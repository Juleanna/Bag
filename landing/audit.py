"""
Helper для запису у LandingChangeLog. Використовується ViewSet'ами в
perform_create/perform_update/perform_destroy і custom-actions
publish/unpublish.
"""

from django.contrib.contenttypes.models import ContentType
from django.db.models.fields.files import FieldFile
from django.forms.models import model_to_dict

from .models import LandingChangeLog


def _snapshot(instance) -> dict:
    """
    Зберігає поточний стан моделі як dict (для журналу).
    File-поля серіалізуємо як URL рядка, decimal-fields — як str.
    """
    try:
        data = model_to_dict(instance)
    except Exception:
        data = {}
    # Convert non-JSON-serializable values
    out = {}
    for k, v in data.items():
        # ImageField/FileField — перевірка типом, бо hasattr(v, "url") сам
        # тригерить _require_file() при пустому файлі
        if isinstance(v, FieldFile):
            out[k] = v.url if v and v.name else None
        elif isinstance(v, (str, int, float, bool, list, dict, type(None))):
            out[k] = v
        else:
            out[k] = str(v)
    return out


def log_change(*, instance, action: str, user=None):
    """Записує дію в журнал змін."""
    if instance is None:
        return
    ct = ContentType.objects.get_for_model(type(instance))
    LandingChangeLog.objects.create(
        content_type=ct,
        object_id=getattr(instance, "pk", None),
        model_name=type(instance)._meta.model_name,
        object_label=str(instance)[:200],
        action=action,
        user=user if (user and getattr(user, "is_authenticated", False)) else None,
        data_snapshot=_snapshot(instance),
    )
