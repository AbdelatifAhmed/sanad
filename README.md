# Sanad - User Frontend (Web Client)

Welcome to the user frontend for the **Sanad** project! This repository contains the modern Next.js application designed for our end-users (Families and Companions).

## 🎯 About Sanad & The Problem We Solve
Sanad is a comprehensive healthcare and companion booking platform designed to bridge the gap between families needing specialized care (e.g., Alzheimer's patients, elderly care) and professional companions.

Finding trustworthy, qualified, and location-appropriate caregivers can be a stressful and manual process. Sanad solves this by providing a smart ecosystem featuring intelligent search, automated care plan generation, and a secure environment for families and companions to connect.

## Screenshots
**[Check Screenshots from here 📸](https://drive.google.com/drive/folders/1btnUPc8KuE3MqZOzT7i2F3bDDfcx8LR7?usp=sharing)**


## ✨ Platform Features & Capabilities

### 🧠 Advanced AI Features (In the User App)
- **Smart Hybrid Search Engine:** Families can use natural language (e.g., "Need an Alzheimer's specialist near me") to find the perfect companion. The system extracts exact filters and ranks the rest using vector embeddings.
- **Automatic Care Plan Generator:** When creating a job post, families simply describe the patient's condition, and the AI automatically generates a structured `tasksList` and `requiredSkills` for the job.
- **Dynamic Chat Assistant:** Provides in-chat guidance and medical tips tailored to the user's role (Family or Companion).

### 💻 Core Frontend Features
- **Real-Time Chat System:** Instant messaging UI between families and companions without refreshing the page, powered by Socket.io.
- **Interactive Location & Mapping:** Visualizing job locations and finding nearby companions using **Leaflet** interactive maps.
- **Secure Payment UI:** End-to-end secure financial transactions integrated with **Stripe Elements** for booking caregivers.
- **Internationalization (i18n):** Multi-language support to cater to diverse users (e.g., seamlessly switching between Arabic and English).
- **State Management & Validation:** Highly responsive UI managed by **Zustand** and robust forms validated with **React Hook Form** and **Zod**.

## 📁 File Structure
```
client/user/sanad/
├── app/               # Next.js App Router (pages, layouts, API routes)
├── components/        # Reusable React components (UI, layout, features)
├── features/          # Feature-specific logic and components
├── hooks/             # Custom React hooks
├── i18n/              # Internationalization (multi-language support)
├── lib/               # Utility functions and shared libraries
├── messages/          # Translation files for i18n
├── public/            # Static assets (images, icons)
├── store/             # Zustand state management
├── types/             # TypeScript type definitions
├── next.config.ts     # Next.js configuration
└── package.json       # Dependencies and scripts
```

## 🔗 Connected Projects
Sanad is a comprehensive ecosystem divided into three main projects:
- **[User Frontend (Web Client)](https://github.com/AbdelatifAhmed/sanad)** - You are here! Next.js application for users.
- **[Server (Backend)](https://github.com/AbdelatifAhmed/sanad-api)** - Node.js/Express API.
- **[Admin Dashboard (Frontend)](https://github.com/AbdelatifAhmed/sanad-dashboard)** - Angular application for administrators.

## 🚀 Technologies Used
- **Next.js (v16) & React (v19)**: Core UI framework.
- **Tailwind CSS v4**: Utility-first CSS framework.
- **Zustand**: Lightweight state management.
- **React Hook Form & Zod**: Schema-based form validation.
- **Stripe Elements**: Secure payment UI.
- **Socket.io-client**: Real-time communication.
- **Leaflet**: Interactive map rendering.

## 📦 Getting Started
### Prerequisites
- Node.js (v18 or higher recommended)

### Installation
1. Navigate to the `client/user/sanad` directory.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up `.env.local` for environment variables.
4. Start the development server:
   ```bash
   npm run dev
   ```

## 📄 License
Private
