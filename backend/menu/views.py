# menu/views.py

from rest_framework import viewsets, status
from rest_framework.permissions import IsAdminUser, AllowAny, IsAuthenticatedOrReadOnly
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.viewsets import ReadOnlyModelViewSet
import json
import zipfile
from django.core.files.base import ContentFile
from .models import Category, Dish, DishIngredient
from .serializers import (
    CategorySerializer, 
    DishSerializer, 
    DishWriteSerializer, 
    DishIngredientSerializer
)

class DishIngredientViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing the ingredients of a specific dish.
    """
    serializer_class = DishIngredientSerializer
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        return DishIngredient.objects.filter(dish_id=self.kwargs['dish_pk'])

    def perform_create(self, serializer):
        serializer.save(dish_id=self.kwargs['dish_pk'])

      
class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.filter(is_point_of_sale_only=False).order_by('name')
    serializer_class = CategorySerializer
    permission_classes = [IsAuthenticatedOrReadOnly]


class DishViewSet(viewsets.ModelViewSet):
    queryset = Dish.objects.filter(category__is_point_of_sale_only=False).order_by('name')
    permission_classes = [IsAuthenticatedOrReadOnly] 
    parser_classes = (MultiPartParser, FormParser, JSONParser)
    def get_queryset(self):
        """
        Base queryset that can be filtered by the 'is_available' query parameter.
        """
        queryset = Dish.objects.all().order_by('category__name', 'name')
        
        # Check for the 'is_available' query parameter
        is_available_param = self.request.query_params.get('is_available')

        if is_available_param is not None:
            # Convert string ('true'/'false') from URL to a boolean
            is_available = is_available_param.lower() == 'true'
            queryset = queryset.filter(is_available=is_available)
           
        return queryset
    def get_serializer_class(self):
        if self.action in ['list', 'retrieve', 'specials', 'most_liked']:
            return DishSerializer
        return DishWriteSerializer

    # --- NEW: Helper function to check inventory ---
    def _get_dishes_with_availability(self, queryset):
        """
        Helper method to check inventory for a given queryset of dishes
        and return the serialized data with an updated 'is_available' flag.
        """
        serializer = self.get_serializer(queryset, many=True)
        data = serializer.data

        for dish_data in data:
            if not dish_data['is_available']:
                continue # Respect manual 'unavailable' setting

            try:
                dish = Dish.objects.get(id=dish_data['id'])
                can_be_made = True
                for recipe_item in dish.dishingredient_set.all():
                    if recipe_item.ingredient.current_stock < recipe_item.quantity_required:
                        can_be_made = False
                        break
                dish_data['is_available'] = can_be_made
            except Dish.DoesNotExist:
                dish_data['is_available'] = False
        
        return data

    def list(self, request, *args, **kwargs):
        """
        Custom list action that now uses the helper function.
        """
        queryset = self.get_queryset()
        data = self._get_dishes_with_availability(queryset)
        return Response(data)

    @action(detail=False, methods=['get'], permission_classes=[AllowAny])
    def specials(self, request):
        """
        Custom action for specials that now uses the helper function.
        """
        queryset = self.get_queryset().filter(is_special=True)
        data = self._get_dishes_with_availability(queryset)
        return Response(data)

    @action(detail=False, methods=['get'], permission_classes=[AllowAny])
    def most_liked(self, request):
        """
        Custom action for most-liked that now uses the helper function.
        """
        queryset = self.get_queryset().order_by('-like_count')[:5]
        data = self._get_dishes_with_availability(queryset)
        return Response(data)
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            self.perform_create(serializer)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        else:
            print("❌ Serializer errors:", serializer.errors)  # logs in console
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)



    @action(detail=False, methods=['post'], permission_classes=[IsAdminUser])
    def bulk_update_availability(self, request):
        """
        Updates the 'is_available' status for a list of dish IDs.
        Expects a POST request with:
        {
            "dish_ids": [1, 2, 3],
            "is_available": true
        }
        """
        dish_ids = request.data.get('dish_ids', [])
        is_available = request.data.get('is_available')

        # --- Input validation ---
        if not isinstance(dish_ids, list) or not dish_ids:
            return Response(
                {'error': '`dish_ids` must be a non-empty list.'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        if not isinstance(is_available, bool):
            return Response(
                {'error': '`is_available` must be a boolean (true/false).'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        # --- Perform the database update ---
        updated_count = Dish.objects.filter(id__in=dish_ids).update(is_available=is_available)

        return Response(
            {'message': f'Successfully updated {updated_count} dishes.'}, 
            status=status.HTTP_200_OK
        )
    @action(detail=False, methods=['post'], permission_classes=[IsAdminUser])
    def bulk_import(self, request):
        # ... (bulk import logic remains the same) ...
        if 'file' not in request.FILES:
            return Response({'error': 'No file provided'}, status=status.HTTP_400_BAD_REQUEST)

        zip_file = request.FILES['file']
        if not zipfile.is_zipfile(zip_file):
            return Response({'error': 'File is not a valid zip archive.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            created_count = 0
            errors = []
            with zipfile.ZipFile(zip_file, 'r') as archive:
                if 'menu.json' not in archive.namelist():
                    return Response({'error': 'menu.json not found in the zip archive.'}, status=status.HTTP_400_BAD_REQUEST)

                with archive.open('menu.json') as json_file:
                    data = json.load(json_file)

                for dish_data in data:
                    try:
                        category_name = dish_data.pop('category_name', None)
                        if category_name:
                            category = Category.objects.get(name__iexact=category_name)
                            dish_data['category'] = category.id
                    except Category.DoesNotExist:
                        errors.append(f"Category '{category_name}' not found for dish '{dish_data.get('name')}'.")
                        continue

                    image_filename = dish_data.pop('image_filename', None)
                    if image_filename:
                        image_path = f'images/{image_filename}'
                        if image_path in archive.namelist():
                            image_content = ContentFile(archive.read(image_path), name=image_filename)
                            dish_data['image'] = image_content
                        else:
                            errors.append(f"Image '{image_filename}' not found for dish '{dish_data.get('name')}'.")

                    serializer = DishWriteSerializer(data=dish_data)
                    if serializer.is_valid():
                        serializer.save()
                        created_count += 1
                    else:
                        errors.append({dish_data.get('name'): serializer.errors})

            return Response({
                'message': f'Import complete. {created_count} dishes created.',
                'errors': errors
            }, status=status.HTTP_201_CREATED)

        except json.JSONDecodeError:
            return Response({'error': 'Invalid JSON in menu.json.'}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class POSDishViewSet(ReadOnlyModelViewSet):
    """
    A simple viewset that provides a list of dishes available for Point of Sale.
    This is for the staff-facing POS screen only.
    It's ReadOnly because staff only need to VIEW dishes to add them to an order.
    """
    permission_classes = [IsAdminUser] # Ensures only logged-in staff can access
    serializer_class = DishSerializer
    
    def get_queryset(self):
        """
        Return only the dishes that belong to a POS-only category.
        """
        return Dish.objects.all().order_by('category__name', 'name')
