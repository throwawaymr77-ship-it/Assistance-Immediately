from rest_framework import viewsets, status, filters, generics, permissions
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.authtoken.models import Token
from rest_framework.exceptions import PermissionDenied, AuthenticationFailed
from django_filters.rest_framework import DjangoFilterBackend
from django.contrib.auth import get_user_model, authenticate
from django.db.models import Count, Q, F
from django.utils import timezone
from datetime import timedelta

from .models import (
    Category, Ticket, Comment, Attachment, SLAPolicy,
    SLARecord, KnowledgeBase, Asset, ChangeRequest, AuditLog
)
from .serializers import (
    UserSerializer, UserBriefSerializer, CategorySerializer,
    TicketSerializer, TicketCreateSerializer, TicketDetailSerializer,
    CommentSerializer, AttachmentSerializer, SLAPolicySerializer,
    SLARecordSerializer, KnowledgeBaseSerializer, KnowledgeBaseListSerializer,
    AssetSerializer, ChangeRequestSerializer, AuditLogSerializer
)

User = get_user_model()


class IsAdminOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user.is_authenticated and request.user.role in ['admin', 'manager']


class IsAdminOrManager(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ['admin', 'manager']


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['first_name', 'last_name', 'email', 'username']
    ordering_fields = ['first_name', 'last_name', 'email', 'created_at']
    ordering = ['last_name', 'first_name']
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdminOrManager()]
        return [IsAuthenticated()]
    
    @action(detail=False, methods=['get'])
    def me(self, request):
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def technicians(self, request):
        technicians = User.objects.filter(role__in=['technician', 'admin', 'manager'])
        serializer = UserBriefSerializer(technicians, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def tickets(self, request, pk=None):
        user = self.get_object()
        tickets = Ticket.objects.filter(
            Q(created_by=user) | Q(assigned_to=user)
        ).distinct()
        serializer = TicketSerializer(tickets, many=True)
        return Response(serializer.data)


class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.filter(parent__isnull=True)
    serializer_class = CategorySerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'description']
    
    def get_queryset(self):
        if self.action == 'list':
            return Category.objects.filter(parent__isnull=True, is_active=True)
        return Category.objects.all()
    
    @action(detail=False, methods=['get'])
    def all_categories(self, request):
        categories = Category.objects.filter(is_active=True)
        serializer = CategorySerializer(categories, many=True)
        return Response(serializer.data)


class TicketViewSet(viewsets.ModelViewSet):
    queryset = Ticket.objects.all()
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['type', 'priority', 'status', 'category', 'assigned_to', 'impact', 'urgency']
    search_fields = ['ticket_number', 'title', 'description']
    ordering_fields = ['ticket_number', 'priority', 'status', 'created_at', 'updated_at', 'due_date']
    ordering = ['-created_at']
    
    def get_queryset(self):
        qs = Ticket.objects.all()
        
        if self.request.query_params.get('my_tickets'):
            qs = qs.filter(
                Q(created_by=self.request.user) | Q(assigned_to=self.request.user)
            ).distinct()
        
        if self.request.query_params.get('unassigned'):
            qs = qs.filter(assigned_to__isnull=True)
        
        if self.request.query_params.get('overdue'):
            qs = qs.filter(due_date__lt=timezone.now(), status__in=['new', 'in_progress', 'on_hold'])
        
        return qs
    
    def get_serializer_class(self):
        if self.action == 'create':
            return TicketCreateSerializer
        if self.action == 'retrieve':
            return TicketDetailSerializer
        return TicketSerializer
    
    def get_permissions(self):
        if self.action in ['destroy']:
            return [IsAdminOrManager()]
        return [IsAuthenticated()]
    
    def perform_create(self, serializer):
        instance = serializer.save(created_by=self.request.user)
        self.create_sla_record(instance)
        self.log_action('create', instance)
    
    def perform_update(self, serializer):
        old_status = serializer.instance.status
        old_assignee = serializer.instance.assigned_to
        instance = serializer.save()
        
        if instance.status != old_status:
            if instance.status == 'resolved':
                instance.resolved_at = timezone.now()
                instance.save()
            elif instance.status == 'closed':
                instance.closed_at = timezone.now()
                instance.save()
        
        self.log_action('update', instance, {'status': {'old': old_status, 'new': instance.status}})
    
    def create_sla_record(self, ticket):
        sla_policy = SLAPolicy.objects.filter(
            priority=ticket.priority,
            type__in=[ticket.type, ''],
            is_active=True
        ).first()
        
        if sla_policy:
            SLARecord.objects.create(
                ticket=ticket,
                policy=sla_policy,
                response_due=timezone.now() + timedelta(hours=sla_policy.response_time_hours),
                resolution_due=timezone.now() + timedelta(hours=sla_policy.resolution_time_hours),
            )
    
    def log_action(self, action, ticket, changes=None):
        AuditLog.objects.create(
            user=self.request.user,
            action=action,
            model_name='Ticket',
            object_id=ticket.id,
            description=f"{action.capitalize()} ticket {ticket.ticket_number}",
            changes=changes or {},
        )
    
    @action(detail=True, methods=['post'])
    def assign(self, request, pk=None):
        ticket = self.get_object()
        user_id = request.data.get('user_id')
        
        if not user_id:
            return Response({'error': 'user_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            assignee = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
        
        ticket.assigned_to = assignee
        if ticket.status == 'new':
            ticket.status = 'in_progress'
        ticket.save()
        
        AuditLog.objects.create(
            user=request.user,
            action='assign',
            model_name='Ticket',
            object_id=ticket.id,
            description=f"Assigned {ticket.ticket_number} to {assignee}",
        )
        
        serializer = self.get_serializer(ticket)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def resolve(self, request, pk=None):
        ticket = self.get_object()
        resolution = request.data.get('resolution', '')
        resolution_code = request.data.get('resolution_code', '')
        
        ticket.status = 'resolved'
        ticket.resolution = resolution
        ticket.resolution_code = resolution_code
        ticket.resolved_at = timezone.now()
        ticket.save()
        
        serializer = self.get_serializer(ticket)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def close(self, request, pk=None):
        ticket = self.get_object()
        ticket.status = 'closed'
        ticket.closed_at = timezone.now()
        ticket.save()
        
        serializer = self.get_serializer(ticket)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def reopen(self, request, pk=None):
        ticket = self.get_object()
        ticket.status = 'in_progress'
        ticket.resolved_at = None
        ticket.closed_at = None
        ticket.save()
        
        serializer = self.get_serializer(ticket)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def dashboard(self, request):
        now = timezone.now()
        qs = Ticket.objects.all()
        
        total = qs.count()
        new_count = qs.filter(status='new').count()
        in_progress = qs.filter(status='in_progress').count()
        on_hold = qs.filter(status='on_hold').count()
        resolved = qs.filter(status='resolved').count()
        closed = qs.filter(status='closed').count()
        
        overdue = qs.filter(
            due_date__lt=now,
            status__in=['new', 'in_progress', 'on_hold']
        ).count()
        
        my_tickets = qs.filter(assigned_to=request.user).count() if request.user.is_authenticated else 0
        
        by_type = list(qs.values('type').annotate(count=Count('id')).order_by('type'))
        by_priority = list(qs.values('priority').annotate(count=Count('id')).order_by('priority'))
        by_status = list(qs.values('status').annotate(count=Count('id')).order_by('status'))
        
        recent = TicketSerializer(qs.order_by('-created_at')[:10], many=True).data
        
        return Response({
            'total': total,
            'new': new_count,
            'in_progress': in_progress,
            'on_hold': on_hold,
            'resolved': resolved,
            'closed': closed,
            'overdue': overdue,
            'my_tickets': my_tickets,
            'by_type': by_type,
            'by_priority': by_priority,
            'by_status': by_status,
            'recent_tickets': recent,
        })


class CommentViewSet(viewsets.ModelViewSet):
    queryset = Comment.objects.all()
    serializer_class = CommentSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['created_at']
    ordering = ['created_at']
    
    def get_queryset(self):
        ticket_id = self.request.query_params.get('ticket')
        if ticket_id:
            return Comment.objects.filter(ticket_id=ticket_id)
        return Comment.objects.all()
    
    def perform_create(self, serializer):
        serializer.save(author=self.request.user)


class AttachmentViewSet(viewsets.ModelViewSet):
    queryset = Attachment.objects.all()
    serializer_class = AttachmentSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        ticket_id = self.request.query_params.get('ticket')
        if ticket_id:
            return Attachment.objects.filter(ticket_id=ticket_id)
        return Attachment.objects.all()
    
    def perform_create(self, serializer):
        serializer.save(uploaded_by=self.request.user)


class SLAPolicyViewSet(viewsets.ModelViewSet):
    queryset = SLAPolicy.objects.all()
    serializer_class = SLAPolicySerializer
    permission_classes = [IsAdminOrReadOnly]
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['priority']
    ordering = ['priority']


class SLARecordViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = SLARecord.objects.all()
    serializer_class = SLARecordSerializer
    permission_classes = [IsAuthenticated]


class KnowledgeBaseViewSet(viewsets.ModelViewSet):
    queryset = KnowledgeBase.objects.all()
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'category']
    search_fields = ['title', 'content', 'summary']
    ordering_fields = ['title', 'created_at', 'views', 'updated_at']
    ordering = ['-created_at']
    
    def get_queryset(self):
        qs = KnowledgeBase.objects.all()
        if self.request.user.role not in ['admin', 'manager']:
            qs = qs.filter(status='published')
        return qs
    
    def get_serializer_class(self):
        if self.action == 'list':
            return KnowledgeBaseListSerializer
        return KnowledgeBaseSerializer
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdminOrManager()]
        return [IsAuthenticated()]
    
    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.views = F('views') + 1
        instance.save(update_fields=['views'])
        instance.refresh_from_db()
        serializer = self.get_serializer(instance)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def rate(self, request, pk=None):
        article = self.get_object()
        helpful = request.data.get('helpful')
        
        if helpful is True:
            article.is_helpful_yes = F('is_helpful_yes') + 1
        elif helpful is False:
            article.is_helpful_no = F('is_helpful_no') + 1
        
        article.save(update_fields=['is_helpful_yes', 'is_helpful_no'])
        article.refresh_from_db()
        
        serializer = self.get_serializer(article)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def publish(self, request, pk=None):
        article = self.get_object()
        article.status = 'published'
        article.published_at = timezone.now()
        article.save()
        serializer = self.get_serializer(article)
        return Response(serializer.data)


class AssetViewSet(viewsets.ModelViewSet):
    queryset = Asset.objects.all()
    serializer_class = AssetSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['type', 'status', 'assigned_to']
    search_fields = ['name', 'asset_tag', 'serial_number', 'manufacturer', 'model']
    ordering_fields = ['asset_tag', 'name', 'created_at']
    ordering = ['asset_tag']
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdminOrManager()]
        return [IsAuthenticated()]
    
    @action(detail=False, methods=['get'])
    def statistics(self, request):
        by_type = list(Asset.objects.values('type').annotate(count=Count('id')))
        by_status = list(Asset.objects.values('status').annotate(count=Count('id')))
        total = Asset.objects.count()
        in_use = Asset.objects.filter(status='in_use').count()
        
        return Response({
            'total': total,
            'in_use': in_use,
            'by_type': by_type,
            'by_status': by_status,
        })


class ChangeRequestViewSet(viewsets.ModelViewSet):
    queryset = ChangeRequest.objects.all()
    serializer_class = ChangeRequestSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['type', 'risk', 'status']
    search_fields = ['change_number', 'title', 'description']
    ordering_fields = ['change_number', 'created_at', 'start_date']
    ordering = ['-created_at']
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update']:
            return [IsAuthenticated()]
        if self.action == 'destroy':
            return [IsAdminOrManager()]
        return [IsAuthenticated()]
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        change = self.get_object()
        if request.user.role not in ['admin', 'manager']:
            raise PermissionDenied("Only managers can approve changes")
        change.status = 'authorized'
        change.approved_by = request.user
        change.save()
        serializer = self.get_serializer(change)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        change = self.get_object()
        if request.user.role not in ['admin', 'manager']:
            raise PermissionDenied("Only managers can reject changes")
        change.status = 'cancelled'
        change.save()
        serializer = self.get_serializer(change)
        return Response(serializer.data)


class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AuditLog.objects.all()
    serializer_class = AuditLogSerializer
    permission_classes = [IsAdminOrManager]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['action', 'model_name', 'user']
    ordering_fields = ['timestamp']
    ordering = ['-timestamp']


class DashboardStatsView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        now = timezone.now()
        week_ago = now - timedelta(days=7)
        month_ago = now - timedelta(days=30)
        
        tickets = Ticket.objects
        
        created_this_week = tickets.filter(created_at__gte=week_ago).count()
        resolved_this_week = tickets.filter(resolved_at__gte=week_ago).count()
        created_this_month = tickets.filter(created_at__gte=month_ago).count()
        resolved_this_month = tickets.filter(resolved_at__gte=month_ago).count()
        
        open_tickets = tickets.filter(status__in=['new', 'in_progress', 'on_hold']).count()
        
        avg_resolution_time = tickets.filter(
            resolved_at__isnull=False
        ).exclude(resolution_time=0).aggregate(
            avg=Count('id')
        )
        
        sla_breached = SLARecord.objects.filter(
            resolution_met=False
        ).count()
        
        sla_compliant = SLARecord.objects.filter(
            resolution_met=True
        ).count()
        
        total_sla = sla_breached + sla_compliant
        sla_compliance_rate = (sla_compliant / total_sla * 100) if total_sla > 0 else 100
        
        return Response({
            'created_this_week': created_this_week,
            'resolved_this_week': resolved_this_week,
            'created_this_month': created_this_month,
            'resolved_this_month': resolved_this_month,
            'open_tickets': open_tickets,
            'sla_compliance_rate': round(sla_compliance_rate, 1),
            'sla_breached': sla_breached,
        })


@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    email = request.data.get('email')
    password = request.data.get('password')
    
    if not email or not password:
        raise AuthenticationFailed('Email and password are required')
    
    user = authenticate(request, username=email, password=password)
    
    if user is None:
        try:
            user_obj = User.objects.get(email=email)
            user = authenticate(request, username=user_obj.username, password=password)
        except User.DoesNotExist:
            user = None
    
    if user is None:
        raise AuthenticationFailed('Invalid email or password')
    
    if not user.is_active:
        raise AuthenticationFailed('User account is disabled')
    
    token, _ = Token.objects.get_or_create(user=user)
    return Response({'token': token.key})
