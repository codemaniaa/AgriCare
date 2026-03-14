from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from .models import Product
from rest_framework.authtoken.models import Token
from .serializers import RegisterSerializer,ProductSerializer


@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):

    serializer = RegisterSerializer(data=request.data)

    if serializer.is_valid():

        user = serializer.save()

        token, created = Token.objects.get_or_create(user=user)

        return Response({
            "token": token.key,
            "username": user.username
        })

    return Response(serializer.errors)


@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):

    username = request.data.get("username")
    password = request.data.get("password")

    user = authenticate(username=username, password=password)

    if user:

        token, created = Token.objects.get_or_create(user=user)

        return Response({
            "token": token.key,
            "username": user.username
        })

    return Response({"error": "Invalid credentials"})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def profile(request):

    profile = request.user.profile

    return Response({
        "username": request.user.username,
        "phone": profile.phone,
        "id": request.user.id
    })

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_product(request):

    data = request.data
    data["user"] = request.user.id

    serializer = ProductSerializer(data=data)

    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)

    return Response(serializer.errors)


# GET ALL PRODUCTS
@api_view(["GET"])
def get_products(request):

    products = Product.objects.all()
    serializer = ProductSerializer(products, many=True)

    return Response(serializer.data)




@api_view(["PUT"])
@permission_classes([IsAuthenticated])
def update_product(request,id):

    try:
        product = Product.objects.get(id=id, user=request.user)
    except Product.DoesNotExist:
        return Response({"error":"Not allowed"}, status=403)

    serializer = ProductSerializer(product,data=request.data)

    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)

    return Response(serializer.errors)



# DELETE PRODUCT
@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def delete_product(request,id):
    try:
        product = Product.objects.get(id=id,user=request.user)
    except Product.DoesNotExist:
        return Response({"error":"Not allowed"},status=403) 
    product.delete() 
    return Response({"message":"Deleted"}) 
    product = Product.objects.get(id=id)
    if product.user != request.user:
        return Response({"error": "Not allowed"})
    product.delete()
    return Response({"message": "Product deleted"})