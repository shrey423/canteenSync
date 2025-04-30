# CanteenSync: Real-Time Order Management System

A modern, real-time canteen management system built with the MERN stack (MongoDB, Express.js, React.js, Node.js) that streamlines the food ordering process for students and canteen managers.

## ✨ Features

### For Students
- 📱 Real-time order tracking
- 💳 Secure UPI payment integration
- 🔔 Real-time notifications for order status
- 📊 Order history and feedback system
- 🎯 Easy order cancellation within time limit
- 📱 Responsive design for all devices

### For Canteen Managers
- 📊 Real-time order management dashboard
- 🔄 Order status updates
- 💰 Payment confirmation system
- 📱 OTP-based order verification
- 📈 Analytics and reporting
- 🍽️ Menu management system

## 🛠️ Tech Stack

### Frontend
- React.js
- Tailwind CSS
- Framer Motion
- Socket.IO Client
- Axios
- React Router

### Backend
- Node.js
- Express.js
- MongoDB
- Socket.IO
- JWT Authentication

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone https://github.com/shrey423/canteen_management_final.git
cd canteen_management_final
```

2. Install dependencies for both frontend and backend
```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

3. Set up environment variables

Create a `.env` file in the backend directory:
```
PORT=5000
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
```

Create a `.env` file in the frontend directory:
```
VITE_API_URL=http://localhost:5000/api
VITE_WS_URL=ws://localhost:5000
```

4. Start the development servers

```bash
# Start backend server (from backend directory)
npm run dev

# Start frontend server (from frontend directory)
npm run dev
```

## 📱 Features in Detail

### Real-time Order Management
- Live order tracking
- Instant status updates
- Real-time notifications
- WebSocket integration for live updates

### Payment System
- UPI payment integration
- Secure payment confirmation
- Payment status tracking
- Transaction history

### Order Verification
- OTP-based order verification
- Secure order pickup process
- Real-time OTP generation
- Order completion tracking

### User Interface
- Modern, responsive design
- Intuitive navigation
- Real-time status indicators
- Animated transitions

## 🔒 Security Features

- JWT-based authentication
- Secure password hashing
- Protected API routes
- Input validation
- XSS protection
- CORS configuration

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Authors

- Your Name - Initial work

## 🙏 Acknowledgments

- Thanks to all contributors who have helped shape this project
- Special thanks to the open-source community for their amazing tools and libraries

## 📞 Support

For support, email your-email@example.com or create an issue in the repository.

---

Made with ❤️ by [Your Name] 