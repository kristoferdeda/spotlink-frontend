import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "https://spotlink-backend.onrender.com/api";

const Dashboard = () => {
  const auth = useContext(AuthContext);
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [spots, setSpots] = useState([]);
  const [editingSpotId, setEditingSpotId] = useState<string | null>(null);
  const [editData, setEditData] = useState({ address: "", price: "" });

  useEffect(() => {
    if (auth?.token && auth.user) {
      fetchData();
    }
  }, [auth]);

  const fetchData = async () => {
    if (!auth || !auth.token || !auth.user) return;
    try {
      const bookingsRes = await axios.get(`${API_URL}/bookings/user`, {
        headers: { Authorization: `Bearer ${auth.token}` },
      });

      const spotsRes = await axios.get(`${API_URL}/parking/user`, {
        headers: { Authorization: `Bearer ${auth.token}` },
      });

      setBookings(bookingsRes.data.bookings);
      setSpots(spotsRes.data.spots);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    try {
      await axios.delete(`${API_URL}/bookings/${bookingId}`, {
        headers: { Authorization: `Bearer ${auth?.token}` },
      });
      setBookings((prev) => prev.filter((b: any) => b._id !== bookingId));
      alert("✅ Booking cancelled");
    } catch (err) {
      alert("❌ Failed to cancel booking");
    }
  };

  const handleDeleteSpot = async (spotId: string) => {
    const confirmDelete = confirm("Are you sure you want to delete this spot?");
    if (!confirmDelete) return;

    try {
      await axios.delete(`${API_URL}/parking/${spotId}`, {
        headers: { Authorization: `Bearer ${auth?.token}` },
      });
      setSpots((prev) => prev.filter((s: any) => s._id !== spotId));
      alert("🗑️ Spot deleted");
    } catch (err) {
      alert("❌ Failed to delete spot");
    }
  };

  const handleEditClick = (spot: any) => {
    setEditingSpotId(spot._id);
    setEditData({ address: spot.address, price: String(spot.price) });
  };

  const handleSaveEdit = async (spotId: string) => {
    try {
      await axios.put(
        `${API_URL}/parking/${spotId}`,
        {
          address: editData.address,
          price: Number(editData.price),
        },
        {
          headers: { Authorization: `Bearer ${auth?.token}` },
        }
      );
      setEditingSpotId(null);
      alert("✅ Spot updated");
      fetchData();
    } catch (err) {
      alert("❌ Failed to update spot");
    }
  };

  if (!auth || auth.loading) {
    return <div className="text-white text-center mt-10">Loading...</div>;
  }

  if (!auth.user) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-black text-white">
        <h1 className="text-2xl mb-4">🔒 You must be logged in to view the dashboard.</h1>
        <div className="flex gap-4">
          <button
            onClick={() => navigate("/login")}
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded"
          >
            Login
          </button>
          <button
            onClick={() => navigate("/register")}
            className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded"
          >
            Register
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-black text-white px-4 py-6 flex flex-col items-center">
      <div className="w-full max-w-2xl">
        <h1 className="text-3xl font-bold mb-4 text-center">DASHBOARD</h1>
        <p className="text-xl text-center">Welcome, {auth.user.name}</p>
        <p className="text-gray-400 text-center mb-6">Park Points: {auth.user.parkPoints}</p>

        <h2 className="text-2xl mt-8 text-center">Your Listed Spots</h2>
        {spots.length > 0 ? (
          <ul className="mt-4 w-full max-w-lg mx-auto">
            {spots.map((spot: any) => (
              <li key={spot._id} className="border p-3 mb-2 bg-gray-800 rounded flex flex-col">
                {editingSpotId === spot._id ? (
                  <>
                    <input
                      className="bg-gray-700 text-white p-2 rounded mb-2"
                      value={editData.address}
                      onChange={(e) => setEditData({ ...editData, address: e.target.value })}
                    />
                    <input
                      className="bg-gray-700 text-white p-2 rounded mb-2"
                      type="number"
                      value={editData.price}
                      onChange={(e) => setEditData({ ...editData, price: e.target.value })}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSaveEdit(spot._id)}
                        className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingSpotId(null)}
                        className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between items-center">
                    <span>{spot.address} - {spot.price} Park Points</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditClick(spot)}
                        className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteSpot(spot._id)}
                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-400 text-center">No spots listed.</p>
        )}

        <h2 className="text-2xl mt-10 text-center">Your Bookings</h2>
        {bookings.length > 0 ? (
          <ul className="mt-4 w-full max-w-lg mx-auto">
            {bookings.map((booking: any) => (
              <li
                key={booking._id}
                className="border p-3 mb-2 bg-gray-800 rounded flex flex-col md:flex-row justify-between items-center gap-2"
              >
                <span>Booking for {booking.parkingSpot?.address || "Unknown Location"}</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => navigate(`/chat/${booking.parkingSpot?.owner}`)}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
                  >
                    Chat
                  </button>
                  <button
                    onClick={() => handleCancelBooking(booking._id)}
                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-400 text-center">No active bookings.</p>
        )}

        <div className="text-center mt-4">
          <Link to="/booking-history" className="text-blue-400 hover:underline text-sm">
            View Booking History →
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
