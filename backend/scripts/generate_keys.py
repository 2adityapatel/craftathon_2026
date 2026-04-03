import os
from Crypto.PublicKey import RSA

def generate_rsa_keys(output_dir="keys", key_size=2048):
    """
    Generates an RSA key pair and saves them as PEM files.
    """
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)

    print(f"Generating {key_size}-bit RSA key pair...")
    key = RSA.generate(key_size)
    private_key = key.export_key()
    public_key = key.publickey().export_key()

    private_key_path = os.path.join(output_dir, "private.pem")
    public_key_path = os.path.join(output_dir, "public.pem")

    with open(private_key_path, "wb") as f:
        f.write(private_key)

    with open(public_key_path, "wb") as f:
        f.write(public_key)

    print("Keys successfully generated at:")
    print(f" - Private Key: {private_key_path}")
    print(f" - Public Key:  {public_key_path}")

if __name__ == "__main__":
    # Get the backend root directory (grandparent of this script)
    backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    keys_dir = os.path.join(backend_dir, "keys")
    generate_rsa_keys(output_dir=keys_dir)
