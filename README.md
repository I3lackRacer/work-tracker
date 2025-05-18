# Work Time Tracker

A modern web application for tracking work hours with a clean, user-friendly interface. Built with React, TypeScript, Spring Boot, and SQLite.

## Features

- 👤 User Authentication (Register/Login)
- ⏰ Clock In/Out functionality
- 📝 Add notes to work sessions
- 📊 View work history
- ⌚ Manual time entry support
- 🔒 Secure JWT authentication
- 💾 Persistent data storage

## Tech Stack

### Frontend
- React 18
- TypeScript
- Tailwind CSS
- Vite (Build tool)

### Backend
- Java 17
- Spring Boot 3
- Spring Security
- SQLite Database
- JWT Authentication

## Prerequisites

- Node.js (v16 or higher)
- Java Development Kit (JDK) 17 or higher
- Maven

## Project Structure

```
work-tracker/
├── app/                    # Frontend React application
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── context/      # React context providers
│   │   ├── pages/        # Page components
│   │   └── ...
│   ├── package.json
│   └── vite.config.ts
│
└── backend/               # Spring Boot backend
    ├── src/
    │   └── main/
    │       ├── java/     # Java source files
    │       └── resources/ # Application properties
    └── pom.xml
```

## Setup and Installation

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies and build:
   ```bash
   mvn clean install
   ```

3. Run the application:
   ```bash
   mvn spring-boot:run
   ```

The backend will start on `http://localhost:8080`

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd app
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file:
   ```
   VITE_API_URL=http://localhost:8080
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

The frontend will start on `http://localhost:5173`

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login user

### Work Entries
- `POST /api/v1/work/clock-in` - Clock in
- `POST /api/v1/work/clock-out` - Clock out
- `GET /api/v1/work/entries` - Get work entries
- `GET /api/v1/work/config` - Get work configuration
- `PUT /api/v1/work/config` - Update work configuration

## Environment Variables

### Backend
- `JWT_SECRET` - JWT signing key (default: defaultSecretKey12345678901234567890)
- `JWT_EXPIRATION` - JWT expiration in milliseconds (default: 86400000)

### Frontend
- `VITE_API_URL` - Backend API URL (default: http://localhost:8080)

## Security

- JWT-based authentication
- Password encryption using BCrypt
- CORS configuration for frontend
- Spring Security for endpoint protection

## Development

### Backend Development
- Uses Spring Boot DevTools for hot reloading
- SQLite database for easy development
- Lombok for reducing boilerplate code

### Frontend Development
- Vite for fast development server
- TypeScript for type safety
- Tailwind CSS for styling
- React Context for state management

## Building for Production

### Backend
```bash
cd backend
mvn clean package
```
The JAR file will be created in `target/` directory.

### Frontend
```bash
cd app
npm run build
```
The build files will be created in `dist/` directory.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT License 