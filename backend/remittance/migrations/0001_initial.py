from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True
    dependencies = []
    operations = [
        migrations.CreateModel(
            name='RemittanceRate',
            fields=[
                ('id',         models.BigAutoField(auto_created=True, primary_key=True, serialize=False)),
                ('provider',   models.CharField(
                    choices=[('wise','Wise'),('remitly','Remitly'),('worldremit','WorldRemit'),('wu','Western Union')],
                    max_length=20, unique=True)),
                ('rate',       models.DecimalField(decimal_places=4, max_digits=10)),
                ('fee_aud',    models.DecimalField(decimal_places=2, default=0, max_digits=8)),
                ('send_url',   models.URLField()),
                ('fetched_at', models.DateTimeField(auto_now=True)),
            ],
        ),
    ]
