# 💬 Connect Converse - Real-Time Chat Application

A modern, feature-rich chat application built with React, Node.js, MongoDB, and Socket.IO.

## ✨ Features

### 🔐 Authentication & Security
- Email/Password authentication with JWT
- Secure password hashing with bcrypt
- Friend request system - users can only chat with approved friends
- Private email addresses - search by username only
- Socket.IO authorization validation

### 💬 Messaging
- Real-time messaging with Socket.IO
- Message read receipts (✓ sent, ✓✓ delivered, ✓✓ seen)
- Typing indicators
- Message grouping by date
- Smart message spacing
- Disappearing messages
- Select and delete multiple messages

### 📁 Media Sharing
- Image sharing with preview
- Video sharing with player
- Document sharing
- Cloudinary integration for media storage
- Download and open file options
- Automatic image optimization

### 📞 Voice & Video Calls
- WebRTC peer-to-peer calling
- Voice calls
- Video calls
- Call controls (mute, video on/off)
- Call duration timer
- Schedule calls feature

### 👥 Social Features
- Friend request system (send, accept, reject)
- User profiles with bio
- Profile pictures
- Online/offline status
- User presence tracking
- Contact info view

### 🎨 Customization
- 6 theme options (Light, Dark, Blue, Purple, Green, Rose)
- Chat wallpapers (colors, patterns, gradients, custom images)
- Per-chat wallpaper settings
- Notification settings
- Chat settings

### 📱 Responsive Design
- Fully responsive for mobile, tablet, and desktop
- Touch-optimized controls
- Mobile-friendly dialogs
- Adaptive layouts

## 🛠️ Tech Stack

### Frontend
- React 18 with TypeScript
- Vite for build tooling
- TailwindCSS for styling
- Radix UI components
- Socket.IO client
- React Router
- Axios for API calls
- React Query for data fetching

### Backend
- Node.js with Express
- MongoDB for database
- Socket.IO for real-time communication
- JWT for authentication
- Cloudinary for media storage
- Multer for file uploads
- bcrypt for password hashing

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- MongoDB installed and running
- Cloudinary account (for media storage)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Aatifraza123/chat-webapp.git
cd chat-webapp/connect-converse
```

2. Install frontend dependencies:
```bash
npm install
```

3. Install backend dependencies:
```bash
cd server
npm install
```

4. Setup environment variables:

**Backend (.env)**
```bash
cd server
cp .env.example .env
# Edit .env with your credentials
```

Required backend environment variables:
```env
MONGODB_URI=mongodb://localhost:27017/connect-converse
JWT_SECRET=your-128-character-secret
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
PORT=5000
FRONTEND_URL=http://localhost:8080
NODE_ENV=development
```

**Frontend (.env)**
```bash
cd ..
cp .env.example .env
```

Required frontend environment variables:
```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

5. Generate JWT secret:
```bash
cd server
npm run generate-secret
# Copy the generated secret to .env
```

6. Start the application:

**Option 1: Use the start script (Windows)**
```bash
start-dev.bat
```

**Option 2: Manual start**
```bash
# Terminal 1 - Backend
cd server
npm start

# Terminal 2 - Frontend
cd ..
npm run dev
```

7. Open your browser:
- Frontend: http://localhost:8080
- Backend: http://localhost:5000

## 📦 Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment instructions.

### Quick Deploy Summary

1. **Database**: MongoDB Atlas (free tier available)
2. **Backend**: Railway or Render (free tier available)
3. **Frontend**: Vercel (free tier available)
4. **Media Storage**: Cloudinary (free tier available)

All services offer free tiers suitable for development and small-scale production use.

## 📁 Project Structure

```
connect-converse/
├── src/                      # Frontend source
│   ├── components/          # React components
│   │   ├── chat/           # Chat-related components
│   │   ├── call/           # Call-related components
│   │   └── ui/             # UI components
│   ├── contexts/            # React contexts
│   │   ├── AuthContext.tsx
│   │   ├── ThemeContext.tsx
│   │   └── PresenceContext.tsx
│   ├── hooks/               # Custom hooks
│   │   ├── useChat.ts
│   │   ├── useWebRTC.ts
│   │   ├── useFriendRequests.ts
│   │   └── useFileUpload.ts
│   ├── pages/               # Page components
│   │   ├── ChatApp.tsx
│   │   ├── ProfilePage.tsx
│   │   └── SettingsPage.tsx
│   ├── types/               # TypeScript types
│   └── lib/                 # Utilities
│       ├── api.ts
│       └── socket.ts
├── server/                   # Backend source
│   ├── routes/              # API routes
│   │   ├── auth.js
│   │   ├── chat.js
│   │   ├── users.js
│   │   ├── upload.js
│   │   ├── friendRequest.js
│   │   └── ...
│   ├── middleware/          # Express middleware
│   │   └── auth.js
│   ├── config/              # Configuration files
│   │   └── cloudinary.js
│   ├── scripts/             # Utility scripts
│   │   └── generate-jwt-secret.js
│   ├── db.js                # MongoDB connection
│   └── server.js            # Server entry point
├── public/                   # Static assets
├── DEPLOYMENT.md            # Deployment guide
└── README.md                # This file
```

## 🔑 Key Features Explained

### Friend Request System
Users cannot chat with anyone directly. They must:
1. Search by username
2. Send friend request
3. Wait for acceptance
4. Only then can they chat

This ensures privacy and prevents spam.

### Read Receipts
- ✓ Single check: Message sent
- ✓✓ Double check: Message delivered
- ✓✓ Blue checks: Message seen

### Typing Indicators
Real-time typing indicators show when someone is typing:
- In chat header
- In message area
- In chat list

### Wallpapers
Each chat can have its own wallpaper:
- Solid colors (8 options)
- Patterns (dots, grid, diagonal, waves, bubbles, hexagons)
- Gradients (sunset, ocean, forest, fire, night, aurora, peach, purple)
- Custom image upload

### Voice & Video Calls
WebRTC-based peer-to-peer calling:
- High-quality audio/video
- Low latency
- Call controls (mute, video toggle)
- Call duration tracking
- Schedule calls for later

## 🔒 Security Features

- JWT authentication with secure tokens
- Password hashing with bcrypt (10 rounds)
- Private email addresses (never exposed in UI)
- Socket.IO authorization middleware
- Friend request validation
- Chat authorization checks
- Secure file uploads to Cloudinary
- CORS protection
- Environment variable protection

## 📡 API Endpoints

### Authentication
- `POST /api/auth/signup` - Create new account
- `POST /api/auth/signin` - Sign in
- `GET /api/auth/me` - Get current user

### Users
- `GET /api/users/search?q=username` - Search users by username
- `GET /api/users/:userId` - Get user profile

### Friend Requests
- `POST /api/friend-requests/send` - Send friend request
- `POST /api/friend-requests/accept/:requestId` - Accept request
- `POST /api/friend-requests/reject/:requestId` - Reject request
- `GET /api/friend-requests/received` - Get received requests
- `GET /api/friend-requests/sent` - Get sent requests
- `GET /api/friend-requests/status/:username` - Check friend status

### Chats
- `GET /api/chats` - Get all chats
- `POST /api/chats` - Create new chat
- `GET /api/chats/:chatId/messages` - Get messages
- `POST /api/chats/:chatId/messages` - Send message

### Upload
- `POST /api/upload` - Upload file to Cloudinary
- `POST /api/profile-picture` - Upload profile picture
- `POST /api/file-attachment` - Upload file attachment

## 🔌 Socket.IO Events

### Client → Server
- `join-chats` - Join chat rooms
- `typing` - Send typing indicator
- `message:read` - Mark messages as read
- `message:delivered` - Mark messages as delivered
- `call:initiate` - Start a call
- `call:answer` - Answer a call
- `call:ice-candidate` - Exchange ICE candidates
- `call:reject` - Reject a call
- `call:end` - End a call
- `friend:request-sent` - Notify friend request sent
- `friend:request-accepted` - Notify friend request accepted

### Server → Client
- `new-message` - Receive new message
- `user-online` - User came online
- `user-offline` - User went offline
- `user-typing` - User is typing
- `message:seen` - Message was seen
- `call:incoming` - Incoming call
- `call:answered` - Call was answered
- `call:rejected` - Call was rejected
- `call:ended` - Call ended
- `friend:request-received` - Friend request received

## 🗄️ Database Schema

### Users Collection
```javascript
{
  _id: ObjectId,
  email: String (unique, private),
  username: String (unique, public),
  password: String (hashed),
  name: String,
  bio: String,
  avatar_url: String,
  created_at: Date,
  updated_at: Date
}
```

### Messages Collection
```javascript
{
  _id: ObjectId,
  chat_id: String,
  sender_id: String,
  content: String,
  type: String ('text' | 'image' | 'video' | 'document'),
  status: String ('sent' | 'delivered' | 'seen'),
  file_url: String,
  created_at: Date
}
```

### Friend Requests Collection
```javascript
{
  _id: ObjectId,
  from: String (user_id),
  to: String (user_id),
  status: String ('pending' | 'accepted' | 'rejected'),
  created_at: Date
}
```

### Friends Collection
```javascript
{
  _id: ObjectId,
  user1: String (user_id),
  user2: String (user_id),
  created_at: Date
}
```

### Chats Collection
```javascript
{
  _id: ObjectId,
  participants: [String] (user_ids),
  created_at: Date,
  updated_at: Date
}
```

## 🎨 Available Themes

1. **Light** - Clean white theme
2. **Dark** - Dark mode for night owls
3. **Blue** - Professional blue theme
4. **Purple** - Creative purple theme
5. **Green** - Nature-inspired green theme
6. **Rose** - Elegant rose theme

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is open source and available under the MIT License.

## 👨‍💻 Author

**Aatif Raza**
- GitHub: [@Aatifraza123](https://github.com/Aatifraza123)
- Repository: [chat-webapp](https://github.com/Aatifraza123/chat-webapp)

## 🙏 Acknowledgments

- Built with React and Node.js
- UI components from Radix UI
- Styling with TailwindCSS
- Real-time communication with Socket.IO
- Media storage with Cloudinary
- Icons from Lucide React

## 📞 Support

If you encounter any issues or have questions:
1. Check the [DEPLOYMENT.md](DEPLOYMENT.md) guide
2. Review the error logs in your console
3. Verify all environment variables are set correctly
4. Open an issue on GitHub

---

Made with ❤️ by Aatif Raza
