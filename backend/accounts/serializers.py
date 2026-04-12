from django.contrib.auth.models import User
from rest_framework import serializers


class RegisterSerializer(serializers.ModelSerializer):
    """
    Registro básico de usuario.
    - username obligatorio
    - password se guarda en hash (set_password)
    """
    password = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model = User
        fields = ["id", "username", "password"]

    def create(self, validated_data):
        user = User(username=validated_data["username"])
        user.set_password(validated_data["password"])
        user.save()
        return user


class MeSerializer(serializers.ModelSerializer):
    """Retorna datos completos del usuario logueado."""
    name = serializers.SerializerMethodField()
    phone = serializers.SerializerMethodField()
    address = serializers.SerializerMethodField()
    address2 = serializers.SerializerMethodField()
    city = serializers.SerializerMethodField()
    department = serializers.SerializerMethodField()
    avatar_icon = serializers.SerializerMethodField()
    picture = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["id", "username", "email", "first_name", "last_name", "name",
                  "phone", "address", "address2", "city", "department", "avatar_icon", "picture"]

    def get_picture(self, obj):
        try:
            from allauth.socialaccount.models import SocialAccount
            social = SocialAccount.objects.get(user=obj, provider='google')
            return social.extra_data.get('picture', '')
        except:
            return ""

    def get_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip() or obj.username

    def _profile(self, obj):
        try:
            return obj.profile
        except Exception:
            return None

    def get_avatar_icon(self, obj):
        p = self._profile(obj)
        return p.avatar_icon if p else ""

    def get_phone(self, obj):
        p = self._profile(obj)
        return p.phone if p else ""

    def get_address(self, obj):
        p = self._profile(obj)
        return p.address if p else ""

    def get_address2(self, obj):
        p = self._profile(obj)
        return p.address2 if p else ""

    def get_city(self, obj):
        p = self._profile(obj)
        return p.city if p else ""

    def get_department(self, obj):
        p = self._profile(obj)
        return p.department if p else ""


class UpdateProfileSerializer(serializers.Serializer):
    """Para PATCH /auth/profile/"""
    name       = serializers.CharField(required=False, allow_blank=True)
    phone      = serializers.CharField(required=False, allow_blank=True)
    address    = serializers.CharField(required=False, allow_blank=True)
    address2   = serializers.CharField(required=False, allow_blank=True)
    city       = serializers.CharField(required=False, allow_blank=True)
    department = serializers.CharField(required=False, allow_blank=True)


class ChangePasswordSerializer(serializers.Serializer):
    """Para POST /auth/change-password/"""
    current_password = serializers.CharField()
    new_password     = serializers.CharField(min_length=6)