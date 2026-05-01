from django.db import migrations, models
from django.utils.text import slugify


def backfill_slugs(apps, schema_editor):
    Listing = apps.get_model('listings', 'Listing')
    for listing in Listing.objects.filter(slug=''):
        listing.slug = f"{slugify(listing.title)}-{listing.id}"
        listing.save(update_fields=['slug'])


class Migration(migrations.Migration):

    dependencies = [
        ('listings', '0010_savedsearch'),
    ]

    operations = [
        # Step 1: add column with no index (plain CharField)
        migrations.AddField(
            model_name='listing',
            name='slug',
            field=models.CharField(max_length=255, blank=True, default=''),
            preserve_default=False,
        ),
        # Step 2: populate slugs for existing rows
        migrations.RunPython(backfill_slugs, migrations.RunPython.noop),
        # Step 3: switch to SlugField with unique constraint
        migrations.AlterField(
            model_name='listing',
            name='slug',
            field=models.SlugField(max_length=255, unique=True, blank=True),
        ),
    ]
