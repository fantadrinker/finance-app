# Generated by Django 4.1.5 on 2023-02-02 03:47

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('activities', '0004_alter_user_user_name'),
    ]

    operations = [
        migrations.AddField(
            model_name='descriptiontocategorymapping',
            name='user',
            field=models.ForeignKey(default=1, on_delete=django.db.models.deletion.CASCADE, to='activities.user'),
            preserve_default=False,
        ),
    ]
