"""Root URL configuration."""

from django.contrib import admin

admin.site.site_header = "IT Asset Management"
admin.site.site_title = "ITAM Admin"
admin.site.index_title = "Operations"

from django.urls import include, path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/auth/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("api/", include("config.api_urls")),
]
