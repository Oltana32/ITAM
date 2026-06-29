# django-backend/apps/attachments/views.py

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.http import FileResponse
from .models import Attachment, AttachmentAccess
from .serializers import AttachmentSerializer, AttachmentAccessSerializer
from config.permissions import IsAssetManager, IsITStaffOrAdmin


class AttachmentViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing asset attachments.
    
    Supports:
    - List/create/update/delete attachments
    - Download files
    - Track access history
    """
    queryset = Attachment.objects.all()
    serializer_class = AttachmentSerializer
    permission_classes = [IsAuthenticated, IsAssetManager]
    filterset_fields = ["asset", "file_type", "is_current"]
    search_fields = ["file_name", "title", "description"]
    ordering_fields = ["uploaded_at", "file_type"]
    ordering = ["-uploaded_at"]
    
    def perform_create(self, serializer):
        """Set the uploaded_by user on creation."""
        serializer.save(uploaded_by=self.request.user)
    
    @action(detail=True, methods=["get"])
    def download(self, request, pk=None):
        """Download an attachment file."""
        attachment = self.get_object()
        
        # Log the access
        AttachmentAccess.objects.create(
            attachment=attachment,
            user=request.user,
            action="download",
        )
        
        if not attachment.file:
            return Response(
                {"detail": "File not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Return file response
        return FileResponse(
            attachment.file.open('rb'),
            as_attachment=True,
            filename=attachment.file_name,
        )
    
    @action(detail=True, methods=["get"])
    def access_history(self, request, pk=None):
        """Get access history for an attachment."""
        attachment = self.get_object()
        accesses = attachment.access_logs.all()
        serializer = AttachmentAccessSerializer(accesses, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=["post"])
    def replace(self, request, pk=None):
        """Replace current version with a new file."""
        old_attachment = self.get_object()
        
        if "file" not in request.FILES:
            return Response(
                {"detail": "No file provided"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create new attachment with incremented version
        new_attachment = Attachment.objects.create(
            asset=old_attachment.asset,
            file=request.FILES["file"],
            file_name=request.FILES["file"].name,
            file_type=old_attachment.file_type,
            title=old_attachment.title,
            description=request.data.get("description", old_attachment.description),
            uploaded_by=request.user,
            version=old_attachment.version + 1,
            replaces=old_attachment,
        )
        
        # Mark old as not current
        old_attachment.is_current = False
        old_attachment.save()
        
        # Log the access
        AttachmentAccess.objects.create(
            attachment=new_attachment,
            user=request.user,
            action="upload",
        )
        
        serializer = self.get_serializer(new_attachment)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class AttachmentAccessViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for viewing attachment access logs (admin only)."""
    queryset = AttachmentAccess.objects.all()
    serializer_class = AttachmentAccessSerializer
    permission_classes = [IsAuthenticated, IsITStaffOrAdmin]
    filterset_fields = ["attachment", "user", "action"]
    search_fields = ["attachment__file_name", "user__email"]
    ordering_fields = ["accessed_at"]
    ordering = ["-accessed_at"]
