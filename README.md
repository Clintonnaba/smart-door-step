# Smart Door Step - Home Service Booking Platform

A full-stack web application for booking home services, connecting customers with skilled technicians.

## 🏗️ Project Structure

```
smart-door-step/
├── backend/                 # Node.js/Express API server
│   ├── config/             # Database and app configuration
│   ├── controllers/        # Business logic handlers
│   ├── middleware/         # Authentication and validation
│   ├── migrations/         # Database schema migrations
│   ├── models/            # Sequelize ORM models
│   ├── routes/            # API route definitions
│   ├── seeders/           # Database seeding scripts
│   └── index.js           # Main server entry point
├── frontend/              # React.js client application
│   ├── public/            # Static assets
│   ├── src/               # React source code
│   │   ├── api/           # API integration
│   │   ├── components/    # Reusable UI components
│   │   └── pages/         # Page components
│   └── package.json       # Frontend dependencies
├── .gitignore             # Git ignore patterns
└── README.md              # Project documentation
```

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- SQLite (for development)

### Backend Setup
```bash
cd backend
npm install
npm start
```

### Frontend Setup
```bash
cd frontend
npm install
npm start
```

## 🔧 Environment Configuration

Create a `.env` file in the root directory:
```env
PORT=5001
DB_PATH=./backend/config/db.sqlite3
JWT_SECRET=your_jwt_secret_here
```

## 📋 Features

- **User Authentication**: Register, login, and role-based access
- **Service Booking**: Browse and book home services
- **Technician Management**: Technician profiles and availability
- **Payment Integration**: Secure payment processing
- **Rating System**: Customer reviews and ratings
- **Admin Dashboard**: Comprehensive admin panel

## 🛠️ Tech Stack

### Backend
- **Node.js** with Express.js
- **Sequelize** ORM with SQLite
- **JWT** for authentication
- **Socket.io** for real-time features

### Frontend
- **React.js** with functional components
- **Tailwind CSS** for styling
- **Axios** for API communication
- **React Router** for navigation

## 📁 Key Directories

### Backend
- `controllers/`: Business logic and request handlers
- `models/`: Database models and relationships
- `routes/`: API endpoint definitions
- `middleware/`: Authentication and validation middleware
- `migrations/`: Database schema versioning
- `seeders/`: Initial data population

### Frontend
- `components/`: Reusable UI components
- `pages/`: Main application pages
- `api/`: API integration and HTTP client setup

## 🔒 Security

- JWT-based authentication
- Role-based access control
- Input validation and sanitization
- CORS configuration
- Environment variable protection

## 📝 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

---

**Smart Door Step** - Making home services accessible and reliable.
