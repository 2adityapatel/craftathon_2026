import easyocr
import logging
import warnings
import torch

# Suppress the harmless cosmetic 'pin_memory' warning PyTorch throws when running on CPU
warnings.filterwarnings("ignore", category=UserWarning, module="torch.utils.data.dataloader")

# Initialize globally so it only loads weights into RAM once on startup.
try:
    # Detect if the laptop has a compatible GPU installed
    has_gpu = torch.cuda.is_available()
    print(f"[OCR] Loading EasyOCR weights... (GPU Acceleration enabled: {has_gpu})")
    
    # We explicitly support English ('en') and Hindi ('hi').
    reader = easyocr.Reader(['en', 'hi'], gpu=has_gpu)
    print("[OCR] EasyOCR successfully loaded!")
except Exception as e:
    logging.warning(f"EasyOCR initialization failed: {e}")
    reader = None

def extract_text_from_image(image_bytes: bytes) -> str:
    """
    Reads pure binary image pixels, finds text (e.g., chat screenshots),
    and spits out a concatenated pure text string for our NLP engine.
    """
    if not reader:
        return ""
        
    try:
        # detail=0 tells it to just give us the raw strings (no bounding boxes needed)
        result = reader.readtext(image_bytes, detail=0)
        extracted_text = " ".join(result)
        return extracted_text
    except Exception as e:
        logging.warning(f"Error during OCR extraction: {e}")
        return ""
