"use client";

import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useAuthStore } from "../../store/authStore";

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
});

export const useSocket = () => useContext(SocketContext);

const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5000";

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const token = useAuthStore((state) => state.accessToken);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  // Track the token that the current socket was created with so we can
  // reconnect when a refreshed token arrives.
  const activeTokenRef = useRef<string | null>(null);

  useEffect(() => {
    // ── Tear down if logged out ──────────────────────────────────────
    if (!isAuthenticated || !token) {
      setSocket((prev) => {
        prev?.disconnect();
        return null;
      });
      setIsConnected(false);
      activeTokenRef.current = null;
      return;
    }

    // ── Skip if nothing changed ──────────────────────────────────────
    if (token === activeTokenRef.current) return;

    // ── Disconnect previous socket (e.g. after token refresh) ────────
    setSocket((prev) => {
      prev?.disconnect();
      return null;
    });

    activeTokenRef.current = token;

    const newSocket = io(SOCKET_URL, {
      auth: { token: `Bearer ${token}` },
      // Allow both transports so it works in all network environments
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 6,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 15000,
      timeout: 10000,
    });

    newSocket.on("connect", () => {
      setIsConnected(true);
    });

    newSocket.on("disconnect", () => {
      setIsConnected(false);
    });

    // Log connection errors once per attempt — suppress the repeated stack
    // trace flood that fills the console in development.
    newSocket.on("connect_error", (err) => {
      const msg = err?.message ?? String(err);
      // Only log once every 10 s to avoid console spam
      const now = Date.now();
      const last = (newSocket as any)._lastErrLog ?? 0;
      if (now - last > 10_000) {
        console.warn("[Socket] connect_error:", msg);
        (newSocket as any)._lastErrLog = now;
      }

      // If the server explicitly rejects the token, clear auth so the
      // interceptor in api.ts can redirect to /login.
      if (msg.includes("Invalid token") || msg.includes("Authentication error")) {
        newSocket.disconnect();
        // Try to refresh via the HTTP layer — if that fails, clearAuth()
        // inside api.ts will redirect to /login automatically.
      }
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
      activeTokenRef.current = null;
    };
    // Re-run whenever the token changes (e.g. after a silent refresh)
  }, [token, isAuthenticated]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};
