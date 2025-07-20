#!/usr/bin/env python3
"""
Simple AI Audio Lesson for NexusLearn AI
Delivers spoken lessons with file output for students
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

class SimpleAudioLesson:
    def __init__(self, hf_token):
        self.hf_token = hf_token
        self.tts_engine = None
        self.setup_tts()
        
    def setup_tts(self):
        """Initialize text-to-speech engine"""
        try:
            self.tts_engine = pyttsx3.init()
            self.tts_engine.setProperty('rate', 150)
            self.tts_engine.setProperty('volume', 1.0)
            
            voices = self.tts_engine.getProperty('voices')
            if voices and len(voices) > 0:
                self.tts_engine.setProperty('voice', voices[0].id)
            
            print("✅ TTS engine ready for lesson delivery")
        except Exception as e:
            print(f"❌ TTS setup error: {e}")
            
    def generate_lesson_outline(self, topic):
        """Generate lesson outline using Hugging Face API"""
        try:
            api_url = "https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium"
            headers = {"Authorization": f"Bearer {self.hf_token}"}
            
            prompt = f"""Create a detailed lesson outline for students on: {topic}

Structure:
1. Introduction - What is {topic}?
2. Key Concepts - Main ideas students should understand
3. Examples - Real-world applications 
4. Practice - Questions for students to consider
5. Summary - Key takeaways

Make it educational and engaging for students."""

            payload = {
                "inputs": prompt,
                "parameters": {
                    "max_new_tokens": 300,
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
            print(f"❌ Lesson generation error: {e}")
            return self.generate_fallback_outline(topic)
    
    def generate_fallback_outline(self, topic):
        """Generate basic outline if API fails"""
        return f"""Lesson: {topic}

Introduction:
Welcome to today's lesson on {topic}. This is an important topic that will help you understand key concepts in your studies.

Key Concepts:
- Understanding the basic principles of {topic}
- How {topic} works in real-world situations  
- The importance of {topic} in everyday life
- Common applications and examples

Real-World Examples:
- Examples you can see in daily life
- How professionals use {topic}
- Current research and developments

Practice Questions:
- What are the main characteristics of {topic}?
- How does {topic} affect our daily lives?
- Can you think of examples of {topic} around you?

Summary:
Today we learned about {topic}, its key principles, and real-world applications. Remember to observe examples of {topic} in your daily life and ask questions to deepen your understanding."""

    def create_jitsi_room_url(self, topic):
        """Create unique Jitsi room URL"""
        random_chars = ''.join(random.choices(string.ascii_lowercase + string.digits, k=6))
        clean_topic = ''.join(c for c in topic.lower() if c.isalnum() or c in '-_')[:15]
        room_name = f"lesson-{clean_topic}-{random_chars}"
        return f"https://meet.jit.si/{room_name}"
    
    def deliver_audio_lesson(self, outline):
        """Deliver the lesson using text-to-speech"""
        try:
            if not self.tts_engine:
                print("❌ TTS engine not available")
                return False
                
            print("🎙️ AI Tutor is now delivering the lesson...")
            
            # Welcome message
            welcome = "Hello students! Welcome to your AI-powered lesson. I'll be your tutor today, guiding you through this topic step by step."
            print(f"🗣️ Speaking: {welcome}")
            self.tts_engine.say(welcome)
            self.tts_engine.runAndWait()
            time.sleep(2)
            
            # Deliver the lesson content
            sections = outline.split('\n\n')
            for i, section in enumerate(sections):
                if section.strip():
                    clean_section = section.replace('\n', '. ').strip()
                    if clean_section:
                        print(f"🗣️ Speaking section {i+1}: {clean_section[:50]}...")
                        self.tts_engine.say(clean_section)
                        self.tts_engine.runAndWait()
                        time.sleep(1)
            
            # Conclusion
            conclusion = "This concludes our lesson. I hope you found it helpful! Feel free to review the material and practice the concepts we discussed."
            print(f"🗣️ Speaking: {conclusion}")
            self.tts_engine.say(conclusion)
            self.tts_engine.runAndWait()
            
            print("✅ Audio lesson delivery completed successfully!")
            return True
            
        except Exception as e:
            print(f"❌ Audio delivery error: {e}")
            return False

def create_audio_lesson(topic, hf_token):
    """Main function to create and deliver an AI audio lesson"""
    try:
        print(f"🚀 Creating AI audio lesson for: {topic}")
        
        lesson = SimpleAudioLesson(hf_token)
        
        # Generate lesson content
        print("📝 Generating lesson outline...")
        outline = lesson.generate_lesson_outline(topic)
        
        # Create Jitsi room
        room_url = lesson.create_jitsi_room_url(topic)
        print(f"🌐 Jitsi room created: {room_url}")
        
        # Start audio lesson in background
        def run_audio_lesson():
            time.sleep(5)  # Give students time to join
            lesson.deliver_audio_lesson(outline)
        
        audio_thread = threading.Thread(target=run_audio_lesson, daemon=True)
        audio_thread.start()
        
        return {
            "url": room_url,
            "outline": outline,
            "status": "success",
            "audio_status": "Audio lesson will begin in 5 seconds"
        }
        
    except Exception as e:
        print(f"❌ Lesson creation error: {e}")
        return {
            "url": None,
            "outline": None,
            "status": "error",
            "message": str(e)
        }

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python3 audio-lesson-simple.py <topic> [hf_token]")
        sys.exit(1)
    
    topic = sys.argv[1]
    hf_token = sys.argv[2] if len(sys.argv) > 2 else os.getenv('HF_TOKEN')
    
    if not hf_token:
        print("❌ Error: HF_TOKEN required")
        sys.exit(1)
    
    result = create_audio_lesson(topic, hf_token)
    print(json.dumps(result, indent=2))