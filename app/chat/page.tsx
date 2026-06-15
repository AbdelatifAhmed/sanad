"use client";

import React from "react";

export default function ChatPage() {
  return (
    <div className="min-h-screen bg-[#fcf9f6] flex items-center justify-center p-6">
      <div className="bg-white p-8 rounded-3xl border border-sand-high max-w-md w-full text-center">
        <h1 className="font-display text-2xl font-bold text-primary mb-2">Chat</h1>
        <p className="text-gray-500 text-sm">Your conversation list with families will appear here.</p>
      </div>
    </div>
  );
}
