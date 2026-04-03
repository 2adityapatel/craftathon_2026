import requests
import hashlib
from Crypto.PublicKey import RSA
from Crypto.Cipher import PKCS1_OAEP, AES
from Crypto.Random import get_random_bytes
import json
import os
import sys

def test_image_flow(image_path: str):
    if not os.path.exists(image_path):
        print(f"Error: Could not find image at {image_path}")
        return

    base_url = "http://localhost:8000"
    print(f"--- Testing Image Backend Flow at {base_url} ---")
    
    # 1. Fetch the Public Key
    print("\n1. Fetching RSA Public Key from backend...")
    try:
        res = requests.get(f"{base_url}/api/v1/public-key")
        if res.status_code != 200:
            print(f"Failed to fetch public key. Is the backend running? Response: {res.text}")
            return
        public_key_pem = res.json().get("public_key")
        print("Successfully retrieved Public Key.")
    except Exception as e:
        print(f"Connection error: Make sure the server is running on {base_url} - {e}")
        return
    
    # 2. Read the image file
    with open(image_path, "rb") as f:
        evidence_bytes = f.read()
    print(f"Read image file: {image_path} ({len(evidence_bytes)} bytes)")
    
    # 3. Client-Side Encryption
    print("\n2. Performing Client-Side Encryption...")
    
    original_hash = hashlib.sha256(evidence_bytes).hexdigest()
    print(f"[Client] Computed SHA-256 Hash: {original_hash}")
    
    aes_key = get_random_bytes(32)
    cipher_aes = AES.new(aes_key, AES.MODE_GCM)
    encrypted_payload_bytes, tag_bytes = cipher_aes.encrypt_and_digest(evidence_bytes)
    
    encrypted_payload_hex = encrypted_payload_bytes.hex()
    aes_iv_hex = cipher_aes.nonce.hex()
    aes_tag_hex = tag_bytes.hex()
    
    print(f"[Client] Encrypted Payload created.")
    
    public_key = RSA.import_key(public_key_pem)
    cipher_rsa = PKCS1_OAEP.new(public_key)
    encrypted_aes_key_bytes = cipher_rsa.encrypt(aes_key)
    encrypted_aes_key_hex = encrypted_aes_key_bytes.hex()
    
    # 4. Submit to Backend
    print("\n3. Submitting to /api/v1/submit...")
    
    payload = {
        "encrypted_payload": encrypted_payload_hex,
        "encrypted_aes_key": encrypted_aes_key_hex,
        "original_hash": original_hash,
        "evidence_type": "image",
        "description": "Image submission test",
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
        
        print("\n4. Testing /api/v1/track with case_id and case_key...")
        # NOTE: the track endpoint expects query parameters!
        track_url = f"{base_url}/api/v1/track?case_id={case_id}&case_key={case_key}"
        print(f"Hitting URL: {track_url}")
        
        track_res = requests.get(track_url)
        print(f"Track Response Status: {track_res.status_code}")
        print(f"Track Response Body: {json.dumps(track_res.json(), indent=2)}")

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Test Image Upload Flow")
    parser.add_argument("image_path", help="Path to the image to upload and test")
    args = parser.parse_args()
    
    test_image_flow(args.image_path)
