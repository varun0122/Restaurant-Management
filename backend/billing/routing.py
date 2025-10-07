from django.urls import path
from orders import consumers as order_consumers
from billing import consumers as billing_consumers # <-- Import billing consumers

websocket_urlpatterns = [
    path("ws/orders/", order_consumers.OrderConsumer.as_asgi()),
    path("ws/customer/<int:customer_id>/", order_consumers.CustomerConsumer.as_asgi()),
    path("ws/billing/", billing_consumers.BillingConsumer.as_asgi()), # <-- Add this new route
]