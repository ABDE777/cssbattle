# CSS Battle Championship

Welcome to the CSS Battle Championship! This is a web application that allows CSS Battle players to register for the championship and provides admin tools to manage participants, scores, and learning resources.

## 🏆 About the Project

The CSS Battle Championship is a competition management system built for CSS Battle players. It provides a platform for player registration, score tracking, and administration of the championship.

## 🌟 Features

### For Players
- **Player Registration**: Register with your CSS Battle profile
- **Profile Management**: Update your information and link your CSS Battle profile
- **Leaderboard**: View real-time rankings of all participants
- **Learning Center**: Access educational resources to improve your CSS skills
- **Messaging System**: Receive messages from admins about the championship

### For Admins
- **Admin Dashboard**: Comprehensive dashboard to manage all aspects of the championship
- **Player Management**: View, edit, create, and delete player accounts
- **Score Automation**: Script to automatically fetch and update player scores from CSS Battle
- **Learning Resource Management**: Upload and manage educational content
- **Messaging System**: Send messages to individual players or groups
- **Group Management**: Organize players into different groups (DD, ID, etc.)

## 🔐 Admin Access

Admins can access the login page at `/admin`. The following admin accounts are pre-configured:
- ibrahim.challal@cssbattle.admin
- moneim.mazgoura@cssbattle.admin
- hamdi.boumlik@cssbattle.admin
- youness.hlibi@cssbattle.admin

Admins should set their own passwords through the Supabase authentication system.

## 🤖 Player Score Automation

To automatically check and update scores for all registered players, run:

```bash
npm run check-player-scores
```

This script will:
1. Fetch all registered players from the database
2. Check each player's current score on CSS Battle
3. Update the database with the latest scores

Note: The current implementation contains mock functions. In a production environment, these would be replaced with actual API calls to CSS Battle.

## 🛠️ Development

### Prerequisites
- Node.js (v16 or higher)
- npm package manager

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables (see Configuration section)

3. Run the development server:
   ```bash
   npm run dev
   ```

### Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build for production
- `npm run build:dev` - Build for development
- `npm run preview` - Preview the production build
- `npm run lint` - Run ESLint
- `npm run check-player-scores` - Run the player score checking script

## 🏗️ Technologies Used

### Frontend
- **React** with TypeScript
- **Vite** build tool
- **Tailwind CSS** for styling
- **shadcn/ui** components
- **React Router** for navigation
- **React Hook Form** with Zod validation
- **Recharts** for data visualization

### Backend & Authentication
- **Supabase** for backend services and authentication
- **Supabase JS SDK** for database operations

### State Management
- **@tanstack/react-query** for server state management
- **React Context API** for client state management

### Development Tools
- **TypeScript** for type safety
- **ESLint** for code linting
- **Prettier** for code formatting

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_public_key
```

### Supabase Setup

1. Create a Supabase project
2. Set up the database tables using the migration files in `supabase/migrations`
3. Configure authentication settings
4. Set up Row Level Security (RLS) policies

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/              # shadcn/ui primitive components
│   └── ...              # Custom components
├── constants/           # Application constants
├── contexts/            # React context providers
├── hooks/               # Custom React hooks
├── integrations/        # Third-party service integrations
│   └── supabase/        # Supabase client and types
├── lib/                 # Utility functions
├── pages/               # Page components
└── App.tsx              # Main application component

supabase/
├── migrations/          # Database schema migrations
└── functions/           # Supabase functions
```

## 🗃️ Database Schema

The application uses several key tables:
- `players` - Stores player information
- `admins` - Stores admin information
- `learning_resources` - Educational content
- `contact_messages` - Messaging system
- `user_roles` - User role assignments

## 🚀 Deployment

The application can be deployed to any platform that supports Node.js applications:
- Vercel
- Netlify
- AWS
- Google Cloud Platform
- etc.

To build for production:
```bash
npm run build
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a pull request

## 📞 Support

For support, please open an issue on the GitHub repository or contact the development team.
