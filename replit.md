# Music Playlist Application

## Overview

A modern, Spotify-inspired music playlist application that allows users to play, pause, and navigate through their personal music collection. The application features a clean, dark-themed interface with a responsive design optimized for both desktop and mobile devices. Users can manage their playlist by simply editing a JSON file and adding MP3 files to a directory—no code changes required.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Build System:**
- React with TypeScript for type-safe component development
- Vite as the build tool and development server with HMR (Hot Module Replacement)
- React Router (wouter) for client-side routing

**UI Component System:**
- shadcn/ui component library with Radix UI primitives
- Tailwind CSS for utility-first styling with custom design tokens
- Theme system supporting light/dark modes with CSS variables
- Custom design guidelines following Spotify's visual language (dark theme, card-based layouts, bold typography)

**State Management:**
- TanStack Query (React Query) for server state management and data fetching
- Local React state with hooks for player controls and UI interactions
- No global state management library—relies on component-level state and server state caching

**Audio Playback:**
- Native HTML5 Audio API for music playback
- Custom audio controls with progress tracking, play/pause, skip functionality
- Client-side progress bar with click-to-seek capability

### Backend Architecture

**Server Framework:**
- Express.js with TypeScript for the HTTP server
- Simple REST API design with a single endpoint (`/api/playlist`)
- File-based data storage using JSON files (no database for playlist data)

**Data Flow:**
- Songs are stored in `server/data/songs.json`
- Static audio files served from `public/music/` directory
- In-memory caching with automatic reload on each request to support hot-updating the playlist

**Architecture Pattern:**
- Memory storage pattern (`MemStorage` class) that reads from filesystem
- Separation of storage logic from route handlers
- Simple request/response cycle without complex middleware chains

### Data Storage Solutions

**Current Implementation:**
- **Playlist Data:** JSON file-based storage (`server/data/songs.json`)
- **Audio Files:** Static file serving from filesystem (`public/music/`)
- **No Database:** Application uses file-based storage for simplicity and ease of updates

**Database Configuration (Provisioned but Unused):**
- Drizzle ORM configured with PostgreSQL support via Neon Database serverless driver
- Database credentials expected via `DATABASE_URL` environment variable
- Migration system in place (`migrations/` directory, `drizzle.config.ts`)
- Schema defined in `shared/schema.ts` but currently only uses Zod validation schemas for Song/Playlist types

**Rationale:**
The application intentionally uses JSON file storage to allow non-technical users to update the playlist by simply editing a text file. The database infrastructure is provisioned but not currently utilized, allowing for future scalability if needed (e.g., user accounts, playlists, favorites).

### External Dependencies

**Third-Party UI Libraries:**
- **shadcn/ui:** Complete component library built on Radix UI primitives
- **Radix UI:** Unstyled, accessible component primitives (dialogs, menus, tooltips, etc.)
- **Lucide React:** Icon library for consistent iconography
- **class-variance-authority (CVA):** Type-safe component variant management
- **Tailwind CSS:** Utility-first CSS framework with custom theme configuration

**Data Fetching & Validation:**
- **TanStack Query:** Server state management and caching
- **Zod:** Runtime type validation and TypeScript type inference
- **drizzle-zod:** Integration between Drizzle ORM and Zod schemas

**Database (Configured but Not Used):**
- **Neon Database:** Serverless PostgreSQL via `@neondatabase/serverless`
- **Drizzle ORM:** Type-safe SQL query builder and migration tool
- **connect-pg-simple:** PostgreSQL session store (available but unused)

**Development Tools:**
- **Vite:** Frontend build tool with dev server
- **esbuild:** Fast JavaScript bundler for production builds
- **TypeScript:** Static type checking across frontend and backend
- **Replit-specific plugins:** Runtime error overlay, cartographer, dev banner for Replit environment

**Utilities:**
- **date-fns:** Date manipulation and formatting
- **clsx & tailwind-merge:** Conditional class name composition
- **nanoid:** Unique ID generation