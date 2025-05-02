# 🚗 SpotLink

**SpotLink** is a full-stack web application where users can list, search, and book parking spots using a points-based system called **Park Points**. It includes real-time messaging, Google Maps integration, and full account management features.

---

## 📌 Features

### 👤 Authentication & Account Management
- 🔐 User registration, login, logout
- ✅ JWT-based authentication (protected routes)
- 📧 Email verification via Gmail (Nodemailer)
- ❌ Delete account functionality
- ✏️ Edit profile

### 📍 Parking Spot Management
- 📦 Users can:
  - List a parking spot on the map (manual or by current location)
  - Edit and delete their listed spots
  - Search locations and pan the map
- 📡 Advanced Google Maps integration with:
  - Color-coded pins (your spots, others’ spots, current location)
  - InfoWindows for spot actions (book, delete)
  - Form-based listing from map or button

### 📅 Booking System
- ✅ Book available spots using Park Points
- ❌ Cancel bookings with automatic point refund
- 📖 View booking history (past and active)

### 💬 Real-Time Chat
- 📬 One-on-one messaging between users
- 🔴 Unread message indicators (chat icon, sidebar, list)
- 🧹 Clear or delete conversations locally

### 📍 Nearby Search
- 🔎 View nearby spots within 1, 5, 10, or 20 miles
- 📍 Radius dropdown in the modal
- 🧭 Live user geolocation on map load

---

## 🛠 Tech Stack

### Frontend
- ⚛️ React (Vite + TypeScript)
- 🎨 Tailwind CSS
- 🔀 React Router
- 🗺️ @react-google-maps/api
- 📡 Socket.io-client
- 🔌 Axios
