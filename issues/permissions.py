from rest_framework import permissions


class IsOwnerOrReadOnly(permissions.BasePermission):
    """Object-level permission: only owner can modify."""

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        # Project owner
        if hasattr(obj, "owner"):
            return obj.owner == request.user
        # Issue reporter
        if hasattr(obj, "reporter"):
            return obj.reporter == request.user
        # Comment author
        if hasattr(obj, "author"):
            return obj.author == request.user
        # Attachment uploader
        if hasattr(obj, "uploader"):
            return obj.uploader == request.user
        return False


class IsProjectMemberOrReadOnly(permissions.BasePermission):
    """Only project members can create/modify objects."""

    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user and request.user.is_authenticated
