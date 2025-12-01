# Telegram Clone

A full-stack Telegram clone application with real-time messaging capabilities.

## Features

- 📱 Phone number authentication with SMS verification
- 👤 User profile management
- 💬 Real-time messaging (coming soon)
- 👥 Group chats (coming soon)
- 🔒 End-to-end encryption (coming soon)
- 📎 Media sharing (coming soon)

## Tech Stack

### Backend
- Node.js + TypeScript
- Express.js
- PostgreSQL
- Redis
- Socket.io
- JWT Authentication

### Frontend
- React 18 + TypeScript
- Vite
- Tailwind CSS
- Zustand (State Management)
- React Router v6

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Redis (optional, for caching)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd telegram-clone
```

2. Install backend dependencies:
```bash
npm install
```

3. Install frontend dependencies:
```bash
cd client
npm install
cd ..
```

4. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

5. Set up the database:
```bash
# Create PostgreSQL database
createdb telegram_clone

# Run migrations
psql -d telegram_clone -f src/database/migrations/001_initial_schema.sql
```

### Running the Application

Development mode (runs both backend and frontend):
```bash
npm run dev
```

Or run separately:

Backend only:
```bash
npm run dev:server
```

Frontend only:
```bash
npm run dev:client
```

### API Endpoints

#### Authentication
- `POST /api/auth/send-code` - Send verification code
- `POST /api/auth/verify` - Verify code and authenticate
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user info

#### Users
- `GET /api/users/profile` - Get current user profile
- `PUT /api/users/profile` - Update profile
- `POST /api/users/profile` - Create profile
- `GET /api/users/:id` - Get user by ID

## Project Structure

```
telegram-clone/
├── src/                    # Backend source code
│   ├── config/            # Configuration
│   ├── database/          # Database connection & migrations
│   ├── middleware/        # Express middleware
│   ├── models/            # TypeScript types/interfaces
│   ├── routes/            # API routes
│   ├── services/          # Business logic
│   ├── tests/             # Test files
│   └── utils/             # Utility functions
├── client/                 # Frontend source code
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── lib/           # Utilities & API client
│   │   ├── pages/         # Page components
│   │   └── store/         # Zustand stores
│   └── public/            # Static assets
└── .kiro/specs/           # Feature specifications
```

## Testing

Run tests:
```bash
npm test
```

Run tests with coverage:
```bash
npm test -- --coverage
```

## License

MIT
