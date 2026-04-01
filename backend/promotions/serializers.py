from rest_framework import serializers
from .models import Coupon


class CouponSerializer(serializers.ModelSerializer):
    class Meta:
        model = Coupon
        fields = ["code", "percent", "is_used", "first_purchase_only", "expires_at", "created_at"]