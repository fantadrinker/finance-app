# Generated by Django 4.1.5 on 2023-03-01 04:33

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('activities', '0007_remove_activity_unique_activity'),
    ]

    operations = [
        migrations.AlterField(
            model_name='descriptiontocategorymapping',
            name='category',
            field=models.CharField(max_length=50),
        ),
        migrations.CreateModel(
            name='Category',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('category', models.CharField(default='others', max_length=40)),
                ('description', models.CharField(max_length=50)),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='activities.user')),
            ],
        ),
        migrations.AddField(
            model_name='activity',
            name='category',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, to='activities.category'),
        ),
        migrations.AddConstraint(
            model_name='category',
            constraint=models.UniqueConstraint(fields=('user', 'category', 'description'), name='unique_user_category_desc'),
        ),
    ]
