import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const BookingHistory = () => {
  const { token } = useAuth();
  const [bookings, setBookings] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const res = await axios.get(`${API_URL}/bookings/history`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setBookings(res.data.bookings);
      } catch (err: any) {
        console.error("❌ Failed to fetch booking history:", err);
        setError("Failed to load booking history.");
      }
    };

    fetchBookings();
  }, [token]);

  return (
    <div className="min-h-screen bg-black text-white px-4 py-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-center">Booking History</h1>

        {error && <p className="text-red-500 text-center">{error}</p>}

        {bookings.length === 0 ? (
          <p className="text-gray-400 text-center">No bookings yet.</p>
        ) : (
          <ul className="space-y-4">
            {bookings.map((booking) => (
              <li key={booking._id} className="bg-gray-800 p-4 rounded">
                <p><strong>📍 Address:</strong> {booking.parkingSpot?.address || "Unknown"}</p>
                <p><strong>💰 Price:</strong> {booking.parkingSpot?.price || "N/A"} Points</p>
                <p><strong>🕒 Date:</strong> {new Date(booking.bookedAt).toLocaleString()}</p>
                <p><strong>📄 Status:</strong> {booking.status}</p>
                {booking.parkingSpotSnapshot?.owner && (
                  <p><strong>🧍 Owner:</strong> {booking.parkingSpotSnapshot.owner.name} ({booking.parkingSpotSnapshot.owner.email})</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default BookingHistory;
