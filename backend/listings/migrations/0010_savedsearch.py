import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('listings', '0009_listing_renewal_blocked'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='SavedSearch',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('label', models.CharField(blank=True, max_length=100)),
                ('listing_type', models.CharField(max_length=20)),
                ('filters', models.JSONField(blank=True, default=dict)),
                ('is_active', models.BooleanField(default=True)),
                ('last_notified', models.DateTimeField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('user', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='saved_searches',
                    to=settings.AUTH_USER_MODEL,
                )),
            ],
            options={
                'db_table': 'saved_searches',
                'ordering': ['-created_at'],
            },
        ),
    ]
