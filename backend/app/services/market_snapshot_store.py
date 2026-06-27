from threading import Lock


class MarketSnapshotStore:
    def __init__(self) -> None:
        self._lock = Lock()
        self._snapshot: dict | None = None

    def set(self, snapshot_dict: dict) -> None:
        with self._lock:
            self._snapshot = dict(snapshot_dict)

    def get(self) -> dict | None:
        with self._lock:
            return dict(self._snapshot) if self._snapshot is not None else None

    def reset(self) -> None:
        with self._lock:
            self._snapshot = None


market_snapshot_store = MarketSnapshotStore()
