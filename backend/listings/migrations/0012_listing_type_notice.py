from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('listings', '0011_listing_slug'),
    ]

    operations = [
        migrations.RunSQL(
            sql="UPDATE listings SET listing_type = 'notice' WHERE listing_type = 'announcement';",
            reverse_sql="UPDATE listings SET listing_type = 'announcement' WHERE listing_type = 'notice';",
        ),
    ]
