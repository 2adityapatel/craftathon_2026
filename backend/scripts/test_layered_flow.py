import requests
import hashlib
from Crypto.PublicKey import RSA
from Crypto.Cipher import PKCS1_OAEP, AES
from Crypto.Random import get_random_bytes
import json
import time
import os

def run_test(name: str, file_path: str | None = None, text_content: str = ""):
    base_url = "http://localhost:8000"
    print(f"\n{'='*50}\nTESTING: {name}\n{'='*50}")
    
    # Fetch PK
    res = requests.get(f"{base_url}/api/v1/public-key")
    if res.status_code != 200:
        print("Backend not reachable.")
        return
    public_key_pem = res.json().get("public_key")
    
    # Read payload bytes (either file or text)
    if file_path and os.path.exists(file_path):
        with open(file_path, "rb") as f:
            evidence_bytes = f.read()
    else:
        evidence_bytes = b""
        
    original_hash = hashlib.sha256(evidence_bytes or text_content.encode('utf-8')).hexdigest()
    
    aes_key = get_random_bytes(32)
    cipher_aes = AES.new(aes_key, AES.MODE_GCM)
    encrypted_payload_bytes, tag_bytes = cipher_aes.encrypt_and_digest(evidence_bytes or text_content.encode('utf-8'))
    
    # Encrypt AES Key
    public_key = RSA.import_key(public_key_pem)
    cipher_rsa = PKCS1_OAEP.new(public_key)
    encrypted_aes_key = cipher_rsa.encrypt(aes_key).hex()
    
    payload = {
        "encrypted_payload": encrypted_payload_bytes.hex(),
        "encrypted_aes_key": encrypted_aes_key,
        "original_hash": original_hash,
        "evidence_type": "mixed",
        "description": text_content,
        "aes_iv": cipher_aes.nonce.hex(),
        "aes_tag": tag_bytes.hex()
    }
    
    res = requests.post(f"{base_url}/api/v1/submit", json=payload)
    print(f"Status: {res.status_code}\nResponse: {json.dumps(res.json(), indent=2)}")

def main():
    print("Beginning Multi-Modal Layered Flow Testing...\n")
    
    # 1. Text / NLP Testing
    run_test("Normal Conversation", text_content="Hello, I wanted to report something I saw today about normal activities.")
    time.sleep(2)
    
    run_test("Hinglish Hate Speech & Threats", text_content="tu pagal hai kya, maar dalunga tujhe bc")
    time.sleep(2)
    
    # 2. URL Fetching & Reputation Testing
    run_test("Malicious URL Submission (Phishing Mock)", text_content="Please investigate this attacker domain: http://phishing.com/scam-site")
    time.sleep(2)
    
    # 3. Vision Testing (Uses the local JPGs)
    run_test("NSFW Image Detection", file_path="nsfw.jpg", text_content="I suspect this is illegal porn")
    time.sleep(2)
    
    # 4. OCR / Chat Screenshot Testing (Uses chat.png)
    # NOTE: Keep a file named 'chat.png' in the backend folder to see the OCR + Abusive Severity in action!
    run_test("Abusive Chat Screenshot Detection", file_path="chat.png", text_content="This is a screenshot of our conversation")

if __name__ == "__main__":
    main()
