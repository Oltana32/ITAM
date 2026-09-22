"""Root URL configuration."""

from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.db import connection
from django.http import JsonResponse

admin.site.site_header = "IT Asset Management"
admin.site.site_title = "ITAM Admin"
admin.site.index_title = "Operations"

from django.urls import include, path
from rest_framework_simplejwt.views import TokenRefreshView
from apps.users.views import ThrottledTokenObtainPairView


def healthz(request):
    return JsonResponse({"status": "ok", "service": "itam-backend"})


def readyz(request):
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
        return JsonResponse({"status": "ok"})
    except Exception:
        return JsonResponse({"status": "error", "detail": "database unavailable"}, status=503)


urlpatterns = [
    path("healthz/", healthz, name="healthz"),
    path("readyz/", readyz, name="readyz"),
    path("admin/", admin.site.urls),
    path("api/auth/token/", ThrottledTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/auth/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("api/", include("config.api_urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
