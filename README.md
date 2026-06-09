# Shifra AI – Voice Assistant Platform

Shifra AI is a full-stack AI Voice Assistant application built using React, Node.js, Express, MongoDB, and Gemini AI integration. The platform allows users to interact with an AI-powered assistant through voice and text while supporting authentication, billing integration, and modern UI features.

---

# Features

* AI Voice Assistant Integration
* User Authentication & Authorization
* JWT-based Secure Login System
* MongoDB Database Integration
* Razorpay Payment Integration
* REST API Architecture
* Responsive Frontend UI
* React Router Navigation
* Voice Interaction Support
* Firebase Integration
* Toast Notifications
* Protected Routes
* Scalable Backend Structure

---

# Tech Stack

## Frontend

* React.js
* React Router DOM
* Tailwind CSS
* Axios
* Firebase
* React Hot Toast
* React Icons

## Backend

* Node.js
* Express.js
* MongoDB
* Mongoose
* JWT Authentication
* Cookie Parser
* CORS
* Razorpay API
* Gemini AI API

---

# Project Structure

```bash
Shifra_AI/
│
├── Backend/
│   ├── Configs/
│   ├── Controllers/
│   ├── Middleware/
│   ├── Models/
│   ├── Routes/
│   ├── index.js
│   └── package.json
│
├── Frontend/
│   └── VoiceAI/
│       ├── src/
│       ├── public/
│       ├── package.json
│       └── vite.config.js
│
└── README.md
```

---

# Installation & Setup

## 1. Clone Repository

```bash
git clone https://github.com/your-username/Shifra_AI.git
cd Shifra_AI
```

---

# Backend Setup

## Navigate to Backend Folder

```bash
cd Backend
```

## Install Dependencies

```bash
npm install
```

## Create .env File

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
GEMINI_API_KEY=your_gemini_api_key
RAZORPAY_KEY_ID=your_razorpay_key
RAZORPAY_SECRET=your_razorpay_secret
```

## Start Backend Server

```bash
npm run dev
```

Backend server will run on:

```bash
http://localhost:5000
```

---

# Frontend Setup

## Navigate to Frontend Folder

```bash
cd Frontend/VoiceAI
```

## Install Dependencies

```bash
npm install
```

## Create .env File

```env
VITE_API_URL=http://localhost:5000
```

## Start Frontend

```bash
npm run dev
```

Frontend will run on:

```bash
http://localhost:5173
```

---

# API Endpoints

## Authentication Routes

```bash
/api/auth
```

## User Routes

```bash
/api/user
```

## Assistant Routes

```bash
/api/assistant
```

## Billing Routes

```bash
/api/billing
```

---

# Authentication Flow

1. User registers or logs in.
2. JWT token is generated.
3. Token is stored securely.
4. Protected routes verify user authentication.
5. Authenticated users can access AI assistant features.

---

# Payment Integration

The project uses Razorpay for handling payments and billing functionality.

Features:

* Secure Payment Gateway
* Subscription/Billing Support
* Payment Verification
* API-based Transaction Handling

---

# AI Integration

Shifra AI integrates Gemini AI APIs to provide:

* AI-generated responses
* Conversational interactions
* Voice assistant capabilities
* Smart assistant workflows

---

# Security Features

* JWT Authentication
* Protected Middleware
* Environment Variable Protection
* CORS Configuration
* Secure API Handling

---

# Future Improvements

* Real-time Speech Recognition
* Multi-language Support
* AI Chat History
* Dark Mode
* Voice Cloning
* AI Memory System
* Deployment using AWS or Docker

---

# Deployment
## Database Hosting

* MongoDB Atlas

---

# Available Scripts

## Backend

```bash
npm run dev
npm start
```

## Frontend

```bash
npm run dev
npm run build
npm run preview
```

---

# Learning Outcomes

This project demonstrates:

* Full-Stack Web Development
* REST API Development
* Authentication Systems
* AI API Integration
* Payment Gateway Integration
* MERN Stack Architecture
* Modern React Development

---

# Author

## Amit Prajapati

* MCA Student
* Full-Stack Developer
* Cloud & AI Enthusiast

---

# License

This project is developed for educational and learning purposes.

---






---

# Contributing

Contributions are welcome.

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to your branch
5. Create a Pull Request

---

# Support

If you found this project useful, give it a ⭐ on GitHub.
