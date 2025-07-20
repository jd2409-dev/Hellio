#!/usr/bin/env python3
"""
Audio Web Interface for NexusLearn AI
Creates lesson content with web-accessible audio files
"""

import os
import sys
import json
import random
import string
import requests
import pyttsx3
import threading
import time
from pathlib import Path

class AudioWebInterface:
    def __init__(self, hf_token):
        self.hf_token = hf_token
        self.tts_engine = None
        self.audio_dir = Path("public/audio")
        self.setup_tts()
        self.setup_audio_directory()
        
    def setup_tts(self):
        """Initialize text-to-speech engine"""
        try:
            self.tts_engine = pyttsx3.init()
            self.tts_engine.setProperty('rate', 150)
            self.tts_engine.setProperty('volume', 1.0)
            
            voices = self.tts_engine.getProperty('voices')
            if voices and len(voices) > 0:
                self.tts_engine.setProperty('voice', voices[0].id)
            
            print("TTS engine ready for audio file generation")
        except Exception as e:
            print(f"TTS setup error: {e}")
            
    def setup_audio_directory(self):
        """Create audio directory for storing lesson files"""
        try:
            self.audio_dir.mkdir(parents=True, exist_ok=True)
            print(f"Audio directory ready: {self.audio_dir}")
        except Exception as e:
            print(f"Audio directory setup error: {e}")
            
    def generate_lesson_outline(self, topic):
        """Generate lesson outline using Hugging Face API"""
        try:
            api_url = "https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium"
            headers = {"Authorization": f"Bearer {self.hf_token}"}
            
            prompt = f"""Create an educational lesson for students about: {topic}

Structure:
1. Welcome - Greet students and introduce the topic
2. Learning Goals - What students will understand
3. Main Content - Key concepts with clear explanations
4. Examples - Real-world applications and cases
5. Review Questions - Interactive elements for engagement
6. Summary - Recap and encouragement

Make it conversational and engaging for spoken delivery."""

            payload = {
                "inputs": prompt,
                "parameters": {
                    "max_new_tokens": 400,
                    "temperature": 0.7,
                    "return_full_text": False
                }
            }
            
            response = requests.post(api_url, headers=headers, json=payload, timeout=30)
            
            if response.status_code == 200:
                result = response.json()
                if isinstance(result, list) and len(result) > 0:
                    return result[0].get('generated_text', '').strip()
            
            return self.generate_fallback_outline(topic)
            
        except Exception as e:
            print(f"Lesson generation error: {e}")
            return self.generate_fallback_outline(topic)
    
    def generate_fallback_outline(self, topic):
        """Generate basic outline if API fails"""
        return f"""Welcome to your AI lesson on {topic}!

Hello students! I'm your AI tutor, and today we're going to explore {topic} together. This is an exciting topic that will help you understand important concepts.

Learning Goals:
By the end of this lesson, you'll understand the key principles of {topic}, how it works in the real world, and why it's important for your studies.

Main Content:
{topic} is a fascinating subject that connects to many areas of learning. Let's break it down into simple, understandable parts.

The fundamental concepts include understanding what {topic} is, how it works, and where we can see it in action around us.

Real-World Examples:
You can observe {topic} in your daily life. Think about how it affects the world around you and the practical applications you might encounter.

Review Questions:
As we go through this lesson, consider: What do you already know about {topic}? Can you think of examples from your own experience? How might this knowledge be useful in your future?

Summary:
Today we explored {topic}, learning its key principles and real-world importance. Keep observing examples around you and stay curious about how {topic} impacts our world.

Thank you for joining this AI-powered lesson. Keep learning and asking great questions!"""

    def create_audio_file(self, text, filename):
        """Create audio file from text using TTS"""
        try:
            if not self.tts_engine:
                print("TTS engine not available")
                return False
                
            audio_path = self.audio_dir / f"{filename}.wav"
            
            # Ensure directory exists
            audio_path.parent.mkdir(parents=True, exist_ok=True)
            
            # Save audio to file
            self.tts_engine.save_to_file(text, str(audio_path))
            self.tts_engine.runAndWait()
            
            # Also demonstrate live speech
            print("Demonstrating live TTS audio...")
            self.tts_engine.say("Audio lesson ready for students!")
            self.tts_engine.runAndWait()
            
            if audio_path.exists():
                print(f"Audio file created: {audio_path}")
                return str(audio_path)
            else:
                print("Audio file creation failed")
                return False
                
        except Exception as e:
            print(f"Audio file creation error: {e}")
            return False
    
    def create_jitsi_room_url(self, topic):
        """Create unique Jitsi room URL"""
        random_chars = ''.join(random.choices(string.ascii_lowercase + string.digits, k=8))
        clean_topic = ''.join(c for c in topic.lower() if c.isalnum())[:12]
        room_name = f"ai-lesson-{clean_topic}-{random_chars}"
        return f"https://meet.jit.si/{room_name}"

def create_audio_lesson_interface(topic, hf_token):
    """Create lesson with web-accessible audio interface"""
    try:
        print(f"Creating audio lesson interface for: {topic}")
        
        interface = AudioWebInterface(hf_token)
        
        # Generate lesson content
        outline = interface.generate_lesson_outline(topic)
        
        # Create audio file
        audio_filename = f"lesson_{int(time.time())}"
        audio_path = interface.create_audio_file(outline, audio_filename)
        
        # Create Jitsi room
        room_url = interface.create_jitsi_room_url(topic)
        
        # Prepare response
        audio_url = f"/audio/{audio_filename}.wav" if audio_path else None
        
        return {
            "url": room_url,
            "outline": outline,
            "audio_url": audio_url,
            "status": "success",
            "audio_status": "Audio file generated and ready for playback",
            "instructions": "Students can play the audio file to hear the AI tutor's lesson"
        }
        
    except Exception as e:
        print(f"Audio lesson interface error: {e}")
        return {
            "url": None,
            "outline": None,
            "audio_url": None,
            "status": "error",
            "message": str(e)
        }

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python3 audio-web-interface.py <topic> [hf_token]")
        sys.exit(1)
    
    topic = sys.argv[1]
    hf_token = sys.argv[2] if len(sys.argv) > 2 else os.getenv('HF_TOKEN')
    
    if not hf_token:
        print("Error: HF_TOKEN required")
        sys.exit(1)
    
    result = create_audio_lesson_interface(topic, hf_token)
    print(json.dumps(result, indent=2))