import json
from channels.generic.websocket import AsyncWebsocketConsumer

class BillingConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        # All users of the billing page will join this one group
        self.room_group_name = 'unpaid_bills'
        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    # This function is called when a 'bill_update' message is sent to the group
    async def bill_update(self, event):
        await self.send(text_data=json.dumps({
            'type': 'bill_update',
            'message': event['message']
        }))