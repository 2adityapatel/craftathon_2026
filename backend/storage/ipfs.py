import os
import requests
import json
from config import settings

class IPFSStorage:
    @staticmethod
    def upload_to_ipfs(file_bytes: bytes, filename: str) -> str:
        """
        Uploads encrypted file bytes to Pinata (IPFS).
        Returns the IPFS CID (Hash).
        """
        # If no keys are provided, return a localized mock for testing
        if not settings.pinata_api_key or not settings.pinata_secret_key:
            print("WARNING: Pinata keys missing. Returning mock IPFS CID.")
            return f"mock_ipfs_{filename[:8]}"

        url = "https://api.pinata.cloud/pinning/pinFileToIPFS"
        
        headers = {
            "pinata_api_key": settings.pinata_api_key,
            "pinata_secret_api_key": settings.pinata_secret_key
        }

        files = {
            "file": (filename, file_bytes)
        }

        # Metadata to identify the evidence on Pinata
        metadata = {
            "name": filename,
            "keyvalues": {
                "project": "POCSO-Blockchain",
                "type": "encrypted_evidence"
            }
        }

        try:
            response = requests.post(
                url, 
                files=files, 
                headers=headers, 
                data={"pinataMetadata": json.dumps(metadata)}
            )
            response.raise_for_status()
            return response.json()["IpfsHash"]
            
        except Exception as e:
            print(f"IPFS Upload Error: {e}")
            raise Exception("Failed to upload evidence to IPFS.")
