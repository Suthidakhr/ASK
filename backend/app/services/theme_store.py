from datetime import datetime, timedelta, timezone
from threading import Lock

ARCHIVE_HOURS = 48


class ThemeStore:
    def __init__(self) -> None:
        self._lock = Lock()
        self._themes: dict[str, dict] = {}

    def upsert(self, payload_dict: dict) -> str:
        with self._lock:
            key = payload_dict["theme_id"]
            status = "created" if key not in self._themes else "updated"
            self._themes[key] = dict(payload_dict)
            return status

    def get_active(self) -> list[dict]:
        cutoff = datetime.now(timezone.utc) - timedelta(hours=ARCHIVE_HOURS)
        with self._lock:
            active = [t for t in self._themes.values() if t["last_article_at"] > cutoff]
        return sorted(active, key=lambda t: t["last_article_at"], reverse=True)

    def get_by_id(self, theme_id: str) -> dict | None:
        with self._lock:
            return dict(self._themes[theme_id]) if theme_id in self._themes else None

    def is_archived(self, theme: dict) -> bool:
        cutoff = datetime.now(timezone.utc) - timedelta(hours=ARCHIVE_HOURS)
        return theme["last_article_at"] <= cutoff

    def reset(self) -> None:
        with self._lock:
            self._themes = {}


theme_store = ThemeStore()
