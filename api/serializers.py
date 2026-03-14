from django.contrib.auth.models import User
from rest_framework import serializers
from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Profile, Product
 

class RegisterSerializer(serializers.ModelSerializer):

    phone = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['username','password','phone']
        extra_kwargs = {
            'password': {'write_only': True}
        }

    def create(self, validated_data):

        phone = validated_data.pop('phone')

        user = User.objects.create_user(
            username=validated_data['username'],
            password=validated_data['password']
        )

        Profile.objects.create(user=user, phone=phone)

        return user
    
 

class ProductSerializer(serializers.ModelSerializer):

    class Meta:
        model = Product
        fields = "__all__"