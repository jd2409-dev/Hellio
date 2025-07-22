#!/usr/bin/env python3
"""
Test script for the Enhanced AI Storytelling System
"""

import sys
import os

# Add the current directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

try:
    # Test basic imports
    print("Testing imports...")
    import google.generativeai as genai
    print("✓ google-generativeai imported successfully")
    
    from PIL import Image
    print("✓ Pillow imported successfully")
    
    import requests
    print("✓ requests imported successfully")
    
    from gtts import gTTS
    print("✓ gtts imported successfully")
    
    from pydub import AudioSegment
    print("✓ pydub imported successfully")
    
    try:
        from moviepy.editor import VideoFileClip, AudioFileClip, CompositeVideoClip, ImageClip
        print("✓ moviepy imported successfully")
    except Exception as e:
        print(f"⚠ moviepy import warning: {e}")
    
    from dotenv import load_dotenv
    print("✓ python-dotenv imported successfully")
    
    # Test environment
    load_dotenv()
    api_key = os.getenv('GEMINI_API_KEY')
    if api_key:
        print("✓ GEMINI_API_KEY found in environment")
        
        # Test Gemini connection
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-2.0-flash-exp')
        
        # Simple test generation
        response = model.generate_content("Say hello")
        print(f"✓ Gemini API connection successful: {response.text[:50]}...")
        
    else:
        print("⚠ GEMINI_API_KEY not found in environment")
    
    print("\nAll systems ready for enhanced storytelling!")
    
except ImportError as e:
    print(f"✗ Import error: {e}")
    sys.exit(1)
except Exception as e:
    print(f"✗ Error: {e}")
    sys.exit(1)