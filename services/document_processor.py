import os
import uuid
import PyPDF2
import pytesseract
from typing import List, Dict, Any
from PIL import Image
import docx
import pandas as pd
import io

from models import FileType, ItemDetail
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
    
    try:
        # Extract text based on file type
        if file_type == FileType.PDF:
            extracted_text = extract_text_from_pdf(file_path)
        elif file_type == FileType.DOCX:
            extracted_text = extract_text_from_docx(file_path)
        elif file_type == FileType.EXCEL:
            extracted_text = extract_text_from_excel(file_path)
        elif file_type == FileType.IMAGE:
            # For images, use OpenAI vision API directly
            return await process_image(file_path)
        
        # Process the extracted text with OpenAI
        if extracted_text:
            result = await extract_text_with_openai(extracted_text)
            
            # Convert the OpenAI result to ItemDetail objects
            items = []
            for item_data in result.get("items", []):
                item_id = item_data.get("id", str(uuid.uuid4()))
                item = ItemDetail(
                    id=item_id,
                    name=item_data.get("name", "Unnamed Item"),
                    quantity=item_data.get("quantity"),
                    brand=item_data.get("brand"),
                    model=item_data.get("model"),
                    size=item_data.get("size"),
                    description=item_data.get("description"),
                    extracted_confidence=item_data.get("extracted_confidence", 0.0)
                )
                items.append(item)
            
            return items
    except Exception as e:
        print(f"Error processing document: {e}")
    
    # Return empty list if processing failed
    return []

def extract_text_from_pdf(file_path: str) -> str:
    """Extract text from a PDF file"""
    text = ""
    try:
        with open(file_path, "rb") as file:
            pdf_reader = PyPDF2.PdfReader(file)
            for page_num in range(len(pdf_reader.pages)):
                page = pdf_reader.pages[page_num]
                text += page.extract_text() + "\n\n"
    except Exception as e:
        print(f"Error extracting text from PDF: {e}")
    return text

def extract_text_from_docx(file_path: str) -> str:
    """Extract text from a DOCX file"""
    text = ""
    try:
        doc = docx.Document(file_path)
        for paragraph in doc.paragraphs:
            text += paragraph.text + "\n"
        for table in doc.tables:
            for row in table.rows:
                for cell in row.cells:
                    text += cell.text + " | "
                text += "\n"
    except Exception as e:
        print(f"Error extracting text from DOCX: {e}")
    return text

def extract_text_from_excel(file_path: str) -> str:
    """Extract text from an Excel file"""
    text = ""
    try:
        df = pd.read_excel(file_path)
        buffer = io.StringIO()
        df.to_csv(buffer)
        text = buffer.getvalue()
    except Exception as e:
        print(f"Error extracting text from Excel: {e}")
    return text

async def process_image(file_path: str) -> List[ItemDetail]:
    """Process an image file using OCR and AI analysis"""
    items = []
    
    try:
        # First try OCR to extract text
        ocr_text = ""
        try:
            image = Image.open(file_path)
            ocr_text = pytesseract.image_to_string(image)
        except Exception as e:
            print(f"OCR extraction failed, falling back to image analysis: {e}")
        
        # If OCR extracted meaningful text, process it with text API
        if len(ocr_text.strip()) > 100:  # Arbitrary threshold to determine if OCR was successful
            result = await extract_text_with_openai(ocr_text)
        else:
            # Use image analysis API if OCR didn't yield good results
            result = await analyze_image_with_openai(file_path)
        
        # Convert the AI result to ItemDetail objects
        for item_data in result.get("items", []):
            item_id = item_data.get("id", str(uuid.uuid4()))
            item = ItemDetail(
                id=item_id,
                name=item_data.get("name", "Unnamed Item"),
                quantity=item_data.get("quantity"),
                brand=item_data.get("brand"),
                model=item_data.get("model"),
                size=item_data.get("size"),
                description=item_data.get("description"),
                extracted_confidence=item_data.get("extracted_confidence", 0.0)
            )
            items.append(item)
    except Exception as e:
        print(f"Error processing image: {e}")
    
    return items