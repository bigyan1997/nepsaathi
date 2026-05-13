from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('listings', '0014_listing_postcode'),
    ]

    operations = [
        migrations.AddField(
            model_name='listingimage',
            name='image_hash',
            field=models.CharField(
                blank=True,
                db_index=True,
                help_text='MD5 hash of image bytes — used for cross-user duplicate detection',
                max_length=32,
            ),
        ),
    ]
