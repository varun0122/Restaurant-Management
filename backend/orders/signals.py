from django.db.models.signals import post_save
from django.dispatch import receiver
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from .models import Order
from .serializers import OrderSerializer
    
@receiver(post_save, sender=Order)
def order_status_update(sender, instance, created, **kwargs):
        
        """
        Signal handler to send order updates to the WebSocket group
        whenever an Order instance is saved.
        """
        channel_layer = get_channel_layer()
        group_name = 'kitchen_orders'
        
        # Serialize the order instance to send as JSON
        serializer = OrderSerializer(instance)
        
        # Send the message to the group
        async_to_sync(channel_layer.group_send)(
            group_name,
            {
                'type': 'order_update', # This corresponds to the method name in the consumer
                'order': serializer.data
            }
    )