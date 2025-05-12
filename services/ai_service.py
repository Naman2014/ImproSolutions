import os
import json
import base64
from typing import Dict, Any, List, Optional

# the newest OpenAI model is "gpt-4o" which was released May 13, 2024.
# do not change this unless explicitly requested by the user
from openai import OpenAI

# Initialize OpenAI client
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")
openai = OpenAI(api_key=OPENAI_API_KEY)

async def extract_text_with_openai(document_text: str) -> Dict[str, Any]:
    """
    Use OpenAI to extract structured information from document text
    
    Args:
        document_text: Text extracted from a document
        
    Returns:
        Structured data extracted from the text
    """
    # System prompt to instruct the model to extract procurement information
    system_prompt = """
    You are an AI procurement specialist. Extract structured information about items from the provided procurement document.
    Focus on identifying products, quantities, brands, models, and any specifications.
    For each item, provide:
    1. A descriptive name
    2. Quantity (if mentioned)
    3. Brand (if mentioned)
    4. Model number (if mentioned)
    5. Size or dimensions (if mentioned)
    6. A brief description with key specifications
    7. A confidence score between 0 and 1 for your extraction

    Return the information in the following JSON format:
    {
        "items": [
            {
                "id": "item1",
                "name": "Item name",
                "quantity": number,
                "brand": "Brand name",
                "model": "Model number",
                "size": "Size information",
                "description": "Brief description with specifications",
                "extracted_confidence": 0.9
            }
        ]
    }
    """
    
    # User prompt with the document text
    user_prompt = f"Extract procurement items from the following document text:\n\n{document_text}"
    
    try:
        response = openai.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            response_format={"type": "json_object"},
            temperature=0.2
        )
        
        # Parse the JSON response
        result = json.loads(response.choices[0].message.content)
        return result
    except Exception as e:
        print(f"Error in OpenAI extraction: {e}")
        return {"items": []}

async def analyze_image_with_openai(image_path: str) -> Dict[str, Any]:
    """
    Use OpenAI vision to analyze and extract information from an image
    
    Args:
        image_path: Path to the image file
        
    Returns:
        Structured data extracted from the image
    """
    # Read the image file
    with open(image_path, "rb") as image_file:
        base64_image = base64.b64encode(image_file.read()).decode('utf-8')
    
    # System prompt to instruct the model to extract procurement information
    system_prompt = """
    You are an AI procurement specialist analyzing images of products or documents.
    Extract all relevant product information visible in the image.
    For each item you identify, provide:
    1. A descriptive name
    2. Quantity (if visible)
    3. Brand (if visible)
    4. Model number (if visible)
    5. Size or dimensions (if visible)
    6. A brief description with key specifications
    7. A confidence score between 0 and 1 for your extraction

    Return the information in the following JSON format:
    {
        "items": [
            {
                "id": "item1",
                "name": "Item name",
                "quantity": number,
                "brand": "Brand name",
                "model": "Model number",
                "size": "Size information",
                "description": "Brief description with specifications",
                "extracted_confidence": 0.9
            }
        ]
    }
    """
    
    try:
        response = openai.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": [
                    {"type": "text", "text": "Extract all product information from this image:"},
                    {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{base64_image}"}}
                ]}
            ],
            response_format={"type": "json_object"},
            temperature=0.2
        )
        
        # Parse the JSON response
        result = json.loads(response.choices[0].message.content)
        return result
    except Exception as e:
        print(f"Error in OpenAI image analysis: {e}")
        return {"items": []}

async def get_vendor_suggestions(item_data: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    Get vendor suggestions for an item using AI
    
    Args:
        item_data: Item data including name, brand, model, etc.
        
    Returns:
        List of vendor suggestions
    """
    # Format the item data for the prompt
    item_description = f"""
    Item: {item_data.get('name', 'Unknown item')}
    Brand: {item_data.get('brand', 'N/A')}
    Model: {item_data.get('model', 'N/A')}
    Description: {item_data.get('description', 'No description available')}
    """
    
    # System prompt to instruct the model
    system_prompt = """
    You are an AI procurement specialist. Based on the provided item information,
    suggest types of vendors that would likely supply this item. For each vendor type,
    provide a match score representing how likely they are to supply this specific item.
    
    Return the information in the following JSON format:
    {
        "vendor_suggestions": [
            {
                "vendor_type": "manufacturer",
                "match_score": 0.9,
                "specialization": "Electronics manufacturing"
            }
        ]
    }
    
    Vendor types should be one of: manufacturer, authorized_distributor, reseller, stockist
    """
    
    try:
        response = openai.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Suggest vendors for this item:\n{item_description}"}
            ],
            response_format={"type": "json_object"},
            temperature=0.3
        )
        
        # Parse the JSON response
        result = json.loads(response.choices[0].message.content)
        return result.get("vendor_suggestions", [])
    except Exception as e:
        print(f"Error in OpenAI vendor suggestions: {e}")
        return []