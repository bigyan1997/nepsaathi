import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('listings', '0010_savedsearch'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='FeaturedPayment',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('stripe_session_id', models.CharField(max_length=200, unique=True)),
                ('amount_paid', models.PositiveIntegerField(help_text='Amount in cents AUD')),
                ('duration_days', models.PositiveIntegerField(default=7)),
                ('status', models.CharField(
                    choices=[
                        ('pending', 'Pending'),
                        ('completed', 'Completed'),
                        ('failed', 'Failed'),
                        ('expired', 'Expired'),
                    ],
                    default='pending',
                    max_length=20,
                )),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('completed_at', models.DateTimeField(blank=True, null=True)),
                ('listing', models.ForeignKey(
                    null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name='featured_payments',
                    to='listings.listing',
                )),
                ('user', models.ForeignKey(
                    null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name='featured_payments',
                    to=settings.AUTH_USER_MODEL,
                )),
            ],
            options={
                'db_table': 'featured_payments',
                'ordering': ['-created_at'],
            },
        ),
    ]
