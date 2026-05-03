from dotenv import load_dotenv
from pydantic_settings import BaseSettings

load_dotenv()


class Settings(BaseSettings):
    groq_api_key: str
    groq_model: str = "llama-3.3-70b-versatile"
    mistral_api_key: str = ""
    mistral_model: str = "mistral-small-latest"
    cors_origin: str = "http://localhost:3000"
    neon_database_url: str = ""

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
