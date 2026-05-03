from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import (
    Category, Ticket, Comment, Attachment, SLAPolicy, 
    SLARecord, KnowledgeBase, Asset, ChangeRequest, AuditLog
)

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False)
    full_name = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name', 
            'full_name', 'phone', 'department', 'role', 'manager',
            'avatar', 'is_active', 'created_at', 'updated_at', 'password'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip() or obj.email
    
    def create(self, validated_data):
        password = validated_data.pop('password', None)
        instance = super().create(validated_data)
        if password:
            instance.set_password(password)
            instance.save()
        return instance
    
    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        updated = super().update(instance, validated_data)
        if password:
            updated.set_password(password)
            updated.save()
        return updated


class UserBriefSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'email', 'first_name', 'last_name', 'full_name', 'role']
    
    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip() or obj.email


class CategorySerializer(serializers.ModelSerializer):
    children = serializers.SerializerMethodField()
    ticket_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Category
        fields = ['id', 'name', 'description', 'parent', 'icon', 'is_active', 'children', 'ticket_count', 'created_at']
    
    def get_children(self, obj):
        children = obj.children.filter(is_active=True)
        return CategorySerializer(children, many=True).data
    
    def get_ticket_count(self, obj):
        return obj.tickets.count()


class CommentSerializer(serializers.ModelSerializer):
    author = UserBriefSerializer(read_only=True)
    attachments_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Comment
        fields = ['id', 'ticket', 'author', 'body', 'is_internal', 'attachments_count', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_attachments_count(self, obj):
        return obj.attachments.count()


class AttachmentSerializer(serializers.ModelSerializer):
    uploaded_by = UserBriefSerializer(read_only=True)
    file_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Attachment
        fields = ['id', 'ticket', 'comment', 'file', 'file_url', 'uploaded_by', 'uploaded_at']
        read_only_fields = ['id', 'uploaded_at']
    
    def get_file_url(self, obj):
        request = self.context.get('request')
        if request and obj.file:
            return request.build_absolute_uri(obj.file.url)
        return None


class TicketSerializer(serializers.ModelSerializer):
    created_by = UserBriefSerializer(read_only=True)
    assigned_to = UserBriefSerializer(read_only=True)
    category = CategorySerializer(read_only=True)
    subcategory = CategorySerializer(read_only=True)
    comments_count = serializers.SerializerMethodField()
    attachments_count = serializers.SerializerMethodField()
    sla_status = serializers.SerializerMethodField()
    
    class Meta:
        model = Ticket
        fields = [
            'id', 'ticket_number', 'title', 'description', 'type', 'priority',
            'status', 'impact', 'urgency', 'category', 'subcategory', 'group',
            'created_by', 'assigned_to', 'resolution', 'resolution_code',
            'due_date', 'resolved_at', 'closed_at', 'created_at', 'updated_at',
            'comments_count', 'attachments_count', 'sla_status'
        ]
        read_only_fields = ['id', 'ticket_number', 'created_at', 'updated_at']
    
    def get_comments_count(self, obj):
        return obj.comments.count()
    
    def get_attachments_count(self, obj):
        return obj.attachments.count()
    
    def get_sla_status(self, obj):
        if hasattr(obj, 'sla_record') and obj.sla_record:
            record = obj.sla_record
            return {
                'response_met': record.response_met,
                'resolution_met': record.resolution_met,
            }
        return None


class TicketCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ticket
        fields = [
            'title', 'description', 'type', 'priority', 'status',
            'impact', 'urgency', 'category', 'subcategory', 'group',
            'assigned_to', 'due_date'
        ]


class TicketDetailSerializer(TicketSerializer):
    comments = CommentSerializer(many=True, read_only=True)
    attachments = AttachmentSerializer(many=True, read_only=True)
    change_request = serializers.SerializerMethodField()
    
    class Meta(TicketSerializer.Meta):
        fields = TicketSerializer.Meta.fields + ['comments', 'attachments', 'change_request']
    
    def get_change_request(self, obj):
        if hasattr(obj, 'change_request') and obj.change_request:
            return {
                'id': obj.change_request.id,
                'change_number': obj.change_request.change_number,
                'type': obj.change_request.type,
                'risk': obj.change_request.risk,
                'status': obj.change_request.status,
            }
        return None


class SLAPolicySerializer(serializers.ModelSerializer):
    class Meta:
        model = SLAPolicy
        fields = '__all__'


class SLARecordSerializer(serializers.ModelSerializer):
    policy = SLAPolicySerializer(read_only=True)
    
    class Meta:
        model = SLARecord
        fields = '__all__'


class KnowledgeBaseSerializer(serializers.ModelSerializer):
    author = UserBriefSerializer(read_only=True)
    category = CategorySerializer(read_only=True)
    
    class Meta:
        model = KnowledgeBase
        fields = [
            'id', 'title', 'content', 'summary', 'status', 'category',
            'author', 'views', 'is_helpful_yes', 'is_helpful_no',
            'created_at', 'updated_at', 'published_at'
        ]
        read_only_fields = ['id', 'views', 'created_at', 'updated_at']


class KnowledgeBaseListSerializer(serializers.ModelSerializer):
    author = UserBriefSerializer(read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    
    class Meta:
        model = KnowledgeBase
        fields = [
            'id', 'title', 'summary', 'status', 'category_name',
            'author', 'views', 'is_helpful_yes', 'is_helpful_no',
            'created_at', 'updated_at'
        ]


class AssetSerializer(serializers.ModelSerializer):
    assigned_to = UserBriefSerializer(read_only=True)
    
    class Meta:
        model = Asset
        fields = '__all__'


class ChangeRequestSerializer(serializers.ModelSerializer):
    requested_by = UserBriefSerializer(read_only=True)
    assigned_to = UserBriefSerializer(read_only=True)
    approved_by = UserBriefSerializer(read_only=True)
    
    class Meta:
        model = ChangeRequest
        fields = '__all__'
        read_only_fields = ['id', 'change_number', 'created_at', 'updated_at']


class AuditLogSerializer(serializers.ModelSerializer):
    user = UserBriefSerializer(read_only=True)
    
    class Meta:
        model = AuditLog
        fields = '__all__'
        read_only_fields = ['id', 'timestamp']
