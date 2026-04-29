"""
Healthcheck endpoints для k8s/docker liveness і readiness probes.
"""

from django.db import connection
from django.http import JsonResponse
from django.views.decorators.cache import never_cache
from django.views.decorators.http import require_GET


@require_GET
@never_cache
def liveness(request):
    """
    Liveness probe — чи живий процес взагалі.
    Не торкається БД, інакше при тимчасовій недоступності БД k8s рестартне процес.
    """
    return JsonResponse({"status": "alive"})


@require_GET
@never_cache
def readiness(request):
    """
    Readiness probe — чи готовий приймати трафік.
    Перевіряє БД (без неї немає сенсу слати запити).
    """
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            cursor.fetchone()
    except Exception as exc:
        return JsonResponse(
            {"status": "not_ready", "error": str(exc)}, status=503
        )
    return JsonResponse({"status": "ready"})
