"""Role-based permissions for DRF.

Three roles:
1. ADMIN - Full system access (users, settings, all CRUD)
2. IT_TEAM - Operational access (assets, assignments, maintenance, etc.)
3. FINANCE - Read-only access to reports and underlying data for exports
"""

from rest_framework.permissions import BasePermission, SAFE_METHODS

from apps.users.models import UserRole


ADMIN_ROLES = {UserRole.ADMIN}
IT_ROLES = {UserRole.ADMIN, UserRole.IT_TEAM}
REPORT_ROLES = {UserRole.ADMIN, UserRole.IT_TEAM, UserRole.FINANCE}


def _user_role(request) -> str | None:
    if not request.user or not request.user.is_authenticated:
        return None
    return getattr(request.user, "role", None)


class IsAdmin(BasePermission):
    """Only Admin."""

    def has_permission(self, request, view):
        return _user_role(request) in ADMIN_ROLES


class IsITTeamOrAdmin(BasePermission):
    """IT Team or Admin."""

    def has_permission(self, request, view):
        return _user_role(request) in IT_ROLES


class CanAccessReports(BasePermission):
    """Admin, IT Team, or Finance — for report generation and read access."""

    def has_permission(self, request, view):
        return _user_role(request) in REPORT_ROLES


class IsITTeamOrAdminOrReadOnly(BasePermission):
    """GET/HEAD/OPTIONS for Admin, IT Team, and Finance; writes for Admin and IT Team."""

    def has_permission(self, request, view):
        role = _user_role(request)
        if role is None:
            return False
        if request.method in SAFE_METHODS:
            return role in REPORT_ROLES
        return role in IT_ROLES


class IsSelfOrITTeamOrAdmin(BasePermission):
    """Allow a user to edit their own record; IT Team/Admin can edit anyone."""

    def has_object_permission(self, request, view, obj):
        role = _user_role(request)
        if role is None:
            return False
        if obj.pk == request.user.pk:
            return True
        return role in IT_ROLES


class IsFinanceReadOnly(BasePermission):
    """Finance users may only use safe HTTP methods."""

    def has_permission(self, request, view):
        role = _user_role(request)
        if role is None:
            return False
        if role == UserRole.FINANCE:
            return request.method in SAFE_METHODS
        return True


# Backward-compatible aliases used by audits/attachments modules
IsITStaffOrAdmin = IsITTeamOrAdmin
IsITStaffOrAdminOrReadOnly = IsITTeamOrAdminOrReadOnly
IsSelfOrITStaffOrAdmin = IsSelfOrITTeamOrAdmin
IsITAdmin = IsITTeamOrAdmin
IsAssetManager = IsITTeamOrAdmin
IsDepartmentManager = IsITTeamOrAdmin
IsAuditor = IsITTeamOrAdmin
IsAssetManagerOrReadOnly = IsITTeamOrAdminOrReadOnly
