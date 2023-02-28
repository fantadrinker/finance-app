from django.urls import path

from . import views

urlpatterns = [
    path('', views.index, name='index'),
    path('user', views.create_user),
    path('user/all', views.get_users_all),
    path('<str:user_id>', views.get_activities),
    path('<str:user_id>/upload', views.upload_activities),
    path('<str:user_id>/delete', views.delete_all_activities),
    path('<str:user_id>/categories', views.get_user_categories),
    path('<str:user_id>/categories/new', views.new_user_categories),
    path('<str:user_id>/categories/delete', views.remove_user_categories)
]