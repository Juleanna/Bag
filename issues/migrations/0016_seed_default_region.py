from django.db import migrations


def seed_default_region(apps, schema_editor):
    Region = apps.get_model("issues", "Region")
    if Region.objects.count() == 0:
        Region.objects.create(
            code="eu",
            label="EU · Frankfurt",
            icon="🇪🇺",
            is_active=True,
            is_default=True,
            sort_order=0,
        )


def remove_default_region(apps, schema_editor):
    Region = apps.get_model("issues", "Region")
    Region.objects.filter(code="eu").delete()


class Migration(migrations.Migration):

    dependencies = [
        ("issues", "0015_region"),
    ]

    operations = [
        migrations.RunPython(seed_default_region, remove_default_region),
    ]
