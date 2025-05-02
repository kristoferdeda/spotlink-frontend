# 🚗 SpotLink

**SpotLink** is a full-stack web application where users can **list**, **search**, and **book** parking spots using a points-based system called **Park Points**.

## 📌 Features

- 🔐 User authentication (register, login, logout)
- ✅ JWT-based token auth (with protected routes)
- 📍 Google Maps integration
- 📦 Users can:
  - List a parking spot on the map
  - Book nearby available spots
  - Cancel bookings (with point refunds)
  - Edit/delete listed spots
  - View booking history
  - Edit profile or delete account
- 📧 Email verification & password reset (via Gmail + Nodemailer)

## 🛠 Tech Stack

### Frontend
- React (Vite + TypeScript)
- Tailwind CSS
- React Router
- @react-google-maps/api
- Axios

### Backend
- Node.js + Express
- MongoDB + Mongoose
- JWT Authentication
- Nodemailer for email
- Bcrypt for password hashing