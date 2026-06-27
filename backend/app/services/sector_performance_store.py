from threading import Lock


class SectorPerformanceStore:
    def __init__(self) -> None:
        self._lock = Lock()
        self._sectors: list[dict] = []

    def set_all(self, sectors: list[dict]) -> None:
        with self._lock:
            self._sectors = [dict(s) for s in sectors]

    def get_all(self) -> list[dict]:
        with self._lock:
            return [dict(s) for s in self._sectors]

    def reset(self) -> None:
        with self._lock:
            self._sectors = []


sector_performance_store = SectorPerformanceStore()
