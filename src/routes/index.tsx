import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "../pages/Auth/Login";
import Register from "../pages/Auth/Register";
import Dashboard from "../pages/Dashboard/Dashboard";
import ParkingList from "../pages/Parking/ParkingList";
import BookingHistory from "../pages/Booking/BookingHistory";
import Home from "../pages/Home/Home";
import Layout from "../components/Layout";
import EditProfile from "../pages/User/EditProfile";
import DeleteAccount from "../pages/User/DeleteAccount";
import ChatPage from "../pages/Chat/ChatPage";
import ChatsPage from "../pages/Chat/ChatsPage";

const AppRoutes = () => {
  return (
    <Router>
      <Routes>

        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/parking" element={<ParkingList />} />
          <Route path="/booking-history" element={<BookingHistory />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/edit-profile" element={<EditProfile />} />
          <Route path="/delete-account" element={<DeleteAccount />} />
          <Route path="/chat/:chatWithUserId" element={<ChatPage />} />
          <Route path="/chats" element={<ChatsPage />} />
        </Route>
        <Route path="*" element={<h1>404 - Page Not Found</h1>} />
      </Routes>
    </Router>
  );
};

export default AppRoutes;
