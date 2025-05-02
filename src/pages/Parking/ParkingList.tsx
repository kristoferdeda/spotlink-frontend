import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";

const API_URL = import.meta.env.VITE_API_URL || "https://spotlink-backend.onrender.com/api";

interface ParkingSpot {
  _id: string;
  address: string;
  price: number;
  description?: string;
  availability: boolean;
}

const Parking = () => {
  const { token } = useAuth();
  const [spots, setSpots] = useState<ParkingSpot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingSpotId, setEditingSpotId] = useState<string | null>(null);
  const [editData, setEditData] = useState({ address: "", price: "" });

  useEffect(() => {
    const fetchSpots = async () => {
      try {
        const res = await axios.get(`${API_URL}/parking/user`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSpots(res.data.spots);
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to fetch spots.");
      } finally {
        setLoading(false);
      }
    };

    fetchSpots();
  }, [token]);

  const handleDeleteSpot = async (spotId: string) => {
    if (!confirm("Are you sure you want to delete this spot?")) return;
    try {
      await axios.delete(`${API_URL}/parking/${spotId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSpots((prev) => prev.filter((s: any) => s._id !== spotId));
      alert("🗑️ Spot deleted");
    } catch (err) {
      alert("❌ Failed to delete spot");
    }
  };

  const handleEditClick = (spot: ParkingSpot) => {
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
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setEditingSpotId(null);
      alert("✅ Spot updated");

      const res = await axios.get(`${API_URL}/parking/user`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSpots(res.data.spots);
    } catch (err) {
      alert("❌ Failed to update spot");
    }
  };

  if (loading) return <p className="text-white text-center mt-10">Loading...</p>;
  if (error) return <p className="text-red-500 text-center mt-10">{error}</p>;

  return (
    <div className="flex flex-col items-center justify-start min-h-screen bg-black text-white p-6">
      <div className="w-full max-w-2xl">
        <h1 className="text-3xl font-bold mb-6 text-center">Your Listed Parking Spots</h1>

        {spots.length === 0 ? (
          <p className="text-gray-400 text-center">You have no active listings.</p>
        ) : (
          <ul className="space-y-4">
            {spots.map((spot) => (
              <li key={spot._id} className="bg-gray-800 p-4 rounded shadow flex flex-col">
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
                  <>
                    <p><strong>📍 Address:</strong> {spot.address}</p>
                    <p><strong>💰 Price:</strong> {spot.price} PP</p>
                    {spot.description && <p><strong>ℹ️ Description:</strong> {spot.description}</p>}
                    <div className="flex gap-2 mt-2">
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
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default Parking;
