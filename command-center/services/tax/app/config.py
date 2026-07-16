from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    env: str = "development"
    cors_origins: list[str] = ["http://localhost:3000", "http://localhost:8000"]
    cos_api_url: str = "http://cos-web:3000/api"
    supabase_url: str = ""
    supabase_service_key: str = ""

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
