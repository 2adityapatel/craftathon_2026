from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Server config
    host: str = "0.0.0.0"
    port: int = 8000
    
    # DB
    database_url: str = "sqlite:///./pocso.db"
    
    # RSA
    rsa_private_key_path: str = "keys/private.pem"
    rsa_public_key_path: str = "keys/public.pem"
    
    # Third party
    pinata_api_key: str = ""
    pinata_secret_key: str = ""
    huggingface_token: str = ""
    
    # Polygon Blockchain
    contract_address: str = ""
    system_wallet_private_key: str = ""
    
    # Admin
    admin_username: str = "admin"
    admin_password_hash: str = ""

    # JWT
    jwt_secret: str = "pocso_super_secret_key_2026"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 600 # 10 hours for hackathon

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

settings = Settings()
