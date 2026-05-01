from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('listings', '0008_listing_is_wanted'),
    ]

    operations = [
        migrations.AddField(
            model_name='listing',
            name='renewal_blocked',
            field=models.BooleanField(
                default=False,
                help_text='Admin can block this listing from being renewed',
            ),
        ),
    ]
