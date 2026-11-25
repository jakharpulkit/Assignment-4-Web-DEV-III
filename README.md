# Secure Connect and Communication Platform

**Course:** Web Dev III · **Lab:** 4 · **Marks:** 2.5

A Node.js and Express backend demonstrating signup/login, bcrypt password hashing, JWT authentication, protected routes, role-based access control (RBAC), private Notes CRUD, Socket.IO chat, and Node.js EventEmitter.

## Requirements
- Node.js 18+
- MongoDB Community Server running locally, or a MongoDB Atlas connection string
- Postman

## Setup
1. Clone the repository and enter the project directory:
   `git clone https://github.com/jakharpulkit/Assignment-4-Web-DEV-III.git`
2. Install packages: `npm install`
3. Copy `.env.example` to `.env` and set `MONGODB_URI`, `DB_NAME`, and a long random `JWT_SECRET`.
4. Start MongoDB.
5. Start the API: `npm start` (development: `npm run dev`).

Server default: http://localhost:5000

## Environment variables
| Variable | Description |
|---|---|
| PORT | API port (default 5000) |
| MONGODB_URI | MongoDB connection URI |
| DB_NAME | Database name |
| JWT_SECRET | Private signing secret; never commit this |
| JWT_EXPIRES_IN | JWT lifetime (default 1d) |
| BCRYPT_ROUNDS | bcrypt cost factor (10–14; default 12) |
| CLIENT_ORIGIN | Socket.IO allowed origin (optional; default *) |

## API endpoints
All request and response bodies use JSON.

| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| GET | /api/health | No | Health check |
| POST | /api/auth/signup | No | Create account |
| POST | /api/auth/login | No | Login and receive JWT |
| GET | /api/auth/me | Bearer JWT | Current user |
| GET | /api/auth/users | Admin JWT | RBAC demonstration |
| POST | /api/notes | Bearer JWT | Create private note |
| GET | /api/notes | Bearer JWT | List own notes |
| GET | /api/notes/:id | Bearer JWT | Read own note |
| PUT | /api/notes/:id | Bearer JWT | Update own note |
| DELETE | /api/notes/:id | Bearer JWT | Delete own note |

### Example requests
Signup:
```json
{ "name": "Student", "email": "student@example.com", "password": "StrongPass123!" }
```
Login:
```json
{ "email": "student@example.com", "password": "StrongPass123!" }
```
For protected endpoints, add header:
`Authorization: Bearer YOUR_JWT_TOKEN`

## Real-time chat
Open http://localhost:5000/chat.html in two browser tabs. Login using Postman and paste the returned JWT into each tab, then click **Connect**. Send a message in either tab. The server verifies the JWT during the Socket.IO handshake and broadcasts authenticated messages to connected clients.

Socket events:
- Client → server: `chat:message` with `{ "message": "Hello" }`
- Server → client: `chat:ready`, `chat:message`, `chat:error`

## Event-driven features
The `events/appEvents.js` module uses Node.js EventEmitter for `user:registered`, `note:created`, and `chat:message`. Events are logged on the server; chat messages are also broadcast through Socket.IO.

## Postman testing
Import `postman/Secure-Connect-Lab4.postman_collection.json` into Postman. Set the collection variables if needed. Run Health Check, Signup, Login, My Profile, Notes CRUD, and the no-token request (which should return 401). The collection stores the JWT and created note ID automatically after successful requests.

## Required Postman screenshots
**Add your own screenshots after running the application. Do not use sample/fabricated outputs.** Save screenshots in `screenshots/` and update this section with the actual images.

| Test | Screenshot |
|---|---|
| Signup and login response | `screenshots/signup-login.png` |
| Notes blocked without token (401) | `screenshots/notes-unauthorized.png` |
| Notes CRUD with valid JWT | `screenshots/notes-crud.png` |
| RBAC forbidden response for regular user (403) | `screenshots/rbac-forbidden.png` |

When saved, embed them like this:
`![Signup and login](screenshots/signup-login.png)`

## Security notes
- Passwords are stored as bcrypt hashes, never in plain text.
- JWT secrets and database credentials belong only in local `.env`.
- Notes queries are scoped to the authenticated owner's MongoDB ObjectId.
- New signups receive the `user` role; the admin-only endpoint demonstrates RBAC. Do not expose role assignment publicly.
- For production, configure a strict CORS origin, HTTPS, rate limiting, input validation, and managed secret storage.

## Project structure
```text
config/db.js
events/appEvents.js
middleware/auth.js
routes/authRoutes.js
routes/noteRoutes.js
public/chat.html
postman/Secure-Connect-Lab4.postman_collection.json
server.js
.env.example
.gitignore
README.md
```
