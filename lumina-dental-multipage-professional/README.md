# Lumina Dental Studio — Multi-page Dental Clinic Booking System

A responsive multi-page dental clinic website prototype with a custom-branded visual style using the supplied dental logo.

## Pages included
- Home page (`/`)
- Treatments / services (`/services.html`)
- Login (`/login.html`)
- Appointment booking (`/book.html`)
- Booking confirmation (`/confirmation.html`)
- Patient dashboard (`/dashboard.html`)
- Clinic staff administration (`/staff.html`)
- Dentist dashboard (`/dentist.html`)
- IT support administration (`/it-support.html`)

## Run locally
Requires Node.js 18 or newer. Open a terminal **inside the extracted project folder** (the folder containing `package.json` and `server.js`) and run:

```bash
npm start
```

Then open http://localhost:3000

## Demo accounts
All demo accounts use password `Demo123!`:
- Patient: `patient@demo.com`
- Clinic staff: `staff@demo.com`
- Dentist: `dentist@demo.com`
- IT support: `it@demo.com`

## Important prototype notes
- This is a multi-page website, not a single-page design.
- Payment is simulated; no real payment is taken.
- Data is stored locally for demonstration. Do not use real patient or payment information.
- Before business deployment, add production-grade authentication, authorization checks, secure secrets, encrypted storage, backups, audit controls, privacy notices, and a real payment provider if needed.
- The logo mark supplied by the user is included at `public/assets/lumina-logo-mark.png`. The gray grid background from the reference screenshot is excluded from the site branding.
