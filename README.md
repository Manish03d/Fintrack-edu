# FinTrack Edu

FinTrack Edu is a role-based FinTech learning and career ecosystem for students, mentors, and recruiters. The current repository contains a React/Vite client and an Express/Mongoose API with JWT authentication, role-based access control, learning workflows, mentor workflows, and an in-progress recruiter and career ecosystem.

## 1. Project Overview

FinTrack Edu brings together structured FinTech learning, practical exercises, assessments, mentor support, verified skills, and recruiter workflows in one platform.

The intended learning and hiring flow is:

```text
Student
  |
  v
Learning
  |
  v
Practice
  |
  v
Assessment
  |
  v
Skills and performance
  |
  v
Career readiness
  |
  v
Jobs
  |
  v
Recruiter
```

Students can discover courses, work through lessons, track progress, practice FinTech problems, complete assessments, review performance, and pursue jobs through a data-backed career workflow. Mentors can work with students through student directories, mentorship requests, sessions, availability, profiles, and messages. Recruiters can manage their own jobs and applications, discover applicants, inspect candidate profiles, and schedule interviews.

## 2. Key Features

### Student

Implemented or clearly present:

- Registration, login, OTP verification, password reset, and authenticated sessions
- Student dashboard
- Course discovery and course details
- Learning player with lesson progress and notes
- My Courses and enrollment workflows
- Learning Path
- Student progress and performance views
- Practice Zone, practice questions, submissions, and results
- Assessment Center, assessment details, attempts, and results
- Student certificates with course completion checks, downloadable PDF credentials, QR codes, and public verification
- Exams and Assignments views and assignment submission
- Evidence-based Student Skill Tracker with detailed evidence and Skill Passport records
- Career dashboard, editable career profile, job discovery and matching, job applications, application tracking, and interview schedules
- Help Center with searchable FAQs, secure student support tickets, ticket history, replies, reopening, and optional validated attachments
- Persistent notifications with unread/read state and per-category in-app preferences

Currently represented by placeholders or not yet implemented:

- Live classes
- Mentor Connect student workflow
- Leaderboard

### Mentor

The mentor portal includes:

- Mentor dashboard
- Student directory
- Student 360-degree detail view
- Mentor Connect workspace
- Mentorship request accept/decline actions
- Mentor session listing, details, creation, status updates, and cancellation/rescheduling support
- Mentor messages and conversation threads
- Mentor profile
- Mentor availability management

Some additional navigation items still use the shared mentor placeholder page.

### Recruiter

Implemented frontend workflows:

- Recruiter dashboard
- Job listing and management
- Create job and save draft
- Publish and close job with confirmation
- Edit job
- Job details
- Search and filtering for jobs
- Candidate discovery
- Candidate search and filters
- Candidate 360-degree profile
- Candidate Skill Passport, real assessment/practice skill scores, projects, certifications, and application history display
- Data-backed candidate-to-job required-skill matching

Implemented recruiter backend/API surfaces:

- Recruiter dashboard aggregated from the recruiter’s own jobs, applications, and interviews
- Recruiter-owned job CRUD, applications and validated status transitions, candidate profiles scoped to applicants, and interview scheduling/status updates
- Recruiter profile
- Recruiter messages

Recruiter applications and interviews have management screens. Messaging and recruiter profile APIs still use their existing placeholder/in-memory behavior and are outside the completed Career & Jobs workflow.

## 3. System Architecture

### Frontend

- React 18
- Vite
- React Router DOM
- Redux Toolkit and React Redux
- Axios
- Tailwind CSS with PostCSS and Autoprefixer
- Lucide React icons

The browser calls relative `/api` URLs. Vite proxies those requests to the Express server at `http://localhost:5000` during development.

### Backend

- Node.js using ES modules
- Express.js
- Mongoose
- MongoDB
- CORS
- Morgan development logging
- Express Validator dependency
- `bcryptjs` password hashing
- `jsonwebtoken` JWT generation and verification
- `dotenv` environment configuration

### Authentication

Authentication is implemented with JWTs. The client stores the authenticated user and token in local storage, adds the bearer token through the Axios API interceptor, and redirects authenticated portal requests to `/login` after a `401` response.

The backend uses `protect` to validate JWTs and `authorizeRoles` to enforce role access.

### Google OAuth configuration

Google OAuth is an additional server-side authentication method. It uses the same FinTrack JWT, Redux auth state, local storage keys, protected routes, and role authorization as email/password login.

Configure these variables in `server/.env` using values from a Google Cloud OAuth 2.0 Web application:

```text
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
```

Add the callback URL to the Google Cloud OAuth client's authorized redirect URIs. Start the backend and frontend normally. On the login page, **Continue with Google** authenticates an existing account. On the registration page, the selected role is sent to Google, verified profile data returns to the form, and the account is created only after the user completes the remaining FinTrack fields. Google users must have a verified email; a verified matching email never creates a duplicate or changes the stored role. The OAuth routes are `GET /api/auth/google`, `GET /api/auth/google/callback`, and `POST /api/auth/google/register`.

```text
Browser
   |
   v
React + Vite client
   |
   |  Axios /api requests
   v
Express REST API
   |
   +---- Authentication and JWT
   +---- Student APIs
   +---- Mentor APIs
   +---- Recruiter APIs
   +---- Seed and fallback data
   |
   v
MongoDB through Mongoose
```

## 4. User Roles and RBAC

### Student

Students can access the protected `/student/*` portal, learning APIs, practice APIs, assessment APIs, exam and assignment APIs, performance APIs, and the student dashboard. Student-only backend routes use `protect` and `authorizeRoles('student')`.

### Mentor

Mentors can access the protected `/mentor/*` portal, mentor dashboard, student directory, sessions, connect workspace, messages, profile, and availability workflows. Mentor-only backend routes use `protect` and `authorizeRoles('mentor')`.

### Recruiter

Recruiters can access the protected `/recruiter/*` portal. Current completed recruiter frontend areas are the dashboard, job management, candidate discovery, and candidate 360-degree profile. Recruiter backend routes cover dashboard, jobs, candidates, applications, interviews, profile, and messages. These routes use `protect` and `authorizeRoles('recruiter')`.

Client-side protection is implemented by:

- `ProtectedRoute`: redirects unauthenticated users to `/login`.
- `RoleRoute`: redirects users whose role is not allowed to `/unauthorized`.
- `Sidebar`: selects navigation entries based on the authenticated role.

Backend authorization remains authoritative even if a client route is accessed directly.

## 5. Project Structure

```text
fintrack-edu/
|
+-- client/
|   +-- index.html
|   +-- package.json
|   +-- package-lock.json
|   +-- vite.config.js
|   +-- tailwind.config.js
|   +-- postcss.config.js
|   +-- src/
|       +-- App.jsx and main.jsx
|       +-- components/
|       |   +-- common/       Shared buttons, forms, badges, dialogs, tables, and states
|       |   +-- layout/       App shell, sidebar, header, profile, notifications
|       |   +-- recruiter/    Recruiter-specific form components
|       +-- data/             Client fallback/demo data
|       +-- features/         Redux slices, including auth and student learning
|       +-- pages/
|       |   +-- auth/         Login, registration, OTP, reset, error pages
|       |   +-- landing/      Public landing page
|       |   +-- student/      Student learning, practice, assessment, and progress pages
|       |   +-- mentor/       Mentor portal pages
|       |   +-- recruiter/    Recruiter dashboard, jobs, candidates, and placeholders
|       +-- routes/           App routes and route guards
|       +-- services/         Axios-backed API and feature services
|       +-- store/            Redux store setup
|       +-- styles/           Tailwind entry and global CSS
|
+-- server/
|   +-- .env.example
|   +-- package.json
|   +-- package-lock.json
|   +-- server.js             Express application entry point
|   +-- config/db.js          MongoDB connection
|   +-- controllers/          Request handlers
|   +-- middleware/           JWT/RBAC and error middleware
|   +-- models/               Mongoose schemas
|   +-- routes/               Express route modules
|   +-- seed/                 In-memory feature seed/demo data
|   +-- services/             Email service abstraction
|   +-- utils/                Token, password, and database seed utilities
|
+-- README.md
+-- .gitignore
```

There is no root-level package.json. Install and run the client and server from their respective directories.

## 6. Breakpoint Implementation

### BP1 — Foundation and Authentication

**Objective:** Establish the application shell, authentication, user roles, shared navigation, and dashboards.

**Implemented:** React/Vite foundation, Express API, registration, login, OTP verification, password reset flows, JWT authentication, role guards, shared layouts, role sidebars, and student/mentor/recruiter dashboard entry points.

**Status:** COMPLETED for the current foundation scope.

### BP2 — Student Learning Ecosystem

**Objective:** Provide structured FinTech course learning and progress tracking.

**Implemented:** Course discovery, course details, learning player, enrollment, My Courses, lesson completion, wishlist, learning path, progress, and learning-related dashboard data.

**Status:** COMPLETED for the implemented learning scope. Some additional navigation such as live classes remains placeholder functionality.

### BP3 — Practice and Assessment

**Objective:** Add practical FinTech exercises, assessments, exams, assignments, and performance views.

**Implemented:** Practice overview, practice sessions and submissions, assessment center, assessment attempts and results, exams and assignments, assignment submission, and student performance.

**Status:** COMPLETED for the implemented practice and assessment scope.

### BP4 — Mentor Ecosystem

**Objective:** Connect mentors with students through guidance, sessions, availability, and messaging.

**Implemented:** Mentor dashboard, student directory and detail view, connect workspace, mentorship request actions, sessions, session creation and updates, mentor messages, mentor profile, and availability.

**Status:** IN PROGRESS / largely implemented. Several non-core mentor navigation entries still use placeholders.

### BP5 — Recruiter and Career Ecosystem

**Objective:** Add recruiter hiring workflows and student career readiness workflows.

**Implemented:** Evidence-based Student Skill Tracker, student career profile and job discovery, skill matching, duplicate-safe applications and tracking, recruiter-owned job and application workflows, applicant-scoped candidate profiles, interview scheduling and tracking, and persisted in-app notifications.

**Status:** COMPLETED for student career, job application, recruiter application, interview, and notification workflows. The recruiter messaging/profile and other non-career placeholders remain separate existing work.

## 7. Frontend Routes

### Public and authentication

- `/`
- `/login`
- `/register`
- `/verify-otp`
- `/forgot-password`
- `/reset-password`
- `/unauthorized`

### Student

- `/student/dashboard`
- `/student/courses`
- `/student/courses/:courseId`
- `/student/learn/:courseId/:lessonId`
- `/student/my-courses`
- `/student/learning-path`
- `/student/progress`
- `/student/performance`
- `/student/practice`
- `/student/practice/:practiceId`
- `/student/practice/:practiceId/result`
- `/student/assessments`
- `/student/assessments/:assessmentId`
- `/student/assessments/:assessmentId/start`
- `/student/assessments/:assessmentId/result`
- `/student/exams`
- `/student/assignments`
- `/student/live-classes`
- `/student/mentors`
- `/student/certificates`
- `/student/skills`
- `/student/career`
- `/student/career/jobs`
- `/student/career/jobs/:jobId`
- `/student/career/profile`
- `/student/career/applications`
- `/student/career/interviews`
- `/student/notifications`
- `/student/settings`
- `/student/support`

The support route provides a database-backed Help Center and student-scoped ticket tracking.

The leaderboard route currently renders `StudentPlaceholder`.

### Mentor

- `/mentor/dashboard`
- `/mentor/students`
- `/mentor/students/:studentId`
- `/mentor/sessions`
- `/mentor/sessions/new`
- `/mentor/sessions/:sessionId`
- `/mentor/connect`
- `/mentor/messages`
- `/mentor/profile`
- `/mentor/availability`
- `/mentor/live-classes`
- `/mentor/assessments`
- `/mentor/progress`
- `/mentor/notifications`
- `/mentor/settings`
- `/mentor/support`

Several latter routes currently render `MentorPlaceholder`.

### Recruiter

- `/recruiter/dashboard`
- `/recruiter/candidates`
- `/recruiter/candidates/:candidateId`
- `/recruiter/jobs`
- `/recruiter/jobs/new`
- `/recruiter/jobs/:jobId`
- `/recruiter/jobs/:jobId/edit`
- `/recruiter/applications`
- `/recruiter/interviews`
- `/recruiter/students`
- `/recruiter/skill-profiles`
- `/recruiter/internships`
- `/recruiter/placement`
- `/recruiter/messages`
- `/recruiter/notifications`
- `/recruiter/settings`
- `/recruiter/support`

The recruiter dashboard, candidates, candidate profile, jobs, applications, interviews, and notifications routes have implemented frontend screens. Several other recruiter routes still render `RecruiterPlaceholder`.

## 8. API Endpoints

The backend is mounted from `server/server.js` under `/api`.

### Health

- `GET /api/health`

### Authentication

- `POST /api/auth/register`
- `POST /api/auth/verify-otp`
- `POST /api/auth/resend-otp`
- `POST /api/auth/login`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`
- `GET /api/auth/me` — protected

### User dashboards

- `GET /api/users/student/dashboard` — student role
- `GET /api/users/mentor/dashboard` — mentor role
- `GET /api/users/recruiter/dashboard` — recruiter role

### Courses

- `GET /api/courses`
- `GET /api/courses/learning-path`
- `GET /api/courses/:courseId`

### Student learning — student role

- `GET /api/student/learning/enrolled`
- `POST /api/student/learning/enroll`
- `POST /api/student/learning/courses/:courseId/lessons/:lessonId/complete`
- `GET /api/student/learning/wishlist`
- `POST /api/student/learning/wishlist/toggle`
- `GET /api/student/learning/progress-stats`

### Student skills — student role

- `GET /api/student/skills` — evidence-based skill summary, recommendations, and Skill Passport
- `GET /api/student/skills/:skillId` — evidence supporting one tracked skill

Skill scores are the arithmetic mean of the student's completed assessment percentages and practice accuracy mapped to that skill. Levels are Beginner (below 60), Intermediate (60–84), and Advanced (85 or above). Course progress, certificates, and recorded Skill Passport projects are displayed as supporting evidence but do not inflate assessed scores. Skills without a completed assessment or practice result remain unassessed. These endpoints require a connected MongoDB database and only query the authenticated student's records.

### Student practice — student role

- `GET /api/practice/overview`
- `POST /api/practice/start`
- `POST /api/practice/:practiceId/submit`

### Student assessments — student role

- `GET /api/assessments`
- `GET /api/assessments/:assessmentId`
- `POST /api/assessments/:assessmentId/start`
- `POST /api/assessments/:assessmentId/submit`

### Student exams and assignments — student role

- `GET /api/student/exams-assignments`
- `POST /api/student/exams-assignments/assignments/:assignmentId/submit`

### Student performance — student role

- `GET /api/student/performance`

### Student Help & Support — student role

- `GET /api/student/support/tickets` — list the authenticated student's tickets; supports `search`, `status`, `page`, and `limit`
- `POST /api/student/support/tickets` — create a ticket with a server-generated ID, category, subject, description, priority, and optional attachment
- `GET /api/student/support/tickets/:ticketId` — view a ticket and its conversation/status history
- `POST /api/student/support/tickets/:ticketId/replies` — reply to an open or in-progress ticket
- `POST /api/student/support/tickets/:ticketId/reopen` — reopen a resolved or closed ticket

Ticket list, detail, reply, and reopen operations are scoped to the authenticated student. Optional uploads accept PNG, JPEG, WebP, or PDF files up to 5 MB and require the existing Cloudinary configuration. The current RBAC model has no support-agent/admin role, so staff ticket-management endpoints are intentionally not exposed.

### Notifications — authenticated users

- `GET /api/notifications` — recipient-scoped list; accepts `?unread=true`
- `PUT /api/notifications/:id/read` — recipient-scoped mark as read
- `PUT /api/notifications/read-all` — mark all of the current recipient's notifications as read
- `GET /api/notifications/preferences`
- `PUT /api/notifications/preferences` — update in-app categories, including support request updates

Notifications are stored with unique recipient/event keys to deduplicate retried events. Application, interview, assessment, certificate, lesson-completion, mentor-session, matching-job, and successful support-ticket submission events use the recipient's notification preferences.

### Mentor — mentor role

- `GET /api/mentor/dashboard`
- `GET /api/mentor/students`
- `GET /api/mentor/students/:studentId`
- `GET /api/mentor/connect`
- `POST /api/mentor/connect/requests/:requestId`
- `GET /api/mentor/sessions`
- `POST /api/mentor/sessions/new`
- `GET /api/mentor/sessions/:sessionId`
- `PUT /api/mentor/sessions/:sessionId`
- `GET /api/mentor/messages/conversations`
- `GET /api/mentor/messages/thread/:studentId`
- `POST /api/mentor/messages/send`
- `GET /api/mentor/profile`
- `PUT /api/mentor/profile`
- `GET /api/mentor/availability`
- `PUT /api/mentor/availability`

### Recruiter — recruiter role

- `GET /api/recruiter/jobs`
- `POST /api/recruiter/jobs`
- `GET /api/recruiter/jobs/:jobId`
- `PUT /api/recruiter/jobs/:jobId`
- `GET /api/recruiter/applications`
- `PUT /api/recruiter/applications/:applicationId/status`
- `GET /api/recruiter/candidates`
- `GET /api/recruiter/candidates/:candidateId`
- `GET /api/recruiter/interviews`
- `POST /api/recruiter/interviews`
- `GET /api/recruiter/interviews/:interviewId`
- `PUT /api/recruiter/interviews/:interviewId`

Recruiter job, application, candidate, interview, and dashboard data require MongoDB and are restricted to the authenticated recruiter. Candidate records are discoverable only when they applied to one of that recruiter's jobs. A missing database returns a service-unavailable error rather than displaying seeded demo candidates, jobs, or results. Existing job records without a recruiter owner must be explicitly reassigned by an administrator before they become visible; the application does not guess ownership.

### Student Career — student role

- `GET /api/student/career/dashboard`
- `GET /api/student/career/profile`
- `PUT /api/student/career/profile`
- `GET /api/student/career/jobs` — filters include search, company, location, job type, skill, and `eligible=true`
- `GET /api/student/career/jobs/:jobId`
- `POST /api/student/career/jobs/:jobId/apply`
- `GET /api/student/career/applications`
- `GET /api/student/career/interviews`

Job match percentages are the proportion of required skills matching actual profile, assessed Skill Tracker, Passport, project, or certificate evidence; missing skills are returned separately. Skill scores only use completed practice and assessment results. Application creation requires a saved resume URL, rejects expired/closed jobs and duplicate applications, and uses a unique `(jobId, candidateId)` index. Recruiter application status changes follow the existing pipeline and notify the student.

- `GET /api/recruiter/profile`
- `PUT /api/recruiter/profile`
- `GET /api/recruiter/messages`
- `GET /api/recruiter/messages/conversations`
- `GET /api/recruiter/messages/thread/:candidateId`
- `POST /api/recruiter/messages/send`

Recruiter profile and messaging remain existing placeholder/in-memory workflows. Job, application, candidate, interview, and dashboard paths listed above use MongoDB-backed records and do not fall back to demo values.

## 9. Database Models

The server contains the following Mongoose models:

- `User` — account identity, credentials, role, verification, and status
- `StudentProfile` — student academic and learning profile data
- `MentorProfile` — mentor organization, expertise, and profile statistics
- `RecruiterProfile` — recruiter company and hiring profile data
- `Settings` — user settings data
- `Course` — course metadata and learning content
- `Enrollment` — student course enrollment and progress relationship
- `Wishlist` — student saved courses
- `Assessment` — assessment definitions
- `AssessmentAttempt` — student assessment attempt and result data
- `Question` — practice or assessment question data
- `PracticeSession` — student practice session data
- `Assignment` — assignment definitions
- `AssignmentSubmission` — student assignment submissions
- `Notification` — persisted recipient-scoped notifications, read state, category, and idempotent event key
- `SupportTicket` — student-owned ticket details, attachments, messages, status, and history
- `SupportTicketCounter` — atomic per-year ticket ID sequence
- `CandidateProfile` — student career profile and resume details
- `Job` — recruiter-owned job postings
- `JobApplication` — student application, match evidence, and recruiter workflow status
- `Interview` — recruiter-owned interview schedule linked to an application
- `Settings.notificationPreferences` — per-user in-app notification categories
- `MentorAvailability` — mentor availability schedules
- `MentorSession` — mentor and student session bookings
- `MentorshipRequest` — mentorship connection requests
- `MentorMessage` — mentor messaging records
- `SkillPassport` — verified skills, certifications, projects, and badges
- `RecruiterMessage` — recruiter-candidate message records

The recruiter profile and messaging placeholder workflows still rely on their existing seed/in-memory data. The Career & Jobs workflow uses its Mongoose models.

## 10. Technology Stack

| Technology | Purpose |
| --- | --- |
| React 18 | Frontend UI |
| Vite | Frontend development server and production bundling |
| React Router DOM | Client-side routing |
| Redux Toolkit | Client state management |
| React Redux | React bindings for Redux |
| Axios | HTTP client and API interceptors |
| Tailwind CSS | Utility-first styling |
| PostCSS | CSS processing |
| Autoprefixer | CSS vendor prefixing |
| Lucide React | UI icons |
| Node.js | Backend runtime |
| Express.js | REST API server |
| MongoDB | Database |
| Mongoose | MongoDB ODM and schemas |
| PDFKit | Landscape certificate PDF generation |
| qrcode | Certificate verification QR codes |
| JSON Web Token | Authentication tokens |
| bcryptjs | Password hashing and verification |
| CORS | Cross-origin API configuration |
| Morgan | Development HTTP request logging |
| dotenv | Environment variable loading |
| express-validator | Request validation dependency |
| nodemon | Backend development restart tool |

## 11. Prerequisites

- Node.js: use a current compatible Node.js version.
- npm.
- MongoDB for database-backed operation. The server attempts `mongodb://127.0.0.1:27017/fintrack_edu` by default and can fall back to development/mock responses when the database is unavailable.
- A browser for the Vite client.
- One terminal for `npm run dev`; the root script starts both client and server processes.

## 12. Environment Variables

The server reads environment variables through `dotenv`. Copy `server/.env.example` to `server/.env` and replace placeholders with local values. Never commit `server/.env` or real credentials.

```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://127.0.0.1:27017/fintrack_edu
JWT_SECRET=replace_with_a_local_secret
JWT_EXPIRE=30d
CLIENT_URL=http://localhost:5173
MOCK_MODE=true
```

Variables used by the server configuration include:

- `PORT` — Express listening port; defaults to `5000`.
- `NODE_ENV` — controls development logging behavior.
- `MONGO_URI` — MongoDB connection string; defaults to the local database above.
- `JWT_SECRET` — JWT signing secret; use a private local value.
- `JWT_EXPIRE` — JWT expiration setting; defaults to `30d` in token generation.
- `CLIENT_URL` — allowed CORS origin; defaults to `http://localhost:5173`.
- `PUBLIC_APP_URL` — optional public client origin embedded in certificate QR links; defaults to `CLIENT_URL`.
- `MOCK_MODE` — present in the supplied environment example. Current fallback behavior is primarily selected from database connectivity and controller fallback logic.

Do not place passwords, tokens, private MongoDB credentials, or production secrets in this README.

### Student certificates

Student certificate APIs are mounted at `/api/certificates`. The student dashboard lists issued certificates, checks completed course eligibility, and requests issuance; the public endpoint `/api/certificates/verify/:verificationId` exposes only credential status, course, issuer, certificate number, and issue date. PDF downloads include the student's stored account name and a QR code linking to `/verify/:verificationId` on the client.

Certificate issuance requires a persisted enrollment marked complete with 100% progress and a completed-lesson set matching every lesson in the course. Configure course assessment prerequisites with the `requiredAssessmentIds` string array on a `Course` document; the seeded analytics, DeFi, and digital-payments courses use the corresponding seeded assessments. Each prerequisite must have a persisted completed passing attempt meeting that assessment's configured passing percentage. Courses with no configured prerequisites require only verified course completion. Certificate endpoints return an error while MongoDB is unavailable and never use demo enrollment or assessment data for issuance.

## 13. Installation and Running

The root workspace provides one-command full-stack development startup through `concurrently`.

### Install

From the project root:

```bash
npm install
```

This installs the root development runner. To install all root, client, and server dependencies in one step, use:

```bash
npm run install-all
```

The existing package-local installation workflow remains available:

```bash
cd server
npm install

cd ../client
npm install
```

### Configure the server

```bash
copy server\.env.example server\.env
```

On macOS/Linux, use:

```bash
cp server/.env.example server/.env
```

Edit `server/.env` with local MongoDB and JWT settings.

### Seed the development users and profiles

From the repository root:

```bash
cd server
npm run seed
```

The seed utility connects to MongoDB, clears existing `User`, `StudentProfile`, `MentorProfile`, and `RecruiterProfile` documents, and creates the three development role accounts. It does not seed every course, mentor, or recruiter demo record into MongoDB; those feature datasets are also available through the server seed modules and controller fallback paths.

### Start the full application

From the project root:

```bash
npm run dev
```

This starts both processes concurrently:

- `[CLIENT]` — Vite frontend at `http://localhost:5173`
- `[SERVER]` — Express API at `http://localhost:5000`

The Vite development proxy forwards `/api` requests to the backend. MongoDB is used by the backend when available; the existing development/mock fallback behavior remains unchanged.

### Start the backend only

```bash
npm run server
```

This runs the existing server development command, `nodemon server.js`. The API listens on `http://localhost:5000` by default.

### Start the frontend only

```bash
npm run client
```

This runs the existing Vite development command. The client listens on `http://localhost:5173`.

For automatic restarts during backend development, use `npm run server` or run `npm run dev` for the complete application.

### Build the frontend

```bash
npm run build
```

The production output is written to `client/dist/`.

### Preview the production build

```bash
npm run preview --prefix client
```

### Lint status

The client declares an `npm run lint` script, but the current client package does not include an ESLint dependency or executable. Running the script in the current repository therefore requires ESLint to be installed/configured separately.

## 14. Development Notes

- The backend can operate with seeded/mock controller data when MongoDB is unavailable, but persistence-dependent flows require MongoDB.
- The Axios client uses `baseURL: '/api'` and attaches `localStorage` values named `fintrack_token` and `fintrack_user`.
- Recruiter and student pages must remain protected by both client route guards and backend role middleware.
- The current repository has no Git metadata at its root in this workspace, so Git history and status are not available here.
- `client/dist/` is generated output and should not be committed.
## Project Maintainer

Maintained by Manish D.

GitHub: https://github.com/Manish03d