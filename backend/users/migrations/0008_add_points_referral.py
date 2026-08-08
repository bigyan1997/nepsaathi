import secrets
import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


def backfill_referral_codes(apps, schema_editor):
    User = apps.get_model('users', 'User')
    for user in User.objects.filter(referral_code=''):
        code = secrets.token_urlsafe(8)[:12]
        while User.objects.filter(referral_code=code).exists():
            code = secrets.token_urlsafe(8)[:12]
        user.referral_code = code
        user.save(update_fields=['referral_code'])


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0007_userreview'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='points',
            field=models.PositiveIntegerField(default=0),
        ),
        # Add without unique first so existing rows (all '') can be backfilled
        migrations.AddField(
            model_name='user',
            name='referral_code',
            field=models.CharField(blank=True, max_length=12, default=''),
        ),
        migrations.RunPython(backfill_referral_codes, migrations.RunPython.noop),
        migrations.AlterField(
            model_name='user',
            name='referral_code',
            field=models.CharField(blank=True, max_length=12, unique=True),
        ),
        migrations.AddField(
            model_name='user',
            name='referred_by',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='referrals', to=settings.AUTH_USER_MODEL),
        ),
        migrations.CreateModel(
            name='PointEvent',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('event_type', models.CharField(max_length=50)),
                ('delta', models.IntegerField()),
                ('description', models.CharField(max_length=200)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='point_events', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'db_table': 'point_events',
                'ordering': ['-created_at'],
            },
        ),
    ]
