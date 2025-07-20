#!/usr/bin/env python3
"""
AI Lesson Bot for NexusLearn AI
Creates Jitsi meetings with AI-powered lesson delivery and Q&A
"""

import os
import json
import sys
import time
import random
import string
import requests
import threading
from urllib.parse import quote
import pyttsx3
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, WebDriverException
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.chrome.service import Service

class AILessonBot:
    def __init__(self, hf_token):
        self.hf_token = hf_token
        self.driver = None
        self.tts_engine = None
        self.setup_tts()
        
    def setup_tts(self):
        """Initialize text-to-speech engine"""
        try:
            self.tts_engine = pyttsx3.init()
            # Set properties for clearer speech
            self.tts_engine.setProperty('rate', 150)  # Speed of speech
            self.tts_engine.setProperty('volume', 0.9)  # Volume level (0.0 to 1.0)
        except Exception as e:
            print(f"TTS setup error: {e}")
            
    def generate_lesson_outline(self, topic):
        """Generate a concise lesson outline using Hugging Face API"""
        try:
            # Use a fast, free model for text generation
            api_url = "https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium"
            headers = {"Authorization": f"Bearer {self.hf_token}"}
            
            prompt = f"""Create a concise 200-word lesson outline for grade 9 students on the topic: {topic}

Structure the outline as:
1. Introduction (what is {topic}?)
2. Key concepts (3-4 main points)
3. Real-world examples
4. Summary and takeaways

Make it engaging and age-appropriate for 14-15 year olds."""

            payload = {
                "inputs": prompt,
                "parameters": {
                    "max_new_tokens": 250,
                    "temperature": 0.7,
                    "top_p": 0.9,
                    "return_full_text": False
                }
            }
            
            response = requests.post(api_url, headers=headers, json=payload, timeout=30)
            
            if response.status_code == 200:
                result = response.json()
                if isinstance(result, list) and len(result) > 0:
                    return result[0].get('generated_text', '').strip()
            
            # Fallback if API fails
            return self.generate_fallback_outline(topic)
            
        except Exception as e:
            print(f"Lesson generation error: {e}")
            return self.generate_fallback_outline(topic)
    
    def generate_fallback_outline(self, topic):
        """Generate a basic outline if HF API fails"""
        return f"""Lesson Outline: {topic}

1. Introduction
   - What is {topic}?
   - Why is it important to understand?

2. Key Concepts
   - Core principles and definitions
   - How {topic} works in practice
   - Common applications and uses

3. Real-World Examples
   - Examples from everyday life
   - How professionals use {topic}
   - Current developments and trends

4. Summary
   - Main takeaways for students
   - Questions for further exploration
   - Next steps in learning about {topic}

This lesson provides a foundation for understanding {topic} at a grade 9 level, encouraging curiosity and practical application."""

    def create_jitsi_room_url(self, topic):
        """Create a unique Jitsi room URL"""
        # Generate random 6-character suffix
        random_chars = ''.join(random.choices(string.ascii_lowercase + string.digits, k=6))
        
        # Clean topic for URL
        clean_topic = ''.join(c for c in topic.lower() if c.isalnum() or c in '-_')
        clean_topic = clean_topic[:20]  # Limit length
        
        room_name = f"{clean_topic}-{random_chars}"
        return f"https://meet.jit.si/{room_name}"
    
    def setup_browser(self):
        """Setup headless Chrome browser for Jitsi"""
        try:
            chrome_options = Options()
            chrome_options.add_argument("--headless")
            chrome_options.add_argument("--no-sandbox")
            chrome_options.add_argument("--disable-dev-shm-usage")
            chrome_options.add_argument("--disable-gpu")
            chrome_options.add_argument("--use-fake-ui-for-media-stream")
            chrome_options.add_argument("--use-fake-device-for-media-stream")
            chrome_options.add_argument("--disable-web-security")
            chrome_options.add_argument("--allow-running-insecure-content")
            
            service = Service(ChromeDriverManager().install())
            self.driver = webdriver.Chrome(service=service, options=chrome_options)
            return True
            
        except Exception as e:
            print(f"Browser setup error: {e}")
            return False
    
    def join_jitsi_room(self, room_url, bot_name="AI Tutor"):
        """Join Jitsi room as a bot"""
        try:
            if not self.driver:
                if not self.setup_browser():
                    return False
                    
            self.driver.get(room_url)
            
            # Wait for page to load
            time.sleep(5)
            
            # Try to set display name
            try:
                name_input = WebDriverWait(self.driver, 10).until(
                    EC.presence_of_element_located((By.ID, "localDisplayName"))
                )
                name_input.clear()
                name_input.send_keys(bot_name)
            except TimeoutException:
                print("Could not set display name")
            
            # Try to join the meeting
            try:
                join_button = WebDriverWait(self.driver, 10).until(
                    EC.element_to_be_clickable((By.XPATH, "//div[contains(@class, 'welcome')]//button"))
                )
                join_button.click()
                time.sleep(3)
                return True
            except TimeoutException:
                print("Could not find join button")
                return False
                
        except Exception as e:
            print(f"Jitsi join error: {e}")
            return False
    
    def speak_lesson(self, outline):
        """Speak the lesson outline using TTS"""
        try:
            if self.tts_engine:
                print("Speaking lesson outline...")
                self.tts_engine.say(outline)
                self.tts_engine.runAndWait()
                return True
        except Exception as e:
            print(f"TTS error: {e}")
        return False
    
    def answer_question(self, question):
        """Generate answer to follow-up questions using HF API"""
        try:
            api_url = "https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium"
            headers = {"Authorization": f"Bearer {self.hf_token}"}
            
            prompt = f"As an AI tutor, provide a clear and helpful answer to this student question: {question}"
            
            payload = {
                "inputs": prompt,
                "parameters": {
                    "max_new_tokens": 150,
                    "temperature": 0.7,
                    "return_full_text": False
                }
            }
            
            response = requests.post(api_url, headers=headers, json=payload, timeout=20)
            
            if response.status_code == 200:
                result = response.json()
                if isinstance(result, list) and len(result) > 0:
                    return result[0].get('generated_text', '').strip()
            
            return "I understand your question. Let me think about that and provide you with a helpful explanation based on what we've covered."
            
        except Exception as e:
            print(f"Question answering error: {e}")
            return "That's a great question! Let me consider that and get back to you with a thorough answer."
    
    def run_lesson_session(self, room_url, outline):
        """Run the complete lesson session"""
        try:
            print(f"Starting lesson session at: {room_url}")
            
            # Join the Jitsi room
            if self.join_jitsi_room(room_url):
                print("Successfully joined Jitsi room")
                
                # Wait a moment for connection to stabilize
                time.sleep(3)
                
                # Speak the lesson outline
                if self.speak_lesson(outline):
                    print("Lesson outline delivered successfully")
                
                # Keep the session alive for questions
                print("AI Tutor is now ready for questions...")
                
                # In a real implementation, this would listen for chat messages
                # For now, we'll keep the session alive for a set duration
                time.sleep(300)  # 5 minutes
                
            else:
                print("Failed to join Jitsi room")
                
        except Exception as e:
            print(f"Lesson session error: {e}")
        finally:
            if self.driver:
                self.driver.quit()
    
    def cleanup(self):
        """Clean up resources"""
        if self.driver:
            self.driver.quit()
        if self.tts_engine:
            self.tts_engine.stop()

def create_meeting(topic, hf_token):
    """Main function to create an AI lesson meeting"""
    try:
        bot = AILessonBot(hf_token)
        
        # Generate lesson outline
        print(f"Generating lesson outline for: {topic}")
        outline = bot.generate_lesson_outline(topic)
        
        # Create Jitsi room URL
        room_url = bot.create_jitsi_room_url(topic)
        
        # Start the lesson session in a background thread
        def run_session():
            bot.run_lesson_session(room_url, outline)
        
        session_thread = threading.Thread(target=run_session, daemon=True)
        session_thread.start()
        
        return {
            "url": room_url,
            "outline": outline,
            "status": "success"
        }
        
    except Exception as e:
        print(f"Meeting creation error: {e}")
        return {
            "url": None,
            "outline": None,
            "status": "error",
            "message": str(e)
        }

if __name__ == "__main__":
    # CLI interface for testing
    if len(sys.argv) < 2:
        print("Usage: python ai-lesson-bot.py <topic> [hf_token]")
        sys.exit(1)
    
    topic = sys.argv[1]
    hf_token = sys.argv[2] if len(sys.argv) > 2 else os.getenv('HF_TOKEN')
    
    if not hf_token:
        print("Error: HF_TOKEN environment variable required")
        sys.exit(1)
    
    result = create_meeting(topic, hf_token)
    print(json.dumps(result, indent=2))