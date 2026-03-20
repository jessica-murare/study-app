# 📚 Study App

A personal productivity web app for students to track study hours, manage tasks, and monitor project progress — all in one place.

## ✨ Features

- **Authentication** — Secure login and signup with Firebase Auth
- **To-Do List** — Create tasks with subtasks, mark them complete, and track progress with a progress bar
- **Projects** — Organize work by category (College, Personal, Exam Prep, Book/Course) with subsections and per-project progress bars
- **Study Hours** — Log sessions manually or use the built-in live timer, with today/week/month stats
- **Dashboard** — Overview of task completion, project progress, and a study hours bar chart (week/month/year view)
- **Dark Mode** — Toggle between light and dark themes, persisted across sessions

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 |
| Styling | Tailwind CSS v4 |
| Build Tool | Vite 7 |
| Backend / Database | Firebase Firestore |
| Authentication | Firebase Auth |
| Charts | Recharts |
| Hosting | Vercel |

## 📁 Project Structure

```
src/
├── context/
│   ├── AuthContext.jsx       # Firebase auth state
│   └── ThemeContext.jsx      # Dark mode state
├── pages/
│   ├── Auth.jsx              # Login & signup
│   ├── Dashboard.jsx         # Overview & charts
│   ├── Todos.jsx             # To-do list with subtasks
│   ├── Projects.jsx          # Projects with subsections
│   └── StudyHours.jsx        # Timer & manual hour logging
├── components/
│   └── Layout.jsx            # Sidebar navigation
├── firebase.js               # Firebase config & exports
├── App.jsx                   # Root component & routing
├── main.jsx                  # Entry point
└── index.css                 # Tailwind imports
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- A Firebase project with Firestore and Authentication enabled

### Installation

1. Clone the repository:
```bash
git clone https://github.com/jessica-murare/study-app.git
cd study-app
```

2. Install dependencies:
```bash
npm install --legacy-peer-deps
```

3. Set up environment variables — create a `.env` file in the root:
```env
VITE_API_KEY=your_api_key
VITE_AUTH_DOMAIN=your_auth_domain
VITE_PROJECT_ID=your_project_id
VITE_STORAGE_BUCKET=your_storage_bucket
VITE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_APP_ID=your_app_id
```

4. Start the development server:
```bash
npm run dev
```

### Firebase Setup

1. Create a project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable **Email/Password** authentication under Authentication → Sign-in method
3. Create a **Firestore Database** in test mode
4. Add your app's domain to **Authentication → Settings → Authorized domains** after deploying

## 🗄️ Firestore Data Structure

```
users/
└── {userId}/
    ├── todos/
    │   └── {todoId}          # title, completed, subtasks[], createdAt
    ├── projects/
    │   └── {projectId}       # title, description, category, subtasks[], createdAt
    └── studySessions/
        └── {sessionId}       # subject, hours, date, dateStr, type
```

## 📦 Deployment

This app is deployed on Vercel. To deploy your own instance:

1. Push your code to GitHub
2. Import the repo at [vercel.com](https://vercel.com)
3. Add your `.env` variables under **Project Settings → Environment Variables**
4. Deploy — Vercel auto-deploys on every push to `main`

## 🔮 Planned Features

- [ ] Daily study goal & streak tracker
- [ ] Notes page per subject
- [ ] Profile page
- [ ] Export study data as CSV

## 📄 License

MIT