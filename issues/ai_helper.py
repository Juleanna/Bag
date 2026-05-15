"""AI-помічник (без зовнішніх LLM-API).

Реалізовано 4 функції алгоритмічно:
 1) find_duplicates — trigram-similarity (pg_trgm на Postgres; fallback на
    SequenceMatcher для SQLite/тестів)
 2) smart_search — Postgres full-text search + парсер ключових слів
    («critical», «за тиждень», «web»)
 3) generate_test_case — rule-based шаблони з ключових слів опису
 4) summarize_thread — extractive summary через TextRank-подібний score
"""

from __future__ import annotations

import re
from datetime import timedelta
from difflib import SequenceMatcher

from django.conf import settings
from django.db.models import Q
from django.utils import timezone


# ============================================================================
# 1. Виявлення дублікатів — trigram similarity
# ============================================================================


def find_duplicates(
    *,
    project_id: int | None,
    title: str,
    description: str = "",
    limit: int = 5,
    user_projects=None,
):
    """Повертає список Issue зі схожим заголовком/описом.

    Postgres: використовує TrigramSimilarity на title (вагомо) і description
    (менша вага). SQLite: SequenceMatcher по title (повільніше, але працює).
    """
    from .models import Issue

    if not title.strip():
        return []

    qs = Issue.objects.filter(is_archived=False)
    if project_id is not None:
        qs = qs.filter(project_id=project_id)
    elif user_projects is not None:
        qs = qs.filter(project__in=user_projects)

    if _is_postgres():
        from django.contrib.postgres.search import TrigramSimilarity
        from django.db.models import F, FloatField, Value
        from django.db.models.functions import Greatest

        title_sim = TrigramSimilarity("title", title)
        desc_sim = (
            TrigramSimilarity("description", description) if description else Value(0.0, output_field=FloatField())
        )
        qs = (
            qs.annotate(_score=Greatest(title_sim, desc_sim * 0.5))
            .filter(_score__gt=0.25)
            .order_by("-_score")[:limit]
        )
        return list(qs)

    # SQLite-фолбек
    candidates = list(qs[:200])
    scored = []
    title_lower = title.lower()
    for c in candidates:
        s = SequenceMatcher(None, title_lower, c.title.lower()).ratio()
        if s > 0.4:
            scored.append((s, c))
    scored.sort(key=lambda x: x[0], reverse=True)
    return [c for _, c in scored[:limit]]


# ============================================================================
# 2. Smart search — full-text + ключові слова
# ============================================================================

_PRIORITY_KEYWORDS = {
    "critical": "critical",
    "критичн": "critical",
    "high": "high",
    "високий": "high",
    "high priority": "high",
    "medium": "medium",
    "середн": "medium",
    "low": "low",
    "низьк": "low",
}

_STATUS_KEYWORDS = {
    "open": "open",
    "відкрит": "open",
    "in progress": "in_progress",
    "у роботі": "in_progress",
    "в процесі": "in_progress",
    "done": "done",
    "готов": "done",
    "closed": "done",
    "закрит": "done",
    "blocked": "blocked",
    "заблоков": "blocked",
}


def _parse_time_range(query: str):
    """Шукає у запиті часові фрази і повертає (since: datetime|None, cleaned_query)."""
    q = query
    now = timezone.now()
    since = None
    patterns = [
        (r"за\s+сьогодні|сьогодні", timedelta(days=1)),
        (r"за\s+вчора|вчора", timedelta(days=2)),
        (r"за\s+тиждень|останн[іий]+ тижд|this\s+week|past\s+week|7\s+днів", timedelta(days=7)),
        (r"за\s+місяць|останн[іий]+ місяц|this\s+month|past\s+month|30\s+днів", timedelta(days=30)),
        (r"за\s+рік|past\s+year|365\s+днів", timedelta(days=365)),
    ]
    for pat, delta in patterns:
        m = re.search(pat, q, re.IGNORECASE)
        if m:
            since = now - delta
            q = re.sub(pat, "", q, flags=re.IGNORECASE).strip()
            break
    return since, q


def smart_search(*, query: str, user_projects, limit: int = 50):
    """Розумний пошук багів.

    Парсимо ключові слова (priority/status/час), будуємо Q-фільтри. На
    Postgres ще ранжуємо по SearchRank. Повертаємо список Issue (без
    serialization — це робить view).
    """
    from .models import Issue

    if not query.strip():
        return Issue.objects.none()

    q = query.lower().strip()
    filters = Q(is_archived=False, project__in=user_projects)

    # Priority
    for kw, val in _PRIORITY_KEYWORDS.items():
        if kw in q:
            filters &= Q(priority=val)
            q = q.replace(kw, "")
            break

    # Status
    for kw, val in _STATUS_KEYWORDS.items():
        if kw in q:
            filters &= Q(status=val)
            q = q.replace(kw, "")
            break

    # Time
    since, q = _parse_time_range(q)
    if since:
        filters &= Q(created_at__gte=since)

    q = q.strip()
    qs = Issue.objects.filter(filters)

    # Залишок — текстовий пошук
    if q:
        if _is_postgres():
            from django.contrib.postgres.search import SearchQuery, SearchRank, SearchVector

            vec = SearchVector("title", weight="A") + SearchVector("description", weight="B")
            sq = SearchQuery(q, search_type="websearch", config="simple")
            qs = qs.annotate(_rank=SearchRank(vec, sq)).filter(_rank__gt=0).order_by("-_rank")
        else:
            qs = qs.filter(Q(title__icontains=q) | Q(description__icontains=q))
    else:
        qs = qs.order_by("-updated_at")

    return qs[:limit]


# ============================================================================
# 3. Генерація test case з опису бага
# ============================================================================


def generate_test_case(issue) -> dict:
    """Генерує структуру тест-кейсу з title/description бага.

    Не LLM — rule-based:
     - witнаходимо «коли … тоді …» → беремо як крок + expected
     - якщо є «Кроки відтворення:» в description — парсимо нумерований список
     - інакше — fallback smoke-тест
    """
    title = issue.title or ""
    description = issue.description or ""
    text = f"{title}\n{description}"

    steps: list[dict] = []
    preconditions = ""
    expected_result = ""

    # 1. Якщо у description вже є структурований список «1. ... 2. ...»
    numbered = re.findall(r"^\s*\d+[\.\)]\s+(.+?)$", description, re.MULTILINE)
    if numbered:
        for line in numbered:
            line = line.strip()
            if line:
                steps.append({"step": line[:255], "expected": ""})

    # 2. Якщо знаходимо явні «передумови:» / «expected:» — витягуємо
    pre_match = re.search(
        r"(?:передумов[аи]|preconditions?)[:\-]\s*(.+?)(?:\n\n|\n[А-ЯA-Z])",
        text,
        re.IGNORECASE | re.DOTALL,
    )
    if pre_match:
        preconditions = pre_match.group(1).strip()[:1000]

    exp_match = re.search(
        r"(?:очікуван[ое]+(?:[іиа]й)?\s+результат|expected\s+result)[:\-]\s*(.+?)(?:\n\n|$)",
        text,
        re.IGNORECASE | re.DOTALL,
    )
    if exp_match:
        expected_result = exp_match.group(1).strip()[:500]

    # 3. Якщо нічого не знайдено — fallback з ключових слів
    if not steps:
        keywords = _detect_keywords(text)
        steps = _build_template_steps(title, keywords)
        if not expected_result:
            expected_result = _build_expected(keywords, title)

    return {
        "title": _build_test_title(title),
        "preconditions": preconditions,
        "steps": steps[:20],
        "expected_result": expected_result,
        "priority": _map_priority(issue.priority),
        "type": "manual",
    }


def _detect_keywords(text: str) -> set[str]:
    """Знаходить ключові слова в описі для вибору шаблону тесту."""
    t = text.lower()
    keywords = set()
    rules = {
        "login": ["login", "вхід", "logout", "auth", "авторизац"],
        "form": ["форма", "form", "input", "поле", "submit"],
        "button": ["кнопк", "button", "натиск", "click"],
        "page": ["сторінк", "page"],
        "error": ["помилк", "error", "fail", "exception", "500", "404"],
        "perf": ["повільно", "slow", "lag", "performance", "тайм-аут", "timeout"],
        "ui": ["ui", "інтерфейс", "відображ", "display", "render"],
        "data": ["дан", "data", "збереж", "save", "load"],
        "permission": ["право", "permission", "access", "доступ"],
    }
    for key, words in rules.items():
        if any(w in t for w in words):
            keywords.add(key)
    return keywords


def _build_template_steps(title: str, keywords: set[str]) -> list[dict]:
    """Шаблонні кроки залежно від виявлених ключових слів."""
    steps: list[dict] = [
        {"step": "Відкрити застосунок у браузері", "expected": "Головна сторінка завантажилась без помилок"},
    ]
    if "login" in keywords:
        steps.append({"step": "Увійти під тестовим обліковим записом", "expected": "Користувача перенаправлено на /dashboard"})
    if "page" in keywords or "form" in keywords:
        steps.append({"step": f"Перейти до місця, де виникає проблема: «{title[:80]}»", "expected": "Сторінка відкривається"})
    if "form" in keywords:
        steps.append({"step": "Заповнити форму валідними даними", "expected": "Поля приймають введення без помилок"})
        steps.append({"step": "Натиснути «Зберегти» / «Надіслати»", "expected": "Дані збережено, з'являється підтвердження"})
    if "button" in keywords:
        steps.append({"step": "Натиснути ключову кнопку, описану у багу", "expected": "Очікувана дія виконується"})
    if "error" in keywords:
        steps.append({"step": "Відтворити умови, за яких у багу виникає помилка", "expected": "Помилка БІЛЬШЕ не зʼявляється"})
    if "perf" in keywords:
        steps.append({"step": "Виміряти час відгуку (DevTools → Network)", "expected": "Час < 2 секунд"})
    if "permission" in keywords:
        steps.append({"step": "Перевірити доступ під різними ролями (admin / user / гість)", "expected": "Доступ відповідає матриці прав"})
    # Завжди — фінальна перевірка
    steps.append({"step": "Перевірити консоль браузера на JS-помилки", "expected": "Жодних red-error у Console"})
    return steps


def _build_expected(keywords: set[str], title: str) -> str:
    if "error" in keywords:
        return f"Сценарій з бага «{title[:80]}» не призводить до помилки/збою."
    if "perf" in keywords:
        return "Час виконання сценарію — у межах SLA (< 2 с)."
    if "login" in keywords:
        return "Користувач успішно автентифікований; redirect на головну."
    if "form" in keywords:
        return "Форма коректно валідується і зберігається."
    return f"Поведінка, описана у багу «{title[:80]}», виправлена і не повторюється."


def _build_test_title(title: str) -> str:
    """Перетворює «Помилка X при Y» → «Перевірити X при Y»."""
    t = title.strip()
    for prefix in ("Помилка ", "Bug:", "[BUG]", "BUG:", "Не працює "):
        if t.lower().startswith(prefix.lower()):
            t = t[len(prefix):].strip()
            break
    if not t.lower().startswith(("перевірити", "verify", "check")):
        t = f"Перевірити: {t}"
    return t[:255]


_PRIORITY_MAP = {
    "critical": "critical",
    "high": "high",
    "medium": "medium",
    "low": "low",
}


def _map_priority(p: str) -> str:
    return _PRIORITY_MAP.get((p or "").lower(), "medium")


# ============================================================================
# 4. Summary тред коментарів — extractive TextRank-подібний
# ============================================================================


def summarize_thread(issue, max_sentences: int = 5) -> dict:
    """Стисне обговорення в бага: повертає ключові sentences + meta."""
    comments = list(
        issue.comments.select_related("author").order_by("created_at")
        if hasattr(issue, "comments")
        else []
    )
    if not comments:
        return {
            "summary": "Обговорення поки відсутнє.",
            "highlights": [],
            "comments_total": 0,
        }

    # Збираємо всі речення з тексту коментарів
    all_sentences: list[tuple[str, str, str]] = []  # (sentence, author, when)
    for c in comments:
        author = (c.author.username if c.author else "—") if hasattr(c, "author") else "—"
        when = c.created_at.isoformat() if hasattr(c, "created_at") else ""
        for s in _split_sentences(c.body or ""):
            if 10 <= len(s) <= 400:
                all_sentences.append((s, author, when))

    if not all_sentences:
        return {
            "summary": "У треді немає змістовних реплік.",
            "highlights": [],
            "comments_total": len(comments),
        }

    # TextRank-like scoring: речення з найвищою overlap з рештою
    sentences = [s[0] for s in all_sentences]
    scores = _textrank_scores(sentences)
    indexed = sorted(enumerate(scores), key=lambda x: x[1], reverse=True)
    top_idx = sorted([i for i, _ in indexed[:max_sentences]])  # зберігаємо хронологію

    highlights = [
        {"text": all_sentences[i][0], "author": all_sentences[i][1], "when": all_sentences[i][2]}
        for i in top_idx
    ]
    summary = " ".join(all_sentences[i][0] for i in top_idx)

    return {
        "summary": summary,
        "highlights": highlights,
        "comments_total": len(comments),
        "first_author": (comments[0].author.username if comments[0].author else "—"),
        "last_author": (comments[-1].author.username if comments[-1].author else "—"),
    }


_SENTENCE_SPLIT = re.compile(r"(?<=[.!?…])\s+(?=[А-ЯA-Z])")


def _split_sentences(text: str) -> list[str]:
    text = (text or "").strip()
    if not text:
        return []
    # Прості еврістики: спочатку по абзацах, потім по реченнях
    paragraphs = [p.strip() for p in text.split("\n") if p.strip()]
    out = []
    for p in paragraphs:
        out.extend(s.strip() for s in _SENTENCE_SPLIT.split(p) if s.strip())
    return out


def _textrank_scores(sentences: list[str]) -> list[float]:
    """Спрощений TextRank: для кожного речення рахуємо overlap-score з усіма іншими."""
    if not sentences:
        return []
    tokens = [_tokenize(s) for s in sentences]
    n = len(sentences)
    scores = [0.0] * n
    for i in range(n):
        for j in range(n):
            if i == j or not tokens[j]:
                continue
            common = tokens[i] & tokens[j]
            scores[i] += len(common) / (len(tokens[i]) + len(tokens[j]) + 1)
    return scores


_TOKEN_SPLIT = re.compile(r"[^\w']+", re.UNICODE)
_STOP_WORDS = {
    "и", "у", "в", "на", "з", "за", "до", "не", "що", "як", "це", "то", "та", "а",
    "the", "a", "is", "of", "in", "to", "and", "or", "with", "for", "but", "on", "at",
    "це", "так", "там", "тут", "був", "були", "буде", "якщо", "коли",
}


def _tokenize(text: str) -> set[str]:
    return {
        t for t in _TOKEN_SPLIT.split(text.lower())
        if len(t) > 2 and t not in _STOP_WORDS
    }


# ============================================================================
# Helpers
# ============================================================================


def _is_postgres() -> bool:
    engine = settings.DATABASES["default"]["ENGINE"]
    return "postgresql" in engine or "postgis" in engine
