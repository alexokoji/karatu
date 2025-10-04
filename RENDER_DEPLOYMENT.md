# Render Deployment Guide for KARATU

## Backend Deployment (API Server)

### 1. Create a new Web Service on Render
- **Build Command**: `cd server && npm install && npx prisma generate && npx prisma db push`
- **Start Command**: `cd server && npm start`
- **Node Version**: 18.x or higher

### 2. Environment Variables for Backend
Set these in your Render dashboard:

```
DATABASE_URL=postgresql://username:password@hostname:port/database
JWT_SECRET=your-super-secret-jwt-key-here
ALLOWED_ORIGIN=https://karatu.onrender.com,http://localhost:3000,http://localhost:5173
NODE_ENV=production
```

### 3. Database Setup
- Create a PostgreSQL database on Render
- Copy the database URL to `DATABASE_URL` environment variable
- The build command will automatically run Prisma migrations

## Frontend Deployment (React App)

### 1. Create a new Static Site on Render
- **Build Command**: `npm install && npm run build`
- **Publish Directory**: `dist`

### 2. Environment Variables for Frontend
Set these in your Render dashboard:

```
VITE_API_URL=https://your-backend-service.onrender.com
VITE_WS_URL=https://your-backend-service.onrender.com
```

## Important Notes

### CORS Configuration
The backend is configured to allow requests from:
- `https://karatu.onrender.com` (production frontend)
- `http://localhost:3000` (local development)
- `http://localhost:5173` (local Vite dev server)
- `http://localhost:5174` (alternative Vite port)

### Database Connection
- The app uses Prisma with PostgreSQL
- Make sure to set `DATABASE_URL` with your PostgreSQL connection string
- Prisma will automatically create tables on first deployment

### WebSocket Support
- The backend includes Socket.IO for video calling
- Make sure your Render plan supports WebSockets
- The frontend will connect to the same URL for both HTTP and WebSocket

## Troubleshooting

### Common Issues:

1. **CORS Errors**: Make sure `ALLOWED_ORIGIN` includes your frontend URL
2. **Database Connection**: Verify `DATABASE_URL` is correct and database is accessible
3. **Build Failures**: Check Node.js version (18.x or higher required)
4. **WebSocket Issues**: Ensure your Render plan supports WebSockets

### Testing the Deployment:

1. **Backend Health Check**: Visit `https://your-backend.onrender.com/auth/me` (should return 401 without auth)
2. **Frontend**: Visit your frontend URL and try to register/login
3. **Video Calls**: Test the video calling functionality between two users

## Environment Variables Summary

### Backend (Web Service):
```
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret-key
ALLOWED_ORIGIN=https://karatu.onrender.com
NODE_ENV=production
```

### Frontend (Static Site):
```
VITE_API_URL=https://your-backend.onrender.com
VITE_WS_URL=https://your-backend.onrender.com
```

## Deployment Steps:

1. **Deploy Backend First**:
   - Create Web Service
   - Set environment variables
   - Deploy and test

2. **Deploy Frontend**:
   - Create Static Site
   - Set environment variables
   - Deploy and test

3. **Update CORS**:
   - Add your frontend URL to `ALLOWED_ORIGIN` in backend
   - Redeploy backend

4. **Test Everything**:
   - Registration/Login
   - Video calls
   - All features
