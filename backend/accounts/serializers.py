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
    """Retorna datos del usuario logueado."""
    class Meta:
        model = User
        fields = ["id", "username"]