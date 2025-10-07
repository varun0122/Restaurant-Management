from django.db.models.signals import post_save
from django.dispatch import receiver
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from .models import Order

# DO NOT import the serializer at the top of the file

@receiver(post_save, sender=Order)
def order_status_update(sender, instance, **kwargs):
    """
    Signal handler to send order updates to WebSocket groups
    whenever an Order instance is saved.
    """
    # --- FIX 1: Import the serializer locally, inside the function ---
    from .serializers import OrderSerializer

    channel_layer = get_channel_layer()
    
    # Serialize the order instance to send as JSON
    serializer = OrderSerializer(instance)
    
    message = {
        'type': 'order_update', # This corresponds to the method name in the consumer
        'order': serializer.data
    }

    # Broadcast to the general kitchen group
    async_to_sync(channel_layer.group_send)('kitchen_orders', message)

    # --- FIX 2: Also broadcast to the specific customer's group ---
    if instance.customer:
        customer_group_name = f'customer_{instance.customer.id}'
        async_to_sync(channel_layer.group_send)(customer_group_name, message)