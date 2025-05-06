import { useEffect, useRef, useState } from "react";
import { GoogleMap, InfoWindow, useLoadScript } from "@react-google-maps/api";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "https://spotlink-backend.onrender.com/api";
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY!;
const libraries: ("marker")[] = ["marker"];
const defaultCenter = { lat: 40.7128, lng: -74.006 };

interface ParkingSpot {
  _id: string;
  owner: string;
  location: { coordinates: [number, number] };
  price: number;
  address: string;
  description: string;
  availability: boolean;
}

const Map = () => {
  const { isLoaded } = useLoadScript({ googleMapsApiKey: GOOGLE_MAPS_API_KEY, libraries });
  const mapRef = useRef<google.maps.Map | null>(null);
  const [AdvancedMarkerElement, setAdvancedMarkerElement] = useState<any>(null);

  const [spots, setSpots] = useState<ParkingSpot[]>([]);
  const [currentLocation, setCurrentLocation] = useState(defaultCenter);
  const [selectedSpot, setSelectedSpot] = useState<ParkingSpot | null>(null);

  const [mapClickLocation, setMapClickLocation] = useState<google.maps.LatLngLiteral | null>(null);
  const [buttonClickLocation, setButtonClickLocation] = useState<google.maps.LatLngLiteral | null>(null);
  const [formOpenType, setFormOpenType] = useState<"map" | "button" | null>(null);

  const [formData, setFormData] = useState({ address: "", description: "", price: "" });
  const [searchInput, setSearchInput] = useState("");

  const [nearbyOpen, setNearbyOpen] = useState(false);
  const [nearbyRadius, setNearbyRadius] = useState(1609);
  const [nearbySpots, setNearbySpots] = useState<ParkingSpot[]>([]);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setCurrentLocation(loc);
        fetchNearbySpots(loc.lat, loc.lng, 20000);
      },
      (error) => {
        console.error("❌ Geolocation failed:", error);
        fetchNearbySpots(defaultCenter.lat, defaultCenter.lng, 20000);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, []);

  useEffect(() => {
    if (!mapRef.current || !AdvancedMarkerElement || !currentLocation) return;

    const { lat, lng } = currentLocation;

    const marker = new AdvancedMarkerElement({
      map: mapRef.current,
      position: { lat, lng },
      title: "You are here",
      content: new google.maps.marker.PinElement({
        background: "#4285F4",
        glyphColor: "#fff",
        borderColor: "#2a56c6",
      }).element,
    });

    return () => {
      marker.map = null;
    };
  }, [currentLocation, AdvancedMarkerElement]);
  
  const fetchNearbySpots = async (lat: number, lng: number, radius: number = nearbyRadius) => {
    try {
      const res = await axios.get<{ spots: ParkingSpot[] }>(
        `${API_URL}/parking/nearby?lat=${lat}&lng=${lng}&radius=${radius}`
      );
      const available = res.data.spots.filter((s) => s.availability);
      setSpots(available);
      setNearbySpots(available);
    } catch (err) {
      console.error("Error fetching nearby spots:", err);
    }
  };

  const handleBook = async (spotId?: string) => {
    const id = spotId || selectedSpot?._id;
    if (!id) return;
    const token = localStorage.getItem("token");
    if (!token) return alert("❌ You must be logged in to book.");
    try {
      await axios.post(`${API_URL}/bookings`, { parkingSpotId: id }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("✅ Booking successful!");
      setSelectedSpot(null);
      fetchNearbySpots(currentLocation.lat, currentLocation.lng, nearbyRadius);
    } catch (err: any) {
      alert(err.response?.data?.message || "❌ Booking failed.");
    }
  };

  const geocodeAddress = async (address: string): Promise<google.maps.LatLngLiteral | null> => {
    try {
      const geocoder = new google.maps.Geocoder();
      const results = await new Promise<google.maps.GeocoderResult[]>((resolve, reject) => {
        geocoder.geocode({ address }, (res, status) => {
          if (status === "OK" && res) resolve(res);
          else reject(`Geocoding failed: ${status}`);
        });
      });
      const { lat, lng } = results[0].geometry.location;
      return { lat: lat(), lng: lng() };
    } catch (err) {
      alert("❌ Could not find that address.");
      return null;
    }
  };

  const handleSearch = async () => {
    const location = await geocodeAddress(searchInput);
    if (location && mapRef.current) {
      mapRef.current.panTo(location);
    }
  };

  const handleNewSpotSubmit = async () => {
    const token = localStorage.getItem("token");
    if (!token) return alert("❌ You must be logged in to list.");

    let finalLocation: google.maps.LatLngLiteral | null = null;
    if (formOpenType === "map" && mapClickLocation) {
      finalLocation = mapClickLocation;
    } else if (formOpenType === "button") {
      if (formData.address.toLowerCase() === "my current location") {
        finalLocation = currentLocation;
      } else {
        finalLocation = await geocodeAddress(formData.address);
        if (!finalLocation) return;
      }
    }

    if (!finalLocation) return alert("❌ No location selected.");

    try {
      await axios.post(`${API_URL}/parking`, {
        location: {
          type: "Point",
          coordinates: [finalLocation.lng, finalLocation.lat],
        },
        address: formData.address || "Not specified",
        description: formData.description,
        price: Number(formData.price),
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      alert("✅ Spot listed!");
      setMapClickLocation(null);
      setButtonClickLocation(null);
      setFormOpenType(null);
      setFormData({ address: "", description: "", price: "" });
      fetchNearbySpots(currentLocation.lat, currentLocation.lng);
    } catch (err: any) {
      alert(err.response?.data?.message || "❌ Listing failed.");
    }
  };

  const handleMapLoad = async (map: google.maps.Map) => {
    mapRef.current = map;
    const { AdvancedMarkerElement } = await google.maps.importLibrary("marker") as google.maps.MarkerLibrary;
    setAdvancedMarkerElement(() => AdvancedMarkerElement);
  };

  const userId = localStorage.getItem("userId");

  useEffect(() => {
    if (!mapRef.current || !AdvancedMarkerElement) return;
    spots.forEach((spot) => {
      const isMySpot = String(spot.owner) === String(userId);
      const marker = new AdvancedMarkerElement({
        map: mapRef.current!,
        position: {
          lat: spot.location.coordinates[1],
          lng: spot.location.coordinates[0],
        },
        title: `Parking Spot - ${spot.price} PP`,
        content: new google.maps.marker.PinElement({
          background: isMySpot ? "#D32F2F" : "#388E3C",
          glyphColor: "#fff",
        }).element,
      });
  
      marker.addListener("gmp-click", () => {
        setSelectedSpot(spot);
      });
    });
  }, [spots, AdvancedMarkerElement]);
  

  if (!isLoaded) return <p>Loading Map...</p>;

  return (
    <div className="fixed top-[60px] bottom-0 w-full bg-black z-0">
      <GoogleMap
        mapContainerStyle={{ width: "100%", height: "100%" }}
        center={currentLocation}
        zoom={14}
        onClick={(e) => {
          setMapClickLocation({ lat: e.latLng?.lat() || 0, lng: e.latLng?.lng() || 0 });
          setFormOpenType("map");
        }}
        onLoad={handleMapLoad}
        options={{ mapId: "192892a3c2c4208d", disableDefaultUI: true, clickableIcons: false, gestureHandling: "greedy", zoomControl: true }}
      >
        {selectedSpot && (
          <InfoWindow
            position={{
              lat: selectedSpot.location.coordinates[1],
              lng: selectedSpot.location.coordinates[0],
            }}
            onCloseClick={() => setSelectedSpot(null)}
          >
            <div style={{ background: "#333", color: "#fff", padding: 10, borderRadius: 8 }}>
              <h3>Parking Spot</h3>
              <p><strong>📍 Address:</strong> {selectedSpot.address}</p>
              <p><strong>💰 Price:</strong> {selectedSpot.price} PP</p>
              <p><strong>ℹ️ Description:</strong> {selectedSpot.description}</p>

              {selectedSpot && String(selectedSpot.owner) === String(userId) ? (
                <>
                  <button
                    disabled
                    className="bg-gray-400 text-white px-3 py-1 rounded cursor-not-allowed"
                  >
                    Your Spot
                  </button>
                  <button
                    onClick={async () => {
                      const confirmDelete = confirm("Are you sure you want to delete this spot?");
                      if (!confirmDelete) return;

                      try {
                        const token = localStorage.getItem("token");
                          await axios({
                            method: "delete",
                            url: `${API_URL}/parking/${selectedSpot._id}`,
                            headers: {
                              Authorization: `${token}`},
                          });

                        alert("🗑️ Spot deleted!");
                        setSelectedSpot(null);
                        fetchNearbySpots(currentLocation.lat, currentLocation.lng, nearbyRadius);
                      } catch (err) {
                        alert("❌ Failed to delete spot.");
                        console.error(err);
                      }
                    }}
                    className="ml-2 bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded"
                  >
                    Delete
                  </button>
                </>
              ) : (
                <button
                  onClick={() => handleBook()}
                  className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded"
                >
                  Book Now
                </button>
              )}
              </div>
            </InfoWindow>
          )}

          {(formOpenType === "map" && mapClickLocation) && (
            <InfoWindow position={mapClickLocation} onCloseClick={() => {
              setMapClickLocation(null);
              setFormOpenType(null);
            }}>
              <div style={{ background: "#333", color: "#fff", padding: 12, borderRadius: 10, width: "280px" }}>
                <h3>📝 List a Spot</h3>
                <input value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Description" style={{ width: "100%", marginBottom: 8, padding: 6 }} />
                <input type="number" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} placeholder="Price" style={{ width: "100%", marginBottom: 12, padding: 6 }} />
                <button onClick={handleNewSpotSubmit} style={{ width: "100%", padding: "8px", backgroundColor: "#4CAF50", color: "#fff", fontWeight: "bold", border: "none", borderRadius: "6px" }}>
                  Submit
                </button>
              </div>
            </InfoWindow>
          )}

          {(formOpenType === "button" && buttonClickLocation) && (
            <InfoWindow position={buttonClickLocation} onCloseClick={() => {
              setButtonClickLocation(null);
              setFormOpenType(null);
            }}>
              <div style={{ background: "#333", color: "#fff", padding: 12, borderRadius: 10, width: "280px" }}>
                <h3>📝 List a New Spot</h3>
                <input value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} placeholder="Enter address" style={{ width: "100%", marginBottom: 8, padding: 6 }} />
                <button onClick={() => {
                  setFormData({ ...formData, address: "My Current Location" });
                  setButtonClickLocation(currentLocation);
                }} style={{ padding: "6px", marginBottom: "10px", backgroundColor: "#555", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer" }}>Use My Location</button>
                <input value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Description" style={{ width: "100%", marginBottom: 8, padding: 6 }} />
                <input type="number" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} placeholder="Price" style={{ width: "100%", marginBottom: 12, padding: 6 }} />
                <button onClick={handleNewSpotSubmit} style={{ width: "100%", padding: "8px", backgroundColor: "#4CAF50", color: "#fff", fontWeight: "bold", border: "none", borderRadius: "6px" }}>
                  Submit
                </button>
              </div>
            </InfoWindow>
          )}
      </GoogleMap>

      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-50 flex flex-col md:flex-row items-center justify-center gap-4 w-[70%] md:w-auto">
        <button
          onClick={() => {
            setFormOpenType("button");
            setButtonClickLocation(currentLocation);
          }}
          className="bg-black font-bold hover:bg-gray-700 hover:scale-105 transition-transform text-white px-6 py-2 rounded-full whitespace-nowrap text-sm w-full md:w-auto shadow-lg order-2 md:order-1"
        >
          LIST A SPOT
        </button>

        <div className="flex flex-row items-center gap-2 bg-white px-3 py-2 rounded-full w-full md:w-auto shadow-lg order-1 md:order-2">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Search location"
            className="p-2 text-black rounded-full text-sm outline-none w-full md:w-[200px]"
          />
          <button
            onClick={handleSearch}
            className="bg-black font-bold hover:bg-gray-700 hover:scale-105 transition-transform text-white px-4 py-2 rounded-full whitespace-nowrap text-sm"
          >
            GO
          </button>
        </div>

        <button
          onClick={() => {
            setNearbyOpen(true);
            fetchNearbySpots(currentLocation.lat, currentLocation.lng, nearbyRadius);
          }}
          className="bg-black font-bold hover:bg-gray-700 hover:scale-105 transition-transform text-white px-6 py-2 rounded-full whitespace-nowrap text-sm w-full md:w-auto shadow-lg order-3"
        >
          NEARBY SPOTS
        </button>

      </div>

      {nearbyOpen && (
        <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 z-50 bg-white p-4 rounded shadow max-h-[300px] overflow-y-auto w-[300px] text-black">
          <div className="flex justify-between items-center mb-2">
            <strong>Nearby Spots</strong>
            <button className="text-red font-bold" onClick={() => setNearbyOpen(false)}>✖</button>
          </div>
          <label className="text-xs">Radius:</label>
          <select value={nearbyRadius} onChange={(e) => {
            const r = parseInt(e.target.value);
            setNearbyRadius(r);
            fetchNearbySpots(currentLocation.lat, currentLocation.lng, r);
          }} className="w-full border mb-2 px-2 py-1 rounded text-sm">
            <option value={1609}>1 mile</option>
            <option value={8047}>5 miles</option>
            <option value={16093}>10 miles</option>
            <option value={32187}>20 miles</option>
          </select>
          {nearbySpots.length === 0 ? (
            <p>No available spots nearby.</p>
          ) : (
            nearbySpots.map((spot) => (
              <div key={spot._id} className="mb-3 border-b pb-2">
                <p><strong>📍 {spot.address}</strong></p>
                <p>💰 {spot.price} Points</p>
                <button onClick={() => handleBook(spot._id)} className="mt-1 px-2 py-1 bg-green-600 text-white rounded text-xs">
                  Book
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default Map;
