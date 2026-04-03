import asyncio
import sys
# Add current directory to python path so it finds ai module
sys.path.append(".")

from ai.text_model import analyze_text

async def main():
    print("Testing the Deep-Translator + Toxic-BERT Pipeline!\n")
    
    test_phrases = [
        # "are u outta mind u dipshit imma f*** your sister and mom dickhead",
        "tu pagal hai kya, maar dalunga tujhe bc randi"
        # "Hello, how are you doing today? I hope you're having a great time."
    ]
    
    for phrase in test_phrases:
        print(f"Phrase: '{phrase}'")
        score = await analyze_text(phrase)
        print(f"-> Final Toxicity Score: {score}\n")

if __name__ == "__main__":
    asyncio.run(main())
