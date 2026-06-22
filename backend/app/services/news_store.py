import hashlib
import uuid
from threading import Lock

from app.services.mock_data import NEWS_DATA


class NewsStore:
    def __init__(self) -> None:
        self._lock = Lock()
        self._items: list[dict] = [dict(item) for item in NEWS_DATA]
        self._url_index: dict[str, str] = {item["source_url"]: item["id"] for item in self._items}
        self._content_hashes: dict[str, str] = {
            self._hash(item["content"]): item["id"] for item in self._items
        }

    def _hash(self, content: str) -> str:
        return hashlib.sha256(content.encode()).hexdigest()

    def get_all(self) -> list[dict]:
        with self._lock:
            return list(self._items)

    def get_by_id(self, news_id: str) -> dict | None:
        with self._lock:
            for item in self._items:
                if item["id"] == news_id:
                    return dict(item)
            return None

    def ingest(self, payload_dict: dict) -> tuple[str, str]:
        with self._lock:
            url = payload_dict["source_url"]
            content_hash = self._hash(payload_dict["content"])

            if url in self._url_index:
                return (self._url_index[url], "duplicate")

            if content_hash in self._content_hashes:
                return (self._content_hashes[content_hash], "duplicate")

            event_id = str(uuid.uuid4())
            item = {**payload_dict, "id": event_id, "ai_analysis": None, "stock_impacts": []}
            self._items.append(item)
            self._url_index[url] = event_id
            self._content_hashes[content_hash] = event_id
            return (event_id, "created")

    def attach_analysis(self, news_id: str, analysis_dict: dict) -> str | None:
        with self._lock:
            for item in self._items:
                if item["id"] == news_id:
                    status = "attached" if item["ai_analysis"] is None else "updated"
                    item["ai_analysis"] = analysis_dict
                    return status
            return None

    def reset(self) -> None:
        with self._lock:
            self._items = [dict(item) for item in NEWS_DATA]
            self._url_index = {item["source_url"]: item["id"] for item in self._items}
            self._content_hashes = {
                self._hash(item["content"]): item["id"] for item in self._items
            }


news_store = NewsStore()
