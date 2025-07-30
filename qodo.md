# Repository Tour

## 🎯 What This Repository Does

**NexusLearn AI** is a comprehensive, gamified educational platform that combines AI-powered tutoring, adaptive learning, and detailed progress tracking to create an engaging learning experience for students across all academic subjects.

**Key responsibilities:**
- AI-driven personalized tutoring and content generation using Google Gemini
- Adaptive quiz generation with multiple question types and difficulty levels
- Comprehensive learning analytics and progress tracking with gamification
- Textbook analysis and content extraction from PDF uploads
- Study planning and productivity tools including Pomodoro timers

---

## 🏗️ Architecture Overview

### System Context
```
[Student] → [NexusLearn AI Platform] → [PostgreSQL Database]
                    ↓
            [Google Gemini AI API]
                    ↓
            [Replit Auth Service]
```

### Key Components
- **Frontend (React + TypeScript)** - Modern SPA with TailwindCSS and shadcn/ui components
- **Backend (Express.js + TypeScript)** - RESTful API with service-oriented architecture
- **AI Services** - Google Gemini integration for content generation, tutoring, and quiz creation
- **Database Layer** - PostgreSQL with Drizzle ORM for type-safe database operations
- **Authentication** - Replit Auth with session management and optional Supabase integration
- **Analytics Engine** - Comprehensive tracking of learning patterns, progress, and gamification metrics

### Data Flow
1. **User Authentication** - Replit Auth → Session Storage → User Profile Creation
2. **AI Tutoring** - User Question → Gemini AI → Response Processing → Chat History Storage
3. **Quiz Generation** - Subject/Topic Input → AI Generation → User Interaction → Score Calculation → Analytics Update
4. **Progress Tracking** - Activity Completion → XP/Coins Award → Level Progression → Achievement Unlocking
5. **Content Analysis** - PDF Upload → Text Extraction → AI Processing → Searchable Content Storage

---

## 📁 Project Structure [Partial Directory Tree]

```
hellio/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # Reusable UI components (gamification, timers, cards)
│   │   ├── pages/          # Application routes (dashboard, ai-tutor, quiz-selection)
│   │   ├── hooks/          # Custom React hooks for data fetching
│   │   ├── lib/            # Utility libraries and API clients
│   │   └── index.css       # Global styles with TailwindCSS
│   └── index.html          # HTML entry point
├── server/                 # Backend Express server
│   ├── services/           # Business logic services
│   │   ├── quizGenerator.ts    # AI-powered quiz generation
│   │   ├── analyticsService.ts # Learning progress tracking
│   │   ├── studyPlanGenerator.ts # AI study schedule creation
│   │   ├── pdfProcessor.ts     # Textbook content extraction
│   │   └── textbookExplainer.ts # AI content analysis
│   ├── routes.ts           # API endpoints and request handling
│   ├── storage.ts          # Database operations and queries
│   ├── gemini.ts           # Google Gemini AI integration
│   ├── replitAuth.ts       # Authentication middleware
│   └── index.ts            # Server entry point and Express setup
├── shared/                 # Shared types and schemas
│   └── schema.ts           # Drizzle database schema definitions
├── api/                    # Serverless API handlers
├── attached_assets/        # User-uploaded files and static assets
├── .config/                # Configuration files
├── package.json            # Dependencies and scripts
├── vite.config.ts          # Build configuration
├── drizzle.config.ts       # Database configuration
└── tsconfig.json           # TypeScript configuration
```

### Key Files to Know

| File | Purpose | When You'd Touch It |
|------|---------|---------------------|
| `server/index.ts` | Express server entry point | Adding middleware or server configuration |
| `server/routes.ts` | All API endpoints and business logic | Adding new features or API endpoints |
| `shared/schema.ts` | Database schema definitions | Adding new tables or modifying data structure |
| `client/src/App.tsx` | React app routing and layout | Adding new pages or changing navigation |
| `server/gemini.ts` | AI integration and services | Modifying AI behavior or adding new AI features |
| `server/storage.ts` | Database operations | Adding new database queries or operations |
| `client/src/pages/dashboard.tsx` | Main user interface | Changing the primary user experience |
| `package.json` | Dependencies and scripts | Adding libraries or changing build process |
| `vite.config.ts` | Build and development configuration | Modifying build process or aliases |
| `.env` | Environment variables | Configuring API keys and database connections |

---

## 🔧 Technology Stack

### Core Technologies
- **Language:** TypeScript (5.6.3) - Type safety across full stack
- **Frontend Framework:** React 18 - Modern component-based UI with hooks
- **Backend Framework:** Express.js 4.21 - RESTful API server
- **Database:** PostgreSQL - Relational database with complex relationships
- **ORM:** Drizzle ORM 0.39 - Type-safe database operations with migrations

### Key Libraries
- **AI Integration:** Google Gemini AI (@google/genai) - Content generation and tutoring
- **UI Components:** shadcn/ui with Radix UI primitives - Accessible, customizable components
- **Styling:** TailwindCSS 3.4 - Utility-first CSS framework
- **State Management:** TanStack Query 5.60 - Server state management and caching
- **Routing:** Wouter 3.3 - Lightweight client-side routing
- **Forms:** React Hook Form 7.55 with multiple resolvers - Type-safe form handling
- **Animations:** Framer Motion 11.18 - Smooth UI animations and transitions

### Development Tools
- **Build Tool:** Vite 7.0 - Fast development and optimized production builds
- **Database Migrations:** Drizzle Kit 0.31 - Schema management and migrations
- **File Processing:** Multer 2.0 - PDF upload and processing for textbook analysis
- **Authentication:** Replit Auth + Passport.js - Secure user authentication
- **Validation:** Zod 3.24 - Runtime type validation and schema parsing

---

## 🌐 External Dependencies

### Required Services
- **Google Gemini AI** - Core AI functionality for tutoring, quiz generation, and content analysis
- **PostgreSQL Database** - Primary data storage for users, content, and analytics
- **Replit Platform** - Hosting environment with integrated authentication and deployment

### Optional Integrations
- **Supabase** - Alternative database and authentication provider with real-time features
- **Neon Database** - Serverless PostgreSQL alternative for cloud deployment

### Environment Variables

```bash
# Required
DATABASE_URL=              # PostgreSQL connection string
GEMINI_API_KEY=           # Google Gemini AI API key
SESSION_SECRET=           # Session encryption key (32+ characters)

# Optional
VITE_SUPABASE_URL=        # Supabase project URL
VITE_SUPABASE_ANON_KEY=   # Supabase anonymous key

# Auto-configured by Replit
REPL_ID=                  # Replit environment identifier
REPLIT_DOMAINS=           # Replit domain configuration
PORT=                     # Application port (default: 5000)
```

---

## 🔄 Common Workflows

### AI Tutoring Workflow
1. **User initiates chat** via `/ai-tutor` interface
2. **Message processing** through chat session management
3. **AI response generation** using Google Gemini with educational context
4. **Response delivery** with conversation history maintenance
5. **Progress tracking** and XP award for engagement

**Code path:** `ai-tutor.tsx` → `/api/ai-chat` → `gemini.ts` → `storage.ts`

### Quiz Generation and Taking Workflow
1. **Subject and difficulty selection** on quiz selection page
2. **AI quiz generation** using Gemini with structured prompts
3. **Interactive quiz interface** with real-time answer tracking
4. **Score calculation** and performance analysis
5. **Analytics update** and gamification rewards (XP, coins, achievements)

**Code path:** `quiz-selection.tsx` → `/api/quizzes/generate` → `quizGenerator.ts` → `/api/quizzes/submit` → `analyticsService.ts`

### Textbook Analysis Workflow
1. **PDF upload** through textbook upload interface
2. **Text extraction** using PDF processing services
3. **AI content analysis** for searchable content creation
4. **Quiz generation** from textbook content
5. **Content storage** for future reference and search

**Code path:** `textbook-upload.tsx` → `/api/textbooks/upload` → `pdfProcessor.ts` → `textbookExplainer.ts`

---

## 📈 Performance & Scale

### Performance Considerations
- **Caching:** TanStack Query for client-side API response caching
- **AI Optimization:** Structured prompts and response schemas for efficient Gemini API usage
- **Database Indexing:** Optimized queries with proper indexing on user and session tables
- **Asset Optimization:** Vite-based bundling with code splitting and lazy loading

### Monitoring
- **Metrics:** User engagement tracking, quiz completion rates, AI response times
- **Analytics:** Comprehensive learning progress tracking with performance insights
- **Error Handling:** Structured error responses with fallback mechanisms for AI services

---

## 🚨 Things to Be Careful About

### 🔒 Security Considerations
- **Authentication:** Replit Auth integration with secure session management
- **API Keys:** Google Gemini API key protection and rate limiting
- **File Uploads:** PDF processing with size limits and type validation
- **Data Privacy:** User learning data protection and GDPR considerations

### 🎯 AI Integration Best Practices
- **Rate Limiting:** Gemini API usage monitoring to prevent quota exhaustion
- **Prompt Engineering:** Structured prompts for consistent AI responses
- **Error Handling:** Graceful fallbacks when AI services are unavailable
- **Content Filtering:** Educational content validation and inappropriate content prevention

### 📊 Database Performance
- **Connection Pooling:** Efficient database connection management
- **Query Optimization:** Indexed queries for analytics and user data retrieval
- **Migration Safety:** Careful schema changes with proper rollback strategies

---

*Updated at: 2025-01-26 19:08:07 UTC*
*Last commit: 7ca4bf2 - chore: add Vercel deployment configuration and serverless API handler*