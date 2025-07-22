#!/usr/bin/env python3
"""
Enhanced AI Educational Storytelling System
Combines Gemini AI with multimedia generation capabilities
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
from pydub import AudioSegment
try:
    from moviepy.editor import VideoFileClip, AudioFileClip, CompositeVideoClip, ImageClip
    MOVIEPY_AVAILABLE = True
except ImportError:
    MOVIEPY_AVAILABLE = False
    logger.warning("MoviePy not available, video creation will be disabled")
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

try:
    from moviepy.editor import VideoFileClip, AudioFileClip, CompositeVideoClip, ImageClip
    MOVIEPY_AVAILABLE = True
except ImportError:
    MOVIEPY_AVAILABLE = False
    logger.warning("MoviePy not available, video creation will be disabled")

class EnhancedStorytellingSystem:
    def __init__(self):
        """Initialize the Enhanced Storytelling System"""
        self.setup_gemini()
        self.output_dir = Path("./server/public/stories")
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
        # Audio settings
        self.audio_settings = {
            'lang': 'en',
            'slow': False,
            'format': 'mp3'
        }
        
        # Video settings
        self.video_settings = {
            'fps': 24,
            'duration_per_scene': 8,  # seconds per scene
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

Convert the user-submitted concept into exactly 4 animated scenes. Each scene must include:

1. "scene_number": A numbered index (1-4)
2. "visual_description": Detailed visual description for image generation (100+ words)
3. "narration": Engaging spoken narration (20-40 words)
4. "caption": Educational takeaway (10-20 words)
5. "visual_elements": List of specific visual elements for image generation
6. "color_palette": Suggested color scheme for the scene
7. "mood": Overall mood/atmosphere of the scene

Make the story educational, engaging, and age-appropriate.
Focus on visual storytelling that can be converted to images and animations."""

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
                logger.warning(f"Generated {len(story_data)} scenes instead of 4, adjusting...")
                story_data = story_data[:4] if len(story_data) > 4 else story_data + [self._create_default_scene(i+1) for i in range(len(story_data), 4)]
            
            return story_data
            
        except Exception as e:
            logger.error(f"Error generating story scenes: {e}")
            return self._create_fallback_story(concept)

    def _parse_gemini_response(self, response_text: str) -> List[Dict[str, Any]]:
        """Parse Gemini's response into structured scene data"""
        scenes = []
        
        # Try to extract JSON if present
        try:
            if '{' in response_text and '}' in response_text:
                # Look for JSON structure
                import re
                json_match = re.search(r'\[.*\]', response_text, re.DOTALL)
                if json_match:
                    scenes_data = json.loads(json_match.group())
                    return scenes_data
        except json.JSONDecodeError:
            pass
        
        # Fallback: parse text structure
        lines = response_text.split('\n')
        current_scene = {}
        scene_count = 0
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
                
            if 'scene' in line.lower() and ('1' in line or '2' in line or '3' in line or '4' in line):
                if current_scene:
                    scenes.append(current_scene)
                current_scene = {'scene_number': scene_count + 1}
                scene_count += 1
            elif 'visual_description' in line.lower():
                current_scene['visual_description'] = line.split(':', 1)[1].strip()
            elif 'narration' in line.lower():
                current_scene['narration'] = line.split(':', 1)[1].strip()
            elif 'caption' in line.lower():
                current_scene['caption'] = line.split(':', 1)[1].strip()
        
        if current_scene:
            scenes.append(current_scene)
        
        return scenes

    def _create_fallback_story(self, concept: str) -> List[Dict[str, Any]]:
        """Create a fallback story structure if AI generation fails"""
        return [
            {
                "scene_number": 1,
                "visual_description": f"Introduction to {concept} with vibrant educational elements",
                "narration": f"Welcome to our journey exploring {concept}",
                "caption": f"Let's discover the basics of {concept}",
                "visual_elements": ["educational", "introduction", "colorful"],
                "color_palette": ["#4F46E5", "#7C3AED", "#EC4899"],
                "mood": "exciting"
            },
            {
                "scene_number": 2,
                "visual_description": f"Detailed exploration of key {concept} principles",
                "narration": f"Now we dive deeper into understanding {concept}",
                "caption": f"Core principles of {concept} explained",
                "visual_elements": ["detailed", "explanatory", "scientific"],
                "color_palette": ["#059669", "#0D9488", "#0891B2"],
                "mood": "focused"
            },
            {
                "scene_number": 3,
                "visual_description": f"Real-world applications and examples of {concept}",
                "narration": f"See how {concept} works in everyday life",
                "caption": f"Practical applications of {concept}",
                "visual_elements": ["practical", "real-world", "examples"],
                "color_palette": ["#DC2626", "#EA580C", "#D97706"],
                "mood": "practical"
            },
            {
                "scene_number": 4,
                "visual_description": f"Summary and future exploration of {concept}",
                "narration": f"What we've learned about {concept} and what's next",
                "caption": f"Mastering {concept} - your learning journey continues",
                "visual_elements": ["summary", "future", "achievement"],
                "color_palette": ["#7C2D12", "#A16207", "#065F46"],
                "mood": "accomplished"
            }
        ]

    def _create_default_scene(self, scene_number: int) -> Dict[str, Any]:
        """Create a default scene structure"""
        return {
            "scene_number": scene_number,
            "visual_description": f"Educational scene {scene_number} with learning elements",
            "narration": f"This is scene {scene_number} of our educational story",
            "caption": f"Learning point {scene_number}",
            "visual_elements": ["educational", "generic"],
            "color_palette": ["#6B7280", "#9CA3AF"],
            "mood": "neutral"
        }

    def generate_scene_image(self, scene_data: Dict[str, Any], story_id: str) -> str:
        """Generate an image for a scene using PIL"""
        try:
            # Create image
            width, height = self.video_settings['resolution']
            img = Image.new('RGB', (width, height), self.video_settings['background_color'])
            draw = ImageDraw.Draw(img)
            
            # Try to load a font, fallback to default if not available
            try:
                font_large = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 48)
                font_medium = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 24)
                font_small = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 18)
            except:
                font_large = ImageFont.load_default()
                font_medium = ImageFont.load_default()
                font_small = ImageFont.load_default()
            
            # Color palette from scene data
            colors = scene_data.get('color_palette', ['#4F46E5', '#7C3AED'])
            primary_color = colors[0] if colors else '#4F46E5'
            
            # Convert hex to RGB
            primary_rgb = tuple(int(primary_color.lstrip('#')[i:i+2], 16) for i in (0, 2, 4))
            
            # Draw scene number circle
            circle_radius = 60
            circle_center = (width - 100, 80)
            draw.ellipse([
                circle_center[0] - circle_radius, 
                circle_center[1] - circle_radius,
                circle_center[0] + circle_radius, 
                circle_center[1] + circle_radius
            ], fill=primary_rgb)
            
            # Scene number text
            scene_num_text = str(scene_data['scene_number'])
            draw.text(circle_center, scene_num_text, fill='white', font=font_large, anchor='mm')
            
            # Title area
            title_y = 150
            max_width = width - 100
            
            # Draw visual description (wrapped)
            description = scene_data.get('visual_description', 'Educational Scene')
            wrapped_description = self._wrap_text(description, font_medium, max_width)
            
            y_offset = title_y
            for line in wrapped_description[:6]:  # Limit to 6 lines
                draw.text((50, y_offset), line, fill='white', font=font_medium)
                y_offset += 35
            
            # Draw caption at the bottom
            caption = scene_data.get('caption', 'Learning continues...')
            caption_wrapped = self._wrap_text(caption, font_small, max_width)
            
            caption_y = height - 120
            for line in caption_wrapped[:3]:  # Limit to 3 lines
                draw.text((50, caption_y), line, fill='#10B981', font=font_small)
                caption_y += 25
            
            # Add decorative elements based on mood
            mood = scene_data.get('mood', 'neutral')
            self._add_mood_decorations(draw, width, height, mood, primary_rgb)
            
            # Save image
            filename = f"scene_{scene_data['scene_number']}_{story_id}.png"
            filepath = self.output_dir / filename
            img.save(filepath)
            
            logger.info(f"Generated image for scene {scene_data['scene_number']}: {filename}")
            return str(filepath)
            
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
            # Use a simple character-based approximation for text width
            if len(test_line) * 12 <= max_width:  # Rough character width estimation
                current_line = test_line
            else:
                if current_line:
                    lines.append(current_line)
                current_line = word
        
        if current_line:
            lines.append(current_line)
        
        return lines

    def _add_mood_decorations(self, draw, width: int, height: int, mood: str, color: tuple):
        """Add decorative elements based on scene mood"""
        if mood == 'exciting':
            # Add some sparkle effects
            for i in range(20):
                x = i * (width // 20) + 30
                y = 50 + (i % 3) * 20
                draw.ellipse([x-3, y-3, x+3, y+3], fill=color)
        
        elif mood == 'focused':
            # Add geometric patterns
            for i in range(0, width, 100):
                draw.rectangle([i, height-10, i+50, height-5], fill=color)
        
        elif mood == 'practical':
            # Add corner accents
            accent_size = 30
            draw.polygon([(0, 0), (accent_size, 0), (0, accent_size)], fill=color)
            draw.polygon([(width, 0), (width-accent_size, 0), (width, accent_size)], fill=color)
        
        elif mood == 'accomplished':
            # Add border accent
            border_width = 5
            draw.rectangle([0, 0, width, border_width], fill=color)
            draw.rectangle([0, height-border_width, width, height], fill=color)

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
            return str(filepath)
            
        except Exception as e:
            logger.error(f"Error generating scene audio: {e}")
            return None

    def create_story_video(self, scenes: List[Dict[str, Any]], story_id: str, title: str = "Educational Story") -> str:
        """Create a complete video from all scenes using MoviePy"""
        if not MOVIEPY_AVAILABLE:
            logger.warning("MoviePy not available, skipping video creation")
            return None
            
        try:
            video_clips = []
            
            for scene in scenes:
                # Generate image and audio for each scene
                image_path = self.generate_scene_image(scene, story_id)
                audio_path = self.generate_scene_audio(scene, story_id)
                
                if image_path and audio_path:
                    # Load audio to get duration
                    audio_clip = AudioFileClip(audio_path)
                    duration = max(audio_clip.duration, self.video_settings['duration_per_scene'])
                    
                    # Create image clip with the audio duration
                    image_clip = ImageClip(image_path, duration=duration)
                    
                    # Combine image and audio
                    scene_clip = image_clip.set_audio(audio_clip)
                    video_clips.append(scene_clip)
                    
                    # Clean up
                    audio_clip.close()
                else:
                    logger.warning(f"Could not create media for scene {scene['scene_number']}")
            
            if video_clips:
                # Concatenate all scenes
                final_video = CompositeVideoClip(video_clips, method='compose')
                
                # Export final video
                output_filename = f"story_{story_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.mp4"
                output_path = self.output_dir / output_filename
                
                final_video.write_videofile(
                    str(output_path), 
                    fps=self.video_settings['fps'],
                    codec='libx264',
                    audio_codec='aac'
                )
                
                # Clean up
                for clip in video_clips:
                    clip.close()
                final_video.close()
                
                logger.info(f"Created story video: {output_filename}")
                return str(output_path)
            
        except Exception as e:
            logger.error(f"Error creating story video: {e}")
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
                'audio_files': [],
                'video_path': None
            }
            
            # Generate individual scene media
            for scene in scenes:
                image_path = self.generate_scene_image(scene, story_id)
                audio_path = self.generate_scene_audio(scene, story_id)
                
                if image_path:
                    media_files['images'].append(image_path)
                if audio_path:
                    media_files['audio_files'].append(audio_path)
            
            # Create complete video
            video_path = self.create_story_video(scenes, story_id, concept)
            if video_path:
                media_files['video_path'] = video_path
            
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
                'story_id': story_id
            }

def main():
    """CLI interface for the Enhanced Storytelling System"""
    if len(sys.argv) < 2:
        print("Usage: python ai-storytelling-enhanced.py <concept> [subject] [difficulty]")
        sys.exit(1)
    
    concept = sys.argv[1]
    subject = sys.argv[2] if len(sys.argv) > 2 else None
    difficulty = sys.argv[3] if len(sys.argv) > 3 else None
    
    # Create storytelling system
    storyteller = EnhancedStorytellingSystem()
    
    # Process story
    result = storyteller.process_story_request(concept, subject, difficulty)
    
    # Output result as JSON
    print(json.dumps(result, indent=2))

if __name__ == "__main__":
    main()