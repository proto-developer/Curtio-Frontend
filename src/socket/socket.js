import { io } from "socket.io-client";
import env from "@/config/env";

/**
 * Singleton Socket.IO client factory.
 *
 * Connects to the same backend origin used by the REST API.
 * The JWT is sent in the handshake `auth` object so the server
 * can verify the user before accepting the connection.
 *
 * autoConnect is OFF — the SocketProvider controls when to connect.
 */

let socket = null;

/**
 * Returns the singleton socket instance, creating it lazily if needed.
 * Reads the JWT from localStorage on every call so reconnections
 * after a token refresh pick up the new token automatically.
 */
export const getSocket = () => {
  const token = localStorage.getItem("apiToken");

  if (!socket) {
    // Derive the Socket.IO server URL from the REST API base URL.
    // Socket.IO connects to the origin, not a sub-path.
    const apiBase = env.BACKEND_URL;
    const serverUrl = apiBase.replace(/\/api\/?$/, "");

    socket = io(serverUrl, {
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      timeout: 20000,
      auth: { token },
    });
  } else {
    // Update token for the next reconnection attempt
    socket.auth = { token };
  }

  return socket;
};

/**
 * Disconnect and destroy the singleton socket.
 * Call on logout to prevent stale connections.
 */
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
