"use client";

import { useEffect, useState, useCallback } from "react";
import { useSocket } from "../components/providers/SocketProvider";
import { api } from "../lib/services/api";
import type { Booking, ApiResponse } from "../types";

export const useBookingRealtime = (bookingId: string) => {
  const [booking, setBooking] = useState<Booking | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { socket } = useSocket();

  const fetchBookingDetails = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await api.get<ApiResponse<Booking>>(`/bookings/${bookingId}`);
      if (res.data && res.data.data) {
        setBooking(res.data.data);
      } else {
        setError("Failed to parse booking details.");
      }
    } catch (err: any) {
      console.error("Error fetching booking details:", err);
      setError(err.response?.data?.message || err.message || "Failed to load booking details");
    } finally {
      setIsLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    if (bookingId) {
      fetchBookingDetails();
    }
  }, [bookingId, fetchBookingDetails]);

  useEffect(() => {
    if (!socket || !bookingId) return;

    const joinRoom = () => {
      console.log(`Joining booking room for ID: ${bookingId}`);
      socket.emit("joinBookingRoom", { bookingId });
    };

    // Join room immediately on mount/change
    joinRoom();

    // Rejoin room if socket disconnects and reconnects
    socket.on("connect", joinRoom);

    const handleCheckIn = (data: { bookingId: string; scheduleId: string; checkInTime: string }) => {
      console.log("Realtime check_in received:", data);
      if (data.bookingId !== bookingId) return;

      setBooking((prevBooking) => {
        if (!prevBooking) return prevBooking;
        
        const updatedSchedule = prevBooking.schedule?.map((item: any) => {
          if (item._id === data.scheduleId) {
            return { ...item, checkInTime: data.checkInTime };
          }
          return item;
        });

        return {
          ...prevBooking,
          status: prevBooking.status === "approved" || prevBooking.status === "pending" ? "active" : prevBooking.status,
          schedule: updatedSchedule,
        };
      });
    };

    const handleCheckOut = (data: { bookingId: string; scheduleId: string; checkOutTime: string; isBookingCompleted: boolean }) => {
      console.log("Realtime check_out received:", data);
      if (data.bookingId !== bookingId) return;

      setBooking((prevBooking) => {
        if (!prevBooking) return prevBooking;

        const updatedSchedule = prevBooking.schedule?.map((item: any) => {
          if (item._id === data.scheduleId) {
            return { ...item, checkOutTime: data.checkOutTime };
          }
          return item;
        });

        return {
          ...prevBooking,
          status: data.isBookingCompleted ? "completed" : prevBooking.status,
          schedule: updatedSchedule,
        };
      });
    };

    const handleTaskUpdated = (data: { bookingId: string; scheduleId: string; taskId: string; isCompleted: boolean }) => {
      console.log("Realtime task_updated received:", data);
      if (data.bookingId !== bookingId) return;

      setBooking((prevBooking) => {
        if (!prevBooking) return prevBooking;

        const updatedSchedule = prevBooking.schedule?.map((item: any) => {
          if (item._id === data.scheduleId) {
            const updatedTasks = item.tasksList?.map((task: any) => {
              if (task._id === data.taskId) {
                return { ...task, isCompleted: data.isCompleted };
              }
              return task;
            });
            return { ...item, tasksList: updatedTasks };
          }
          return item;
        });

        return {
          ...prevBooking,
          schedule: updatedSchedule,
        };
      });
    };

    // Listen to real-time events from server
    socket.on("check_in", handleCheckIn);
    socket.on("check_out", handleCheckOut);
    socket.on("task_updated", handleTaskUpdated);

    return () => {
      console.log(`Leaving booking room for ID: ${bookingId}`);
      socket.emit("leaveBookingRoom", { bookingId });
      socket.off("connect", joinRoom);
      socket.off("check_in", handleCheckIn);
      socket.off("check_out", handleCheckOut);
      socket.off("task_updated", handleTaskUpdated);
    };
  }, [socket, bookingId]);

  return {
    booking,
    isLoading,
    error,
    refresh: fetchBookingDetails,
    setBooking,
  };
};
