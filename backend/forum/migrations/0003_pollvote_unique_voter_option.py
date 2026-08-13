from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('forum', '0002_polloption_pollvote'),
    ]

    operations = [
        migrations.AlterUniqueTogether(
            name='pollvote',
            unique_together={('voter', 'option')},
        ),
    ]
