import { io } from "socket.io-client";

const socket = io('https://spotlink-backend.onrender.com', {
  transports: ['websocket'],
  secure: true
});

export default socket;
