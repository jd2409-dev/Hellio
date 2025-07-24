# NexusLearn AI - Educational Platform

A fully gamified, AI-driven academic assistant designed to help students master subjects through interactive study tools, textbook scanning, real-time tutoring, quizzes, and AI-powered personalized learning experiences.

## 🚀 Features

### Core Educational Features
- **AI Tutor**: Personalized AI tutoring with contextual responses
- **Interactive Quizzes**: AI-generated quizzes with real-time scoring
- **Study Planner**: AI-powered study schedule generation
- **Time Capsule Mode**: Record and reflect on learning progress over time
- **Peer Challenges**: Create and share custom quiz challenges
- **Analytics Dashboard**: Track learning progress and achievements

### Gamification System
- **XP & Coins**: Earn points through study activities
- **Level Progression**: Advance through consistent engagement
- **Achievement Badges**: Unlock rewards for milestones
- **Study Streaks**: Daily engagement tracking
- **Leaderboards**: Compete with peers on challenges

### AI-Powered Features
- **AI Meetings**: Structured learning sessions with AI assistance
- **Live AI Classroom**: Interactive AI tutoring with speech delivery
- **Content Generation**: AI-created educational materials
- **Personalized Learning**: Adaptive content based on user progress

### Database Integration
- **Supabase Integration**: Complete CRUD operations and authentication
- **PostgreSQL Support**: Native database support with Drizzle ORM
- **Real-time Updates**: Live data synchronization
- **User Management**: Comprehensive user profiles and session management

## 🛠️ Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **TailwindCSS** for styling
- **shadcn/ui** components for consistent UI
- **Wouter** for lightweight routing
- **TanStack Query** for data management
- **Framer Motion** for animations

### Backend
- **Express.js** server with TypeScript
- **Drizzle ORM** for database operations
- **PostgreSQL** database
- **Replit Auth** for authentication
- **Session management** with PostgreSQL storage

### AI & External Services
- **Google Gemini AI** for content generation and tutoring
- **Supabase** for database and authentication (optional)
- **PDF Processing** for textbook content extraction

## 🏃‍♂️ Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL database (or Supabase project)
- Google Gemini API key
- Replit environment (recommended)

### Environment Variables
Create the following environment variables in your Replit Secrets:

```bash
DATABASE_URL=your_postgresql_connection_string
GEMINI_API_KEY=your_google_gemini_api_key
SESSION_SECRET=your_session_secret_key
VITE_SUPABASE_URL=your_supabase_project_url (optional)
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key (optional)
```

### Installation & Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/nexuslearn-ai.git
   cd nexuslearn-ai
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up the database**
   ```bash
   npm run db:push
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Access the application**
   - Open your browser to `http://localhost:5000`
   - Sign in with Replit Auth or Supabase Auth

## 📊 Database Setup

### PostgreSQL (Default)
The application uses Drizzle ORM with PostgreSQL. Run `npm run db:push` to sync the schema.

### Supabase (Optional)
For Supabase integration, see [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) for detailed instructions.

## 🎯 Available Routes

- `/` - Dashboard (authenticated users) or Landing page
- `/ai-tutor` - AI tutoring interface
- `/ai-meeting` - AI-powered learning sessions
- `/quiz-selection` - Interactive quiz generation
- `/study-planner` - AI study schedule planner
- `/time-capsule` - Learning reflection system
- `/peer-challenges` - Create and play peer challenges
- `/analytics` - Learning progress analytics
- `/supabase-demo` - Database CRUD operations demo
- `/supabase-auth` - Authentication demo

## 🔧 Development

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run check` - Type checking
- `npm run db:push` - Push database schema changes

### Project Structure
```
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Application pages
│   │   ├── hooks/          # Custom React hooks
│   │   ├── lib/            # Utility libraries
│   │   └── index.css       # Global styles
├── server/                 # Backend Express server
│   ├── services/           # Business logic services
│   ├── routes.ts           # API routes
│   ├── storage.ts          # Database operations
│   └── index.ts            # Server entry point
├── shared/                 # Shared types and schemas
│   └── schema.ts           # Database schema definitions
└── public/                 # Static assets
```

### Key Components
- **Gamification Stats**: XP, coins, and level display
- **Achievement Cards**: Progress tracking components
- **Interactive Quiz**: Real-time quiz interface
- **AI Chat Interface**: Tutoring conversation UI
- **Study Planner Calendar**: Schedule management
- **Challenge Creator**: Peer challenge builder

## 🔐 Authentication

The application supports two authentication methods:

1. **Replit Auth** (Default): OAuth integration with Replit
2. **Supabase Auth** (Optional): Email/password with Supabase

## 🎮 Gamification Features

### XP System
- Complete quizzes: 10-50 XP based on score
- Create time capsules: 25 XP
- Complete reflections: 50 XP
- Create peer challenges: 30 XP

### Achievement System
- Study streaks
- Quiz mastery
- Subject completion
- Social engagement
- Time management
- Learning milestones

### Coin Economy
- Earn coins through activities
- Future: Spend on premium features
- Leaderboard rankings

## 🤖 AI Integration

### Google Gemini AI
- Content generation
- Quiz creation
- Tutoring responses
- Study plan generation
- Educational content processing

### AI Services
- `quizService`: Generate adaptive quizzes
- `chatService`: Handle tutoring conversations
- `meetingService`: Manage AI learning sessions
- `studyPlanService`: Create personalized schedules

## 🚀 Deployment

### Replit Deployment
1. Configure environment variables in Replit Secrets
2. Ensure database is provisioned
3. Click the "Deploy" button in Replit

### Production Build
```bash
npm run build
npm run start
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Google Gemini AI for powerful AI capabilities
- Supabase for database and authentication services
- shadcn/ui for beautiful UI components
- Replit for hosting and development environment
- The educational technology community for inspiration

## 📞 Support

For support and questions:
- Open an issue on GitHub
- Check the documentation in `/docs`
- Review setup guides for common issues

---

**NexusLearn AI** - Empowering education through artificial intelligence and gamification 🎓✨