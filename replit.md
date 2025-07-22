# NexusLearn AI - Educational Platform

## Overview

NexusLearn AI is a fully gamified, AI-driven academic assistant designed to help students master subjects through interactive study tools, textbook scanning, real-time tutoring, quizzes, and AI-powered personalized learning experiences. The platform combines modern web technologies with artificial intelligence to create an engaging educational environment.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Full-Stack Application Structure
The application follows a monorepo structure with clear separation between client and server code:

- **Frontend**: React-based SPA with TypeScript
- **Backend**: Express.js server with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **AI Integration**: Google Gemini AI for content generation and tutoring
- **Authentication**: Replit Auth integration
- **File Processing**: PDF text extraction and AI summarization

### Technology Stack
- **Frontend**: React 18, TypeScript, Vite, TailwindCSS, shadcn/ui components
- **Backend**: Express.js, TypeScript, Drizzle ORM
- **Database**: PostgreSQL (Neon serverless)
- **AI**: Google Gemini AI (@google/genai)
- **Auth**: Replit OAuth with session management
- **Styling**: TailwindCSS with custom theme variables
- **Build**: Vite for frontend, esbuild for backend

## Key Components

### Frontend Architecture
- **Component Library**: shadcn/ui components for consistent UI
- **State Management**: TanStack Query for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Styling**: TailwindCSS with custom NexusLearn theme (green/gold color scheme)
- **Forms**: React Hook Form with Zod validation

### Backend Architecture
- **API Structure**: RESTful endpoints organized by feature
- **File Upload**: Multer middleware for PDF handling
- **Session Management**: PostgreSQL-backed sessions with express-session
- **AI Services**: Modular services for quiz generation, PDF processing, and chat

### Database Schema
Key entities include:
- **Users**: Profile data, XP, coins, level, study streaks
- **Subjects**: Academic subjects with descriptions and metadata
- **Textbooks**: Uploaded PDF content with AI-processed summaries
- **Quizzes**: Generated quizzes with questions and scoring
- **Achievements**: Gamification rewards and progress tracking
- **Chat Sessions**: AI tutor conversation history
- **AI Meetings**: Structured learning sessions with topics, subjects, grades, and agendas
- **Meeting Messages**: Real-time chat messages during AI-powered learning sessions

### Gamification System (Updated January 2025)
- **XP System**: Points earned through study activities
- **Coin Economy**: Virtual currency for achievements
- **Level Progression**: User advancement through consistent engagement
- **Achievement Badges**: 10 real achievements with database integration
- **Study Streaks**: Daily engagement tracking
- **Real Data Integration**: Dashboard now shows actual user achievements and stats

### AI Meeting System (Updated January 2025)
- **Meeting Organization**: Natural language meeting requests (e.g., "Organize a meeting for topic 'motion' for grade 9")
- **AI-Powered Parsing**: Automatic extraction of topic, subject, grade level, and structured agenda
- **Interactive Sessions**: Real-time AI tutoring during meetings with contextual responses
- **Meeting Management**: Database-backed meeting storage with status tracking
- **Live Chat**: In-meeting chat system with AI assistant for instant help and explanations
- **Educational Structure**: Pedagogically organized agendas from basic to advanced concepts

### AI Live Classroom (Updated January 2025)
- **AI Bot Integration**: Creates Jitsi rooms where AI tutor joins with visual and audio presence
- **Real-time Speech Delivery**: AI speaks lesson content using Web Speech API in browser
- **Interactive Q&A System**: AI responds to student questions in real-time chat during sessions
- **Comprehensive Lesson Generation**: Creates structured educational content with HF Inference API
- **Live Teaching Simulation**: AI tutor demonstrates speaking capabilities and interactive responses
- **Zero-cost Implementation**: Uses free Jitsi rooms and open-source tools for education delivery
- **Multi-modal Learning**: Combines visual content, spoken explanations, and text-based interactions

### Time Capsule Mode (Updated January 2025)
- **Concept Recording**: Students record video/audio explanations of concepts to their future selves
- **Multi-format Support**: Text, audio, and video recording capabilities with browser media APIs
- **Automated Reminders**: System pings users months later (configurable 1-365 days) for reflection
- **Reflection Interface**: Comprehensive reflection form for comparing past vs current understanding
- **Growth Tracking**: Documents learning journey and insights about personal knowledge evolution
- **Database Integration**: PostgreSQL storage for recordings, reminders, and reflection data
- **Gamification**: XP rewards for creating capsules (25 XP) and completing reflections (50 XP)
- **Progressive Learning**: Helps students recognize knowledge gaps and celebrate growth over time

### Gamified Peer Challenge System (Updated January 2025)
- **Challenge Creation**: Users create custom quiz challenges with multiple-choice questions and explanations
- **JSON Package Sharing**: Challenges packaged as downloadable JSON files for easy peer sharing
- **Shareable URLs**: Challenges accessible via unique links like "https://gamify.repl.co/challenges/abc123"
- **Interactive Quiz Interface**: Timed quizzes with progress tracking and smooth animations using Framer Motion
- **Real-time Leaderboards**: PostgreSQL-backed scoring system with attempt tracking and best score rankings
- **Gamification Rewards**: XP and coin rewards for creating challenges (30 XP) and completing them (score-based XP)
- **Difficulty Levels**: Easy, medium, and hard difficulty settings with visual badges and color coding
- **Attempt Limits**: Configurable maximum attempts per challenge with retry functionality
- **Results Sharing**: Social sharing functionality for challenge results and achievements
- **Multi-format Export**: Challenges exportable as JSON with metadata for cross-platform compatibility

### Internet Archive Book Integration (Updated January 2025)
- **Archive.org Integration**: Replaced PDF Drive with Internet Archive's vast educational book collection
- **Comprehensive Search**: Multi-field search across titles, subjects, creators, and descriptions for broader topic coverage
- **Rich Metadata**: Displays book descriptions, download counts, publication years, and subject classifications
- **Multiple Format Access**: Users access books through Archive.org where PDF, EPUB, and other formats are available
- **Category Filtering**: Enhanced category mapping with related terms (e.g., mathematics includes calculus, algebra, geometry)
- **Ethical Access**: Uses Archive.org's official API for legitimate access to educational resources
- **Subject Integration**: Books can be saved to user libraries and associated with study subjects

### AI Study Planner (Updated January 2025)
- **Calendar Interface**: Complete calendar system with multiple view modes (calendar, week, day)
- **AI-Powered Plan Generation**: Uses Gemini API to create personalized study schedules based on exam requirements
- **Intelligent Scheduling**: Analyzes syllabus content, available study time, and exam dates to optimize learning
- **Reminder System**: Automatic notifications 30 minutes before scheduled study sessions
- **Progress Integration**: Completed study plans award XP and integrate with user progress tracking
- **Manual Planning**: Custom study session creation with priorities, study types, and duration settings
- **Database Persistence**: PostgreSQL storage for study plans, reminders, and completion tracking

## Data Flow

### Authentication Flow
1. User initiates login through Replit OAuth
2. Session established with PostgreSQL storage
3. User profile created/updated in database
4. Frontend receives authenticated user data

### Content Processing Flow
1. User uploads PDF textbook
2. Gemini AI extracts and processes text content
3. AI generates summary and searchable content
4. Content stored in database with metadata
5. Search functionality enables content retrieval

### Quiz Generation Flow
1. User selects subject and difficulty parameters
2. AI generates adaptive quiz questions using Gemini
3. Quiz stored with questions, answers, and explanations
4. Real-time scoring and progress tracking
5. Results feed back into user progress metrics

### AI Tutoring Flow
1. User submits question to AI tutor
2. Context includes chat history and user profile
3. Gemini AI generates personalized response
4. Conversation stored for continuity
5. Learning progress tracked and analyzed

## External Dependencies

### AI Services
- **Google Gemini AI**: Core AI functionality for content generation, tutoring, and text processing
- **API Key Management**: Environment-based configuration for AI services

### Database Services
- **Neon PostgreSQL**: Serverless PostgreSQL database
- **Connection Pooling**: Configured for optimal performance

### Authentication
- **Replit Auth**: OAuth integration for user authentication
- **Session Storage**: PostgreSQL-backed session management

### File Processing
- **PDF Handling**: Multer for file uploads with size and type validation
- **AI Text Extraction**: Gemini AI for OCR and content parsing

## Deployment Strategy

### Development Environment
- **Vite Dev Server**: Hot module replacement for frontend development
- **TSX Runtime**: TypeScript execution for backend development
- **Environment Variables**: Centralized configuration management

### Production Build
- **Frontend**: Vite builds optimized SPA bundle
- **Backend**: esbuild creates optimized Node.js bundle
- **Static Assets**: Served through Express in production

### Database Management
- **Schema Evolution**: Drizzle migrations for database changes
- **Connection Management**: Pool-based connections with proper cleanup

### Environment Configuration
Required environment variables:
- `DATABASE_URL`: PostgreSQL connection string
- `GEMINI_API_KEY`: Google AI API key
- `SESSION_SECRET`: Session encryption key
- `REPL_ID`: Replit authentication identifier

The application is designed for deployment on Replit but can be adapted for other platforms with minimal configuration changes.