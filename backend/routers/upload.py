import os
import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, UploadFile

from core.auth import get_current_user
from models import User
from schemas.upload import UploadResponse

router = APIRouter(prefix="/api/uploads", tags=["uploads"])

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("", response_model=UploadResponse)
async def upload_file(
    file: UploadFile,
    current_user: Annotated[User, Depends(get_current_user)],
) -> dict:
    """Upload a file and return its URL."""
    # Generate unique filename
    file_ext = file.filename.split(".")[-1] if "." in file.filename else ""
    unique_filename = f"{uuid.uuid4()}.{file_ext}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)

    # Save file
    with open(file_path, "wb") as f:
        content = await file.read()
        f.write(content)

    # Return URL
    url = f"/uploads/{unique_filename}"
    return {"url": url}
