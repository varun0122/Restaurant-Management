# menu/resources.py
from import_export import resources, fields
from import_export.widgets import ForeignKeyWidget
from .models import Dish, Category

class DishResource(resources.ModelResource):
    category = fields.Field(
        column_name='category',
        attribute='category',
        widget=ForeignKeyWidget(Category, 'name'))
    
    image = fields.Field(column_name='image', attribute='image')

    class Meta:
        model = Dish
        # --- Add 'food_type' to this list ---
        fields = ('id', 'name', 'description', 'price', 'category', 'image', 'is_special', 'food_type')
        import_id_fields = ['id']
        skip_unchanged = True
        report_skipped = True