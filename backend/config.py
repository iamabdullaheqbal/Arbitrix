from dotenv import load_dotenv
from pydantic_settings import BaseSettings

load_dotenv()


class Settings(BaseSettings):
    gemini_api_key: str
    gemini_model: str = "gemini-2.5-flash"
    mistral_api_key: str
    mistral_model: str = "codestral-latest"
    cors_origin: str = "http://localhost:3000"
    neon_database_url: str = ""

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"  # silently ignore any extra env vars


settings = Settings()
