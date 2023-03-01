import json
from django.http import HttpResponse, Http404, JsonResponse
from django.db import DatabaseError
from rest_framework.decorators import api_view, permission_classes
from rest_framework import permissions
from activities.models import User, Activity, Category, DescriptionToCategoryMapping
from activities.serializers import UserSerializer, ActivitySerializer, DescriptionToCategoryMappingSerializer

# Create your views here.
def index(request):
    return HttpResponse("Hello world, this is activities")

@api_view(['POST'])
@permission_classes((permissions.AllowAny,))
def create_user(request):
    body = json.loads(request.body)
    try:
        new_user = User(user_name=body["user_name"])
        new_user.save()
        return JsonResponse(data={
            "success": True,
            "user_name":  new_user.user_name
        })
    except DatabaseError:
        return HttpResponse("databse error", status_code=500)

@api_view(['GET'])
@permission_classes((permissions.AllowAny,))
def get_users_all(request):
    users = User.objects.all()
    serializer = UserSerializer(users, many=True)
    return JsonResponse(data={
        "success": True,
        "data": serializer.data
    })


# processes user form, but should integrate some logic.
# e.g. mapping headers to categories.
# TODO: add support for multiple versions of table headers
@api_view(['POST'])
@permission_classes((permissions.AllowAny,))
def upload_activities(request, user_id):
    success_count = 0
    processed_count = 0
    try:
        user = User.objects.filter(user_name=user_id)[0]
        # TODO: need to account for potential duplicates
        # add an option to dedup? Or just botch it if it's screwed up
        for line in request.body.splitlines():
            values = line.decode("utf-8").split(',')

            # this code works for capitalone export
            if values[3]:
                # check 
                category = Category.objects.filter(user=user.id).filter(description=values[2]).filter(category=values[3]).first()
                if not category:
                    category = Category(user=user, category=values[3], description=values[2])
                    category.save()
            # TODO: need some sanitizing on descriptions and category value
            activityEntry = ActivitySerializer(data={
                "user": user.id,
                "account_type": values[0],
                "date": values[1],
                "descriptions": values[2],
                "amount": values[4],
                "category": category.id
            })

            processed_count += 1
            if activityEntry.is_valid():
                success_count += 1
                activityEntry.save()
    except Exception as e:
        print(str(e))
        return HttpResponse("failed creating activity entry")
    return JsonResponse(data={
        "success": True,
        "success_count": success_count,
        "processed_count": processed_count
    })

# TODO: delete selected activities by ID
@api_view(['DELETE'])
@permission_classes((permissions.AllowAny,))
def delete_all_activities(request, user_id):
    try:
        user = User.objects.filter(user_name=user_id).values('id')[0]
        result = Activity.objects.filter(user_id=user["id"])
        result.delete()
        return JsonResponse({
            "success": True
        })
    except Activity.DoesNotExist:
        raise Http404("no activities")

# pagination paramters by month or num of records
@api_view(['GET'])
@permission_classes((permissions.AllowAny,))
def get_activities(request, user_id):
    # GET, get activites for user
    try:
        user = User.objects.filter(user_name=user_id).values('id')[0]
        print(user)
        result = Activity.objects.filter(user_id=user["id"])
        activitiesData = ActivitySerializer(result, many=True)
        return JsonResponse({
            "success": True,
            "data": activitiesData.data
        })
    except Activity.DoesNotExist:
        raise Http404("no activities")
    
def _agg_category_results(user):
    result = Category.objects.filter(user=user.id).values('description', 'category')
    cat_desc_mapping = {}
    for row in result:
        categoryText = row['category']
        descriptionText = row['description']
        if categoryText not in cat_desc_mapping:
            cat_desc_mapping[categoryText] = [descriptionText]
        else:
            cat_desc_mapping[categoryText].append(descriptionText)
    cat_sum_mapping = {}
    # need to clean this up with aggregation
    # also the number value needs to be rounded to 2 decimal places
    for key in cat_desc_mapping:
        sum = 0
        for desc in cat_desc_mapping[key]:
            activities = Activity.objects.filter(user=user.id, descriptions=desc)
            for act in activities:
                sum += act.amount
        cat_sum_mapping[key] = sum
    return [{
        "category": key,
        "descriptions": cat_desc_mapping[key],
        "sum": cat_sum_mapping[key]
    } for key in cat_desc_mapping]

@api_view(['GET'])
@permission_classes((permissions.AllowAny,))
def get_user_categories(request, user_id):
    try:
        user = User.objects.filter(user_name=user_id)[0]
        data = _agg_category_results(user)
        return JsonResponse({
            "success": True,
            "data": data
        })
    except Exception as e:
        print(str(e))
        return HttpResponse("failed fetching user categories")

@api_view(['POST'])
@permission_classes((permissions.AllowAny,))
def new_user_categories(request, user_id):
    # create new user categories mapping, returns all users mapping in return
    try:
        user = User.objects.filter(user_name=user_id)[0]
        mapping = json.loads(request.body)
        existingMapping = Category.objects.filter(user=user, description=mapping["description"])
        if existingMapping:
            for item in existingMapping:
                item.category = mapping["category"]
                item.save()
        else:
            mappingObj = Category(
                user=user)
            mappingObj.category = mapping["category"]
            mappingObj.description = mapping["description"]
            mappingObj.save()
        result = _agg_category_results(user)
        return JsonResponse(data={
            "success": True,
            "data": result
        })
    except Exception as e:
        print(str(e))
        return HttpResponse("failed fetching user categories")

@api_view(['DELETE'])
@permission_classes((permissions.AllowAny,))
def remove_user_categories(request, user_id):
    # create new user categories mapping
    pass