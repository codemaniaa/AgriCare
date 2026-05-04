"""
agricare/apps/admin_panel/jwt_utils.py

Override SimpleJWT's token to embed role + is_staff into the JWT payload.
This lets the React frontend know instantly whether the user is admin.

Usage in settings.py:
    SIMPLE_JWT = {
        ...
        'TOKEN_OBTAIN_SERIALIZER': 'agricare.apps.admin_panel.jwt_utils.AdminAwareTokenSerializer',
    }
"""

from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView


class AdminAwareTokenSerializer(TokenObtainPairSerializer):
    """
    Extends the default JWT login to add:
      - role
      - is_staff
      - is_superuser
      - username / full_name
    to the token payload AND to the response body.
    """

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        # Add claims to the JWT payload itself
        token['role']         = getattr(user, 'role', 'buyer')
        token['is_staff']     = user.is_staff
        token['is_superuser'] = user.is_superuser
        token['username']     = user.username
        token['full_name']    = user.get_full_name()
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        user = self.user
        # Also add to the JSON response body (useful for React context)
        data['user'] = {
            'id':           user.id,
            'email':        user.email,
            'username':     user.username,
            'full_name':    user.get_full_name(),
            'role':         getattr(user, 'role', 'buyer'),
            'is_staff':     user.is_staff,
            'is_superuser': user.is_superuser,
            'avatar':       None,  # Add avatar URL if your model has it
        }
        return data


class AdminAwareTokenView(TokenObtainPairView):
    serializer_class = AdminAwareTokenSerializer
