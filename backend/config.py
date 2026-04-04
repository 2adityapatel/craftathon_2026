from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Server config
    host: str = "0.0.0.0"
    port: int = 8000
    
    # DB
    database_url: str = "postgresql://postgres:postgres@localhost:5432/pocso"
    
    # RSA
    rsa_private_key_path: str = "keys/private.pem"
    rsa_public_key_path: str = "keys/public.pem"
    
    # Third party
    pinata_api_key: str = ""
    pinata_secret_key: str = ""
    huggingface_token: str = ""
    
    # Blockchain (Sepolia)
    sepolia_rpc_url: str = ""
    contract_address: str = ""
    system_wallet_private_key: str = ""
    
    # Safe Browsing
    safe_browsing_api_key: str = ""
    
    # Admin
    admin_username: str = "admin"
    admin_password_hash: str = ""

    # Rate limiting
    rate_limit: str = "5/minute"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"  # Silently ignore unknown env vars (e.g. VITE_GROQ_API_KEY)

settings = Settings()