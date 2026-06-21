import pytest


async def test_get_news_returns_200(client):
    response = await client.get("/news/")
    assert response.status_code == 200


async def test_get_news_returns_list(client):
    response = await client.get("/news/")
    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0


async def test_get_news_items_have_required_fields(client):
    response = await client.get("/news/")
    items = response.json()
    required_fields = {"id", "title", "summary", "category", "published_at", "source", "ai_analysis", "stock_impacts"}
    for item in items:
        assert required_fields.issubset(item.keys()), f"Missing fields in item: {item.get('id')}"


async def test_get_news_no_null_non_nullable_fields(client):
    response = await client.get("/news/")
    items = response.json()
    non_nullable = ["id", "title", "summary", "category", "published_at", "source", "ai_analysis"]
    for item in items:
        for field in non_nullable:
            assert item[field] is not None, f"Null value for {field} in item {item.get('id')}"


async def test_get_news_filter_by_category(client):
    response = await client.get("/news/?category=พลังงาน")
    assert response.status_code == 200
    items = response.json()
    for item in items:
        assert item["category"] == "พลังงาน"


async def test_get_news_by_id_returns_200(client):
    response = await client.get("/news/news-001")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == "news-001"


async def test_get_news_by_id_not_found_returns_404(client):
    response = await client.get("/news/nonexistent-id")
    assert response.status_code == 404


async def test_get_categories_returns_200(client):
    response = await client.get("/news/categories")
    assert response.status_code == 200
    data = response.json()
    assert "categories" in data
    assert isinstance(data["categories"], list)
