# Lumina Dental Studio — Appointment Booking System

A responsive, multi-page dental clinic booking prototype based on the uploaded assignment's requirements and stakeholder roles.

## Included
- Public landing page and treatment catalogue
- Sign-in page and role-based dashboards
- Patient appointment booking, confirmation, appointment list, and demo checkout
- Clinic staff appointment management and status updates
- Dentist appointment manifest and visit status updates
- IT support area: account creation, activity log, JSON backup, and maintenance-mode demo flag
- Node.js backend API with appointment collision checks and local JSON persistence
- Responsive design for desktop and mobile

## Run locally
Requires Node.js 18 or newer. No third-party npm packages are needed.

```bash
npm start
```
Then open http://localhost:3000

## Demo logins
All use password `Demo123!`
- Patient: `patient@demo.com`
- Clinic staff: `staff@demo.com`
- Dentist: `dentist@demo.com`
- IT support: `it@demo.com`

## Assignment alignment and limitations
The assignment explicitly marks live online payments, SMS reminders, medical records/electronic patient records, and a live production deployment as out of scope. Therefore the checkout is **simulated only** and never charges a card. Email/SMS reminders and medical records are not implemented. The project is intended for demonstration and coursework, not real patient data.

## Important prototype security notes
This prototype stores demo user credentials in `data.json` in plain text and uses in-memory sessions. Do not use real passwords or patient data. Before production, add password hashing, durable secure sessions, HTTPS, CSRF protection, rate limiting, database migrations, audit controls, and a real payment provider with its compliance requirements.

## Pages
- `/` — public home
- `/services.html` — treatment catalogue
- `/login.html` — sign-in
- `/book.html` — appointment booking
- `/confirmation.html` — booking confirmation
- `/dashboard.html` — patient dashboard
- `/staff.html` — clinic staff
- `/dentist.html` — dentist schedule
- `/it-support.html` — IT support administration
