# orders/consumers.py

import json
from channels.generic.websocket import AsyncWebsocketConsumer

class OrderConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        print("OrderConsumer.connect called!")
        print(f"WebSocket connect called: {self.channel_name}")
        
        # This group name is where all order updates will be sent.
        self.room_group_name = 'kitchen_orders'

        # Join the room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()

    async def disconnect(self, close_code):
        print("OrderConsumer.disconnect called!")
        print(f"WebSocket disconnect called: {self.channel_name}")
        
        # Leave the room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    # This method is called when a message is sent to the 'kitchen_orders' group.
    async def order_update(self, event):
        print("OrderConsumer.order_update called!")

        # Lazy import here to avoid AppRegistryNotReady error
        from .serializers import OrderSerializer

        # The 'event' dictionary contains the data sent from the signal.
        order_data = event['order']

        # Send the order data to the WebSocket client (the frontend).
        await self.send(text_data=json.dumps({
            'type': 'order_update',
            'order': order_data
        }))
