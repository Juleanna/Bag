"""
Захищене віддавання медіа-файлів (вкладень).

У production Nginx не повинен сервити /media/ напряму — інакше будь-який
користувач з прямим URL завантажить чужий файл. Замість цього використовуємо
цей view для перевірки членства в проєкті.

Для high-traffic варіантів: налаштуйте Nginx з X-Accel-Redirect, щоб після
auth-перевірки Django повертав заголовок з internal location, а Nginx
ефективно віддавав файл (без переходу даних через Python).
"""

import mimetypes
import os

from django.conf import settings
from django.http import FileResponse, Http404
from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated

from .models import Attachment
from .views_api import _user_projects_qs


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def serve_attachment(request, pk: int):
    """
    Віддає файл вкладення лише членам проєкту.
    URL: /api/attachments/<pk>/download/
    """
    attachment = get_object_or_404(
        Attachment.objects.select_related("issue__project"), pk=pk
    )

    # Перевірка членства
    user_projects = _user_projects_qs(request.user)
    if not user_projects.filter(pk=attachment.issue.project_id).exists():
        raise Http404("Вкладення не знайдено")

    file_path = attachment.file.path
    if not os.path.exists(file_path):
        raise Http404("Файл відсутній на диску")

    # Якщо налаштовано X-Accel-Redirect (для Nginx у production)
    if getattr(settings, "USE_X_ACCEL_REDIRECT", False):
        from django.http import HttpResponse

        content_type, _ = mimetypes.guess_type(attachment.name)
        response = HttpResponse(content_type=content_type or "application/octet-stream")
        # Шлях усередині Nginx — internal location, що мапить на MEDIA_ROOT
        response["X-Accel-Redirect"] = f"/protected/{attachment.file.name}"
        response["Content-Disposition"] = f'attachment; filename="{attachment.name}"'
        return response

    # Dev-режим: віддаємо файл напряму через Django (повільно, але працює).
    # FileResponse сам закриває file handle після надсилання — context manager
    # тут не підходить (Django потім читає файл асинхронно).
    return FileResponse(
        open(file_path, "rb"),
        as_attachment=True,
        filename=attachment.name or os.path.basename(file_path),
    )
