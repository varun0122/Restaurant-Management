# menu/views.py

from rest_framework import viewsets, status
from rest_framework.permissions import IsAdminUser, AllowAny, IsAuthenticatedOrReadOnly
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.decorators import action
from rest_framework.response import Response
import json
import zipfile
from django.core.files.base import ContentFile
from .models import Category, Dish
from .serializers import CategorySerializer, DishSerializer, DishWriteSerializer

class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all().order_by('name')
    serializer_class = CategorySerializer
    permission_classes = [AllowAny]


class DishViewSet(viewsets.ModelViewSet):
    queryset = Dish.objects.all().order_by('name')
    permission_classes = [IsAuthenticatedOrReadOnly] # Allow read for anyone, write for admins
    parser_classes = (MultiPartParser, FormParser)

    def get_serializer_class(self):
        if self.action in ['list', 'retrieve', 'specials', 'most_liked']:
            return DishSerializer
        return DishWriteSerializer

    @action(detail=False, methods=['get'], permission_classes=[AllowAny])
    def specials(self, request):
        special_dishes = Dish.objects.filter(is_special=True)
        serializer = self.get_serializer(special_dishes, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], permission_classes=[AllowAny])
    def most_liked(self, request):
        top_dishes = Dish.objects.order_by('-like_count')[:5]
        serializer = self.get_serializer(top_dishes, many=True)
        return Response(serializer.data)

    # --- NEW: Bulk import logic moved into a custom action ---
    @action(detail=False, methods=['post'], permission_classes=[IsAdminUser])
    def bulk_import(self, request):
        """
        Allows bulk creation of dishes from a .zip file.
        The zip file must contain 'menu.json' and an 'images/' folder.
        """
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
