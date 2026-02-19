import json
from django.http import JsonResponse
from django.views.decorators.http import require_GET, require_POST, require_http_methods
from django.views.decorators.csrf import csrf_protect
from django.middleware.csrf import get_token
from django.contrib.auth import (
    authenticate,
    login as dj_login,
    logout as dj_logout,
    get_user_model,
)


def _user_json(user):
    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "first_name": user.first_name,
        "last_name": user.last_name,
    }


@require_GET
def csrf(request):
    token = get_token(request)
    return JsonResponse({"csrfToken": token})


@require_GET
def whoami(request):
    if request.user.is_authenticated:
        return JsonResponse(
            {
                "isAuthenticated": True,
                "user": _user_json(request.user),
            }
        )
    return JsonResponse({"isAuthenticated": False})


@require_POST
@csrf_protect
def login(request):
    try:
        payload = json.loads(request.body or b"{}")
    except Exception:
        payload = {}
    identifier = (payload.get("username", "") or "").strip()
    password = payload.get("password", "")

    if not identifier or not password:
        return JsonResponse(
            {"ok": False, "error": "Укажите логин/почту и пароль"}, status=400
        )

    user = authenticate(request, username=identifier, password=password)
    if user is None and "@" in identifier:
        User = get_user_model()
        found = User.objects.filter(email__iexact=identifier).first()
        if found:
            user = authenticate(
                request,
                username=getattr(found, User.USERNAME_FIELD, found.username),
                password=password,
            )
    if user is None:
        return JsonResponse(
            {"ok": False, "error": "Неверные учетные данные"}, status=400
        )
    dj_login(request, user)
    return JsonResponse(
        {
            "ok": True,
            "isAuthenticated": True,
            "user": _user_json(user),
        }
    )


@require_POST
@csrf_protect
def register(request):
    try:
        payload = json.loads(request.body or b"{}")
    except Exception:
        payload = {}

    username = (payload.get("username", "") or "").strip()
    email = (payload.get("email", "") or "").strip()
    password = payload.get("password", "")
    first_name = payload.get("first_name", "").strip()
    last_name = payload.get("last_name", "").strip()

    if not username or not email or not password:
        return JsonResponse(
            {"ok": False, "error": "Заполните обязательные поля"}, status=400
        )

    User = get_user_model()
    if User.objects.filter(username=username).exists():
        return JsonResponse(
            {"ok": False, "error": "Пользователь с таким логином уже существует"},
            status=400,
        )

    if User.objects.filter(email=email).exists():
        return JsonResponse(
            {"ok": False, "error": "Пользователь с такой почтой уже существует"},
            status=400,
        )

    try:
        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name,
        )
        dj_login(request, user)
        return JsonResponse(
            {
                "ok": True,
                "isAuthenticated": True,
                "user": _user_json(user),
            }
        )
    except Exception as e:
        return JsonResponse({"ok": False, "error": str(e)}, status=400)


@require_POST
@csrf_protect
def logout(request):
    dj_logout(request)
    return JsonResponse({"ok": True})


@require_POST
@csrf_protect
def change_password(request):
    if not request.user.is_authenticated:
        return JsonResponse({"ok": False, "error": "Not authenticated"}, status=401)

    try:
        payload = json.loads(request.body or b"{}")
    except Exception:
        payload = {}

    current = payload.get("current_password", "")
    new_pw = payload.get("new_password", "")

    if not current or not new_pw:
        return JsonResponse({"ok": False, "error": "Both fields are required"}, status=400)

    if len(new_pw) < 6:
        return JsonResponse({"ok": False, "error": "Password too short"}, status=400)

    if not request.user.check_password(current):
        return JsonResponse({"ok": False, "error": "Current password is incorrect"}, status=400)

    request.user.set_password(new_pw)
    request.user.save()
    # Re-login to keep the session active
    from django.contrib.auth import update_session_auth_hash
    update_session_auth_hash(request, request.user)
    return JsonResponse({"ok": True})


@require_http_methods(["PATCH"])
@csrf_protect
def update_profile(request):
    if not request.user.is_authenticated:
        return JsonResponse({"ok": False, "error": "Not authenticated"}, status=401)

    try:
        payload = json.loads(request.body or b"{}")
    except Exception:
        payload = {}

    user = request.user
    changed = False

    if "first_name" in payload:
        user.first_name = payload["first_name"].strip()
        changed = True
    if "last_name" in payload:
        user.last_name = payload["last_name"].strip()
        changed = True
    if "email" in payload:
        new_email = payload["email"].strip()
        if new_email and new_email != user.email:
            User = get_user_model()
            if User.objects.filter(email=new_email).exclude(pk=user.pk).exists():
                return JsonResponse(
                    {"ok": False, "error": "Email already taken"}, status=400
                )
            user.email = new_email
            changed = True

    if changed:
        user.save()

    return JsonResponse({"ok": True, "user": _user_json(user)})
