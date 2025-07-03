# MIT App Inventor AIA Generator

## Overview

This is a full-stack web application that generates MIT App Inventor 2 specification-compliant AIA files from user project specifications. The application features a React frontend with a Node.js/Express backend, integrated with Google Custom Search API and support for MIT App Inventor extensions.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **UI Framework**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design tokens
- **State Management**: React Hook Form for form state, TanStack Query for server state
- **Routing**: Wouter for lightweight client-side routing

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **File Processing**: Archiver for ZIP file generation, Multer for file uploads
- **Development**: Hot module replacement with Vite middleware integration

### Data Storage Solutions
- **Database**: PostgreSQL with Drizzle ORM
- **Connection**: Neon Database serverless connection
- **Schema**: User management and AIA project storage
- **Session Management**: In-memory storage for development (can be extended with connect-pg-simple)

## Key Components

### AIA File Generation Engine
- **Purpose**: Converts user specifications into MIT App Inventor 2 compliant project files
- **Implementation**: Server-side ZIP file creation with proper MIT AI2 directory structure
- **Features**: Extension support (.aix files), Google Custom Search API integration, feature detection from requirements

### Form System
- **Validation**: Zod schema validation on both client and server
- **File Handling**: Multi-part form data for extension uploads
- **Real-time Features**: Dynamic feature detection from user requirements text
- **Configuration**: Persistent storage of API keys and user preferences

### UI Components
- **Design System**: Consistent component library with proper accessibility
- **Responsive Design**: Mobile-first approach with adaptive layouts
- **Interactive Elements**: Progress tracking, status messaging, file upload with drag-and-drop

## Data Flow

1. **User Input**: User fills out project configuration form with API keys, project details, and requirements
2. **Client Validation**: React Hook Form with Zod schema validates input before submission
3. **File Upload**: Extension files (.aix) are uploaded via multipart form data
4. **Server Processing**: Express routes handle validation and delegate to AIA generation engine
5. **File Generation**: Server creates MIT AI2 compliant directory structure and ZIP file
6. **Response**: Generated AIA file is returned as downloadable blob to client

## External Dependencies

### Google APIs
- **Custom Search API**: For search functionality integration within generated apps
- **Configuration**: Requires API key and Custom Search Engine ID from Google Cloud Console

### MIT App Inventor Compliance
- **File Format**: Strict adherence to MIT AI2 project structure and manifest requirements
- **Extension Support**: Compatible with .aix extension files from MIT App Inventor ecosystem

### Development Tools
- **Replit Integration**: Custom plugins for development environment support
- **TypeScript**: Full type safety across frontend and backend
- **ESLint/Prettier**: Code quality and formatting standards

## Deployment Strategy

### Development Environment
- **Local Development**: Vite dev server with Express backend integration
- **Hot Reload**: Full-stack hot module replacement for rapid development
- **Port Management**: Automatic port conflict resolution and process termination

### Production Build
- **Frontend**: Static assets built with Vite and served from Express
- **Backend**: Bundled with esbuild for optimal Node.js performance
- **Database**: PostgreSQL with migration support via Drizzle Kit

### Environment Configuration
- **Database URL**: Required PostgreSQL connection string
- **API Keys**: Google Custom Search API credentials
- **Node Environment**: Development vs production mode switching

## Changelog
- July 03, 2025. Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.