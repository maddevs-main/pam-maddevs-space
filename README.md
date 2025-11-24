PAM — Project Access & Management Dashboard

PAM is a lightweight, secure dashboard built by maddevs to give clients a unified space to manage and track everything related to their project. It centralizes access, updates, documents, reports, environments, and communication—providing clarity and control throughout the entire build journey.

⸻

Features • Project Overview — Clear summary of active modules, pages, and progress • Updates & Logs — See what’s been done, what’s planned, and current status • Documents & Assets — All project files in one place • Environment Access — Links to development, staging, and production • Authentication — Secure, modern login without cookie dependencies • Feedback & Notes — Leave comments or request changes from inside the dashboard

⸻

Tech Stack • Next.js (App Router) • TypeScript • Tailwind CSS • MongoDB / Server Actions • Edge Runtime friendly • Modern authentication layer (token-based)

⸻

Installation

Clone the repository:

git clone https://github.com/maddevs/pam-maddevs-space.git cd pam-maddevs-space

Install dependencies:

npm install

Run locally:

npm run dev

⸻

Environment Variables

Create a .env.local file:

NEXT_PUBLIC_APP_URL=http://localhost:3000 NEXT_PUBLIC_API_URL=http://localhost:3000 NEXTAUTH_URL=http://localhost:3000 NEXTAUTH_SECRET=your_secret_here MONGODB_URI=your_mongo_uri MONGODB_DB=pam

⸻

Build

npm run build npm start

⸻

License

Private & proprietary — part of maddevs’ internal infrastructure. Not for redistribution.