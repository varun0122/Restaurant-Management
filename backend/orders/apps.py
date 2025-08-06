    # orders/apps.py
    
from django.apps import AppConfig
    
class OrdersConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'orders'
    
    def ready(self):
            # This imports the signals file when the app is ready.
        import orders.signals
    