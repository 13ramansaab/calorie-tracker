# Calorie Tracker Setup Guide

## Project Overview
This is a React Native/Expo calorie tracking application with the following features:
- Calorie and macro nutrient tracking
- Meal logging with photo analysis
- User authentication and profiles
- Progress tracking and analytics
- Premium subscription features
- Achievement system

## Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Expo CLI (`npm install -g @expo/cli`)
- Supabase account (for database)

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Supabase Configuration
You need to set up a Supabase project and configure the environment variables:

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Settings > API to get your project URL and anon key
3. Create a `.env.local` file in the root directory:
```bash
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Database Setup
Run the migration file to set up your database schema:
```bash
# In Supabase SQL Editor, run the migration file:
# supabase/migrations/20251019035718_extend_schema_for_app.sql
```

### 4. Run the Application
```bash
# For web development
npm run dev

# For mobile development
npx expo start
```

## Project Structure
- `app/` - Main application screens (Expo Router)
- `components/` - Reusable UI components
- `contexts/` - React context providers
- `lib/` - Supabase configuration
- `types/` - TypeScript definitions
- `utils/` - Utility functions
- `supabase/` - Database migrations

## Key Features
- **Authentication**: User signup/login with Supabase Auth
- **Meal Logging**: Track calories and macros for each meal
- **Photo Analysis**: AI-powered food recognition (requires API setup)
- **Progress Tracking**: Daily/weekly/monthly analytics
- **Goals**: Set and track nutrition goals
- **Premium Features**: Subscription-based advanced features

## Development Notes
- The app uses TypeScript for type safety
- Supabase handles authentication and database operations
- Expo Router provides file-based routing
- Custom components for consistent UI design

## Next Steps
1. Set up Supabase project and configure environment variables
2. Run database migrations
3. Test the application functionality
4. Customize features as needed
