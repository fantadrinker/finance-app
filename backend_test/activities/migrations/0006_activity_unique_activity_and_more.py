# Generated by Django 4.1.5 on 2023-03-01 03:20

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('activities', '0005_descriptiontocategorymapping_user'),
    ]

    operations = [
        migrations.AddConstraint(
            model_name='activity',
            constraint=models.UniqueConstraint(fields=('user', 'account_type', 'date', 'amount'), name='unique_activity'),
        ),
        migrations.AddConstraint(
            model_name='descriptiontocategorymapping',
            constraint=models.UniqueConstraint(fields=('user', 'description', 'category'), name='unique_mapping'),
        ),
    ]
