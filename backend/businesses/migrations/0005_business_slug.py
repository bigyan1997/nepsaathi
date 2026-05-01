from django.db import migrations, models
from django.utils.text import slugify


def backfill_slugs(apps, schema_editor):
    Business = apps.get_model('businesses', 'Business')
    for business in Business.objects.filter(slug=''):
        business.slug = f"{slugify(business.business_name)}-{business.id}"
        business.save(update_fields=['slug'])


class Migration(migrations.Migration):

    dependencies = [
        ('businesses', '0004_add_business_report'),
    ]

    operations = [
        migrations.AddField(
            model_name='business',
            name='slug',
            field=models.SlugField(blank=True, max_length=255, default=''),
            preserve_default=False,
        ),
        migrations.RunPython(backfill_slugs, migrations.RunPython.noop),
        migrations.AlterField(
            model_name='business',
            name='slug',
            field=models.SlugField(blank=True, max_length=255, unique=True),
        ),
    ]
