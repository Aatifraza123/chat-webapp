# Connect Converse - Real-time Chat Application

A modern real-time chat application built with React, TypeScript, MongoDB, and Socket.IO.

## Tech Stack

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Shadcn UI** - Component library
- **Socket.IO Client** - Real-time communication
- **Axios** - HTTP client
- **React Router** - Navigation

### Backend
- **Node.js** - Runtime
- **Express** - Web framework
- **MongoDB** - Database
- **Socket.IO** - Real-time communication
- **JWT** - Authentication
- **Bcrypt** - Password hashing

## Features

- 🔐 User authentication (Sign up/Sign in)
- 💬 Real-time messaging
- 👥 User presence (online/offline status)
- ⌨️ Typing indicators
- 📱 Responsive design
- 🖼️ Image sharing support
- 🔔 Unread message counts

## Prerequisites

- Node.js (v18 or higher)
- MongoDB (running locally or remote connection)

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/Aatifraza123/connect-converse.git
cd connect-converse
```

### 2. Install Frontend Dependencies

```bash
npm install
```

### 3. Install Backend Dependencies

```bash
cd server
npm install
cd ..
```

### 4. Setup Cloudinary (for media storage)

**Important:** Profile pictures and media files are stored on Cloudinary (free cloud storage).

1. Create a free account at [Cloudinary](https://cloudinary.com/users/register/free)
2. Get your credentials from the dashboard
3. Update `server/.env`:

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

See [CLOUDINARY_SETUP.md](CLOUDINARY_SETUP.md) for detailed instructions.

### 5. Configure Environment Variables

Make sure MongoDB is running on your system. You can:
- Install MongoDB locally: https://www.mongodb.com/docs/manual/installation/
- Or use MongoDB Atlas (cloud): https://www.mongodb.com/cloud/atlas

### 5. Configure Environment Variables

**Frontend (.env):**
```env
VITE_API_URL=http://localhost:5000
```

**Backend (server/.env):**
```env
MONGODB_URI=mongodb://localhost:27017/connect-converse
JWT_SECRET=your-secret-key-change-this-in-production
PORT=5000
```

## Running the Application

### Start Backend Server

```bash
cd server
npm run dev
```

The server will start on http://localhost:5000

### Start Frontend Development Server

In a new terminal:

```bash
npm run dev
```

The app will start on http://localhost:8080

## Project Structure

```
connect-converse/
├── src/                      # Frontend source
│   ├── components/          # React components
│   ├── contexts/            # React contexts (Auth, Presence)
│   ├── hooks/               # Custom hooks
│   ├── lib/                 # Utilities (API, Socket)
│   ├── pages/               # Page components
│   └── types/               # TypeScript types
├── server/                   # Backend source
│   ├── routes/              # API routes
│   ├── middleware/          # Express middleware
│   ├── db.js                # MongoDB connection
│   └── server.js            # Server entry point
└── public/                   # Static assets
```

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Create new account
- `POST /api/auth/signin` - Sign in
- `GET /api/auth/me` - Get current user

### Users
- `GET /api/users` - Get all users
- `GET /api/users/:userId` - Get user profile

### Chats
- `GET /api/chats` - Get all chats
- `POST /api/chats` - Create new chat
- `GET /api/chats/:chatId/messages` - Get messages
- `POST /api/chats/:chatId/messages` - Send message

## Socket.IO Events

### Client → Server
- `join-chats` - Join chat rooms
- `typing` - Send typing indicator

### Server → Client
- `new-message` - Receive new message
- `user-online` - User came online
- `user-offline` - User went offline
- `user-typing` - User is typing

## Database Schema

### Users Collection
```javascript
{
  _id: ObjectId,
  email: String,
  password: String (hashed),
  name: String,
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
  type: String ('text' | 'image'),
  status: String,
  created_at: Date
}
```

### Chat Participants Collection
```javascript
{
  _id: ObjectId,
  chat_id: String,
  user_id: String,
  joined_at: Date
}
```

## Development

### Build for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is open source and available under the MIT License.

## Author

Aatif Raza

## Acknowledgments

- Built with React and TypeScript
- UI components from Shadcn UI
- Icons from Lucide React
- Avatars from DiceBear
