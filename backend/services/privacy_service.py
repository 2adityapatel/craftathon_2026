import hashlib
from crypto.encrypt import rsa_decrypt, aes_decrypt
from config import settings

class PrivacyService:
    @staticmethod
    def decrypt_and_verify(encrypted_payload: str, encrypted_aes_key: str, 
                           original_hash: str, aes_iv: str, aes_tag: str) -> bytes:
        """
        1. Decrypts the AES key using the Backend's RSA Private Key.
        2. Decrypts the payload using the recovered AES key.
        3. Verifies the SHA-256 hash.
        """
        try:
            with open(settings.rsa_private_key_path, "r") as f:
                private_key_pem = f.read()
                
            # Decrypt AES key
            aes_key = rsa_decrypt(encrypted_aes_key, private_key_pem)
            
            # Decrypt Payload
            clean_payload = aes_decrypt(encrypted_payload, aes_key, aes_iv, aes_tag)
            
            # Verify hash
            computed_hash = hashlib.sha256(clean_payload).hexdigest()
            if computed_hash != original_hash:
                raise ValueError("Payload hash mismatch, tampering detected!")
                
            # Exif stripping could be added here
            
            return clean_payload
        except Exception as e:
            raise ValueError(f"Decryption or Verification failed: {str(e)}")
