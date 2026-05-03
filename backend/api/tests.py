from django.test import TestCase
from django.contrib.auth import get_user_model
from .models import Ticket, Category, SLAPolicy

User = get_user_model()


class TicketModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123',
            first_name='Test',
            last_name='User'
        )
        self.category = Category.objects.create(name='Hardware')

    def test_ticket_creation(self):
        ticket = Ticket.objects.create(
            title='Test Ticket',
            description='Test description',
            created_by=self.user,
            category=self.category,
        )
        self.assertIsNotNone(ticket.ticket_number)
        self.assertTrue(ticket.ticket_number.startswith('INC-'))
        self.assertEqual(ticket.status, 'new')
        self.assertEqual(ticket.priority, '3')

    def test_ticket_str(self):
        ticket = Ticket.objects.create(
            title='Test Ticket',
            description='Test description',
            created_by=self.user,
        )
        self.assertEqual(str(ticket), f"{ticket.ticket_number}: Test Ticket")

    def test_different_ticket_types(self):
        types = ['incident', 'service_request', 'problem', 'change', 'task']
        prefixes = ['INC', 'REQ', 'PRB', 'CHG', 'TSK']
        
        for ticket_type, prefix in zip(types, prefixes):
            ticket = Ticket.objects.create(
                title=f'{ticket_type} ticket',
                description='Test',
                type=ticket_type,
                created_by=self.user,
            )
            self.assertTrue(ticket.ticket_number.startswith(prefix))


class UserModelTest(TestCase):
    def test_user_creation(self):
        user = User.objects.create_user(
            email='newuser@example.com',
            password='pass123',
            first_name='New',
            last_name='User',
            role='technician',
        )
        self.assertEqual(user.email, 'newuser@example.com')
        self.assertTrue(user.check_password('pass123'))
        self.assertEqual(user.role, 'technician')

    def test_superuser_creation(self):
        user = User.objects.create_superuser(
            email='admin@example.com',
            password='admin123',
            username='admin',
        )
        self.assertTrue(user.is_staff)
        self.assertTrue(user.is_superuser)


class SLAPolicyTest(TestCase):
    def test_sla_policy_creation(self):
        policy = SLAPolicy.objects.create(
            name='Test SLA',
            priority='1',
            response_time_hours=1,
            resolution_time_hours=4,
        )
        self.assertEqual(policy.response_time_hours, 1)
        self.assertEqual(policy.resolution_time_hours, 4)
