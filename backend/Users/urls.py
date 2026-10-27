from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    RegisterView,
    ProfileView,
    CartMergingTokenObtainPairView,
)

urlpatterns = [
    path("register/", RegisterView.as_view(), name="api-register"),
    path(
        "login/",
        CartMergingTokenObtainPairView.as_view(),
        name="api-token-obtain",
    ),
    path(
        "login/refresh/",
        TokenRefreshView.as_view(),
        name="api-token-refresh",
    ),
    path("profile/", ProfileView.as_view(), name="api-profile"),
]
