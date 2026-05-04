"""
Міграція 0002: видаляє існуючі рядки items + обнуляє тексти на singleton'ах
ПЕРЕД зміною типу полів на JSONField. SQLite не може конвертувати text → JSON
автоматично, тому ми спершу очищаємо дані, потім alter type, потім reseed.

ПРИМІТКА: usable тільки для dev-середовища, де seed-дані ми відразу
відновимо у міграції 0004.
"""

from django.db import migrations


def clear_data(apps, schema_editor):
    # Видаляємо ВСІ items — будуть повторно створені у міграції 0004
    for name in (
        "LandingFeature",
        "LandingUseCase",
        "LandingIntegration",
        "LandingMetric",
        "LandingTestimonial",
        "LandingFaqItem",
    ):
        apps.get_model("landing", name).objects.all().delete()
    # Singleton-и видаляємо повністю — теж створяться знову
    for name in ("LandingHero", "LandingSettings"):
        apps.get_model("landing", name).objects.all().delete()


def noop_reverse(apps, schema_editor):
    pass


class Migration(migrations.Migration):
    dependencies = [
        ("landing", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(clear_data, noop_reverse),
    ]
