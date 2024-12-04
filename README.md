# Hotel Management System

A comprehensive hotel management system with separate interfaces for guests and staff members.

## Project Structure

- `Guest Side/` - Guest portal interface
- `LoginPage/` - Staff login interface
- `ReceptionistAndStaff/` - Staff management interface
  - `backend/` - Node.js/Express backend
  - `frontend/` - Staff frontend interface

## Important Note for GitHub Pages Deployment

This is a full-stack application that requires:
- Node.js backend server
- MongoDB database
- Express.js for API routing

The static frontend is hosted on GitHub Pages, but for full functionality:
1. The backend needs to be hosted separately (e.g., Heroku, DigitalOcean, AWS)
2. The MongoDB database needs to be hosted (e.g., MongoDB Atlas)
3. Update the API endpoints in the frontend to point to your hosted backend

## Local Development Setup

1. Clone the repository
```bash
git clone <your-repo-url>
cd hotel-management-system
```

2. Install dependencies
```bash
# Install backend dependencies
cd ReceptionistAndStaff/backend
npm install

# Install frontend dependencies (if separate)
cd ../frontend
npm install
```

3. Set up MongoDB
- Install MongoDB locally or use MongoDB Atlas
- Update connection string in server.js

4. Start the development servers
```bash
# Start backend server
cd ReceptionistAndStaff/backend
npm start

# Start frontend (if separate)
cd ../frontend
npm start
```

## Deployment

### Frontend (GitHub Pages)
The static frontend is automatically deployed to GitHub Pages when pushing to the main branch.

### Backend
The backend needs to be deployed separately to a hosting service that supports Node.js applications.

## Environment Variables
Create a `.env` file in the backend directory with:
```
PORT=3000
MONGODB_URI=your_mongodb_connection_string
```

## Contributing
1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request
