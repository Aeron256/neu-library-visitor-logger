NEU Library Visitor Logger
A high-performance, web-based visitor management system designed for New Era University. This application streamlines the library check-in/out process using QR code technology, replacing manual logs with a digital, real-time tracking system.

🌐 Live Demo: https://neu-library-visitor-logger.web.app/

✨ Key Features
🔐 Authentication & Profile
Google OAuth Integration: Secure sign-in using institutional emails.

Dynamic Registration: Custom profile setup for Students, Faculty, and Staff across all NEU Colleges (CICS, CAS, CBE, etc.).

Persistent User Data: Saves School IDs and User Types to Firestore for seamless repeated visits.

📸 Smart Scanning System
QR Scanner: Built-in camera integration to scan student/staff QR codes.

Auto-Check: Automatically detects if a user is checking in or out based on their active status.

Visit Purpose: Interactive modal to categorize library usage (Reading, Research, Meetings, etc.).

📊 Admin Dashboard
Real-time Analytics: Visualizes visitor traffic using Chart.js.

Advanced Filtering: Filter logs by Date Range (Daily/Weekly/Monthly), specific Colleges, or Purpose of visit.

Status Tracking: Monitor live "In Library" counts versus completed visits.

Duration Calculation: Automatically calculates and displays how long each visitor stayed.

🛠️ Tech Stack
Frontend: React.js (Vite)

Styling: Tailwind CSS (Modern, split-screen UI)

Backend/Database: Firebase Firestore

Authentication: Firebase Auth (Google Provider)

Icons: Lucide-React

Charts: Chart.js & React-Chartjs-2

Deployment: Firebase Hosting

🚀 Getting Started
Prerequisites
Node.js (v18 or higher)

A Firebase Project

Installation
Clone the repository:

Bash

git clone https://github.com/your-username/neu-library-visitor-logger.git
cd neu-library-visitor-logger
Install dependencies:

Bash

npm install
Environment Setup:
Create a .env file in the root directory and add your Firebase configuration:

Code snippet

VITE_FIREBASE_API_KEY=your_key
VITE_FIREBASE_AUTH_DOMAIN=your_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
Run Development Server:

Bash

npm run dev
