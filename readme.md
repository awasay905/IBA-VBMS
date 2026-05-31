# IBA Campus Facility Booking System

This project was developed as part of the Software Testing course. The primary objective was to design, implement, and execute a comprehensive testing suite—spanning Unit, Integration, and End-to-End (E2E) testing levels—to validate the system against its Software Requirements Specification (SRS). In addition to writing the test suites, the application's user interface was completely rewritten and modernized, incorporating responsive layouts, custom interactive components, and native dark mode support.

---

## Authors (Group Members)

* Aman Khan	
* Maryam Binte Shahid	
* Hamna Hammad	
* Khansa Danish	
* Tester and UI Improvement: Abdul Wasay Imran

---

## Project Overview

The IBA Campus Facility Booking System is a centralized, role-based platform designed to replace manual, informal facility booking methods. It provides real-time visibility into campus resource availability, enforces structural scheduling rules, prevents double bookings, and manages approval workflows.

### Redesigned User Interface

While the initial assignment focused on testing the backend and existing logic, the frontend was completely overhauled to improve user experience. Key UI enhancements include:
* **Modern Aesthetic:** Transitioned to clean corporate branding utilizing standard design tokens, balanced typography (DM Sans & DM Serif Display), and custom layout structures.
* **Interactive Step-by-Step Wizard:** The student reservation flow was split into a logical multi-step process (Date Selection, Building/Room Configuration, Time Slot Selection, and Purpose Verification) with real-time summary slip updates.
* **Compact KPI Badges:** Bulky dashboards were replaced with concise, responsive data summaries highlighting pending requests, room capacities, active facilities, and scheduling conflicts.
* **Native Theme System:** Built a theme transition system supporting persistent, fully optimized light and dark modes across all student, PO, and admin screens.

---

## Visual Tour

All screenshots are located in `./iba-testing/screenshots` and were automatically captured using our automated E2E screenshot generation tool.

### 1. Authentication Portal
A secure login screen that dynamically recognizes user roles, handles credentials securely, and provides quick-access demo buttons for evaluators.

| Light Mode | Dark Mode |
|------------|-----------|
| ![Login Light](./iba-testing/screenshots/01-login-screen-light.png) | ![Login Dark](./iba-testing/screenshots/01-login-screen-dark.png) |

### 2. Student Portal — My Reservations
Provides students with an immediate timeline of their upcoming reservations, current approval statuses, and cancellation actions.

| Light Mode | Dark Mode |
|------------|-----------|
| ![Student Reservations Light](./iba-testing/screenshots/02-student-my-reservations-light.png) | ![Student Reservations Dark](./iba-testing/screenshots/02-student-my-reservations-dark.png) |

### 3. Student Portal — Booking Wizard
A sequential wizard that guides students through choosing dates, rooms, available slot configurations, and writing the purpose of reservation.

| Light Mode | Dark Mode |
|------------|-----------|
| ![Booking Wizard Light](./iba-testing/screenshots/03-student-request-wizard-light.png) | ![Booking Wizard Dark](./iba-testing/screenshots/03-student-request-wizard-dark.png) |

### 4. Program Office — Pending Requests
The central operations dashboard for the Program Office. It highlights scheduling conflicts, lists active reservations, and hosts quick action triggers.

| Light Mode | Dark Mode |
|------------|-----------|
| ![PO Pending Light](./iba-testing/screenshots/04-po-pending-requests-light.png) | ![PO Pending Dark](./iba-testing/screenshots/04-po-pending-requests-dark.png) |

### 5. Program Office — Approved Requests
A filtered log tracking all officially confirmed reservations on the campus.

| Light Mode | Dark Mode |
|------------|-----------|
| ![PO Approved Light](./iba-testing/screenshots/05-po-approved-requests-light.png) | ![PO Approved Dark](./iba-testing/screenshots/05-po-approved-requests-dark.png) |

### 6. Program Office — Detail Modal
An overlaid inspector that exposes student profiles, contact coordinates, precise reservation slot ranges, and automated conflict warnings.

| Light Mode | Dark Mode |
|------------|-----------|
| ![Detail Modal Light](./iba-testing/screenshots/06-po-details-modal-light.png) | ![Detail Modal Dark](./iba-testing/screenshots/06-po-details-modal-dark.png) |

### 7. System Admin — Reservations
A master operational view for system administrators to oversee all pending, approved, and rejected reservations across all roles.

| Light Mode | Dark Mode |
|------------|-----------|
| ![Admin Reservations Light](./iba-testing/screenshots/07-admin-reservations-light.png) | ![Admin Reservations Dark](./iba-testing/screenshots/07-admin-reservations-dark.png) |

### 8. System Admin — Building Management
An administration layout to quickly register new physical buildings or remove existing structures.

| Light Mode | Dark Mode |
|------------|-----------|
| ![Admin Buildings Light](./iba-testing/screenshots/08-admin-buildings-light.png) | ![Admin Buildings Dark](./iba-testing/screenshots/08-admin-buildings-dark.png) |

### 9. System Admin — Room Specifications
Enables administrators to allocate specific room capacities, configure venue types (e.g. Seminar Hall, Computer Lab), and map them to parent structures.

| Light Mode | Dark Mode |
|------------|-----------|
| ![Admin Rooms Light](./iba-testing/screenshots/09-admin-rooms-light.png) | ![Admin Rooms Dark](./iba-testing/screenshots/09-admin-rooms-dark.png) |

### 10. System Admin — Student Enrollment Registry
Allows on-demand student account enrollment, mapping ERP IDs, full names, and academic emails directly to the central database.

| Light Mode | Dark Mode |
|------------|-----------|
| ![Admin Students Light](./iba-testing/screenshots/10-admin-students-light.png) | ![Admin Students Dark](./iba-testing/screenshots/10-admin-students-dark.png) |

### 11. System Admin — Program Office Staff Registry
Enables system administrators to appoint official PO coordinators, allocating their administrative credentials.

| Light Mode | Dark Mode |
|------------|-----------|
| ![Admin Staff Light](./iba-testing/screenshots/11-admin-staff-light.png) | ![Admin Staff Dark](./iba-testing/screenshots/11-admin-staff-dark.png) |

---

## Tech Stack

* **Frontend:** React (Vite), TailwindCSS 4, Lucide React (Icons), Sonner (Toasts)
* **Backend:** NestJS, Passport.js (JWT Authentication Strategy), Class-Validator (DTO Validation)
* **Database:** Supabase (PostgreSQL), with customized unique constraints, indexes, and automated triggers
* **Testing:** Playwright (E2E UI Testing), Jest (Unit Testing), Supertest (API Integration Testing), Postman (API Collections)

---

## Testing Framework & Implementation

This project implements a multi-tier testing architecture to ensure high reliability, validation, and schema consistency.

### 1. Unit Testing (Jest)
Located in `iba-testing/unit`, these tests run against mocked database instances to validate backend service methods independently of network latency:
* **AuthService (`auth.service.test.ts`):** Validates password hashing, invalid credential rejections, and successful JWT issuance for Students and PO members.
* **BlockedSlotsService (`blocked-slots.service.test.ts`):** Validates administrative block rules, reason fallbacks, list querying, and unblocking idempotency.
* **BookingsService (`bookings.service.test.ts`):** Verifies conflict checks, prevents booking blocked rooms, enforces safety guards against unauthorized user actions, and validates cancellation conditions.
* **Buildings/Rooms/Users Services:** Confirms structured database entries are successfully processed, mapped, and queried.

### 2. Integration Testing (Supertest)
Located in `iba-testing/integration`, these tests evaluate server endpoint integrations, validation pipelines, and relational database constraints:
* **User Management (`admin.users.test.ts`):** Validates duplicate ERP rejections, email pattern enforcements, and database persistence.
* **Facility Allocation (`admin.rooms.test.ts`):** Tests physical layout creation, capacity integer checks, and unblocked/blocked slot lifecycles.
* **Auth RBAC (`auth.rbac.test.ts`):** Enforces strict route authorization limits. Students and Program Office members are restricted from structural administrative routes (HTTP 403 Forbidden).
* **Booking Creation (`bookings.create.test.ts`):** Tests happy-path request pipelines, past-date booking rejections, and boundary validations (ensuring out-of-bound slots receive HTTP 400 Bad Request).
* **Cancellation (`bookings.cancel.test.ts`):** Confirms logic guards, ensuring students can cancel their own slots but are blocked from modifying requests submitted by other students.
* **Concurrency (`bookings.concurrency.test.ts`):** Tests simultaneous approval requests for the same slot. Verifies that the database unique indexes maintain structural integrity by approving one request (HTTP 200) and rejecting the other (HTTP 409).

### 3. End-to-End (E2E) Testing (Playwright)
Located in `iba-testing/e2e`, these tests launch actual headless/headed browser sessions to walk through core frontend workflows:
* **Auth Flows (`auth.spec.ts`):** Validates login forms, login state persistence, invalid feedback, and logout routing.
* **Admin Tasks (`admin.spec.ts`):** Performs system administration tasks, validating student enrollment, staff assignment, building registration, and room allocations.
* **Booking Wizard (`student-booking.spec.ts`):** Walks through the wizard steps, testing slot configurations, date navigations, and confirmation toasts.
* **PO Actions & Approvals (`po-approval.spec.ts`):** Evaluates approval decisions, validates reject actions, and checks conflict resolution mechanisms (such as auto-rejecting overlapping requests once a slot is approved).
* **Booking Cancellations (`cancellation.spec.ts`):** Validates student-driven pending cancellations, approved slot revocations, and PO-driven overrides.

---

## Installation & Setup

### Prerequisites
* Node.js (v18+)
* PostgreSQL Database or Supabase Account

### Backend Configuration

1. Navigate to the backend directory:
   ```bash
   cd iba-backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create your local environment file:
   ```bash
   cp .env.example .env
   ```
4. Configure the variables inside `.env` to connect with your database:
   ```env
   SUPABASE_URL=https://your-project-url.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-secret-service-role-key
   JWT_SECRET=your-secure-jwt-secret-string
   PORT=3000
   FRONTEND_URL=http://localhost:5173
   DATABASE_URL=postgresql://postgres:your-password@db.your-project.supabase.co:5432/postgres
   ```
5. Apply the initial schema and seed data by running the script:
   ```bash
   npm run start:dev
   ```

### Frontend Configuration

1. Navigate to the frontend directory:
   ```bash
   cd iba-booking-frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the Vite development server:
   ```bash
   npm run dev
   ```

---

## Execution of Test Suites

Ensure your backend server is running locally on port 3000 before executing integration or E2E tests.

### Running Unit and Integration Tests (Jest & Supertest)
All NestJS backend tests are executed from the testing directory.

1. Navigate to the testing directory:
   ```bash
   cd iba-testing
   ```
2. Configure `.env.test` with your test database credentials.
3. Run Jest tests:
   ```bash
   # Execute unit tests
   npm run test:unit

   # Execute integration tests
   npm run test:integration
   ```

### Running End-to-End Tests (Playwright)
E2E browser tests automate standard user scenarios:

1. Install Playwright browser engines (first-time setup):
   ```bash
   npx playwright install
   ```
2. Execute E2E tests:
   ```bash
   npx playwright test
   ```

### Regenerating Portfolio Screenshots
To regenerate the light and dark mode portfolio screenshots, run:
```bash
npx playwright test e2e/generate-screenshots.spec.ts --project=chromium
```
This script will cycle through each user role, toggle themes, and output high-definition screenshots into the `./iba-testing/screenshots` directory.