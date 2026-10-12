# LearnSpace — Virtual Classroom and Online Tutoring Site

A beginner-friendly FSD lab project using HTML, CSS, JavaScript, Node.js, Express, and MongoDB.

## Features
- Student and teacher registration/login
- Password hashing with bcrypt
- JWT-based authentication
- Course creation by teachers
- Course deletion also removes its scheduled classes and study materials
- Upcoming Classes shows only future sessions belonging to existing courses
- Student course enrollment
- Class scheduling and optional online meeting links
- Study material links
- Role-protected API endpoints
- Responsive frontend

## Requirements
- Node.js LTS and npm
- MongoDB Community Server running locally, or a MongoDB Atlas connection string
- VS Code (recommended)

## Run locally
1. Extract the ZIP and open the `virtual-classroom-fsd` folder in VS Code.
2. Open a terminal in this folder.
3. Install dependencies:
   ```bash
   npm install
   ```
4. Copy `.env.example` to `.env`.
   - Windows Command Prompt: `copy .env.example .env`
   - PowerShell: `Copy-Item .env.example .env`
5. Open `.env`. Set `MONGODB_URI` to your local MongoDB URI or Atlas connection string.
6. Replace `JWT_SECRET` with a long random secret. Do not share the `.env` file.
7. Start the app:
   ```bash
   npm start
   ```
8. Open `http://localhost:3000`.

The server starts only after it connects successfully to MongoDB.

## First demo flow
1. Register an account with role **Teacher / Tutor**.
2. Create a course in the dashboard.
3. Schedule a class and optionally add a Google Meet/Zoom link.
4. Add study material using a valid HTTPS URL.
5. Log out.
6. Register a different account as **Student**.
7. Enroll in the course and check the dashboard for classes and resources.

## API overview
- `GET /api/health`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/courses`
- `POST /api/courses` (teacher)
- `DELETE /api/courses/:id` (course-owning teacher; also removes related classes and materials)
- `POST /api/courses/:id/enroll` (student)
- `GET /api/courses/mine/enrolled` (student)
- `GET /api/courses/mine/teaching` (teacher)
- `GET /api/classes` (logged-in user)
- `POST /api/classes` (teacher)
- `GET /api/materials` (logged-in user)
- `POST /api/materials` (teacher)

## Notes and limitations
- This project stores study resources as URLs, not uploaded files. You can link to PDFs or other files hosted online.
- Online class meetings use external meeting links; this project does not implement video streaming.
- For a production deployment, add rate limiting, stricter validation, CSRF considerations if changing the auth design, account recovery, tests, and more comprehensive authorization checks.
- This is a lab/demo baseline, not a production-ready learning management system.

## Troubleshooting GET/POST requests
- Start the app with `npm start` and confirm the terminal says it connected to MongoDB and is running on port 3000.
- Open `http://localhost:3000/api/health`; it should return JSON with `status: "OK"`.
- Use the app through `http://localhost:3000` rather than opening `index.html` directly from File Explorer.
- Teacher-only POST/DELETE endpoints require a logged-in teacher. Student enrollment POST requires a logged-in student. The browser app adds the JWT automatically after login.
- If the server reports MongoDB connection failure, start MongoDB or correct `MONGODB_URI` in `.env`.
