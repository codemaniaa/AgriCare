import re
from matplotlib import image
from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import User, OTPVerification


class RegisterSerializer(serializers.ModelSerializer):
    password         = serializers.CharField(write_only=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True)

    class Meta:
        model  = User
        fields = ['username', 'email', 'full_name', 'role', 'city',
                  'cnic', 'password', 'confirm_password']

    def validate_cnic(self, value):
        # Accept with or without dashes: 13 digits or XXXXX-XXXXXXX-X
        cleaned = value.replace('-', '')
        if not re.match(r'^\d{13}$', cleaned):
            raise serializers.ValidationError('CNIC must be exactly 13 digits.')
        return value

    def validate_email(self, value):
        if not value.endswith('@gmail.com'):
            raise serializers.ValidationError('Only Gmail addresses are accepted.')
        return value

    def validate(self, data):
        if data['password'] != data.pop('confirm_password'):
            raise serializers.ValidationError({'confirm_password': 'Passwords do not match.'})
        return data

    def create(self, validated_data):
        user = User.objects.create_user(
            username  = validated_data['username'],
            email     = validated_data['email'],
            password  = validated_data['password'],
            full_name = validated_data['full_name'],
            role      = validated_data.get('role', 'buyer'),
            city      = validated_data.get('city', ''),
            cnic      = validated_data['cnic'],
        )
        return user


class OTPSerializer(serializers.Serializer):
    email = serializers.EmailField()
    otp   = serializers.CharField(max_length=6, min_length=6)


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    cnic     = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        username = data.get('username')
        password = data.get('password')
        cnic     = data.get('cnic')

        try:
            user_obj = User.objects.get(username=username)
        except User.DoesNotExist:
            raise serializers.ValidationError('Invalid credentials.')

        cleaned_cnic = cnic.replace('-', '')
        stored_cnic  = user_obj.cnic.replace('-', '')
        if cleaned_cnic != stored_cnic:
            raise serializers.ValidationError('Invalid credentials.')

        user = authenticate(username=username, password=password)
        if not user:
            raise serializers.ValidationError('Invalid credentials.')
        if not user.is_active:
            raise serializers.ValidationError('Account not verified. Check your email.')

        data['user'] = user
        return data


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model  = User
        fields = ['id', 'username', 'email', 'full_name', 'role', 'city', 'cnic', 'profile_picture', 'is_verified', 'date_joined']
        read_only_fields = ['id', 'username', 'email', 'cnic', 'is_verified', 'date_joined']


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, min_length=8)

    
class PublicProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'id',
            'username',
            'full_name',
            'city',
            'profile_picture',
            'role',
            'date_joined'
        ]