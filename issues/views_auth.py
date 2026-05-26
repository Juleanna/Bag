import json

from django.contrib.auth import (
    authenticate,
    get_user_model,
    password_validation,
    update_session_auth_hash,
)
from django.contrib.auth import (
    login as dj_login,
)
from django.contrib.auth import (
    logout as dj_logout,
)
from django.core.exceptions import ValidationError
from django.core.validators import validate_email
from django.db.models import Q
from django.http import JsonResponse
from django.middleware.csrf import get_token
from django.views.decorators.csrf import csrf_protect
from django.views.decorators.http import require_GET, require_http_methods, require_POST
from rest_framework.throttling import ScopedRateThrottle


def _check_throttle(request, scope):
    """
    Застосовує DRF ScopedRateThrottle до function-based view.
    Повертає (passed, wait_seconds): passed=False означає 429.
    """
    throttle = ScopedRateThrottle()
    throttle.scope = scope
    throttle.rate = throttle.get_rate()
    throttle.num_requests, throttle.duration = throttle.parse_rate(throttle.rate)

    # Імітація DRF view для отримання ідентифікатора (IP/user)
    class _FakeView:
        throttle_scope = scope

    if not throttle.allow_request(request, _FakeView()):
        return False, throttle.wait()
    return True, 0


def _user_json(user, request=None):
    """Серіалізація користувача для відповідей API.
    avatar_url повертаємо як відносний шлях (/media/...), щоб уникнути
    проблем з Docker-DNS (backend:8000 не резолвиться у браузері)."""
    profile = getattr(user, "profile", None)
    avatar_url = None
    if profile and profile.avatar and hasattr(profile.avatar, "url"):
        avatar_url = profile.avatar.url
    totp_enabled = bool(profile and profile.totp_enabled)
    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "is_staff": user.is_staff,
        "is_superuser": user.is_superuser,
        "avatar_url": avatar_url,
        "totp_enabled": totp_enabled,
    }


def _parse_json(request):
    """Безпечно зчитує JSON-тіло запиту, повертає {} при помилці."""
    try:
        return json.loads(request.body or b"{}")
    except (json.JSONDecodeError, ValueError):
        return {}


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
    # Захист від bruteforce — 10 спроб на хвилину з IP
    passed, wait = _check_throttle(request, "login")
    if not passed:
        return JsonResponse(
            {"ok": False, "error": f"Забагато спроб. Спробуйте через {int(wait)} с"},
            status=429,
        )

    payload = _parse_json(request)
    identifier = (payload.get("username", "") or "").strip()
    password = payload.get("password", "")

    if not identifier or not password:
        return JsonResponse(
            {"ok": False, "error": "Вкажіть логін/пошту та пароль"}, status=400
        )

    user = authenticate(request, username=identifier, password=password)
    # Якщо не вдалося — пробуємо знайти користувача за email
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
            {"ok": False, "error": "Невірні облікові дані"}, status=400
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
    # Захист від масової реєстрації — 5 на годину з IP
    passed, wait = _check_throttle(request, "register")
    if not passed:
        return JsonResponse(
            {"ok": False, "error": f"Забагато реєстрацій. Спробуйте через {int(wait)} с"},
            status=429,
        )

    payload = _parse_json(request)

    username = (payload.get("username", "") or "").strip()
    email = (payload.get("email", "") or "").strip()
    password = payload.get("password", "")
    first_name = (payload.get("first_name", "") or "").strip()
    last_name = (payload.get("last_name", "") or "").strip()

    if not username or not email or not password:
        return JsonResponse(
            {"ok": False, "error": "Заповніть обов'язкові поля"}, status=400
        )

    # Принаймні одне з імені/прізвища має бути — щоб у UI завжди було
    # людиночитане displayName, а не machine-нік. Інакше @-mentions і
    # підписи коментарів виглядають як «@baterfield17».
    if not first_name and not last_name:
        return JsonResponse(
            {
                "ok": False,
                "error": "Вкажіть імʼя або прізвище",
            },
            status=400,
        )

    # Той самий ліміт, що в update_profile — щоб не можна було через
    # реєстрацію створити юзера з 1000-символьним прізвищем і потім
    # ламати верстку всюди, де воно відображається.
    if len(first_name) > 50:
        return JsonResponse(
            {"ok": False, "error": "Імʼя задовге (макс 50 символів)"}, status=400
        )
    if len(last_name) > 50:
        return JsonResponse(
            {"ok": False, "error": "Прізвище задовге (макс 50 символів)"}, status=400
        )

    # Валідація email
    try:
        validate_email(email)
    except ValidationError:
        return JsonResponse({"ok": False, "error": "Некоректна адреса пошти"}, status=400)

    User = get_user_model()
    # Об'єднуємо два запити в один (раніше було два окремих filter().exists())
    if User.objects.filter(Q(username=username) | Q(email__iexact=email)).exists():
        return JsonResponse(
            {
                "ok": False,
                "error": "Користувач з таким логіном або поштою вже існує",
            },
            status=400,
        )

    # Валідація пароля через стандартні AUTH_PASSWORD_VALIDATORS
    try:
        password_validation.validate_password(password)
    except ValidationError as exc:
        return JsonResponse(
            {"ok": False, "error": " ".join(exc.messages)}, status=400
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
    except Exception as exc:
        return JsonResponse({"ok": False, "error": str(exc)}, status=400)


@require_POST
@csrf_protect
def logout(request):
    dj_logout(request)
    return JsonResponse({"ok": True})


@require_POST
@csrf_protect
def change_password(request):
    if not request.user.is_authenticated:
        return JsonResponse({"ok": False, "error": "Не автентифіковано"}, status=401)

    payload = _parse_json(request)
    current = payload.get("current_password", "")
    new_pw = payload.get("new_password", "")

    if not current or not new_pw:
        return JsonResponse(
            {"ok": False, "error": "Обидва поля обов'язкові"}, status=400
        )

    if not request.user.check_password(current):
        return JsonResponse(
            {"ok": False, "error": "Поточний пароль невірний"}, status=400
        )

    # Стандартна Django-валідація пароля (мін. довжина, схожість, common, numeric)
    try:
        password_validation.validate_password(new_pw, request.user)
    except ValidationError as exc:
        return JsonResponse({"ok": False, "error": " ".join(exc.messages)}, status=400)

    request.user.set_password(new_pw)
    request.user.save()
    # Підтримуємо сесію активною після зміни пароля
    update_session_auth_hash(request, request.user)
    return JsonResponse({"ok": True})


@require_http_methods(["PATCH"])
@csrf_protect
def update_profile(request):
    if not request.user.is_authenticated:
        return JsonResponse({"ok": False, "error": "Не автентифіковано"}, status=401)

    payload = _parse_json(request)
    user = request.user
    changed = False

    # Реалістичний ліміт — імена/прізвища до 50 символів покривають навіть
    # подвійні прізвища; 150 (Django default) занадто багато і ламає верстку
    # у sidebar / шапці бага / коментарях.
    NAME_MAX = 50

    # Спочатку перевіряємо «одне з двох обовʼязкове» — підраховуємо фінальні
    # значення з урахуванням payload, а потім, якщо обидва порожні, відмова.
    final_first = (
        (payload.get("first_name") or "").strip()
        if "first_name" in payload
        else user.first_name
    )
    final_last = (
        (payload.get("last_name") or "").strip()
        if "last_name" in payload
        else user.last_name
    )
    if ("first_name" in payload or "last_name" in payload) and not final_first and not final_last:
        return JsonResponse(
            {"ok": False, "error": "Вкажіть імʼя або прізвище"}, status=400
        )

    if "first_name" in payload:
        new_first = (payload["first_name"] or "").strip()
        if len(new_first) > NAME_MAX:
            return JsonResponse(
                {"ok": False, "error": f"Імʼя задовге (макс {NAME_MAX} символів)"},
                status=400,
            )
        user.first_name = new_first
        changed = True
    if "last_name" in payload:
        new_last = (payload["last_name"] or "").strip()
        if len(new_last) > NAME_MAX:
            return JsonResponse(
                {"ok": False, "error": f"Прізвище задовге (макс {NAME_MAX} символів)"},
                status=400,
            )
        user.last_name = new_last
        changed = True
    if "email" in payload:
        new_email = (payload["email"] or "").strip()
        if not new_email:
            # Email обовʼязковий — без нього забути пароль не вдасться
            # і нотифікації не дійдуть. Не дозволяємо очистити.
            return JsonResponse(
                {"ok": False, "error": "Пошта обовʼязкова — не можна залишити порожньою"},
                status=400,
            )
        if new_email != user.email:
            try:
                validate_email(new_email)
            except ValidationError:
                return JsonResponse(
                    {"ok": False, "error": "Некоректна адреса пошти"}, status=400
                )
            User = get_user_model()
            if User.objects.filter(email__iexact=new_email).exclude(pk=user.pk).exists():
                return JsonResponse(
                    {"ok": False, "error": "Цю пошту вже використовує інший користувач"},
                    status=400,
                )
            user.email = new_email
            changed = True

    if changed:
        user.save()

    return JsonResponse({"ok": True, "user": _user_json(user, request)})


@require_http_methods(["POST", "DELETE"])
@csrf_protect
def avatar_view(request):
    """POST → завантаження аватара (multipart 'avatar'), DELETE → видалення."""
    if not request.user.is_authenticated:
        return JsonResponse({"ok": False, "error": "Не автентифіковано"}, status=401)
    from .models import UserProfile

    profile, _ = UserProfile.objects.get_or_create(user=request.user)

    if request.method == "DELETE":
        if profile.avatar:
            profile.avatar.delete(save=False)
        profile.avatar = None
        profile.save(update_fields=["avatar"])
        return JsonResponse({"ok": True, "user": _user_json(request.user, request)})

    file = request.FILES.get("avatar")
    if not file:
        return JsonResponse({"ok": False, "error": "Файл не передано"}, status=400)
    if file.size > 5 * 1024 * 1024:
        return JsonResponse(
            {"ok": False, "error": "Максимум 5 MB"}, status=400
        )
    if not (file.content_type or "").startswith("image/"):
        return JsonResponse(
            {"ok": False, "error": "Очікується зображення"}, status=400
        )
    # Видаляємо старе зображення, якщо було
    if profile.avatar:
        profile.avatar.delete(save=False)
    profile.avatar = file
    profile.save(update_fields=["avatar"])
    return JsonResponse({"ok": True, "user": _user_json(request.user, request)})
