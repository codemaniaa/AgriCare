from django.core.mail import send_mail
from django.conf import settings 
from rest_framework import status, generics
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError
from agricare.apps.products.models import Product
from django.shortcuts import get_object_or_404
from .models import User, OTPVerification
from .serializers import (
    RegisterSerializer, OTPSerializer, LoginSerializer,
    UserProfileSerializer, ChangePasswordSerializer, PublicProfileSerializer
)


def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return {
        'refresh': str(refresh),
        'access':  str(refresh.access_token),
    }


@api_view(['POST'])
@permission_classes([AllowAny])
def register_view(request):
    """Step 1 – validate data, save inactive user, send OTP."""
    serializer = RegisterSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    email = serializer.validated_data['email']

    # Create user as inactive until OTP verified
    user = serializer.save()

    # Generate & save OTP
    otp_code = OTPVerification.generate_otp()
    OTPVerification.objects.create(email=email, otp=otp_code)

    # Send OTP email
    send_mail(
        subject='AgriCare – Your OTP Verification Code',
        message=(
            f'Hello {user.full_name},\n\n'
            f'Your AgriCare OTP code is: {otp_code}\n\n'
            f'This code expires in {settings.OTP_EXPIRY_MINUTES} minutes.\n\n'
            f'If you did not request this, please ignore this email.\n\n'
            f'— AgriCare Team'
        ),
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[email],
        fail_silently=False,
    )

    return Response(
        {'detail': 'OTP sent to your email. Please verify to activate your account.'},
        status=status.HTTP_201_CREATED
    )


@api_view(['POST'])
@permission_classes([AllowAny])
def verify_otp_view(request):
    """Step 2 – verify OTP, activate user, return JWT tokens."""
    serializer = OTPSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    email = serializer.validated_data['email']
    otp   = serializer.validated_data['otp']

    try:
        otp_obj = OTPVerification.objects.filter(
            email=email, otp=otp, is_used=False
        ).latest('created_at')
    except OTPVerification.DoesNotExist:
        return Response({'detail': 'Invalid OTP.'}, status=status.HTTP_400_BAD_REQUEST)

    if not otp_obj.is_valid():
        return Response({'detail': 'OTP has expired.'}, status=status.HTTP_400_BAD_REQUEST)

    otp_obj.is_used = True
    otp_obj.save()

    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return Response({'detail': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)

    user.is_active   = True
    user.is_verified = True
    user.save()

    tokens = get_tokens_for_user(user)
    return Response({
        'detail': 'Account verified successfully.',
        'tokens': tokens,
        'user':   UserProfileSerializer(user).data,
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([AllowAny])
def resend_otp_view(request):
    """Resend OTP for unverified user."""
    email = request.data.get('email', '').strip()
    if not email:
        return Response({'detail': 'Email is required.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return Response({'detail': 'No user with this email.'}, status=status.HTTP_404_NOT_FOUND)

    if user.is_active:
        return Response({'detail': 'Account already verified.'}, status=status.HTTP_400_BAD_REQUEST)

    otp_code = OTPVerification.generate_otp()
    OTPVerification.objects.create(email=email, otp=otp_code)

    send_mail(
        subject='AgriCare – Resend OTP',
        message=f'Your new OTP is: {otp_code}\nExpires in {settings.OTP_EXPIRY_MINUTES} minutes.',
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[email],
        fail_silently=False,
    )
    return Response({'detail': 'OTP resent.'}, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    serializer = LoginSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    user   = serializer.validated_data['user']
    tokens = get_tokens_for_user(user)
    return Response({
        'tokens': tokens,
        'user':   UserProfileSerializer(user).data,
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    try:
        token = RefreshToken(request.data.get('refresh'))
        token.blacklist()
        return Response({'detail': 'Logged out successfully.'})
    except TokenError:
        return Response({'detail': 'Invalid token.'}, status=status.HTTP_400_BAD_REQUEST)


class ProfileView(generics.RetrieveUpdateAPIView):
    serializer_class   = UserProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password_view(request):
    serializer = ChangePasswordSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    user = request.user
    if not user.check_password(serializer.validated_data['old_password']):
        return Response({'detail': 'Old password is incorrect.'}, status=status.HTTP_400_BAD_REQUEST)

    user.set_password(serializer.validated_data['new_password'])
    user.save()
    return Response({'detail': 'Password changed successfully.'})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_stats_view(request):
    from agricare.apps.orders.models import Order
    from agricare.apps.products.models import Product

    user     = request.user
    products = Product.objects.filter(seller=user)
    orders   = Order.objects.filter(seller=user)

    earnings = sum(
        o.total_price for o in orders.filter(status='delivered')
    )
    pending_payments = sum(
        o.total_price for o in orders.filter(status__in=['pending', 'shipped'])
    )

    return Response({
        'earnings':         earnings,
        'active_orders':    orders.filter(status__in=['pending', 'shipped']).count(),
        'total_products':   products.count(),
        'pending_payments': pending_payments,
    })


@api_view(['POST'])
@permission_classes([AllowAny])
def forgot_password_view(request):
    """Send OTP to email for password reset."""
    email = request.data.get('email', '').strip()
    if not email:
        return Response({'detail': 'Email is required.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        # Don't reveal whether user exists
        return Response({'detail': 'If that email exists, an OTP has been sent.'})

    otp_code = OTPVerification.generate_otp()
    OTPVerification.objects.create(email=email, otp=otp_code)

    send_mail(
        subject='AgriCare – Password Reset OTP',
        message=(
            f'Hello {user.full_name},\n\n'
            f'Your password reset OTP is: {otp_code}\n\n'
            f'This code expires in {settings.OTP_EXPIRY_MINUTES} minutes.\n\n'
            f'If you did not request this, please ignore this email.\n\n'
            f'— AgriCare Team'
        ),
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[email],
        fail_silently=False,
    )
    return Response({'detail': 'If that email exists, an OTP has been sent.'})


@api_view(['POST'])
@permission_classes([AllowAny])
def reset_password_view(request):
    """Verify OTP and set new password."""
    email        = request.data.get('email', '').strip()
    otp          = request.data.get('otp', '').strip()
    new_password = request.data.get('new_password', '').strip()

    if not all([email, otp, new_password]):
        return Response({'detail': 'email, otp, and new_password are required.'}, status=status.HTTP_400_BAD_REQUEST)
    if len(new_password) < 8:
        return Response({'detail': 'Password must be at least 8 characters.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        otp_obj = OTPVerification.objects.filter(email=email, otp=otp, is_used=False).latest('created_at')
    except OTPVerification.DoesNotExist:
        return Response({'detail': 'Invalid OTP.'}, status=status.HTTP_400_BAD_REQUEST)

    if not otp_obj.is_valid():
        return Response({'detail': 'OTP has expired.'}, status=status.HTTP_400_BAD_REQUEST)

    otp_obj.is_used = True
    otp_obj.save()

    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return Response({'detail': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)

    user.set_password(new_password)
    user.save()

    return Response({'detail': 'Password reset successfully. Please sign in.'})

 

 

@api_view(['GET'])
def public_profile(request, username):
    user = get_object_or_404(User, username=username)

    data = PublicProfileSerializer(user).data

    # privacy logic
    if user.show_phone:
        data['phone'] = user.phone
    if user.show_email:
        data['email'] = user.email
    if user.show_address:
        data['address'] = user.address

    # user products
    products = Product.objects.filter(seller=user)

    data['products'] = [
        {
            "id": p.id,
            "title": p.title,
            "price": p.price,
        }
        for p in products
    ]

    return Response(data)