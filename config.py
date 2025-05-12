import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Application settings
    APP_NAME: str = "ProcureIQ™ AI Procurement Automation System"
    DEBUG: bool = os.getenv("DEBUG", "False").lower() == "true"
    
    # API Keys
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    AZURE_DOC_INTELLIGENCE_KEY: str = os.getenv("AZURE_DOC_INTELLIGENCE_KEY", "")
    AZURE_DOC_INTELLIGENCE_ENDPOINT: str = os.getenv("AZURE_DOC_INTELLIGENCE_ENDPOINT", "")
    GOOGLE_VISION_API_KEY: str = os.getenv("GOOGLE_VISION_API_KEY", "")
    
    # Email Settings
    SMTP_HOST: str = os.getenv("SMTP_HOST", "smtp.gmail.com")
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", "587"))
    SMTP_USERNAME: str = os.getenv("SMTP_USERNAME", "")
    SMTP_PASSWORD: str = os.getenv("SMTP_PASSWORD", "")
    EMAIL_FROM: str = os.getenv("EMAIL_FROM", "procureiq@example.com")
    
    # File Upload Settings
    UPLOAD_FOLDER: str = "uploads"
    MAX_CONTENT_LENGTH: int = 16 * 1024 * 1024  # 16 MB
    ALLOWED_EXTENSIONS: list = ["pdf", "docx", "xlsx", "xls", "jpg", "jpeg", "png"]
    
    # RFQ Numbering
    RFQ_PREFIX: str = "INQ13QP"
    RFQ_YEAR: str = "2025"
    
    # Vendor APIs
    VENDOR_API_ENABLED: bool = os.getenv("VENDOR_API_ENABLED", "False").lower() == "true"
    THOMASNET_API_KEY: str = os.getenv("THOMASNET_API_KEY", "")
    ALIBABA_API_KEY: str = os.getenv("ALIBABA_API_KEY", "")
    VERIDION_API_KEY: str = os.getenv("VERIDION_API_KEY", "")

    class Config:
        env_file = ".env"

settings = Settings()
