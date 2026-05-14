"""
Views для підтвердження email та скидання пароля.
"""

import json
from datetime import timedelta

from django.conf import settings
from django.contrib.auth import get_user_model, password_validation
from django.core.exceptions import ValidationError
from django.core.mail import send_mail
from django.http import JsonResponse
from django.utils import timezone
from django.utils.crypto import get_random_string
from django.views.decorators.csrf import csrf_protect
from django.views.decorators.http import require_GET, require_POST

from .models import EmailToken, UserProfile

User = get_user_model()

# Час життя токенів
CONFIRM_EMAIL_TTL = timedelta(days=2)
RESET_PASSWORD_TTL = timedelta(hours=1)


def _parse_json(request):
    try:
        return json.loads(request.body or b"{}")
    except (json.JSONDecodeError, ValueError):
        return {}


def _create_token(user, purpose: str, ttl: timedelta) -> EmailToken:
    """Створює одноразовий токен для дій з email."""
    return EmailToken.objects.create(
        user=user,
        token=get_random_string(48),
        purpose=purpose,
        expires_at=timezone.now() + ttl,
    )


def _send_email(subject: str, message: str, to: str):
    """Безпечна обгортка над send_mail (не падає, якщо backend упав)."""
    send_mail(
        subject=subject,
        message=message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[to],
        fail_silently=True,
    )


@require_POST
@csrf_protect
def request_confirm_email(request):
    """Надсилає на email користувача посилання для підтвердження."""
    if not request.user.is_authenticated:
        return JsonResponse({"ok": False, "error": "Не автентифіковано"}, status=401)

    user = request.user
    profile, _ = UserProfile.objects.get_or_create(user=user)
    if profile.email_verified:
        return JsonResponse({"ok": True, "already_verified": True})

    # Інвалідуємо попередні непідтверджені токени для цього користувача
    EmailToken.objects.filter(
        user=user,
        purpose=EmailToken.Purpose.CONFIRM_EMAIL,
        used_at__isnull=True,
    ).update(used_at=timezone.now())

    token = _create_token(user, EmailToken.Purpose.CONFIRM_EMAIL, CONFIRM_EMAIL_TTL)
    confirm_url = f"{settings.FRONTEND_URL}/confirm-email?token={token.token}"
    _send_email(
        subject="Підтвердження пошти — BugTracker",
        message=(
            f"Привіт, {user.username}!\n\n"
            f"Підтвердьте свою пошту за посиланням:\n{confirm_url}\n\n"
            f"Посилання дійсне 2 дні."
        ),
        to=user.email,
    )
    return JsonResponse({"ok": True})


@require_POST
@csrf_protect
def confirm_email(request):
    """Підтверджує email за токеном."""
    payload = _parse_json(request)
    token_str = (payload.get("token") or "").strip()
    if not token_str:
        return JsonResponse({"ok": False, "error": "Не вказано токен"}, status=400)

    token = EmailToken.objects.filter(
        token=token_str, purpose=EmailToken.Purpose.CONFIRM_EMAIL
    ).first()
    if not token or not token.is_valid():
        return JsonResponse(
            {"ok": False, "error": "Токен недійсний або застарілий"}, status=400
        )

    profile, _ = UserProfile.objects.get_or_create(user=token.user)
    profile.email_verified = True
    profile.email_verified_at = timezone.now()
    profile.save(update_fields=["email_verified", "email_verified_at"])

    token.used_at = timezone.now()
    token.save(update_fields=["used_at"])

    return JsonResponse({"ok": True})


@require_POST
@csrf_protect
def request_password_reset(request):
    """
    Надсилає лист зі скиданням пароля.
    З міркувань privacy завжди повертаємо ok=True (не розкриваємо, чи існує email).
    """
    # Throttle (password_reset scope, ~3/година) — щоб атакувальник не міг
    # масово розсилати reset-лист чужим юзерам.
    from .views_auth import _check_throttle

    ok, wait = _check_throttle(request, "password_reset")
    if not ok:
        return JsonResponse(
            {"ok": False, "error": f"Зачекайте {int(wait)} секунд"},
            status=429,
        )

    payload = _parse_json(request)
    email = (payload.get("email") or "").strip()
    if not email:
        return JsonResponse({"ok": False, "error": "Не вказано email"}, status=400)

    user = User.objects.filter(email__iexact=email).first()
    if user:
        # Інвалідуємо попередні токени скидання
        EmailToken.objects.filter(
            user=user,
            purpose=EmailToken.Purpose.RESET_PASSWORD,
            used_at__isnull=True,
        ).update(used_at=timezone.now())

        token = _create_token(
            user, EmailToken.Purpose.RESET_PASSWORD, RESET_PASSWORD_TTL
        )
        reset_url = f"{settings.FRONTEND_URL}/reset-password?token={token.token}"
        _send_email(
            subject="Скидання пароля — BugTracker",
            message=(
                f"Привіт, {user.username}!\n\n"
                f"Для встановлення нового пароля перейдіть за посиланням:\n{reset_url}\n\n"
                f"Посилання дійсне 1 годину. Якщо ви цього не запитували — ігноруйте лист."
            ),
            to=user.email,
        )
    # Завжди повертаємо ok=True — щоб не дати enumeration
    return JsonResponse({"ok": True})


@require_POST
@csrf_protect
def confirm_password_reset(request):
    """Встановлює новий пароль за токеном скидання."""
    payload = _parse_json(request)
    token_str = (payload.get("token") or "").strip()
    new_password = payload.get("new_password") or ""

    if not token_str or not new_password:
        return JsonResponse(
            {"ok": False, "error": "Потрібен токен і новий пароль"}, status=400
        )

    token = EmailToken.objects.filter(
        token=token_str, purpose=EmailToken.Purpose.RESET_PASSWORD
    ).first()
    if not token or not token.is_valid():
        return JsonResponse(
            {"ok": False, "error": "Токен недійсний або застарілий"}, status=400
        )

    try:
        password_validation.validate_password(new_password, token.user)
    except ValidationError as exc:
        return JsonResponse({"ok": False, "error": " ".join(exc.messages)}, status=400)

    user = token.user
    user.set_password(new_password)
    user.save()

    token.used_at = timezone.now()
    token.save(update_fields=["used_at"])

    return JsonResponse({"ok": True})


@require_GET
def email_verified_status(request):
    """Повертає, чи підтверджена пошта поточного користувача."""
    if not request.user.is_authenticated:
        return JsonResponse({"isAuthenticated": False})
    profile, _ = UserProfile.objects.get_or_create(user=request.user)
    return JsonResponse(
        {"isAuthenticated": True, "email_verified": profile.email_verified}
    )
