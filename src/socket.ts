import { io } from "socket.io-client";

const socket = io("https://spotlink-backend.onrender.com/", {
  withCredentials: true,
});

export default socket;
