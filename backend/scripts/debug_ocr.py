import sys
import os

# Add parent directory to path so it can import the ai modules 
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from ai.ocr_model import extract_text_from_image

def main():
    if len(sys.argv) < 2:
        print("Usage: python debug_ocr.py <path_to_image>")
        sys.exit(1)
        
    image_path = sys.argv[1]
    if not os.path.exists(image_path):
        print(f"Error: File not found ({image_path})")
        sys.exit(1)
        
    with open(image_path, "rb") as f:
        image_bytes = f.read()
        
    print(f"\n=========================================")
    print(f"Running EasyOCR on: {image_path}")
    print(f"=========================================\n")
    
    extracted = extract_text_from_image(image_bytes)
    
    print("--- RAW TEXT EXTRACTED ---")
    if extracted.strip():
        print(f"\"{extracted}\"")
    else:
        print("[ No text detected in this image ]")
    print("--------------------------\n")
    
    print("NOTE: In the full backend flow, this text is combined with any descriptions you typed, and then piped directly into the Hindi Abusive Heuristics + Deep ML NLP engine!")

if __name__ == "__main__":
    main()
