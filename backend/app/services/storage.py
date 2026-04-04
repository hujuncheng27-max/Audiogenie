import uuid
from .database import get_connection


class StorageService:
    """Upload reference storage backed by SQLite."""

    def save_file(self, filename: str) -> str:
        ref = f"ref_{uuid.uuid4().hex}"
        conn = get_connection()
        try:
            conn.execute(
                "INSERT INTO uploads (ref, filename) VALUES (?, ?)",
                (ref, filename),
            )
            conn.commit()
        finally:
            conn.close()
        return ref


storage_service = StorageService()
