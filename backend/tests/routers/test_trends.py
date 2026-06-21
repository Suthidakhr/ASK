import pytest


async def test_get_trends_returns_200(client):
    response = await client.get("/trends/")
    assert response.status_code == 200


async def test_get_trends_returns_list(client):
    response = await client.get("/trends/")
    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0


async def test_get_trends_items_have_required_fields(client):
    response = await client.get("/trends/")
    items = response.json()
    required_fields = {"rank", "title", "description", "sentiment"}
    for item in items:
        assert required_fields.issubset(item.keys())


async def test_get_trends_no_null_non_nullable_fields(client):
    response = await client.get("/trends/")
    items = response.json()
    for item in items:
        for field in ["rank", "title", "description", "sentiment"]:
            assert item[field] is not None


async def test_get_trends_summary_returns_200(client):
    response = await client.get("/trends/summary")
    assert response.status_code == 200


async def test_get_trends_summary_has_required_fields(client):
    response = await client.get("/trends/summary")
    data = response.json()
    required_fields = {"date", "overview", "key_points", "watch_sectors", "avoid_sectors"}
    assert required_fields.issubset(data.keys())


async def test_get_trends_summary_no_null_non_nullable_fields(client):
    response = await client.get("/trends/summary")
    data = response.json()
    for field in ["date", "overview"]:
        assert data[field] is not None
