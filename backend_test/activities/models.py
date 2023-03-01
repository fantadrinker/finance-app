from django.db import models

# Create your models here.

# TODO: should deprecate this and use profile as name instead
class User(models.Model):
    user_name = models.CharField(max_length=30, unique=True)


class Category(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    category = models.CharField(max_length=40, default="others")
    description = models.CharField(max_length=50)

    class Meta:
        constraints = [
            # user can not have duplicate category mappings
            models.UniqueConstraint(fields=['user', 'category', 'description'], name="unique_user_category_desc")
        ]

# TODO: need to add id field, support record delete
# note: removed unique constraint, since it's possible to have multiple 
# same transactions on the same day
class Activity(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    account_type = models.CharField(max_length=30)
    date = models.DateField('date published')
    descriptions = models.CharField(max_length=50)
    amount = models.FloatField(default=0.0)
    category = models.ForeignKey(Category, on_delete=models.CASCADE, blank=True, null=True)


class DescriptionToCategoryMapping(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    description = models.CharField(max_length=50)
    category = models.CharField(max_length=50)
    
    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['user', 'description', 'category'], name="unique_mapping")
        ]
