import hashlib

def generate_sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()

def verify_sha256(data: bytes, expected_hash: str) -> bool:
    return generate_sha256(data) == expected_hash
