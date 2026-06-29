# django-backend/apps/attachments/serializers.py

from rest_framework import serializers
from .models import Attachment, AttachmentAccess


class AttachmentSerializer(serializers.ModelSerializer):
    uploaded_by_email = serializers.CharField(source="uploaded_by.email", read_only=True)
    file_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Attachment
        fields = (
            "id",
            "asset",
            "file",
            "file_name",
            "file_type",
            "file_size",
            "mime_type",
            "title",
            "description",
            "uploaded_by",
            "uploaded_by_email",
            "uploaded_at",
            "version",
            "is_current",
            "file_url",
        )
        read_only_fields = ("id", "file_size", "mime_type", "uploaded_by", "uploaded_at", "version", "file_url")
    
    def get_file_url(self, obj):
        """Return the file URL if available."""
        if obj.file:
            return obj.file.url
        return None


class AttachmentAccessSerializer(serializers.ModelSerializer):
    user_email = serializers.CharField(source="user.email", read_only=True)
    file_name = serializers.CharField(source="attachment.file_name", read_only=True)
    
    class Meta:
        model = AttachmentAccess
        fields = (
            "id",
            "attachment",
            "user",
            "user_email",
            "file_name",
            "action",
            "accessed_at",
        )
        read_only_fields = ("id", "accessed_at")
