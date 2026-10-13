from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    github_token: str | None = None
    frontend_origin: str = "http://localhost:3000"
    database_url: str = "postgresql://proof_user:local_dev_password_change_me@localhost:5432/proof_of_skill"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")


settings = Settings()
