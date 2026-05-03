from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone


class User(AbstractUser):
    ROLE_CHOICES = (
        ('end_user', 'End User'),
        ('technician', 'Technician'),
        ('manager', 'Manager'),
        ('admin', 'Admin'),
    )
    
    DEPARTMENT_CHOICES = (
        ('IT', 'Information Technology'),
        ('HR', 'Human Resources'),
        ('Finance', 'Finance'),
        ('Operations', 'Operations'),
        ('Sales', 'Sales'),
        ('Marketing', 'Marketing'),
        ('Legal', 'Legal'),
        ('Other', 'Other'),
    )
    
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=20, blank=True)
    department = models.CharField(max_length=20, choices=DEPARTMENT_CHOICES, blank=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='end_user')
    manager = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True)
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']
    
    class Meta:
        ordering = ['last_name', 'first_name']
    
    def __str__(self):
        return f"{self.first_name} {self.last_name}" if self.first_name else self.email


class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    parent = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='children')
    icon = models.CharField(max_length=50, blank=True, default='ticket')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name_plural = 'Categories'
        ordering = ['name']
    
    def __str__(self):
        return self.name


class Ticket(models.Model):
    PRIORITY_CHOICES = (
        ('1', 'Critical'),
        ('2', 'High'),
        ('3', 'Medium'),
        ('4', 'Low'),
    )
    
    STATUS_CHOICES = (
        ('new', 'New'),
        ('in_progress', 'In Progress'),
        ('on_hold', 'On Hold'),
        ('resolved', 'Resolved'),
        ('closed', 'Closed'),
        ('cancelled', 'Cancelled'),
    )
    
    TYPE_CHOICES = (
        ('incident', 'Incident'),
        ('service_request', 'Service Request'),
        ('problem', 'Problem'),
        ('change', 'Change Request'),
        ('task', 'Task'),
    )
    
    IMPACT_CHOICES = (
        ('1', 'High'),
        ('2', 'Medium'),
        ('3', 'Low'),
    )
    
    URGENCY_CHOICES = (
        ('1', 'High'),
        ('2', 'Medium'),
        ('3', 'Low'),
    )
    
    ticket_number = models.CharField(max_length=20, unique=True, editable=False)
    title = models.CharField(max_length=255)
    description = models.TextField()
    type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='incident')
    priority = models.CharField(max_length=1, choices=PRIORITY_CHOICES, default='3')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='new')
    impact = models.CharField(max_length=1, choices=IMPACT_CHOICES, default='2')
    urgency = models.CharField(max_length=1, choices=URGENCY_CHOICES, default='2')
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True)
    subcategory = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True, related_name='subcategory_tickets')
    
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_tickets')
    assigned_to = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_tickets')
    group = models.CharField(max_length=100, blank=True)
    
    resolution = models.TextField(blank=True)
    resolution_code = models.CharField(max_length=50, blank=True)
    
    due_date = models.DateTimeField(null=True, blank=True)
    resolved_at = models.DateTimeField(null=True, blank=True)
    closed_at = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def save(self, *args, **kwargs):
        if not self.ticket_number:
            prefix = {'incident': 'INC', 'service_request': 'REQ', 'problem': 'PRB', 'change': 'CHG', 'task': 'TSK'}.get(self.type, 'TKT')
            last = Ticket.objects.filter(ticket_number__startswith=prefix).order_by('-ticket_number').first()
            if last:
                num = int(last.ticket_number.split('-')[1]) + 1
            else:
                num = 1000
            self.ticket_number = f"{prefix}-{num}"
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.ticket_number}: {self.title}"


class Comment(models.Model):
    ticket = models.ForeignKey(Ticket, on_delete=models.CASCADE, related_name='comments')
    author = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    body = models.TextField()
    is_internal = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['created_at']
    
    def __str__(self):
        return f"Comment by {self.author} on {self.ticket}"


class Attachment(models.Model):
    ticket = models.ForeignKey(Ticket, on_delete=models.CASCADE, related_name='attachments')
    comment = models.ForeignKey(Comment, on_delete=models.CASCADE, null=True, blank=True, related_name='attachments')
    file = models.FileField(upload_to='attachments/%Y/%m/%d/')
    uploaded_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.file.name}"


class SLAPolicy(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    priority = models.CharField(max_length=1, choices=Ticket.PRIORITY_CHOICES)
    type = models.CharField(max_length=20, choices=Ticket.TYPE_CHOICES, blank=True)
    response_time_hours = models.PositiveIntegerField(help_text="Hours to first response")
    resolution_time_hours = models.PositiveIntegerField(help_text="Hours to resolution")
    is_active = models.BooleanField(default=True)
    
    class Meta:
        verbose_name = 'SLA Policy'
        ordering = ['priority']
    
    def __str__(self):
        return f"{self.name} - Priority {self.get_priority_display()}"


class SLARecord(models.Model):
    ticket = models.OneToOneField(Ticket, on_delete=models.CASCADE, related_name='sla_record')
    policy = models.ForeignKey(SLAPolicy, on_delete=models.SET_NULL, null=True)
    response_due = models.DateTimeField(null=True, blank=True)
    resolution_due = models.DateTimeField(null=True, blank=True)
    response_met = models.BooleanField(null=True)
    resolution_met = models.BooleanField(null=True)
    response_time = models.DurationField(null=True, blank=True)
    resolution_time = models.DurationField(null=True, blank=True)
    
    class Meta:
        verbose_name = 'SLA Record'
    
    def __str__(self):
        return f"SLA for {self.ticket}"


class KnowledgeBase(models.Model):
    STATUS_CHOICES = (
        ('draft', 'Draft'),
        ('review', 'Under Review'),
        ('published', 'Published'),
        ('archived', 'Archived'),
    )
    
    title = models.CharField(max_length=255)
    content = models.TextField()
    summary = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True)
    author = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='kb_articles')
    views = models.PositiveIntegerField(default=0)
    is_helpful_yes = models.PositiveIntegerField(default=0)
    is_helpful_no = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    published_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        verbose_name = 'Knowledge Base Article'
        ordering = ['-created_at']
    
    def __str__(self):
        return self.title


class Asset(models.Model):
    STATUS_CHOICES = (
        ('in_use', 'In Use'),
        ('in_stock', 'In Stock'),
        ('maintenance', 'Under Maintenance'),
        ('retired', 'Retired'),
        ('disposed', 'Disposed'),
    )
    
    TYPE_CHOICES = (
        ('hardware', 'Hardware'),
        ('software', 'Software'),
        ('license', 'License'),
        ('network', 'Network Equipment'),
        ('other', 'Other'),
    )
    
    name = models.CharField(max_length=255)
    asset_tag = models.CharField(max_length=50, unique=True)
    type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='in_stock')
    manufacturer = models.CharField(max_length=100, blank=True)
    model = models.CharField(max_length=100, blank=True)
    serial_number = models.CharField(max_length=100, blank=True)
    assigned_to = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='assets')
    location = models.CharField(max_length=255, blank=True)
    purchase_date = models.DateField(null=True, blank=True)
    warranty_expiry = models.DateField(null=True, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['asset_tag']
    
    def __str__(self):
        return f"{self.asset_tag} - {self.name}"


class ChangeRequest(models.Model):
    STATUS_CHOICES = (
        ('new', 'New'),
        ('assessing', 'Assessing'),
        ('authorized', 'Authorized'),
        ('scheduled', 'Scheduled'),
        ('implementing', 'Implementing'),
        ('reviewing', 'Reviewing'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    )
    
    RISK_CHOICES = (
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
    )
    
    TYPE_CHOICES = (
        ('standard', 'Standard'),
        ('normal', 'Normal'),
        ('emergency', 'Emergency'),
    )
    
    change_number = models.CharField(max_length=20, unique=True, editable=False)
    title = models.CharField(max_length=255)
    description = models.TextField()
    type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='normal')
    risk = models.CharField(max_length=20, choices=RISK_CHOICES, default='medium')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='new')
    reason = models.TextField(help_text="Reason for change")
    implementation_plan = models.TextField(blank=True)
    rollback_plan = models.TextField(blank=True)
    test_plan = models.TextField(blank=True)
    
    requested_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='requested_changes')
    assigned_to = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_changes')
    approved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_changes')
    
    start_date = models.DateTimeField(null=True, blank=True)
    end_date = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    ticket = models.OneToOneField(Ticket, on_delete=models.SET_NULL, null=True, blank=True, related_name='change_request')
    
    class Meta:
        ordering = ['-created_at']
    
    def save(self, *args, **kwargs):
        if not self.change_number:
            last = ChangeRequest.objects.order_by('-change_number').first()
            if last:
                num = int(last.change_number.split('-')[1]) + 1
            else:
                num = 1000
            self.change_number = f"CHG-{num}"
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.change_number}: {self.title}"


class AuditLog(models.Model):
    ACTION_CHOICES = (
        ('create', 'Created'),
        ('update', 'Updated'),
        ('delete', 'Deleted'),
        ('assign', 'Assigned'),
        ('status_change', 'Status Changed'),
        ('comment', 'Comment Added'),
    )
    
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    action = models.CharField(max_length=20, choices=ACTION_CHOICES)
    model_name = models.CharField(max_length=50)
    object_id = models.PositiveIntegerField()
    description = models.TextField()
    changes = models.JSONField(default=dict, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-timestamp']
    
    def __str__(self):
        return f"{self.action} {self.model_name} #{self.object_id} by {self.user}"
