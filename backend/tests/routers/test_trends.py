import re
from datetime import datetime, timedelta, timezone

import pytest

from app.services.theme_store import ARCHIVE_HOURS, theme_store

BKK_TZ = timezone(timedelta(hours=7))


def _now_utc() -> datetime:
    return datetime.now(timezone.utc)


SAMPLE_THEME = {
    "theme_id": "theme-001",
    "name": "Fed Rate Cut Sentiment",
    "description": "Markets anticipate rate cuts following softer CPI data published this week.",
    "overall_sentiment": "bullish",
    "article_count": 2,
    "last_article_at": _now_utc() - timedelta(hours=1),
    "created_at": _now_utc() - timedelta(hours=2),
    "constituent_article_ids": ["news-001", "news-002"],
}


@pytest.fixture(autouse=True)
async def reset_store():
    theme_store.reset()
    yield
    theme_store.reset()


# --- GET /trends/ ---


async def test_get_themes_returns_200_empty_list_when_no_themes(client):
    response = await client.get("/trends/")
    assert response.status_code == 200
    assert response.json() == []


async def test_get_themes_returns_active_theme(client):
    theme_store.upsert(SAMPLE_THEME)
    response = await client.get("/trends/")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["theme_id"] == "theme-001"
    assert data[0]["name"] == "Fed Rate Cut Sentiment"


async def test_get_themes_excludes_archived_themes(client):
    archived = {
        **SAMPLE_THEME,
        "theme_id": "theme-archived",
        "last_article_at": _now_utc() - timedelta(hours=ARCHIVE_HOURS + 1),
    }
    theme_store.upsert(archived)
    response = await client.get("/trends/")
    assert response.status_code == 200
    assert response.json() == []


async def test_get_themes_48h_boundary_appears(client):
    """Theme 1 minute before cutoff should appear."""
    almost_expired = _now_utc() - timedelta(hours=ARCHIVE_HOURS) + timedelta(minutes=1)
    theme_store.upsert({**SAMPLE_THEME, "last_article_at": almost_expired})
    response = await client.get("/trends/")
    assert response.status_code == 200
    assert len(response.json()) == 1


async def test_get_themes_48h_boundary_excluded(client):
    """Theme 1 minute past cutoff should NOT appear."""
    just_archived = _now_utc() - timedelta(hours=ARCHIVE_HOURS) - timedelta(minutes=1)
    theme_store.upsert({**SAMPLE_THEME, "last_article_at": just_archived})
    response = await client.get("/trends/")
    assert response.status_code == 200
    assert response.json() == []


async def test_get_themes_sorted_by_last_article_at_descending(client):
    older = {
        **SAMPLE_THEME,
        "theme_id": "theme-older",
        "last_article_at": _now_utc() - timedelta(hours=10),
    }
    newer = {
        **SAMPLE_THEME,
        "theme_id": "theme-newer",
        "last_article_at": _now_utc() - timedelta(hours=1),
    }
    theme_store.upsert(older)
    theme_store.upsert(newer)
    response = await client.get("/trends/")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2
    assert data[0]["theme_id"] == "theme-newer"
    assert data[1]["theme_id"] == "theme-older"


async def test_get_themes_required_fields_present(client):
    theme_store.upsert(SAMPLE_THEME)
    response = await client.get("/trends/")
    item = response.json()[0]
    required = {"theme_id", "name", "description", "overall_sentiment",
                "article_count", "last_article_at", "created_at"}
    assert required.issubset(item.keys())


async def test_get_themes_does_not_include_constituent_articles(client):
    """List view must not include constituent_articles."""
    theme_store.upsert(SAMPLE_THEME)
    response = await client.get("/trends/")
    item = response.json()[0]
    assert "constituent_articles" not in item


# --- GET /trends/{theme_id} ---


async def test_get_theme_by_id_returns_200_with_constituent_articles(client):
    theme_store.upsert(SAMPLE_THEME)
    response = await client.get("/trends/theme-001")
    assert response.status_code == 200
    data = response.json()
    assert data["theme_id"] == "theme-001"
    assert "constituent_articles" in data
    assert isinstance(data["constituent_articles"], list)
    assert len(data["constituent_articles"]) > 0


async def test_get_theme_by_id_returns_410_when_archived(client):
    archived = {
        **SAMPLE_THEME,
        "theme_id": "theme-archived",
        "last_article_at": _now_utc() - timedelta(hours=ARCHIVE_HOURS + 1),
    }
    theme_store.upsert(archived)
    response = await client.get("/trends/theme-archived")
    assert response.status_code == 410


async def test_get_theme_by_id_returns_404_for_unknown_id(client):
    response = await client.get("/trends/nonexistent-theme")
    assert response.status_code == 404


async def test_get_theme_sentiment_is_valid_enum(client):
    theme_store.upsert(SAMPLE_THEME)
    response = await client.get("/trends/theme-001")
    assert response.status_code == 200
    assert response.json()["overall_sentiment"] in ("bullish", "bearish", "neutral")


async def test_get_theme_datetimes_are_timezone_aware(client):
    theme_store.upsert(SAMPLE_THEME)
    response = await client.get("/trends/theme-001")
    assert response.status_code == 200
    data = response.json()
    for field in ["last_article_at", "created_at"]:
        assert re.search(r"([+-]\d{2}:\d{2}|Z)$", data[field]), (
            f"{field} not timezone-aware: {data[field]}"
        )


async def test_get_theme_constituent_articles_sorted_descending(client):
    """news-001 published_at > news-002 published_at in mock data."""
    theme_store.upsert(SAMPLE_THEME)
    response = await client.get("/trends/theme-001")
    assert response.status_code == 200
    articles = response.json()["constituent_articles"]
    assert len(articles) >= 2
    timestamps = [a["published_at"] for a in articles]
    assert timestamps == sorted(timestamps, reverse=True)
