from Crypto.PublicKey import RSA
import os

def generate_keys(directory="backend/keys"):
    if not os.path.exists(directory):
        os.makedirs(directory)
    
    # Generate private key (2048 bits)
    key = RSA.generate(2048)
    
    # Save private key
    private_key = key.export_key()
    with open(os.path.join(directory, "private.pem"), "wb") as f:
        f.write(private_key)
        
    # Save public key
    public_key = key.publickey().export_key()
    with open(os.path.join(directory, "public.pem"), "wb") as f:
        f.write(public_key)
    
    print(f"RSA Keys generated successfully in {directory} using pycryptodome")

if __name__ == "__main__":
    generate_keys()
