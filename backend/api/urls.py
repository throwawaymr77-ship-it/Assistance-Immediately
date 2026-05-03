from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    UserViewSet, CategoryViewSet, TicketViewSet, CommentViewSet,
    AttachmentViewSet, SLAPolicyViewSet, SLARecordViewSet,
    KnowledgeBaseViewSet, AssetViewSet, ChangeRequestViewSet,
    AuditLogViewSet, DashboardStatsView, login_view
)

router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'categories', CategoryViewSet)
router.register(r'tickets', TicketViewSet)
router.register(r'comments', CommentViewSet)
router.register(r'attachments', AttachmentViewSet)
router.register(r'sla-policies', SLAPolicyViewSet)
router.register(r'sla-records', SLARecordViewSet, basename='sla-records')
router.register(r'knowledge-base', KnowledgeBaseViewSet, basename='knowledge-base')
router.register(r'assets', AssetViewSet)
router.register(r'change-requests', ChangeRequestViewSet, basename='change-requests')
router.register(r'audit-logs', AuditLogViewSet, basename='audit-logs')

urlpatterns = [
    path('', include(router.urls)),
    path('auth/login/', login_view, name='api-token-auth'),
    path('dashboard/stats/', DashboardStatsView.as_view(), name='dashboard-stats'),
]
