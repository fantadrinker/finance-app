from django.db import models

# Create your models here.

# TODO: should deprecate this and use profile as name instead
class User(models.Model):
    user_name = models.CharField(max_length=30, unique=True)

# TODO: need to add id field, support record delete
class Activity(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    account_type = models.CharField(max_length=30)
    date = models.DateField('date published')
    descriptions = models.CharField(max_length=50)
    amount = models.FloatField(default=0.0)
    
    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['user', 'account_type', 'date', 'amount'])
        ]

class DescriptionToCategoryMapping(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    description = models.CharField(max_length=50)
    category = models.CharField(max_length=10,default="others")

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['user', 'description', 'category'])
        ]
