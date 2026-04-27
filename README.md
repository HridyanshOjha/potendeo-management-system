# 🎓 PDO Education — Potendeo Education Web App

A production-ready, role-based education management system with real-time communication built with React + Node.js + MongoDB.

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [API Reference](#-api-reference)
- [Database Schemas](#-database-schemas)
- [Role-Based Access](#-role-based-access)
- [Socket.io Events](#-socketio-events)
- [Deployment](#-deployment)

---

## ✨ Features

### 👨‍💼 Admin
- Full dashboard with live stats (students, teachers, groups, messages)
- Create & manage Teachers and Students
- Enable / Disable user accounts
- Create groups, assign teachers & students
- Each student is strictly assigned to ONE group
- Manage fee structure for all class segments
- Broadcast announcements with priority levels
- Monitor all group chats in real time

### 👨‍🏫 Teacher
- View all assigned groups
- Real-time group chat with students
- Restricted to only their assigned groups

### 👨‍🎓 Student
- View their single assigned group and its teachers
- Real-time group chat
- View fee structure for all class segments
- Read announcements with unread indicators

### 💬 Real-Time Chat
- Socket.io powered messaging
- Messages persisted in MongoDB
- Typing indicators
- Online presence tracking
- Message deletion (own messages + admin)
- Date separators & role-colored bubbles

---

## 🧱 Tech Stack

| Layer        | Technology                               |
|--------------|------------------------------------------|
| Frontend     | React 18, Vite, Tailwind CSS, React Router v6 |
| HTTP Client  | Axios                                    |
| Real-time    | Socket.io-client                         |
| Backend      | Node.js, Express.js                      |
| Database     | MongoDB Atlas, Mongoose                  |
| Auth         | JWT (HTTP-only cookies + Bearer token)   |
| Password     | bcryptjs (12 salt rounds)                |
| Date utils   | date-fns                                 |
| Toasts       | react-hot-toast                          |

---

## 📁 Project Structure

```
pdo-education/
├── backend/
│   ├── config/
│   │   └── db.js                  # MongoDB connection
│   ├── controllers/
│   │   ├── authController.js      # Login, logout, me, change-password
│   │   ├── userController.js      # CRUD users (admin only)
│   │   ├── groupController.js     # CRUD groups, assign members
│   │   ├── announcementController.js
│   │   ├── feeController.js
│   │   ├── chatController.js      # Message history, delete
│   │   └── dashboardController.js # Aggregated stats
│   ├── middleware/
│   │   └── auth.js                # protect, restrictTo, socketAuth
│   ├── models/
│   │   ├── User.js
│   │   ├── Group.js
│   │   ├── Message.js
│   │   ├── Announcement.js
│   │   └── FeeStructure.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── users.js
│   │   ├── groups.js
│   │   ├── announcements.js
│   │   ├── fees.js
│   │   ├── chat.js
│   │   └── dashboard.js
│   ├── utils/
│   │   └── socket.js              # Socket.io event handlers
│   ├── .env.example
│   ├── seed.js                    # Creates default admin + fee structure
│   ├── server.js                  # Express app + Socket.io setup
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── shared/
│   │   │   │   ├── Sidebar.jsx
│   │   │   │   ├── Topbar.jsx
│   │   │   │   ├── Modal.jsx
│   │   │   │   ├── ConfirmDialog.jsx
│   │   │   │   └── StatCard.jsx
│   │   │   └── chat/
│   │   │       └── ChatWindow.jsx  # Full real-time chat component
│   │   ├── context/
│   │   │   └── AuthContext.jsx     # Global auth state
│   │   ├── pages/
│   │   │   ├── auth/LoginPage.jsx
│   │   │   ├── admin/
│   │   │   │   ├── AdminLayout.jsx
│   │   │   │   ├── AdminDashboard.jsx
│   │   │   │   ├── AdminUsers.jsx
│   │   │   │   ├── AdminGroups.jsx
│   │   │   │   ├── AdminFees.jsx
│   │   │   │   ├── AdminAnnouncements.jsx
│   │   │   │   └── AdminChat.jsx
│   │   │   ├── teacher/
│   │   │   │   ├── TeacherLayout.jsx
│   │   │   │   ├── TeacherDashboard.jsx
│   │   │   │   └── TeacherChat.jsx
│   │   │   └── student/
│   │   │       ├── StudentLayout.jsx
│   │   │       ├── StudentDashboard.jsx
│   │   │       ├── StudentChat.jsx
│   │   │       ├── StudentFees.jsx
│   │   │       └── StudentAnnouncements.jsx
│   │   ├── utils/
│   │   │   ├── api.js              # Axios instance with interceptors
│   │   │   ├── socket.js           # Socket.io client singleton
│   │   │   └── helpers.js          # Date, currency, color helpers
│   │   ├── App.jsx                 # Routes + guards
│   │   ├── main.jsx
│   │   └── index.css               # Tailwind + custom component classes
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
│
├── .gitignore
├── package.json                    # Root scripts (concurrently)
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js v18+
- npm v9+
- MongoDB Atlas account (free tier works)

### 1. Clone & Install

```bash
# Clone the repository
git clone <your-repo-url>
cd pdo-education

# Install all dependencies (backend + frontend)
npm run install:all
```

### 2. Configure Environment

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env`:
```env
PORT=5000
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.xxxxx.mongodb.net/pdo-education
JWT_SECRET=your_very_long_random_secret_key_here
JWT_EXPIRES_IN=7d
NODE_ENV=development
CLIENT_URL=http://localhost:5173
```

### 3. Seed the Database

```bash
npm run seed
```

This creates:
- **Admin account**: `admin@pdo.edu` / `Admin@123`
- Default fee structure for all 5 class segments

### 4. Start Development

```bash
# Run both backend + frontend concurrently
npm run dev
```

Or separately:
```bash
npm run dev:backend   # http://localhost:5000
npm run dev:frontend  # http://localhost:5173
```

### 5. Open in Browser

Navigate to **http://localhost:5173** and log in as:

| Role    | Email              | Password    |
|---------|--------------------|-------------|
| Admin   | admin@pdo.edu      | Admin@123   |

Create teachers and students from the Admin → Users panel.

---

## 🔐 Environment Variables

| Variable         | Description                            | Required |
|------------------|----------------------------------------|----------|
| `PORT`           | Backend server port (default: 5000)    | No       |
| `MONGODB_URI`    | MongoDB Atlas connection string        | **Yes**  |
| `JWT_SECRET`     | Secret key for signing JWT tokens      | **Yes**  |
| `JWT_EXPIRES_IN` | Token expiry (e.g. `7d`, `24h`)        | No       |
| `NODE_ENV`       | `development` or `production`          | No       |
| `CLIENT_URL`     | Frontend URL for CORS                  | **Yes**  |

---

## 📡 API Reference

### Auth
| Method | Endpoint                    | Access  | Description              |
|--------|-----------------------------|---------|--------------------------|
| POST   | `/api/auth/login`           | Public  | Login with email/password|
| GET    | `/api/auth/me`              | Private | Get current user         |
| POST   | `/api/auth/logout`          | Private | Logout                   |
| PUT    | `/api/auth/change-password` | Private | Change password          |

### Users (Admin only)
| Method | Endpoint                         | Description         |
|--------|----------------------------------|---------------------|
| GET    | `/api/users`                     | List users (filter) |
| POST   | `/api/users`                     | Create user         |
| GET    | `/api/users/:id`                 | Get user            |
| PUT    | `/api/users/:id`                 | Update user         |
| DELETE | `/api/users/:id`                 | Delete user         |
| PATCH  | `/api/users/:id/toggle-status`   | Enable/Disable      |

### Groups
| Method | Endpoint                                | Access  | Description             |
|--------|-----------------------------------------|---------|-------------------------|
| GET    | `/api/groups/my-groups`                 | All     | Get accessible groups   |
| GET    | `/api/groups`                           | Admin   | Get all groups          |
| POST   | `/api/groups`                           | Admin   | Create group            |
| GET    | `/api/groups/:id`                       | All     | Get group detail        |
| PUT    | `/api/groups/:id`                       | Admin   | Update group            |
| DELETE | `/api/groups/:id`                       | Admin   | Delete group            |
| POST   | `/api/groups/:id/assign-teacher`        | Admin   | Assign teacher          |
| DELETE | `/api/groups/:id/remove-teacher/:tid`   | Admin   | Remove teacher          |
| POST   | `/api/groups/:id/assign-student`        | Admin   | Assign student          |
| DELETE | `/api/groups/:id/remove-student/:sid`   | Admin   | Remove student          |

### Announcements
| Method | Endpoint                        | Access  | Description       |
|--------|---------------------------------|---------|-------------------|
| GET    | `/api/announcements`            | All     | Get announcements |
| POST   | `/api/announcements`            | Admin   | Create            |
| PUT    | `/api/announcements/:id`        | Admin   | Update            |
| DELETE | `/api/announcements/:id`        | Admin   | Delete            |
| PATCH  | `/api/announcements/:id/read`   | All     | Mark as read      |

### Fees
| Method | Endpoint    | Access | Description          |
|--------|-------------|--------|----------------------|
| GET    | `/api/fees` | All    | Get fee structure    |
| PUT    | `/api/fees` | Admin  | Update fee structure |

### Chat
| Method | Endpoint                         | Access | Description              |
|--------|----------------------------------|--------|--------------------------|
| GET    | `/api/chat/:groupId/messages`    | All    | Get message history      |
| DELETE | `/api/chat/messages/:messageId`  | All    | Delete a message         |
| GET    | `/api/chat/stats/total`          | Admin  | Total message count      |

### Dashboard
| Method | Endpoint               | Access | Description          |
|--------|------------------------|--------|----------------------|
| GET    | `/api/dashboard/stats` | Admin  | Full stats & metrics |

---

## 🗃️ Database Schemas

### User
```js
{
  name: String,
  email: String (unique),
  password: String (bcrypt hashed),
  role: 'admin' | 'teacher' | 'student',
  isActive: Boolean,
  phone: String,
  group: ObjectId → Group,         // students only
  assignedGroups: [ObjectId],      // teachers only
  lastSeen: Date,
  createdBy: ObjectId → User,
}
```

### Group
```js
{
  name: String (unique),
  description: String,
  subject: String,
  classSegment: 'Class 1-5' | 'Class 6-8' | 'Class 9-10' | 'Class 11-12' | 'Competitive Exams',
  teachers: [ObjectId → User],
  students: [ObjectId → User],
  isActive: Boolean,
  maxStudents: Number,
  schedule: String,
  createdBy: ObjectId → User,
}
```

### Message
```js
{
  group: ObjectId → Group,
  sender: ObjectId → User,
  senderName: String,
  senderRole: 'admin' | 'teacher' | 'student',
  content: String,
  type: 'text' | 'announcement' | 'system',
  isDeleted: Boolean,
  readBy: [ObjectId → User],
}
```

### Announcement
```js
{
  title: String,
  content: String,
  author: ObjectId → User,
  authorName: String,
  targetAudience: 'all' | 'teachers' | 'students' | 'specific_groups',
  priority: 'low' | 'normal' | 'high' | 'urgent',
  isActive: Boolean,
  expiresAt: Date,
  readBy: [ObjectId → User],
  tags: [String],
}
```

### FeeStructure
```js
{
  segments: [{
    segment: 'Class 1-5' | ... | 'Competitive Exams',
    order: Number,                   // fixed order 1–5
    oneToOne:    { min, max, recommended },
    groupTuition: { min, max, recommended },
  }],
  currency: String,
  isPublished: Boolean,
  lastUpdatedBy: ObjectId → User,
}
```

---

## 🔒 Role-Based Access

| Feature               | Admin | Teacher | Student |
|-----------------------|:-----:|:-------:|:-------:|
| View Dashboard        | ✅    | ✅      | ✅      |
| Manage Users          | ✅    | ❌      | ❌      |
| Manage Groups         | ✅    | ❌      | ❌      |
| Edit Fee Structure    | ✅    | ❌      | ❌      |
| Create Announcements  | ✅    | ❌      | ❌      |
| Access All Chats      | ✅    | ❌      | ❌      |
| Access Assigned Chats | ✅    | ✅      | ❌      |
| Access Own Chat       | ✅    | ✅      | ✅      |
| View Fee Structure    | ✅    | ❌      | ✅      |
| View Announcements    | ✅    | ✅      | ✅      |

---

## 🔌 Socket.io Events

### Client → Server
| Event            | Payload                          | Description          |
|------------------|----------------------------------|----------------------|
| `group:join`     | `{ groupId }`                    | Join a group room    |
| `group:leave`    | `{ groupId }`                    | Leave a group room   |
| `group:message`  | `{ groupId, content }`           | Send a message       |
| `typing:start`   | `{ groupId }`                    | User started typing  |
| `typing:stop`    | `{ groupId }`                    | User stopped typing  |
| `message:delete` | `{ messageId, groupId }`         | Delete a message     |

### Server → Client
| Event            | Payload                          | Description          |
|------------------|----------------------------------|----------------------|
| `group:joined`   | `{ groupId, message }`           | Confirm join         |
| `group:message`  | `{ full message object }`        | New message          |
| `typing:start`   | `{ userId, name, role }`         | Someone typing       |
| `typing:stop`    | `{ userId, name }`               | Stopped typing       |
| `message:deleted`| `{ messageId, groupId }`         | Message deleted      |
| `user:joined`    | `{ userId, name, role }`         | User joined room     |
| `user:left`      | `{ userId, name }`               | User left room       |
| `online:users`   | `[userId, ...]`                  | Online user IDs      |
| `error`          | `{ message }`                    | Error event          |

---

## 🚢 Deployment

### Backend (Railway / Render / Fly.io)
1. Set environment variables in your hosting platform
2. Set `NODE_ENV=production`
3. Set `CLIENT_URL` to your frontend domain
4. Deploy the `backend/` folder

### Frontend (Vercel / Netlify)
1. Build: `cd frontend && npm run build`
2. Set environment variable: `VITE_API_URL` if not using the proxy
3. Deploy the `frontend/dist/` folder

### MongoDB Atlas
1. Create a free cluster at [mongodb.com/atlas](https://mongodb.com/atlas)
2. Whitelist `0.0.0.0/0` for production (or specific IPs)
3. Copy connection string to `MONGODB_URI`

---

## 🧪 Default Login

After running `npm run seed`:

```
URL:      http://localhost:5173
Email:    admin@pdo.edu
Password: Admin@123
```

---

## 📝 License

MIT © Potendeo Education

---

Built with ❤️ using React · Node.js · MongoDB · Socket.io
