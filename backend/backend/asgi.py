# backend/asgi.py

import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
import orders.routing # We will create this file next



application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket": AuthMiddlewareStack(
        URLRouter(
            orders.routing.websocket_urlpatterns
        )
    ),
})
