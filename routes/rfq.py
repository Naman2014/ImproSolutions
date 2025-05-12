from fastapi import APIRouter, Request, Form, UploadFile, File, HTTPException, Depends
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.templating import Jinja2Templates
from typing import List, Optional
import uuid
import os
import datetime
from pathlib import Path

from models import RFQ, RFQStatus, UploadedFile, FileType, ItemDetail
from config import settings
from services.document_processor import process_document

router = APIRouter(prefix="/rfq", tags=["RFQ Management"])
templates = Jinja2Templates(directory="templates")

# In-memory storage for demo purposes
rfq_database = {}
current_rfq_number = 1

def generate_rfq_number():
    """Generate a unique RFQ number in the format INQ13QP-2025-00001"""
    global current_rfq_number
    rfq_num = f"{settings.RFQ_PREFIX}-{settings.RFQ_YEAR}-{current_rfq_number:05d}"
    current_rfq_number += 1
    return rfq_num

def ensure_upload_dir_exists():
    """Ensure the upload directory exists"""
    Path(settings.UPLOAD_FOLDER).mkdir(parents=True, exist_ok=True)

@router.get("/", response_class=HTMLResponse)
async def get_rfq_dashboard(request: Request):
    """Main RFQ dashboard view"""
    return templates.TemplateResponse(
        "dashboard.html",
        {"request": request, "title": "RFQ Dashboard", "rfqs": list(rfq_database.values())}
    )

@router.get("/new", response_class=HTMLResponse)
async def new_rfq_form(request: Request):
    """Form to create a new RFQ"""
    return templates.TemplateResponse(
        "rfq_entry.html",
        {"request": request, "title": "New RFQ Entry"}
    )

@router.post("/new", response_class=HTMLResponse)
async def create_rfq(
    request: Request,
    client_name: str = Form(...),
    notes: Optional[str] = Form(None),
    files: List[UploadFile] = File(None)
):
    """Create a new RFQ with uploaded files"""
    ensure_upload_dir_exists()
    
    # Generate a unique RFQ ID and number
    rfq_id = str(uuid.uuid4())
    rfq_number = generate_rfq_number()
    now = datetime.datetime.now()
    
    # Process uploaded files
    uploaded_files = []
    if files:
        for file in files:
            if file.filename:
                # Determine file type
                file_extension = file.filename.split('.')[-1].lower()
                if file_extension in ['pdf']:
                    file_type = FileType.PDF
                elif file_extension in ['docx', 'doc']:
                    file_type = FileType.DOCX
                elif file_extension in ['xlsx', 'xls']:
                    file_type = FileType.EXCEL
                elif file_extension in ['jpg', 'jpeg', 'png', 'gif']:
                    file_type = FileType.IMAGE
                else:
                    continue  # Skip unsupported file types
                
                # Save file
                file_id = str(uuid.uuid4())
                file_path = f"{settings.UPLOAD_FOLDER}/{file_id}_{file.filename}"
                
                with open(file_path, "wb") as f:
                    f.write(await file.read())
                
                uploaded_file = UploadedFile(
                    id=file_id,
                    filename=file.filename,
                    file_type=file_type,
                    upload_date=now,
                    file_path=file_path
                )
                uploaded_files.append(uploaded_file)
    
    # Create the RFQ object
    new_rfq = RFQ(
        id=rfq_id,
        rfq_number=rfq_number,
        client_name=client_name,
        created_at=now,
        updated_at=now,
        status=RFQStatus.DRAFT,
        files=uploaded_files,
        notes=notes
    )
    
    # Store in our in-memory database
    rfq_database[rfq_id] = new_rfq
    
    return templates.TemplateResponse(
        "data_extraction.html",
        {
            "request": request,
            "title": "Data Extraction",
            "rfq": new_rfq,
            "message": f"RFQ {rfq_number} created successfully"
        }
    )

@router.get("/{rfq_id}", response_class=HTMLResponse)
async def get_rfq_details(request: Request, rfq_id: str):
    """Get details of a specific RFQ"""
    if rfq_id not in rfq_database:
        raise HTTPException(status_code=404, detail="RFQ not found")
    
    rfq = rfq_database[rfq_id]
    return templates.TemplateResponse(
        "data_extraction.html",
        {"request": request, "title": f"RFQ {rfq.rfq_number}", "rfq": rfq}
    )

@router.post("/{rfq_id}/process", response_class=JSONResponse)
async def process_rfq_documents(request: Request, rfq_id: str):
    """Process RFQ documents using AI to extract information"""
    if rfq_id not in rfq_database:
        raise HTTPException(status_code=404, detail="RFQ not found")
    
    rfq = rfq_database[rfq_id]
    
    # Update status
    rfq.status = RFQStatus.PROCESSING
    rfq_database[rfq_id] = rfq
    
    # Process each document
    extracted_items = []
    for file in rfq.files:
        try:
            items = await process_document(file.file_path, file.file_type)
            extracted_items.extend(items)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error processing document: {str(e)}")
    
    # Update RFQ with extracted items
    rfq.items = extracted_items
    rfq.status = RFQStatus.READY
    rfq.updated_at = datetime.datetime.now()
    rfq_database[rfq_id] = rfq
    
    return {"status": "success", "items": [item.dict() for item in extracted_items]}

@router.put("/{rfq_id}/items", response_class=JSONResponse)
async def update_rfq_items(request: Request, rfq_id: str, items: List[ItemDetail]):
    """Update RFQ items after manual correction"""
    if rfq_id not in rfq_database:
        raise HTTPException(status_code=404, detail="RFQ not found")
    
    rfq = rfq_database[rfq_id]
    rfq.items = items
    rfq.updated_at = datetime.datetime.now()
    rfq_database[rfq_id] = rfq
    
    return {"status": "success", "message": "RFQ items updated successfully"}
