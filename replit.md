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

### Gamification System
- **XP System**: Points earned through study activities
- **Coin Economy**: Virtual currency for achievements
- **Level Progression**: User advancement through consistent engagement
- **Achievement Badges**: Milestone rewards for various accomplishments
- **Study Streaks**: Daily engagement tracking

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