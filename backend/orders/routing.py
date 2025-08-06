# orders/routing.py

from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    # This URL is what the frontend will connect to.
    re_path(r'ws/orders/$', consumers.OrderConsumer.as_asgi()),
    

]
print("websocket_urlpatterns loaded:", websocket_urlpatterns)