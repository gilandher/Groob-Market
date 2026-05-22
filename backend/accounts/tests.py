from django.contrib.auth.models import User
from rest_framework.test import APITestCase
from rest_framework import status
from django.urls import reverse
from .models import UserProfile

class AccountsProfileTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="testuser@example.com", email="testuser@example.com", password="testpassword123")
        self.client.force_authenticate(user=self.user)
        self.profile_url = reverse("auth-profile")
        self.me_url = reverse("auth-me")

    def test_profile_created_automatically(self):
        """Verifica que el perfil se crea automáticamente al crear un usuario."""
        profile = UserProfile.objects.filter(user=self.user).first()
        self.assertIsNotNone(profile)
        self.assertEqual(profile.avatar, "avatar_1")
        self.assertEqual(profile.cedula, "")
        self.assertFalse(profile.data_policy_accepted)

    def test_update_profile_success(self):
        """Verifica que se pueden actualizar los campos de cédula, avatar y Habeas Data."""
        payload = {
            "first_name": "Andres",
            "last_name": "Inciarte",
            "phone": "3001234567",
            "address": "Calle 123 # 45-67",
            "city": "Medellin",
            "department": "Antioquia",
            "cedula": "10203040",
            "avatar": "avatar_3",
            "data_policy_accepted": True
        }
        res = self.client.patch(self.profile_url, payload, format="json")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        
        # Recargar perfil y validar
        profile = UserProfile.objects.get(user=self.user)
        self.assertEqual(profile.cedula, "10203040")
        self.assertEqual(profile.avatar, "avatar_3")
        self.assertTrue(profile.data_policy_accepted)
        self.assertEqual(profile.phone, "3001234567")

        # Verificar campos del usuario
        self.user.refresh_from_db()
        self.assertEqual(self.user.first_name, "Andres")
        self.assertEqual(self.user.last_name, "Inciarte")

    def test_me_endpoint_returns_new_fields(self):
        """Verifica que el endpoint /auth/me/ devuelva los nuevos campos del perfil."""
        profile = UserProfile.objects.get(user=self.user)
        profile.cedula = "99887766"
        profile.avatar = "avatar_5"
        profile.data_policy_accepted = True
        profile.save()

        self.user.refresh_from_db()

        res = self.client.get(self.me_url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        data = res.json()
        self.assertEqual(data["cedula"], "99887766")
        self.assertEqual(data["avatar"], "avatar_5")
        self.assertTrue(data["data_policy_accepted"])


class SocialLoginTests(APITestCase):
    def setUp(self):
        self.social_url = reverse("auth-social-login")

    def test_social_login_missing_email(self):
        """Verifica que si falta el correo se retorna 400 Bad Request."""
        payload = {
            "name": "Groob Support",
            "provider": "Google"
        }
        res = self.client.post(self.social_url, payload, format="json")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("El correo electrónico es requerido", res.json()["detail"])

    def test_social_login_new_user(self):
        """Verifica que un nuevo usuario se registra correctamente vía social login."""
        payload = {
            "email": "newsocial@example.com",
            "name": "John Doe",
            "provider": "Google"
        }
        res = self.client.post(self.social_url, payload, format="json")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        
        data = res.json()
        self.assertIn("access", data)
        self.assertIn("refresh", data)
        self.assertEqual(data["user"]["email"], "newsocial@example.com")
        self.assertEqual(data["user"]["name"], "John Doe")
        self.assertTrue(data["user"]["data_policy_accepted"])
        self.assertTrue(data["user"]["avatar"].startswith("avatar_"))

        # Verificar base de datos
        user = User.objects.filter(email="newsocial@example.com").first()
        self.assertIsNotNone(user)
        self.assertEqual(user.first_name, "John")
        self.assertEqual(user.last_name, "Doe")
        
        profile = UserProfile.objects.get(user=user)
        self.assertTrue(profile.data_policy_accepted)
        self.assertTrue(profile.avatar.startswith("avatar_"))

    def test_social_login_existing_user(self):
        """Verifica que un usuario existente puede iniciar sesión vía social login."""
        existing_user = User.objects.create_user(
            username="existing@example.com",
            email="existing@example.com",
            first_name="Alice",
            last_name="Smith"
        )
        profile = UserProfile.objects.get(user=existing_user)
        profile.avatar = "avatar_8"
        profile.data_policy_accepted = False
        profile.save()

        payload = {
            "email": "existing@example.com",
            "name": "Alice Smith",
            "provider": "Facebook"
        }
        res = self.client.post(self.social_url, payload, format="json")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        
        data = res.json()
        self.assertIn("access", data)
        self.assertEqual(data["user"]["email"], "existing@example.com")
        self.assertEqual(data["user"]["avatar"], "avatar_8")
        # Debería forzar la aceptación de la política de datos
        self.assertTrue(data["user"]["data_policy_accepted"])

        profile.refresh_from_db()
        self.assertTrue(profile.data_policy_accepted)


