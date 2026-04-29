"""
Server-Sent Events (SSE) для realtime сповіщень.

SSE — простіша альтернатива WebSocket: однонапрямлений потік від сервера до
клієнта через звичайний HTTP. Працює на gunicorn без Django Channels, але
тримає 1 worker зайнятим, тому в production треба:
  - або gevent/async worker (`gunicorn -k gevent`),
  - або переключитись на Django Channels + WebSocket для масштабу.

Для невеликих команд (десятки одночасних користувачів) — SSE достатньо.
"""

import json
import time

from django.http import StreamingHttpResponse
from django.utils import timezone
from django.views.decorators.cache import never_cache
from django.views.decorators.http import require_GET

from .models import Notification

# Інтервал перевірки нових сповіщень
SSE_POLL_INTERVAL = 3.0
# Максимум часу одного SSE-з'єднання (потім клієнт перепідключиться)
SSE_MAX_DURATION = 5 * 60  # 5 хв


@require_GET
@never_cache
def notifications_stream(request):
    """
    SSE-стрім нових сповіщень користувача.
    Клієнт відкриває EventSource('/api/notifications/stream/') і отримує
    JSON-події з полем `data` для кожного нового сповіщення.
    """
    if not request.user.is_authenticated:
        return StreamingHttpResponse(
            "data: {\"error\": \"unauthorized\"}\n\n",
            content_type="text/event-stream",
            status=401,
        )

    user_id = request.user.id

    def event_stream():
        # Стартова мітка часу — не надсилати старі сповіщення повторно
        last_seen = timezone.now()
        # Heartbeat щоб з'єднання не закривалось проксі-серверами
        yield "event: ping\ndata: connected\n\n"

        start = time.time()
        while time.time() - start < SSE_MAX_DURATION:
            new = list(
                Notification.objects.filter(
                    user_id=user_id, created_at__gt=last_seen
                )
                .order_by("created_at")
                .values("id", "message", "is_read", "issue_id", "created_at")[:50]
            )
            for n in new:
                # datetime → ISO для JSON
                n["created_at"] = n["created_at"].isoformat()
                yield f"data: {json.dumps(n, default=str)}\n\n"
                last_seen = max(last_seen, timezone.now())

            # Heartbeat кожні N секунд
            yield ": heartbeat\n\n"
            time.sleep(SSE_POLL_INTERVAL)

    response = StreamingHttpResponse(
        event_stream(), content_type="text/event-stream"
    )
    response["Cache-Control"] = "no-cache"
    response["X-Accel-Buffering"] = "no"  # Nginx: не буферити SSE
    return response
