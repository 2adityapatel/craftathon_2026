import requests
import hashlib
from Crypto.PublicKey import RSA
from Crypto.Cipher import PKCS1_OAEP, AES
from Crypto.Random import get_random_bytes
import json
import os

def test_fast_ocr(image_path: str):
    base_url = "http://localhost:8000"
    
    if not os.path.exists(image_path):
        print(f"Error: Could not find image at {image_path}")
        return
        
    print(f"\n==================================================")
    print(f"FAST TESTING OCR SEVERITY: {image_path}")
    print(f"==================================================")

    # Fetch PK
    try:
        res = requests.get(f"{base_url}/api/v1/public-key")
        public_key_pem = res.json().get("public_key")
    except Exception:
        print("Backend not reachable. Start uvicorn!")
        return

    # Read image
    with open(image_path, "rb") as f:
        evidence_bytes = f.read()

    # Encrypt
    original_hash = hashlib.sha256(evidence_bytes).hexdigest()
    aes_key = get_random_bytes(32)
    cipher_aes = AES.new(aes_key, AES.MODE_GCM)
    encrypted_payload_bytes, tag_bytes = cipher_aes.encrypt_and_digest(evidence_bytes)
    
    public_key = RSA.import_key(public_key_pem)
    cipher_rsa = PKCS1_OAEP.new(public_key)
    encrypted_aes_key = cipher_rsa.encrypt(aes_key).hex()

    payload = {
        "encrypted_payload": encrypted_payload_bytes.hex(),
        "encrypted_aes_key": encrypted_aes_key,
        "original_hash": original_hash,
        "evidence_type": "mixed",
        "description": "I intercepted this chat.",
        "aes_iv": cipher_aes.nonce.hex(),
        "aes_tag": tag_bytes.hex()
    }

    print("\nSending secure mapped request to /api/v1/submit...")
    res = requests.post(f"{base_url}/api/v1/submit", json=payload)
    
    print(f"\nStatus: {res.status_code}")
    print("Response:")
    print(json.dumps(res.json(), indent=2))
    
    if res.status_code == 200:
        print(f"\nSUCCESS: Threat Severity assigned as [{res.json().get('threat_level')}]")

if __name__ == "__main__":
    test_fast_ocr("D:/gu/posco/threat_chat.png")
