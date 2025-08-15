from django.urls import path
from . import views
from .views import MyTokenObtainPairView
urlpatterns = [
    path('pos-place/', views.place_pos_order, name='pos-place-order'),
    path('place/', views.place_order),
    path('history/<str:phone_number>/', views.order_history),
    path('repeat/<int:order_id>/', views.repeat_order),
    path('kitchen/', views.kitchen_orders),
    path('dashboard-summary/', views.dashboard_summary, name='dashboard-summary'),
    path('daily-sales-chart/', views.daily_sales_chart, name='daily-sales-chart'),
    path('recent-orders/', views.recent_orders, name='recent-orders'),
    path('kitchen-display/', views.kitchen_display_orders, name='kitchen-display'),
    path('api/token/', MyTokenObtainPairView.as_view(), name='token_obtain_pair'),
     path('<int:order_id>/update-status/',views.update_order_status, name='update-order-status'),
      path('all/', views.all_orders_list, name='all-orders-list'),
      path('status/<int:order_id>/', views.get_order_status, name='order-status'),
      path('my-history/',views.customer_order_history, name='customer-order-history'),
      path('live-orders/', views.live_orders_list, name='live-orders'),
]
