from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    APP_NAME: str = "FinTrack"
    APP_VERSION: str = "1.0.0"
    DATABASE_URL: str = "sqlite:///./fintrack.db"

    # JWT
    SECRET_KEY: str = "change-me-in-production-use-a-long-random-string"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    class Config:
        env_file = ".env"


settings = Settings()
