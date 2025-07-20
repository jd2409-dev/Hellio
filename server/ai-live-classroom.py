#!/usr/bin/env python3
"""
AI Live Classroom for NexusLearn - zero-cost implementation
Creates Jitsi meetings with AI bot that speaks and responds to chat
"""
import os
import json
import random
import string
import threading
import time
import requests
import subprocess
import sys
from pathlib import Path

try:
    from huggingface_hub import InferenceClient
    from seleniumbase import Driver
    from pyvirtualdisplay import Display
except ImportError as e:
    print(f"Missing dependency: {e}")
    print("Please install required packages")
    sys.exit(1)

class AILiveClassroom:
    def __init__(self, hf_token):
        self.hf_token = hf_token
        self.client = InferenceClient(token=hf_token)
        
    def random_room(self):
        """Generate random room identifier"""
        return "".join(random.choices(string.ascii_lowercase + string.digits, k=8))
    
    def generate_outline(self, topic):
        """Generate lesson outline using Hugging Face"""
        try:
            prompt = (f"Write a comprehensive 300-word lesson outline for '{topic}' "
                     f"aimed at students. Include: Introduction, Key Concepts, Examples, "
                     f"Practice Questions, and Summary. Use clear structure.")
            
            result = self.client.text_generation(
                prompt, 
                max_new_tokens=350,
                temperature=0.7
            ).strip()
            
            return result if result else self.generate_fallback_outline(topic)
            
        except Exception as e:
            print(f"Outline generation error: {e}")
            return self.generate_fallback_outline(topic)
    
    def generate_fallback_outline(self, topic):
        """Generate basic outline if API fails"""
        return f"""AI Lesson: {topic}

Introduction:
Welcome to your AI-powered lesson on {topic}. I'm your AI tutor and will guide you through this important topic step by step.

Key Concepts:
• Understanding the fundamental principles of {topic}
• How {topic} applies to real-world situations
• The importance of {topic} in academic learning
• Practical examples and applications

Real-World Examples:
You can observe {topic} in daily life through various applications and phenomena that surround us.

Practice Questions:
• What do you already know about {topic}?
• Can you think of examples from your experience?
• How might this knowledge be useful in your future?

Summary:
Today we explored {topic}, learning its key principles and real-world applications. Continue observing examples around you and stay curious about how {topic} impacts our world.

Ready for questions and discussion!"""

    def run_bot(self, jitsi_url, outline, topic):
        """Run AI bot in Jitsi room with speech and chat capabilities"""
        display = None
        driver = None
        
        try:
            print(f"🚀 Starting AI bot for: {topic}")
            
            # Virtual display for headless browser
            display = Display(visible=0, size=(1280, 720))
            display.start()
            print("✅ Virtual display started")
            
            # Initialize browser
            driver = Driver(uc=True, headless2=True, incognito=True, use_wire=True)
            driver.get(jitsi_url)
            print(f"✅ Navigated to: {jitsi_url}")
            
            time.sleep(3)
            
            # Set AI Tutor name
            try:
                name_input = driver.find_element('input[data-testid="prejoin.displayName"]')
                if name_input:
                    driver.type('input[data-testid="prejoin.displayName"]', "AI Tutor")
                    print("✅ Set name as AI Tutor")
            except Exception as e:
                print(f"Name setting note: {e}")
            
            time.sleep(2)
            
            # Create silent video loop for fake webcam
            try:
                mp4_path = "/tmp/ai_tutor_loop.mp4"
                subprocess.run([
                    "ffmpeg", "-f", "lavfi", "-i", "testsrc=duration=5:size=640x360:rate=30",
                    "-pix_fmt", "yuv420p", "-y", mp4_path
                ], check=True, capture_output=True, timeout=30)
                print("✅ Created video loop")
            except Exception as e:
                print(f"Video creation note: {e}")
            
            # Override media devices
            driver.execute_cdp_cmd("Page.addScriptToEvaluateOnNewDocument", {
                "source": """
                    navigator.mediaDevices.getUserMedia = async () => {
                        const canvas = document.createElement('canvas');
                        canvas.width = 640;
                        canvas.height = 360;
                        const ctx = canvas.getContext('2d');
                        ctx.fillStyle = '#1e293b';
                        ctx.fillRect(0, 0, 640, 360);
                        ctx.fillStyle = '#3b82f6';
                        ctx.font = '24px Arial';
                        ctx.fillText('AI Tutor', 270, 180);
                        const stream = canvas.captureStream(30);
                        return stream;
                    };
                """
            })
            
            # Join meeting
            try:
                join_button = driver.find_element('button[data-testid="prejoin.joinMeeting"]')
                if join_button:
                    driver.click('button[data-testid="prejoin.joinMeeting"]')
                    print("✅ Joined meeting")
            except Exception as e:
                print(f"Join attempt note: {e}")
            
            time.sleep(5)
            
            # Speak the lesson outline
            print("🎙️ Speaking lesson outline...")
            driver.execute_script("""
                const utter = new SpeechSynthesisUtterance(arguments[0]);
                utter.rate = 0.8;
                utter.pitch = 1;
                utter.volume = 1;
                speechSynthesis.speak(utter);
                console.log('AI Tutor speaking lesson...');
            """, f"Hello everyone! Welcome to your AI lesson on {topic}. {outline}")
            
            print("✅ Lesson delivery started")
            
            # Monitor and respond to chat messages
            last_chat = ""
            session_time = 0
            max_session_time = 600  # 10 minutes
            
            print("💬 Monitoring chat for questions...")
            
            while session_time < max_session_time:
                try:
                    # Check for chat messages
                    msgs = driver.find_elements("css selector", "[data-testid='chat.message']")
                    if msgs:
                        latest = msgs[-1].text
                        if latest != last_chat and not latest.startswith("AI Tutor"):
                            last_chat = latest
                            print(f"📨 Received question: {latest}")
                            
                            # Generate answer
                            answer = self.client.text_generation(
                                f"As an AI tutor teaching {topic}, answer this student question briefly and clearly: {latest}",
                                max_new_tokens=80
                            ).strip()
                            
                            # Send text response
                            driver.execute_script("""
                                const msg = arguments[0];
                                APP.conference.sendTextMessage("AI Tutor: " + msg);
                            """, answer)
                            
                            # Speak the answer
                            driver.execute_script("""
                                const msg = arguments[0];
                                const utter = new SpeechSynthesisUtterance(msg);
                                utter.rate = 0.8;
                                speechSynthesis.speak(utter);
                            """, f"Great question! {answer}")
                            
                            print(f"✅ Responded: {answer}")
                    
                    time.sleep(3)
                    session_time += 3
                    
                except Exception as e:
                    print(f"Chat monitoring note: {e}")
                    break
            
            print("🏁 AI session completed")
            
        except Exception as e:
            print(f"❌ Bot error: {e}")
        finally:
            # Cleanup
            if driver:
                try:
                    driver.quit()
                    print("✅ Browser closed")
                except:
                    pass
            if display:
                try:
                    display.stop()
                    print("✅ Display stopped")
                except:
                    pass

    def create_meeting(self, topic):
        """Create AI meeting with bot"""
        try:
            print(f"Creating AI live classroom for: {topic}")
            
            # Generate room URL
            room_id = f"{topic.replace(' ', '-').lower()}-{self.random_room()}"
            jitsi_url = f"https://meet.jit.si/{room_id}"
            
            # Generate lesson outline
            outline = self.generate_outline(topic)
            
            # Start bot in background thread
            bot_thread = threading.Thread(
                target=self.run_bot, 
                args=(jitsi_url, outline, topic), 
                daemon=True
            )
            bot_thread.start()
            
            return {
                "url": jitsi_url,
                "outline": outline,
                "status": "success",
                "audio_status": "AI bot will join room and speak the lesson",
                "bot_features": [
                    "Speaks lesson content using Web Speech API",
                    "Responds to student questions in chat",
                    "Provides visual presence in video room",
                    "Interactive Q&A session available"
                ]
            }
            
        except Exception as e:
            print(f"Meeting creation error: {e}")
            return {
                "url": None,
                "outline": None,
                "status": "error",
                "message": str(e)
            }

def main():
    if len(sys.argv) < 2:
        print("Usage: python3 ai-live-classroom.py <topic> [hf_token]")
        sys.exit(1)
    
    topic = sys.argv[1]
    hf_token = sys.argv[2] if len(sys.argv) > 2 else os.getenv('HF_TOKEN')
    
    if not hf_token:
        print("Error: HF_TOKEN required")
        sys.exit(1)
    
    classroom = AILiveClassroom(hf_token)
    result = classroom.create_meeting(topic)
    print(json.dumps(result, indent=2))

if __name__ == "__main__":
    main()