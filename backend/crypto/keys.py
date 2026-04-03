import os

def get_public_key_pem(path: str) -> str:
    """Reads and returns the public RSA key PEM."""
    with open(path, "r") as f:
        return f.read()

def get_private_key_pem(path: str) -> str:
    """Reads and returns the private RSA key PEM."""
    with open(path, "r") as f:
        return f.read()
