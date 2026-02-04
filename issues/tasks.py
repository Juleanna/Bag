"""
Background tasks for BugTracker using Celery.
"""

# from celery import shared_task
# from django.core.mail import send_mail
# from django.template.loader import render_to_string
# from .models import Issue, Comment, Notification
# import logging

# logger = logging.getLogger(__name__)


# @shared_task(bind=True, max_retries=3)
# def send_issue_notification(self, issue_id, action='created'):
#     """Send notification when issue is created/updated."""
#     try:
#         issue = Issue.objects.get(id=issue_id)
#         # Get project members
#         members = issue.project.members.all()
#
#         # Send emails
#         for member in members:
#             if member.email:
#                 context = {'issue': issue, 'action': action, 'user': member}
#                 html_message = render_to_string('emails/issue_notification.html', context)
#                 send_mail(
#                     subject=f'Issue {action}: {issue.title}',
#                     message='',
#                     from_email='noreply@bugtracker.com',
#                     recipient_list=[member.email],
#                     html_message=html_message,
#                 )
#         logger.info(f'Sent notification for issue {issue_id}')
#     except Issue.DoesNotExist:
#         logger.error(f'Issue {issue_id} not found')
#     except Exception as exc:
#         logger.error(f'Error sending notification: {exc}')
#         self.retry(exc=exc, countdown=60)


# @shared_task
# def export_project_issues(project_id, user_id, format='csv'):
#     """Export project issues to CSV/Excel."""
#     try:
#         from django.contrib.auth import get_user_model
#         User = get_user_model()
#
#         project = Project.objects.get(id=project_id)
#         user = User.objects.get(id=user_id)
#         issues = project.issues.all()
#
#         # Export logic here
#         logger.info(f'Exported {issues.count()} issues from project {project_id}')
#     except Exception as exc:
#         logger.error(f'Export failed: {exc}')


# @shared_task
# def send_weekly_digest(user_id):
#     """Send weekly digest to user."""
#     try:
#         from django.contrib.auth import get_user_model
#         User = get_user_model()
#
#         user = User.objects.get(id=user_id)
#         # Get user's assigned issues
#         assigned_issues = user.assigned_issues.filter(
#             updated_at__gte=timezone.now() - timedelta(days=7)
#         )
#
#         if assigned_issues.exists():
#             context = {'user': user, 'issues': assigned_issues}
#             html_message = render_to_string('emails/weekly_digest.html', context)
#             send_mail(
#                 subject='Weekly Issues Digest',
#                 message='',
#                 from_email='noreply@bugtracker.com',
#                 recipient_list=[user.email],
#                 html_message=html_message,
#             )
#             logger.info(f'Sent digest to {user.email}')
#     except Exception as exc:
#         logger.error(f'Digest error: {exc}')
