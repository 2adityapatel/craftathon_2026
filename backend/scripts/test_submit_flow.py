import requests
import hashlib
from Crypto.PublicKey import RSA
from Crypto.Cipher import PKCS1_OAEP, AES
from Crypto.Random import get_random_bytes
import json
import base64

def test_flow():
    base_url = "http://localhost:8000"
    print(f"--- Testing Backend Flow at {base_url} ---")
    
    # 1. Fetch the Public Key
    print("\n1. Fetching RSA Public Key from backend...")
    res = requests.get(f"{base_url}/api/v1/public-key")
    if res.status_code != 200:
        print(f"Failed to fetch public key. Is the backend running? Response: {res.text}")
        return
    
    public_key_pem = res.json().get("public_key")
    print("Successfully retrieved Public Key.")
    
    # 2. Simulate User selecting "Evidence"
    evidence_text = "This is a highly sensitive report about suspicious activity at example.com."
    evidence_bytes = evidence_text.encode('utf-8')
    
    # 3. Client-Side Encryption
    print("\n2. Performing Client-Side Encryption...")
    
    # Step A: Compute original SHA-256 hash of the raw evidence
    original_hash = hashlib.sha256(evidence_bytes).hexdigest()
    print(f"[Client] Computed SHA-256 Hash: {original_hash}")
    
    # Step B: Generate a random AES-256 key (32 bytes)
    aes_key = get_random_bytes(32)
    
    # Step C: Encrypt the evidence with AES-GCM
    cipher_aes = AES.new(aes_key, AES.MODE_GCM)
    encrypted_payload_bytes, tag_bytes = cipher_aes.encrypt_and_digest(evidence_bytes)
    
    encrypted_payload_hex = encrypted_payload_bytes.hex()
    aes_iv_hex = cipher_aes.nonce.hex()
    aes_tag_hex = tag_bytes.hex()
    
    print(f"[Client] Encrypted Payload (Hex): {encrypted_payload_hex[:30]}...")
    
    # Step D: Encrypt the AES key with the Backend's RSA Public Key
    public_key = RSA.import_key(public_key_pem)
    cipher_rsa = PKCS1_OAEP.new(public_key)
    encrypted_aes_key_bytes = cipher_rsa.encrypt(aes_key)
    encrypted_aes_key_hex = encrypted_aes_key_bytes.hex()
    
    print("[Client] Encrypted AES Key with RSA.")
    
    # 4. Submit to Backend
    print("\n3. Submitting to /api/v1/submit...")
    
    payload = {
        "encrypted_payload": encrypted_payload_hex,
        "encrypted_aes_key": encrypted_aes_key_hex,
        "original_hash": original_hash,
        "evidence_type": "text",
        "description": "Text report submission",
        "aes_iv": aes_iv_hex,
        "aes_tag": aes_tag_hex
    }
    
    res = requests.post(f"{base_url}/api/v1/submit", json=payload)
    
    print(f"Response Status: {res.status_code}")
    print(f"Response Body: {json.dumps(res.json(), indent=2)}")
    
    # 5. Test Track Endpoint
    if res.status_code == 200:
        data = res.json()
        case_id = data.get("case_id")
        case_key = data.get("case_key")
        
        print("\n4. Testing /api/v1/track...")
        track_res = requests.get(f"{base_url}/api/v1/track", params={"case_id": case_id, "case_key": case_key})
        print(f"Track Response Status: {track_res.status_code}")
        print(f"Track Response Body: {json.dumps(track_res.json(), indent=2)}")

if __name__ == "__main__":
    test_flow()
