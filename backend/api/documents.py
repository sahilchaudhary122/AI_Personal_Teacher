from fastapi import APIRouter, HTTPException, UploadFile, File, Depends
import os
import tempfile
from services.rag_service import ingest_pdf
from api.dependencies import get_current_student

router = APIRouter(
    prefix="/api/documents",
    tags=["Documents"]
)

@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    student: dict = Depends(get_current_student)
):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(
            status_code=400,
            detail="Only PDF files are supported."
        )

    student_id = student["id"]

    # Save to temp file
    temp_dir = tempfile.gettempdir()
    temp_path = os.path.join(temp_dir, file.filename)

    try:
        with open(temp_path, "wb") as f:
            f.write(await file.read())

        result = ingest_pdf(
            file_path=temp_path,
            student_id=student_id,
            filename=file.filename,
            subject="General",
            title=file.filename
        )

        return {
            "success": True,
            "document_id": result["document_id"],
            "filename": file.filename
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Ingestion failed: {str(e)}"
        )
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)
