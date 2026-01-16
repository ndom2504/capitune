# CapiTune - English Language Learning Social Network

CapiTune is a social network platform designed to develop a community for learning and English language culture. It provides a space for English learners worldwide to connect, share knowledge, and improve their language skills together.

## Features

- **User Authentication**: Register and login to create your personalized account
- **Social Feed**: Share posts about English learning topics (grammar, vocabulary, pronunciation, culture)
- **Learning Communities**: Join or create communities based on skill level (beginner, intermediate, advanced)
- **Interactive Features**: Like posts, comment on discussions, and engage with other learners
- **Category Filtering**: Browse posts by specific topics (grammar, vocabulary, pronunciation, culture, general)
- **User Profiles**: Follow other learners and track your learning journey

## Technology Stack

### Backend
- Node.js with Express
- JWT authentication
- In-memory data storage (for simplicity)
- RESTful API architecture

### Frontend
- React.js
- React Router for navigation
- Axios for API calls
- Context API for state management
- Responsive CSS design

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/ndom2504/capitune.git
cd capitune
```

2. Install backend dependencies:
```bash
npm install
```

3. Install frontend dependencies:
```bash
cd client
npm install
cd ..
```

### Running the Application

1. Start the backend server (from root directory):
```bash
npm start
```
The server will run on http://localhost:5000

2. Start the frontend development server (in a new terminal):
```bash
npm run client
```
The React app will run on http://localhost:3000

### Running Both Simultaneously

You can run both backend and frontend together using:
```bash
# Terminal 1: Backend
npm run server

# Terminal 2: Frontend
npm run client
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user

### Posts
- `GET /api/posts` - Get all posts
- `POST /api/posts` - Create a new post (authenticated)
- `GET /api/posts/:id` - Get post by ID
- `POST /api/posts/:id/like` - Like a post (authenticated)
- `DELETE /api/posts/:id/like` - Unlike a post (authenticated)
- `POST /api/posts/:id/comments` - Add comment to post (authenticated)
- `DELETE /api/posts/:id` - Delete post (authenticated)

### Users
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `GET /api/users/:id/posts` - Get user's posts
- `PUT /api/users/profile` - Update profile (authenticated)
- `POST /api/users/:id/follow` - Follow a user (authenticated)
- `DELETE /api/users/:id/follow` - Unfollow a user (authenticated)

### Communities
- `GET /api/communities` - Get all communities
- `POST /api/communities` - Create community (authenticated)
- `GET /api/communities/:id` - Get community by ID
- `POST /api/communities/:id/join` - Join community (authenticated)
- `DELETE /api/communities/:id/join` - Leave community (authenticated)

## Environment Variables

Create a `.env` file in the root directory:

```env
PORT=5000
JWT_SECRET=your-secret-key-change-in-production
NODE_ENV=development
```

For the React app, create a `.env` file in the `client` directory:

```env
REACT_APP_API_URL=http://localhost:5000/api
```

## Project Structure

```
capitune/
├── server/
│   ├── index.js              # Express server setup
│   ├── models/               # Data models
│   │   ├── User.js
│   │   ├── Post.js
│   │   └── Community.js
│   ├── routes/               # API routes
│   │   ├── auth.js
│   │   ├── posts.js
│   │   ├── users.js
│   │   └── communities.js
│   └── middleware/           # Custom middleware
│       └── auth.js
├── client/
│   ├── src/
│   │   ├── components/       # React components
│   │   ├── pages/            # Page components
│   │   ├── context/          # Context providers
│   │   ├── services/         # API services
│   │   └── App.js
│   └── public/
├── package.json
└── README.md
```

## Contributing

Feel free to contribute to this project by submitting pull requests or reporting issues.

## License

ISC
