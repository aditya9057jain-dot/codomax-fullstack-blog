# WriteSpace — Codomax Full Stack Blog Application

A single full-stack Blog Application designed to satisfy the Codomax Academy Full Stack internship milestones from Module 1 through Module 6.

## Stack
- Frontend: HTML5, CSS3, vanilla JavaScript
- Backend: Node.js + Express
- Database: MongoDB with Mongoose
- Authentication: JWT + bcrypt password hashing
- Security: Helmet, rate limiting, owner-only update/delete
- Deployment target: Render (single Express service serving the frontend)

## Features mapped to the internship
### Module 1 — Frontend Development
- Responsive layout
- Home page with blog listing
- Login and Register pages
- Dashboard page
- Create Blog page
- Blog details page
- Search and category filter UI

### Module 2 — Backend Development
REST APIs:
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `PUT /api/auth/profile`
- `GET /api/blogs`
- `GET /api/blogs/:id`
- `POST /api/blogs`

### Module 3 — Database Integration
- MongoDB persistence
- User records and blog post records
- Passwords stored only as bcrypt hashes
- Read all blogs and individual blog details

### Module 4 — CRUD Operations
- Create blog
- Read blogs
- Update own blog
- Delete own blog
- Search and category filters

### Module 5 — Authentication & Dashboard
- JWT authentication
- Protected API routes
- Private dashboard
- Logged-in user's own blog list
- Profile update
- Logout

### Module 6 — Final Project & Deployment
- Polished responsive UI
- Error handling and validation
- Professional README
- Render-ready deployment configuration

## Run locally
1. Install Node.js 18+.
2. Create a MongoDB Atlas database and copy the connection string.
3. Copy `.env.example` to `.env` and set `MONGODB_URI` and `JWT_SECRET`.
4. Run:

```bash
npm install
npm start
```

5. Open `http://localhost:5000`.

## Render deployment
Create a new **Web Service** on Render connected to this GitHub repository.
- Build Command: `npm install`
- Start Command: `npm start`
- Add environment variables: `MONGODB_URI`, `JWT_SECRET`, optionally `JWT_EXPIRES_IN=7d`.

The app serves both the frontend and API from one service, so the deployed URL is the submission's Live Website Link.

## Suggested GitHub repository name
`codomax-fullstack-blog`

## Suggested Module submission order
Use the same GitHub repository throughout the internship. Each module submission should point to the current state of the project after that module's work is complete.
