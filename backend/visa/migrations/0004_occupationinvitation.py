from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('visa', '0003_alter_invitationround_lowest_score'),
    ]

    operations = [
        migrations.CreateModel(
            name='OccupationInvitation',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('round_date', models.CharField(help_text='YYYY-MM format', max_length=7)),
                ('visa_type', models.CharField(choices=[('189', 'Skilled Independent (189)'), ('190', 'Skilled Nominated (190)'), ('491', 'Skilled Work Regional (491)')], max_length=10)),
                ('score', models.PositiveSmallIntegerField(blank=True, help_text='Points score for this occupation in this round; null if not invited or unpublished', null=True)),
                ('was_invited', models.BooleanField(default=True, help_text='Was this occupation invited in this round?')),
                ('notes', models.CharField(blank=True, max_length=200)),
                ('occupation', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='invitations', to='visa.occupation')),
            ],
            options={
                'db_table': 'visa_occupation_invitations',
                'ordering': ['-round_date', 'visa_type'],
            },
        ),
        migrations.AlterUniqueTogether(
            name='occupationinvitation',
            unique_together={('occupation', 'round_date', 'visa_type')},
        ),
    ]
