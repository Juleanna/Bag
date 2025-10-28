from django.http import JsonResponse
from django.views.decorators.http import require_GET, require_POST
from django.views.decorators.csrf import csrf_protect
from django.middleware.csrf import get_token
from django.contrib.auth import authenticate, login as dj_login, logout as dj_logout


@require_GET
def csrf(request):
    token = get_token(request)
    return JsonResponse({"csrfToken": token})


@require_GET
def whoami(request):
    if request.user.is_authenticated:
        user = request.user
        return JsonResponse({
            "isAuthenticated": True,
            "user": {
                "id": user.id,
                "username": user.username,
                "first_name": user.first_name,
                "last_name": user.last_name,
            },
        })
    return JsonResponse({"isAuthenticated": False})


@require_POST
@csrf_protect
def login(request):
    import json

    try:
        payload = json.loads(request.body or b"{}")
    except Exception:
        payload = {}
    username = payload.get("username", "")
    password = payload.get("password", "")

    user = authenticate(request, username=username, password=password)
    if user is None:
        return JsonResponse({"ok": False, "error": "Неверные учетные данные"}, status=400)
    dj_login(request, user)
    return JsonResponse({"ok": True, "user": {"id": user.id, "username": user.username}})


@require_POST
@csrf_protect
def logout(request):
    dj_logout(request)
    return JsonResponse({"ok": True})

