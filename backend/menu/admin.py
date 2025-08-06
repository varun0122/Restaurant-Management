from django.contrib import admin
from .models import Category, Dish
from import_export.admin import ImportExportModelAdmin
from .resources import DishResource

# Register the Category model as usual
admin.site.register(Category)

# This decorator tells Django to use the DishAdmin class for the Dish model
@admin.register(Dish)
class DishAdmin(ImportExportModelAdmin):
    resource_class = DishResource
    list_display = ('name', 'category', 'price', 'is_special')
    list_filter = ('category', 'is_special')
    search_fields = ('name', 'description')

# We have removed the line: admin.site.register(Dish)