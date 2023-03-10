# Generated by Django 4.1.5 on 2023-01-29 06:15

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('activities', '0002_user_alter_activity_user_id'),
    ]

    operations = [
        migrations.CreateModel(
            name='DescriptionToCategoryMapping',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('description', models.CharField(max_length=50)),
                ('category', models.CharField(default='others', max_length=10)),
            ],
        ),
        migrations.RenameField(
            model_name='activity',
            old_name='user_id',
            new_name='user',
        ),
    ]
