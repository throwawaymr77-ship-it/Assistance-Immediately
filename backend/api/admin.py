from django.contrib import admin
from .models import (
    User, Category, Ticket, Comment, Attachment,
    SLAPolicy, SLARecord, KnowledgeBase, Asset, ChangeRequest, AuditLog
)


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ['email', 'first_name', 'last_name', 'role', 'department', 'is_active']
    list_filter = ['role', 'department', 'is_active']
    search_fields = ['email', 'first_name', 'last_name']


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'parent', 'is_active']
    list_filter = ['is_active']


class CommentInline(admin.TabularInline):
    model = Comment
    extra = 0


@admin.register(Ticket)
class TicketAdmin(admin.ModelAdmin):
    list_display = ['ticket_number', 'title', 'type', 'priority', 'status', 'assigned_to', 'created_at']
    list_filter = ['type', 'priority', 'status', 'category']
    search_fields = ['ticket_number', 'title', 'description']
    readonly_fields = ['ticket_number', 'created_at', 'updated_at']
    inlines = [CommentInline]


@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ['ticket', 'author', 'is_internal', 'created_at']


@admin.register(Attachment)
class AttachmentAdmin(admin.ModelAdmin):
    list_display = ['ticket', 'uploaded_by', 'uploaded_at']


@admin.register(SLAPolicy)
class SLAPolicyAdmin(admin.ModelAdmin):
    list_display = ['name', 'priority', 'response_time_hours', 'resolution_time_hours', 'is_active']


@admin.register(SLARecord)
class SLARecordAdmin(admin.ModelAdmin):
    list_display = ['ticket', 'policy', 'response_met', 'resolution_met']


@admin.register(KnowledgeBase)
class KnowledgeBaseAdmin(admin.ModelAdmin):
    list_display = ['title', 'status', 'author', 'views', 'created_at']
    list_filter = ['status']


@admin.register(Asset)
class AssetAdmin(admin.ModelAdmin):
    list_display = ['asset_tag', 'name', 'type', 'status', 'assigned_to']
    list_filter = ['type', 'status']


@admin.register(ChangeRequest)
class ChangeRequestAdmin(admin.ModelAdmin):
    list_display = ['change_number', 'title', 'type', 'risk', 'status', 'requested_by']
    list_filter = ['type', 'risk', 'status']


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ['user', 'action', 'model_name', 'object_id', 'timestamp']
    list_filter = ['action', 'model_name']
