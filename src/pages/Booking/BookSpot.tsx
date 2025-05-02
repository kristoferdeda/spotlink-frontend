import { useState, useEffect, useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const BookSpot = () => {
  const auth = useContext(AuthContext);
  const navigate = useNavigate();
  const [spots, setSpots] = useState([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSpots = async () => {
      try {
        const res = await axios.get(`${API_URL}/parking`);
        setSpots(res.data.spots);
      } catch (err: any) {
        setError("❌ Failed to load parking spots.");
        console.error("Error fetching spots:", err);
      }
    };
    fetchSpots();
  }, []);

  const handleBooking = async (spotId: string) => {
    try {
      await axios.post(
        `${API_URL}/bookings`,
        { parkingSpotId: spotId },
        { headers: { Authorization: `Bearer ${auth?.token}` } }
      );
      navigate("/dashboard");
    } catch (err: any) {
      setError("❌ Failed to book parking spot.");
      console.error("Error booking spot:", err);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-6">
      <h1 className="text-2xl mb-4">Book a Parking Spot</h1>
      {error && <p className="text-red-500">{error}</p>}
      
      {spots.length > 0 ? (
        <ul className="mt-4">
          {spots.map((spot: any) => (
            <li key={spot._id} className="border p-3 mb-2 bg-gray-800 rounded flex justify-between">
              <div>
                {spot.address} - {spot.price} Park Points
              </div>
              <button onClick={() => handleBooking(spot._id)} className="p-2 bg-green-500 rounded">Book</button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-400">No available parking spots.</p>
      )}
    </div>
  );
};

export default BookSpot;
