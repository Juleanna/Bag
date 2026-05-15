"""API endpoints для AI-помічника (всі алгоритмічні, без зовнішніх LLM)."""

from rest_framework import permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from . import ai_helper
from .models import Issue
from .views_api import _user_projects_cached


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def find_duplicates(request):
    """POST {project?, title, description?, limit?} → top-N схожих issues.

    Якщо передано `exclude_id` — той баг виключається (зручно при edit).
    """
    data = request.data or {}
    title = str(data.get("title", "")).strip()
    description = str(data.get("description", ""))
    project_id = data.get("project")
    limit = min(int(data.get("limit") or 5), 20)
    exclude_id = data.get("exclude_id")

    user_projects = _user_projects_cached(request)
    matches = ai_helper.find_duplicates(
        project_id=project_id,
        title=title,
        description=description,
        limit=limit + (1 if exclude_id else 0),
        user_projects=user_projects,
    )
    if exclude_id:
        matches = [m for m in matches if m.id != int(exclude_id)][:limit]

    return Response(
        {
            "results": [
                {
                    "id": m.id,
                    "title": m.title,
                    "status": m.status,
                    "status_display": getattr(m, "status_display", m.status),
                    "priority": m.priority,
                    "project": m.project_id,
                    "created_at": m.created_at.isoformat(),
                    "score": getattr(m, "_score", None),
                }
                for m in matches
            ]
        }
    )


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def smart_search(request):
    """POST {query} → список Issue, ранжованих за релевантністю.

    Парсимо ключові слова (critical / за тиждень / blocked) → конвертимо
    у фільтри + повнотекстовий пошук Postgres.
    """
    data = request.data or {}
    query = str(data.get("query", ""))
    user_projects = _user_projects_cached(request)
    matches = ai_helper.smart_search(query=query, user_projects=user_projects, limit=50)
    return Response(
        {
            "query": query,
            "results": [
                {
                    "id": m.id,
                    "title": m.title,
                    "status": m.status,
                    "status_display": getattr(m, "status_display", m.status),
                    "priority": m.priority,
                    "project": m.project_id,
                    "created_at": m.created_at.isoformat(),
                }
                for m in matches
            ],
        }
    )


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def generate_test_case(request):
    """POST {issue_id} → структура тест-кейсу (preview, ще не збережено)."""
    issue_id = request.data.get("issue_id")
    if not issue_id:
        return Response({"detail": "issue_id обовʼязковий"}, status=400)
    user_projects = _user_projects_cached(request)
    issue = Issue.objects.filter(pk=issue_id, project__in=user_projects).first()
    if not issue:
        return Response({"detail": "Доступ заборонено або баг не існує"}, status=404)
    payload = ai_helper.generate_test_case(issue)
    return Response(payload)


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def summarize_thread(request):
    """POST {issue_id} → стислий конспект треда коментарів."""
    issue_id = request.data.get("issue_id")
    if not issue_id:
        return Response({"detail": "issue_id обовʼязковий"}, status=400)
    user_projects = _user_projects_cached(request)
    issue = Issue.objects.filter(pk=issue_id, project__in=user_projects).first()
    if not issue:
        return Response({"detail": "Доступ заборонено або баг не існує"}, status=404)
    payload = ai_helper.summarize_thread(issue)
    return Response(payload)
