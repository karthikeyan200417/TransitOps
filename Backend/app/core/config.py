import os
from pydantic_settings import BaseSettings, SettingsConfigDict
class Settings(BaseSettings):
    # Connection fields loaded dynamically
    POSTGRES_USER: str = "transitops_user"
    POSTGRES_PASSWORD: str = "transitops_password"
    POSTGRES_HOST: str = "localhost"
    POSTGRES_PORT: int = 5433
    POSTGRES_DB: str = "transitops_db"
    @property
    def DATABASE_URL(self) -> str:
        return f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )
settings = Settings()
