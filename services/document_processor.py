import os
import uuid
import tempfile
from typing import List, Dict, Any
import PyPDF2
from docx import Document
import pandas as pd
import pytesseract
from PIL import Image
import io

from models import ItemDetail, FileType
from services.ai_service import extract_text_with_openai, analyze_image_with_openai

async def process_document(file_path: str, file_type: FileType) -> List[ItemDetail]:
    """
    Process an uploaded document and extract item information
    
    Args:
        file_path: Path to the uploaded file
        file_type: Type of the file (PDF, DOCX, EXCEL, IMAGE)
        
    Returns:
        List of extracted items
    """
    extracted_text = ""
    
    # Extract text based on file type
    if file_type == FileType.PDF:
        extracted_text = extract_text_from_pdf(file_path)
    elif file_type == FileType.DOCX:
        extracted_text = extract_text_from_docx(file_path)
    elif file_type == FileType.EXCEL:
        extracted_text = extract_text_from_excel(file_path)
    elif file_type == FileType.IMAGE:
        # For images, we'll use AI-powered image analysis directly
        return await process_image(file_path)
    
    # Use AI to extract structured information from text
    if extracted_text:
        structured_data = await extract_text_with_openai(extracted_text)
        items = structured_data.get("items", [])
        
        # Convert to ItemDetail objects
        item_details = []
        for item in items:
            item_detail = ItemDetail(
                id=str(uuid.uuid4()),
                name=item.get("name", "Unknown Item"),
                quantity=item.get("quantity"),
                brand=item.get("brand"),
                model=item.get("model"),
                size=item.get("size"),
                type=item.get("type"),
                description=item.get("description"),
                extracted_confidence=item.get("confidence", 0.8)
            )
            item_details.append(item_detail)
        
        return item_details
    
    return []

def extract_text_from_pdf(file_path: str) -> str:
    """Extract text from a PDF file"""
    text = ""
    try:
        with open(file_path, "rb") as file:
            pdf_reader = PyPDF2.PdfReader(file)
            for page in pdf_reader.pages:
                text += page.extract_text() + "\n"
    except Exception as e:
        print(f"Error extracting text from PDF: {str(e)}")
    return text

def extract_text_from_docx(file_path: str) -> str:
    """Extract text from a DOCX file"""
    text = ""
    try:
        doc = Document(file_path)
        for paragraph in doc.paragraphs:
            text += paragraph.text + "\n"
        for table in doc.tables:
            for row in table.rows:
                for cell in row.cells:
                    text += cell.text + " "
                text += "\n"
    except Exception as e:
        print(f"Error extracting text from DOCX: {str(e)}")
    return text

def extract_text_from_excel(file_path: str) -> str:
    """Extract text from an Excel file"""
    text = ""
    try:
        # Read all sheets
        excel_data = pd.read_excel(file_path, sheet_name=None)
        
        # Process each sheet
        for sheet_name, df in excel_data.items():
            text += f"Sheet: {sheet_name}\n"
            
            # Convert DataFrame to string
            text += df.to_string(index=False) + "\n\n"
    except Exception as e:
        print(f"Error extracting text from Excel: {str(e)}")
    return text

async def process_image(file_path: str) -> List[ItemDetail]:
    """Process an image file using OCR and AI analysis"""
    try:
        # Use OpenAI Vision to analyze the image
        result = await analyze_image_with_openai(file_path)
        items = result.get("items", [])
        
        # Convert to ItemDetail objects
        item_details = []
        for item in items:
            item_detail = ItemDetail(
                id=str(uuid.uuid4()),
                name=item.get("name", "Unknown Item"),
                quantity=item.get("quantity"),
                brand=item.get("brand"),
                model=item.get("model"),
                size=item.get("size"),
                type=item.get("type"),
                description=item.get("description"),
                extracted_confidence=item.get("confidence", 0.7)
            )
            item_details.append(item_detail)
        
        return item_details
    except Exception as e:
        print(f"Error processing image: {str(e)}")
        return []
