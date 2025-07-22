#!/usr/bin/env python3
"""
Simple AI Educational Storytelling System
Uses Gemini AI, PIL, and gTTS for story generation
"""

import os
import json
import sys
from pathlib import Path
from typing import Dict, List, Any, Optional
import logging
from datetime import datetime

# Third-party imports
import google.generativeai as genai
from PIL import Image, ImageDraw, ImageFont
import requests
from gtts import gTTS
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class SimpleStorytellingSystem:
    def __init__(self):
        """Initialize the Simple Storytelling System"""
        self.setup_gemini()
        self.output_dir = Path("./server/public/stories")
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
        # Audio settings
        self.audio_settings = {
            'lang': 'en',
            'slow': False,
            'format': 'mp3'
        }
        
        # Image settings
        self.image_settings = {
            'resolution': (1280, 720),
            'background_color': (30, 41, 59)  # Slate-800 equivalent
        }

    def setup_gemini(self):
        """Configure Gemini AI"""
        api_key = os.getenv('GEMINI_API_KEY')
        if not api_key:
            raise ValueError("GEMINI_API_KEY not found in environment variables")
        
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel('gemini-2.0-flash-exp')
        logger.info("Gemini AI configured successfully")

    def generate_story_scenes(self, concept: str, subject: str = None, difficulty: str = None) -> List[Dict[str, Any]]:
        """Generate educational story scenes using Gemini AI"""
        try:
            system_prompt = """You are an educational storytelling assistant.

Convert the user-submitted concept into exactly 4 animated scenes for educational purposes. Each scene MUST be a JSON object with these exact fields:

{
  "scene_number": 1,
  "visual_description": "Detailed visual description for image generation (100+ words)",
  "narration": "Engaging spoken narration (20-40 words)", 
  "caption": "Educational takeaway (10-20 words)"
}

Return a JSON array of exactly 4 scenes. Make the story educational, engaging, and age-appropriate.
Focus on visual storytelling that teaches the concept effectively."""

            context = f"Concept: {concept}"
            if subject:
                context += f"\nSubject: {subject}"
            if difficulty:
                context += f"\nDifficulty: {difficulty}"

            response = self.model.generate_content(f"{system_prompt}\n\n{context}")
            
            # Parse the response to extract structured data
            story_data = self._parse_gemini_response(response.text)
            
            # Ensure exactly 4 scenes
            if len(story_data) != 4:
                logger.warning(f"Generated {len(story_data)} scenes instead of 4, creating fallback...")
                story_data = self._create_fallback_story(concept)
            
            return story_data
            
        except Exception as e:
            logger.error(f"Error generating story scenes: {e}")
            return self._create_fallback_story(concept)

    def _parse_gemini_response(self, response_text: str) -> List[Dict[str, Any]]:
        """Parse Gemini's response into structured scene data"""
        try:
            # Look for JSON array in response
            import re
            json_match = re.search(r'\[.*\]', response_text, re.DOTALL)
            if json_match:
                scenes_data = json.loads(json_match.group())
                if isinstance(scenes_data, list) and len(scenes_data) > 0:
                    return scenes_data[:4]  # Take first 4 scenes
            
            # Look for individual JSON objects
            json_objects = re.findall(r'\{[^}]*"scene_number"[^}]*\}', response_text, re.DOTALL)
            if json_objects:
                scenes = []
                for obj_str in json_objects[:4]:
                    try:
                        scene = json.loads(obj_str)
                        scenes.append(scene)
                    except json.JSONDecodeError:
                        continue
                if scenes:
                    return scenes
                    
        except Exception as e:
            logger.warning(f"Failed to parse JSON response: {e}")
        
        # Fallback to text parsing
        return self._parse_text_response(response_text)

    def _parse_text_response(self, response_text: str) -> List[Dict[str, Any]]:
        """Parse text-based response"""
        scenes = []
        lines = response_text.split('\n')
        current_scene = {}
        scene_count = 0
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
                
            # Look for scene markers
            if any(marker in line.lower() for marker in ['scene', 'part', 'step']) and any(num in line for num in ['1', '2', '3', '4']):
                if current_scene and 'scene_number' in current_scene:
                    scenes.append(current_scene)
                scene_count += 1
                current_scene = {'scene_number': scene_count}
            
            # Parse content fields
            for field, keywords in [
                ('visual_description', ['visual', 'image', 'scene', 'description']),
                ('narration', ['narration', 'speech', 'audio', 'voice']),
                ('caption', ['caption', 'lesson', 'takeaway', 'learning'])
            ]:
                if any(keyword in line.lower() for keyword in keywords) and ':' in line:
                    content = line.split(':', 1)[1].strip()
                    if content and field not in current_scene:
                        current_scene[field] = content
        
        if current_scene and 'scene_number' in current_scene:
            scenes.append(current_scene)
        
        return scenes if scenes else []

    def _create_fallback_story(self, concept: str) -> List[Dict[str, Any]]:
        """Create a fallback story structure if AI generation fails"""
        return [
            {
                "scene_number": 1,
                "visual_description": f"Introduction to {concept} with vibrant educational elements and colorful diagrams",
                "narration": f"Welcome to our journey exploring {concept}",
                "caption": f"Let's discover the basics of {concept}"
            },
            {
                "scene_number": 2,
                "visual_description": f"Detailed exploration of key {concept} principles with scientific illustrations and examples",
                "narration": f"Now we dive deeper into understanding {concept}",
                "caption": f"Core principles of {concept} explained"
            },
            {
                "scene_number": 3,
                "visual_description": f"Real-world applications and examples of {concept} in everyday situations",
                "narration": f"See how {concept} works in everyday life",
                "caption": f"Practical applications of {concept}"
            },
            {
                "scene_number": 4,
                "visual_description": f"Summary and future exploration of {concept} with encouraging educational elements",
                "narration": f"What we've learned about {concept} and what's next",
                "caption": f"Mastering {concept} - your learning journey continues"
            }
        ]

    def generate_scene_image(self, scene_data: Dict[str, Any], story_id: str) -> str:
        """Generate an image for a scene using PIL"""
        try:
            width, height = self.image_settings['resolution']
            img = Image.new('RGB', (width, height), self.image_settings['background_color'])
            draw = ImageDraw.Draw(img)
            
            # Try to load fonts
            try:
                font_large = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 48)
                font_medium = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 24)
                font_small = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 18)
            except:
                font_large = ImageFont.load_default()
                font_medium = ImageFont.load_default()
                font_small = ImageFont.load_default()
            
            # Scene number circle
            circle_radius = 60
            circle_center = (width - 100, 80)
            draw.ellipse([
                circle_center[0] - circle_radius, 
                circle_center[1] - circle_radius,
                circle_center[0] + circle_radius, 
                circle_center[1] + circle_radius
            ], fill=(79, 70, 229))  # Indigo color
            
            # Scene number text
            scene_num_text = str(scene_data['scene_number'])
            draw.text(circle_center, scene_num_text, fill='white', font=font_large, anchor='mm')
            
            # Visual description
            description = scene_data.get('visual_description', 'Educational Scene')
            wrapped_description = self._wrap_text(description, font_medium, width - 100)
            
            y_offset = 150
            for line in wrapped_description[:8]:  # Limit lines
                draw.text((50, y_offset), line, fill='white', font=font_medium)
                y_offset += 35
            
            # Caption at bottom
            caption = scene_data.get('caption', 'Learning continues...')
            caption_wrapped = self._wrap_text(caption, font_small, width - 100)
            
            caption_y = height - 120
            for line in caption_wrapped[:3]:
                draw.text((50, caption_y), line, fill=(16, 185, 129), font=font_small)  # Green color
                caption_y += 25
            
            # Save image
            filename = f"scene_{scene_data['scene_number']}_{story_id}.png"
            filepath = self.output_dir / filename
            img.save(filepath)
            
            logger.info(f"Generated image for scene {scene_data['scene_number']}: {filename}")
            return str(filepath.relative_to(Path.cwd()))
            
        except Exception as e:
            logger.error(f"Error generating scene image: {e}")
            return None

    def _wrap_text(self, text: str, font, max_width: int) -> List[str]:
        """Wrap text to fit within specified width"""
        words = text.split()
        lines = []
        current_line = ""
        
        for word in words:
            test_line = current_line + (" " if current_line else "") + word
            # Simple character-based width estimation
            if len(test_line) * 12 <= max_width:
                current_line = test_line
            else:
                if current_line:
                    lines.append(current_line)
                current_line = word
        
        if current_line:
            lines.append(current_line)
        
        return lines

    def generate_scene_audio(self, scene_data: Dict[str, Any], story_id: str) -> str:
        """Generate audio narration for a scene using gTTS"""
        try:
            narration = scene_data.get('narration', 'Educational content continues.')
            
            # Create TTS audio
            tts = gTTS(text=narration, lang=self.audio_settings['lang'], slow=self.audio_settings['slow'])
            
            # Save audio file
            filename = f"audio_{scene_data['scene_number']}_{story_id}.mp3"
            filepath = self.output_dir / filename
            tts.save(str(filepath))
            
            logger.info(f"Generated audio for scene {scene_data['scene_number']}: {filename}")
            return str(filepath.relative_to(Path.cwd()))
            
        except Exception as e:
            logger.error(f"Error generating scene audio: {e}")
            return None

    def process_story_request(self, concept: str, subject: str = None, difficulty: str = None, story_id: str = None) -> Dict[str, Any]:
        """Main method to process a complete story request"""
        if not story_id:
            story_id = datetime.now().strftime('%Y%m%d_%H%M%S')
        
        logger.info(f"Processing story request: {concept}")
        
        try:
            # Generate story scenes
            scenes = self.generate_story_scenes(concept, subject, difficulty)
            
            # Generate multimedia content
            media_files = {
                'images': [],
                'audio_files': []
            }
            
            # Generate individual scene media
            for scene in scenes:
                image_path = self.generate_scene_image(scene, story_id)
                audio_path = self.generate_scene_audio(scene, story_id)
                
                if image_path:
                    media_files['images'].append(image_path)
                if audio_path:
                    media_files['audio_files'].append(audio_path)
            
            # Prepare response
            result = {
                'success': True,
                'story_id': story_id,
                'concept': concept,
                'subject': subject,
                'difficulty': difficulty,
                'scenes': scenes,
                'media_files': media_files,
                'generated_at': datetime.now().isoformat()
            }
            
            logger.info(f"Successfully processed story: {story_id}")
            return result
            
        except Exception as e:
            logger.error(f"Error processing story request: {e}")
            return {
                'success': False,
                'error': str(e),
                'story_id': story_id,
                'scenes': self._create_fallback_story(concept),
                'media_files': {'images': [], 'audio_files': []}
            }

def main():
    """CLI interface for the Simple Storytelling System"""
    if len(sys.argv) < 2:
        print("Usage: python ai-storytelling-simple.py <concept> [subject] [difficulty]")
        sys.exit(1)
    
    concept = sys.argv[1]
    subject = sys.argv[2] if len(sys.argv) > 2 else None
    difficulty = sys.argv[3] if len(sys.argv) > 3 else None
    
    # Create storytelling system
    storyteller = SimpleStorytellingSystem()
    
    # Process story
    result = storyteller.process_story_request(concept, subject, difficulty)
    
    # Output result as JSON
    print(json.dumps(result, indent=2))

if __name__ == "__main__":
    main()