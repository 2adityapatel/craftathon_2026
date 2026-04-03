from Crypto.PublicKey import RSA
from Crypto.Cipher import PKCS1_OAEP, AES

def rsa_decrypt(encrypted_data_hex: str, private_key_pem: str) -> bytes:
    """Decrypts AES key encrypted by frontend RSA-OAEP public key."""
    private_key = RSA.import_key(private_key_pem)
    cipher_rsa = PKCS1_OAEP.new(private_key)
    return cipher_rsa.decrypt(bytes.fromhex(encrypted_data_hex))

def aes_decrypt(encrypted_data_hex: str, aes_key: bytes, nonce_hex: str, tag_hex: str) -> bytes:
    """Decrypts main payload encrypted by frontend AES-256-GCM."""
    cipher_aes = AES.new(aes_key, AES.MODE_GCM, nonce=bytes.fromhex(nonce_hex))
    return cipher_aes.decrypt_and_verify(bytes.fromhex(encrypted_data_hex), bytes.fromhex(tag_hex))
