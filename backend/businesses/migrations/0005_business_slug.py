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
        # Add column only if it doesn't already exist (handles partial Railway state)
        migrations.RunSQL(
            sql="ALTER TABLE businesses ADD COLUMN IF NOT EXISTS slug VARCHAR(255) NOT NULL DEFAULT '';",
            reverse_sql="ALTER TABLE businesses DROP COLUMN IF EXISTS slug;",
        ),
        # Tell Django the field exists in state (no DB operation)
        migrations.SeparateDatabaseAndState(
            database_operations=[],
            state_operations=[
                migrations.AddField(
                    model_name='business',
                    name='slug',
                    field=models.CharField(blank=True, max_length=255, default=''),
                    preserve_default=False,
                ),
            ],
        ),
        # Backfill slugs for any rows missing one
        migrations.RunPython(backfill_slugs, migrations.RunPython.noop),
        # Drop any partial indexes/constraints, then recreate cleanly
        migrations.RunSQL(
            sql="""
                DROP INDEX IF EXISTS businesses_slug_381f1ade_like;
                ALTER TABLE businesses DROP CONSTRAINT IF EXISTS businesses_slug_key;
                ALTER TABLE businesses ADD CONSTRAINT businesses_slug_key UNIQUE (slug);
                CREATE INDEX businesses_slug_381f1ade_like ON businesses (slug varchar_pattern_ops);
            """,
            reverse_sql=migrations.RunSQL.noop,
        ),
        # Tell Django the field is now a SlugField with unique=True (no DB operation)
        migrations.SeparateDatabaseAndState(
            database_operations=[],
            state_operations=[
                migrations.AlterField(
                    model_name='business',
                    name='slug',
                    field=models.SlugField(blank=True, max_length=255, unique=True),
                ),
            ],
        ),
    ]
