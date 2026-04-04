import requests
import base64
import json
from config import settings


PINATA_BASE = "https://api.pinata.cloud"


def _headers():
    return {
        "pinata_api_key": settings.pinata_api_key,
        "pinata_secret_api_key": settings.pinata_secret_key,
    }


def upload_image_bytes(image_bytes: bytes, filename: str = "evidence.jpg") -> str:
    """
    Uploads raw image bytes to Pinata IPFS.
    Returns the IPFS CID (hash).
    """
    files = {
        "file": (filename, image_bytes, "image/jpeg"),
    }
    metadata = json.dumps({"name": filename})
    data = {"pinataMetadata": metadata}

    response = requests.post(
        f"{PINATA_BASE}/pinning/pinFileToIPFS",
        headers=_headers(),
        files=files,
        data=data,
        timeout=30,
    )
    response.raise_for_status()
    return response.json()["IpfsHash"]


def upload_json(data: dict, name: str = "report_metadata") -> str:
    """
    Uploads a JSON object to Pinata IPFS.
    Returns the IPFS CID (hash).
    """
    payload = {
        "pinataMetadata": {"name": name},
        "pinataContent": data,
    }
    response = requests.post(
        f"{PINATA_BASE}/pinning/pinJSONToIPFS",
        headers={**_headers(), "Content-Type": "application/json"},
        data=json.dumps(payload),
        timeout=30,
    )
    response.raise_for_status()
    return response.json()["IpfsHash"]
