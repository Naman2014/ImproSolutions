import os
import base64
import json
from typing import List, Dict, Any, Optional
from openai import OpenAI
from fastapi import HTTPException

from config import settings

# Initialize OpenAI client
openai_client = OpenAI(api_key=settings.OPENAI_API_KEY)

async def extract_text_with_openai(document_text: str) -> Dict[str, Any]:
    """
    Use OpenAI to extract structured information from document text
    
    Args:
        document_text: Text extracted from a document
        
    Returns:
        Structured data extracted from the text
    """
    try:
        # Create the prompt for OpenAI
        prompt = """
        Extract structured information from the following procurement request document text.
        Identify items being requested, including their names, quantities, brands, models, sizes, and types if available.
        Format the response as a JSON array of items, each with the following properties:
        - name: The name of the item
        - quantity: The quantity requested (if available)
        - brand: The brand name (if available)
        - model: The model number or name (if available)
        - size: The size specification (if available)
        - type: The type of item (if available)
        - description: Any additional description
        
        Document text:
        """
        
        response = openai_client.chat.completions.create(
            # the newest OpenAI model is "gpt-4o" which was released May 13, 2024.
            # do not change this unless explicitly requested by the user
            model="gpt-4o",
            messages=[
                {"role": "system", "content": "You are an AI assistant specializing in procurement document analysis."},
                {"role": "user", "content": f"{prompt}\n\n{document_text}"}
            ],
            response_format={"type": "json_object"},
            max_tokens=2000
        )
        
        result = json.loads(response.choices[0].message.content)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"OpenAI extraction error: {str(e)}")

async def analyze_image_with_openai(image_path: str) -> Dict[str, Any]:
    """
    Use OpenAI vision to analyze and extract information from an image
    
    Args:
        image_path: Path to the image file
        
    Returns:
        Structured data extracted from the image
    """
    try:
        # Read the image file and encode as base64
        with open(image_path, "rb") as image_file:
            base64_image = base64.b64encode(image_file.read()).decode('utf-8')
        
        # Create the prompt for OpenAI with the image
        response = openai_client.chat.completions.create(
            # the newest OpenAI model is "gpt-4o" which was released May 13, 2024.
            # do not change this unless explicitly requested by the user
            model="gpt-4o",
            messages=[
                {
                    "role": "system",
                    "content": "You are an AI assistant specializing in procurement document analysis. Extract product details from images."
                },
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": "Extract all product information from this image. Look for product name, model number, brand, size, quantity, and any other specifications. Format the response as JSON."
                        },
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{base64_image}"
                            }
                        }
                    ]
                }
            ],
            response_format={"type": "json_object"},
            max_tokens=1000
        )
        
        result = json.loads(response.choices[0].message.content)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"OpenAI image analysis error: {str(e)}")

async def get_vendor_suggestions(item_data: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    Get vendor suggestions for an item using AI
    
    Args:
        item_data: Item data including name, brand, model, etc.
        
    Returns:
        List of vendor suggestions
    """
    try:
        # Create prompt for vendor suggestions
        item_description = f"Item: {item_data.get('name', '')}"
        if item_data.get('brand'):
            item_description += f", Brand: {item_data['brand']}"
        if item_data.get('model'):
            item_description += f", Model: {item_data['model']}"
        if item_data.get('type'):
            item_description += f", Type: {item_data['type']}"
        
        prompt = f"""
        Suggest potential vendors for the following product:
        {item_description}
        
        Return a JSON array of vendors with the following properties:
        - company: Vendor company name
        - country: Country of origin
        - website: Company website URL
        - email: Contact email
        """
        
        response = openai_client.chat.completions.create(
            # the newest OpenAI model is "gpt-4o" which was released May 13, 2024.
            # do not change this unless explicitly requested by the user
            model="gpt-4o",
            messages=[
                {"role": "system", "content": "You are an AI assistant specializing in procurement vendor matching."},
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"},
            max_tokens=1000
        )
        
        result = json.loads(response.choices[0].message.content)
        return result.get("vendors", [])
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Vendor suggestion error: {str(e)}")
