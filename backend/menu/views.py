from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import Dish
from .serializers import DishSerializer

@api_view(['GET'])
def menu_list(request):
    dishes = Dish.objects.all().order_by('category__name')
    serializer = DishSerializer(dishes, many=True)
    for dish in dishes:
        print(f"Dish: {dish.name}, Category: {dish.category.name},url : {dish.image_url}")
    return Response(serializer.data)

@api_view(['GET'])
def todays_special(request):
    specials = Dish.objects.filter(is_special=True)
    serializer = DishSerializer(specials, many=True)
    return Response(serializer.data)

@api_view(['GET'])
def most_liked_list(request):
    liked = Dish.objects.order_by('-like_count')[:10]  # ✅ CORRECT
    serializer = DishSerializer(liked, many=True, context={'request': request})
    return Response(serializer.data)

