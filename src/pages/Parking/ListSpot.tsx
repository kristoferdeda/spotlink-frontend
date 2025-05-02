import { useState, useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "https://spotlink-backend.onrender.com/api";

const ListSpot = () => {
  const auth = useContext(AuthContext);
  const navigate = useNavigate();
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post(
        `${API_URL}/parking`,
        { address, description, price },
        { headers: { Authorization: `Bearer ${auth?.token}` } }
      );
      navigate("/dashboard");
    } catch (err: any) {
      setError("❌ Failed to list parking spot.");
      console.error("Error listing parking spot:", err);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white">
      <h1 className="text-2xl mb-4">List a Parking Spot</h1>
      {error && <p className="text-red-500">{error}</p>}
      <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
        <input
          type="text"
          placeholder="Address"
          className="p-2 bg-gray-800 border border-gray-600 rounded"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />
        <input
          type="text"
          placeholder="Description"
          className="p-2 bg-gray-800 border border-gray-600 rounded"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <input
          type="number"
          placeholder="Price (Park Points)"
          className="p-2 bg-gray-800 border border-gray-600 rounded"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />
        <button type="submit" className="p-2 bg-blue-500 rounded">List Spot</button>
      </form>
    </div>
  );
};

export default ListSpot;
