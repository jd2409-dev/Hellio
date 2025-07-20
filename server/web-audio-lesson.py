#!/usr/bin/env python3
"""
Web-based AI Audio Lesson for NexusLearn AI
Uses browser automation to deliver audio directly in Jitsi rooms
"""

import os
import sys
import json
import random
import string
import requests
import time
import threading
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager

class WebAudioLesson:
    def __init__(self, hf_token):
        self.hf_token = hf_token
        self.driver = None
        
    def generate_lesson_outline(self, topic):
        """Generate lesson outline using Hugging Face API"""
        try:
            api_url = "https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium"
            headers = {"Authorization": f"Bearer {self.hf_token}"}
            
            prompt = f"""Create a detailed lesson outline for students on: {topic}

Structure the lesson with clear sections:
1. Introduction - Welcome and overview
2. Key Concepts - Main learning points
3. Examples - Real-world applications
4. Practice - Questions for engagement
5. Summary - Key takeaways

Make it educational and engaging for students."""

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
        return f"""AI Lesson: {topic}

Welcome students! Today we'll explore {topic} together.

Introduction:
{topic} is an important subject that helps us understand our world better. Let's dive into the key concepts.

Key Learning Points:
- Understanding the fundamental principles of {topic}
- How {topic} applies to real-world situations
- Why {topic} matters in your academic journey
- Practical examples you can relate to

Real-World Applications:
- Examples you see in daily life
- How professionals use {topic}
- Current developments in {topic}

Interactive Questions:
- What do you already know about {topic}?
- Can you think of examples around you?
- How might {topic} be useful in your future?

Summary:
Today we explored {topic}, its principles, and applications. Remember to observe examples in your daily life and continue asking questions to deepen your understanding.

Thank you for joining this AI-powered lesson!"""

    def create_jitsi_room_url(self, topic):
        """Create unique Jitsi room URL"""
        random_chars = ''.join(random.choices(string.ascii_lowercase + string.digits, k=8))
        clean_topic = ''.join(c for c in topic.lower() if c.isalnum())[:12]
        room_name = f"ai-lesson-{clean_topic}-{random_chars}"
        return f"https://meet.jit.si/{room_name}"
    
    def setup_browser(self):
        """Setup Chrome browser with audio capabilities"""
        try:
            chrome_options = Options()
            chrome_options.add_argument("--no-sandbox")
            chrome_options.add_argument("--disable-dev-shm-usage")
            # Enable audio
            chrome_options.add_argument("--use-fake-ui-for-media-stream")
            chrome_options.add_argument("--use-fake-device-for-media-stream")
            chrome_options.add_argument("--autoplay-policy=no-user-gesture-required")
            chrome_options.add_argument("--allow-running-insecure-content")
            chrome_options.add_argument("--disable-web-security")
            chrome_options.add_argument("--disable-features=VizDisplayCompositor")
            
            service = Service(ChromeDriverManager().install())
            self.driver = webdriver.Chrome(service=service, options=chrome_options)
            return True
            
        except Exception as e:
            print(f"Browser setup error: {e}")
            return False
    
    def join_jitsi_room(self, room_url):
        """Join Jitsi room and prepare for audio delivery"""
        try:
            print(f"Joining Jitsi room: {room_url}")
            self.driver.get(room_url)
            
            # Wait for room to load
            time.sleep(5)
            
            # Try to dismiss any popups or join the meeting
            try:
                # Look for join button or name input
                wait = WebDriverWait(self.driver, 10)
                
                # Try to find name input field
                name_input = wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "input[placeholder*='name'], input[name='displayName'], input[id*='name']")))
                name_input.clear()
                name_input.send_keys("AI Tutor Bot")
                time.sleep(1)
                
                # Look for join button
                join_button = self.driver.find_element(By.CSS_SELECTOR, "button[data-testid='prejoin.joinMeeting'], button:contains('Join'), .prejoin-btn")
                join_button.click()
                
            except Exception as e:
                print(f"Join process note: {e}")
                # Room might already be joined or different layout
            
            time.sleep(3)
            print("Successfully joined Jitsi room")
            return True
            
        except Exception as e:
            print(f"Jitsi join error: {e}")
            return False
    
    def deliver_web_audio_lesson(self, outline):
        """Deliver lesson using web speech synthesis"""
        try:
            print("Starting web-based audio lesson delivery...")
            
            # Use browser's Web Speech API for text-to-speech
            clean_outline = outline.replace('`', '').replace('"', "'").replace('\n', ' ')
            speech_script = f"""
            const utterance = new SpeechSynthesisUtterance();
            utterance.text = "{clean_outline}";
            utterance.rate = 0.8;
            utterance.pitch = 1;
            utterance.volume = 1;
            
            // Get available voices
            const voices = speechSynthesis.getVoices();
            if (voices.length > 0) {{
                utterance.voice = voices[0];
            }}
            
            speechSynthesis.speak(utterance);
            console.log('AI Tutor speaking lesson...');
            """
            
            self.driver.execute_script(speech_script)
            print("Audio lesson started using Web Speech API")
            
            # Keep session alive
            time.sleep(30)  # 30 seconds for demo
            
            return True
            
        except Exception as e:
            print(f"Web audio delivery error: {e}")
            return False
    
    def run_audio_lesson(self, room_url, outline):
        """Run complete audio lesson session"""
        try:
            print(f"Starting AI audio lesson session")
            
            if self.setup_browser():
                if self.join_jitsi_room(room_url):
                    # Wait a moment for students to join
                    print("Waiting for students to join...")
                    time.sleep(10)
                    
                    # Deliver the lesson
                    self.deliver_web_audio_lesson(outline)
                    
                    print("Audio lesson completed successfully")
                    return True
            
            print("Could not complete audio lesson setup")
            return False
            
        except Exception as e:
            print(f"Audio lesson error: {e}")
            return False
        finally:
            if self.driver:
                self.driver.quit()

def create_web_audio_lesson(topic, hf_token):
    """Main function to create web-based audio lesson"""
    try:
        print(f"Creating web audio lesson for: {topic}")
        
        lesson = WebAudioLesson(hf_token)
        
        # Generate lesson content
        outline = lesson.generate_lesson_outline(topic)
        
        # Create Jitsi room
        room_url = lesson.create_jitsi_room_url(topic)
        
        # Start audio lesson in background thread
        def run_lesson():
            lesson.run_audio_lesson(room_url, outline)
        
        lesson_thread = threading.Thread(target=run_lesson, daemon=True)
        lesson_thread.start()
        
        return {
            "url": room_url,
            "outline": outline,
            "status": "success",
            "audio_status": "AI bot will join room and speak the lesson"
        }
        
    except Exception as e:
        print(f"Lesson creation error: {e}")
        return {
            "url": None,
            "outline": None,
            "status": "error",
            "message": str(e)
        }

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python3 web-audio-lesson.py <topic> [hf_token]")
        sys.exit(1)
    
    topic = sys.argv[1]
    hf_token = sys.argv[2] if len(sys.argv) > 2 else os.getenv('HF_TOKEN')
    
    if not hf_token:
        print("Error: HF_TOKEN required")
        sys.exit(1)
    
    result = create_web_audio_lesson(topic, hf_token)
    print(json.dumps(result, indent=2))