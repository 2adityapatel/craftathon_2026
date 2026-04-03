import base64
from Crypto.PublicKey import RSA
from Crypto.Cipher import PKCS1_OAEP, AES
from Crypto.Hash import SHA256

def rsa_decrypt(encrypted_data_b64: str, private_key_pem: str) -> bytes:
    """Decrypts AES key encrypted by frontend RSA-OAEP public key."""
    encrypted_data = base64.b64decode(encrypted_data_b64)
    private_key = RSA.import_key(private_key_pem)
    
    # Frontend uses SHA-256 for RSA-OAEP, so we must specify it here
    cipher_rsa = PKCS1_OAEP.new(private_key, hashAlgo=SHA256)
    return cipher_rsa.decrypt(encrypted_data)

def aes_decrypt(encrypted_data_b64: str, aes_key: bytes, iv_b64: str, tag_b64: str) -> bytes:
    """Decrypts main payload encrypted by frontend AES-256-GCM."""
    encrypted_data = base64.b64decode(encrypted_data_b64)
    iv = base64.b64decode(iv_b64)
    tag = base64.b64decode(tag_b64)
    
    cipher_aes = AES.new(aes_key, AES.MODE_GCM, nonce=iv)
    return cipher_aes.decrypt_and_verify(encrypted_data, tag)
