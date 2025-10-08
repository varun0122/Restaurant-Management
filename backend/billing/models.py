from django.db import models
from tables.models import Table
from discounts.models import Discount
from decimal import Decimal,InvalidOperation,ROUND_HALF_UP
from django.db.models import Sum, F 
class Bill(models.Model):
    table = models.ForeignKey(Table, on_delete=models.CASCADE)
    
    # --- Base amounts ---
    subtotal = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    tax_amount = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))

    # --- Loyalty Coins ---
    coins_redeemed = models.PositiveIntegerField(default=0)
    coin_discount = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    
    # --- Discounts/Offers ---
    applied_discount = models.ForeignKey(
        Discount, 
        on_delete=models.SET_NULL,
        null=True, 
        blank=True
    )
    discount_amount = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        default=Decimal('0.00')
    )
    discount_request_pending = models.BooleanField(default=False)

    # --- FIX: final_amount is now a writable database field ---
    final_amount = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))

    # --- Payment Status & Timestamps ---
    is_paid = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    paid_at = models.DateTimeField(null=True, blank=True)
    def recalculate_and_save(self):
        print(f"\n--- Recalculating Bill ID: {self.id} ---")
        
        # Let's check how many orders are linked to this bill AT THIS MOMENT
        order_count = self.orders.count()
        print(f"Found {order_count} orders linked to this bill.")

        subtotal_agg = self.orders.aggregate(
            total=Sum(F('items__quantity') * F('items__dish__price'))
        )
        subtotal = subtotal_agg['total'] or Decimal('0.00')
        print(f"Calculated Subtotal: {subtotal}")

        # ... (rest of the calculation logic is fine)
        total_discount = (self.discount_amount or Decimal('0.00')) + (self.coin_discount or Decimal('0.00'))
        discounted_subtotal = max(Decimal('0.00'), subtotal - total_discount)
        TAX_RATE = Decimal('0.05')
        tax_amount = discounted_subtotal * TAX_RATE
        final_amount = discounted_subtotal + tax_amount
        
        self.subtotal = subtotal.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
        self.tax_amount = tax_amount.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
        self.final_amount = final_amount.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
        
        print(f"Final Amount to be saved: {self.final_amount}")
        print("--- Finished Recalculating ---\n")
        
        self.save()
    def __str__(self):
        return f"Bill for {self.table} - {'Paid' if self.is_paid else 'Unpaid'}"