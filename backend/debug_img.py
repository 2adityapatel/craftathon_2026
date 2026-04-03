import asyncio
import os
import httpx
from config import settings

async def debug_image():
    API_URL = "https://router.huggingface.co/hf-inference/models/Falconsai/nsfw_image_detection"
    headers = {
        "Authorization": f"Bearer {settings.huggingface_token}",
        "Content-Type": "image/jpeg"
    }
    
    with open("nsfw.jpg", "rb") as f:
        image_bytes = f.read()

    async with httpx.AsyncClient() as client:
        print("Sending API Request to Falconsai...")
        try:
            response = await client.post(API_URL, headers=headers, content=image_bytes, timeout=10.0)
            print(f"Status Code: {response.status_code}")
            print(f"Response: {response.text}")
        except Exception as e:
            print(f"Exception: {e}")

if __name__ == "__main__":
    asyncio.run(debug_image())
