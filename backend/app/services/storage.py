import uuid
from typing import Dict

class StorageService:
    def __init__(self):
        # In-memory storage for uploaded file references
        self.files: Dict[str, str] = {}

    def save_file(self, filename: str) -> str:
        ref = f"ref_{uuid.uuid4().hex}"
        self.files[ref] = filename
        return ref

storage_service = StorageService()
