# Defect Log

| ID | TC | Severity | Title | Status |
|---|---|---|---|---|
| DEF-001 | TC-CANCEL-001, 002, 005 | S2 | Cancelled bookings are incorrectly marked as 'rejected' | Open |
| DEF-002 | TC-BOOK-BUG, TC-CANCEL-BUG | S1 | Unconditional unique DB constraint prevents re-booking cancelled/rejected slots | Open |
| DEF-003 | TC-BOOK-PAST | S2 | Missing validation allows users to book rooms for past dates | Open |
| DEF-004 | TC-CANCEL-002 | S2 | Student dashboard does not show "Cancel" button for approved bookings | Open |
| DEF-005 | TC-BOOK-008 (Boundary) | S2 | Missing "Current Year" date constraint allows bookings in far future/past | Open |
| DEF-006 | TC-BOOK-004, 005 | S3 | Time slots in database violate SRS business hours (9 AM - 6 PM) | Open |
| DEF-007 | TC-CANCEL-004 | S2 | Missing boundary check allows cancellation of bookings after their start time | Open |
| DEF-008 | TC-ADMIN-006 | S2 | Missing feature: "Disable Room" completely is implemented only as "Block Slot" | Open |
| DEF-009 | TC-AUTH-001 | S3 | Missing "Faculty/Teacher" user role | Open |
| DEF-010 | TC-BOOK-010 | S1 | Missing Range Validation on `slot_id` crashes the Database | Open |
| DEF-011 | TC-DATA-002 | S1 | Deleting a user or room wipes out historical booking records (Audit Trail destruction) | Open |
| DEF-012 | TC-DATA-001 | S2 | Student cancellation overwrites the `reviewed_by` field with the Student's UUID | Open |
| DEF-013 | TC-PO-001, TC-PERF-001 | S2 | `GET /bookings` fetches all historical records without pagination | Open |
| DEF-014 | TC-SEC-001 | S2 | Booking `purpose` field is vulnerable to Cross-Site Scripting (XSS) | Open |

---

## DEF-001 detail

- **TC:** TC-CANCEL-001, TC-CANCEL-002, TC-CANCEL-005
- **Severity:** S2 (Major)
- **Title:** Cancelled bookings are incorrectly marked as 'rejected'
- **Steps to reproduce:**
  1. Authenticate as a student.
  2. Create a pending room booking.
  3. Send a `PATCH` request to `/api/bookings/:id/cancel` to cancel the newly created booking.
  4. Observe the returned payload.
- **Expected:** The booking status should be updated to `"cancelled"`.
- **Actual:** The booking status is returned as `"rejected"`.
- **Root cause:** In `iba-backend\src\bookings\bookings.service.ts`, the `cancel` function hardcodes the target status to `'rejected'`. 
  ```typescript
  async cancel(id: string, requesterId: string, requesterRole: string) {
      // ... authorization checks ...
      return this.updateStatus(id, 'rejected', requesterId); // <-- Hardcoded to 'rejected' instead of 'cancelled'
  }
  ```
- **Status:** Open

---

## DEF-002 detail

- **TC:** TC-BOOK-BUG, TC-CANCEL-BUG
- **Severity:** S1 (Critical)
- **Title:** Unconditional unique DB constraint prevents re-booking cancelled/rejected slots
- **Steps to reproduce:**
  1. Create a booking for a specific room, date, and slot.
  2. Cancel (or reject) that booking.
  3. Attempt to create a new booking for the exact same room, date, and slot.
- **Expected:** The system should accept the new booking and return a `201 Created` because the previous booking is no longer active.
- **Actual:** The system throws a `500 Internal Server Error` (Database constraint violation).
- **Root cause:** In `iba-backend\supabase-schema.sql`, the `bookings` table defines an unconditional unique constraint: `UNIQUE (room_id, date, slot_id)`. While the backend service code (`bookings.service.ts`) correctly checks for conflicts by looking only for active (`'pending'`, `'approved'`) statuses before inserting, the database-level constraint indiscriminately blocks any duplicate insert for a slot, even if the prior record's status is `cancelled` or `rejected`.
- **Status:** Open

---

## DEF-003 detail

- **TC:** TC-BOOK-PAST
- **Severity:** S2 (Major)
- **Title:** Missing validation allows users to book rooms for past dates
- **Steps to reproduce:**
  1. Authenticate as a student.
  2. Submit a `POST` request to `/api/bookings` using a date from the past (e.g., `"2020-01-01"`).
- **Expected:** The system should reject the request with a `400 Bad Request` validation error stating that past dates are not allowed.
- **Actual:** The system accepts the booking and returns a `201 Created`.
- **Root cause:** In `iba-backend\src\bookings\bookings.service.ts`, the `CreateBookingDto` only ensures the `date` parameter is a valid string. There is no business logic in the `create` method nor a class-validator decorator (such as `@IsFutureDate()`) to prevent historical dates.
- **Status:** Open

---

## DEF-004 detail

- **TC:** TC-CANCEL-002
- **Severity:** S2 (Major)
- **Title:** Student dashboard does not show "Cancel" button for approved bookings
- **Steps to reproduce:**
  1. Authenticate as a student.
  2. Create a room booking and wait for a Program Office member to "Approve" it.
  3. Navigate to the Student Dashboard.
  4. Locate the card corresponding to the "Approved" booking.
  5. Observe the available action buttons.
- **Expected:** As per SRS 2.9, users should be able to cancel a booking before the start time. The "Cancel" button should be visible on the booking card regardless of whether the status is "Pending" or "Approved".
- **Actual:** The "Cancel" button is missing. Action buttons only appear for bookings with a "Pending" status.
- **Root cause:** In `iba-booking-frontend\src\pages\StudentDashboard.jsx`, the conditional rendering for the cancellation action is strictly limited to the "pending" string. The logic fails to include the `approved` status.
- **Status:** Open

---

## DEF-005 detail

- **TC:** TC-BOOK-008 (Boundary)
- **Severity:** S2 (Major)
- **Title:** Missing "Current Year" date constraint allows bookings in far future/past
- **Steps to reproduce:**
  1. Authenticate as a student.
  2. Submit a `POST` request to `/api/bookings` using a date far in the future (e.g., `"2028-01-01"`).
- **Expected:** System should reject the booking with a `400 Bad Request` per SRS 2.2.3 which limits bookings to the "current year".
- **Actual:** The system accepts the booking and returns `201 Created`.
- **Root cause:** The frontend restricts past dates via `min={new Date()....}` in HTML, but there is no `max` attribute. Furthermore, the backend `CreateBookingDto` uses `@IsDateString()` which accepts any valid date format without validating boundaries.
- **Status:** Open

---

## DEF-006 detail

- **TC:** TC-BOOK-004, TC-BOOK-005
- **Severity:** S3 (Minor)
- **Title:** Time slots in database violate SRS business hours (9 AM - 6 PM)
- **Steps to reproduce:**
  1. Log into the system and navigate to the booking form.
  2. Open the "Time Slot" dropdown or query the `/api/time-slots` endpoint.
- **Expected:** The available time slots should exclusively cover the 9 AM to 6 PM window, as per SRS 2.2.3.
- **Actual:** The available time slots start at 08:30 and end at 18:45.
- **Root cause:** The `supabase-schema.sql` explicitly hardcodes `time_slots` outside of the stated business hours.
- **Status:** Open

---

## DEF-007 detail

- **TC:** TC-CANCEL-004
- **Severity:** S2 (Major)
- **Title:** Missing boundary check allows cancellation of bookings after their start time
- **Steps to reproduce:**
  1. Authenticate as a student or PO.
  2. Locate an "Approved" booking where the scheduled `date` and `start_time` have already passed.
  3. Send a `PATCH /api/bookings/:id/cancel` request.
- **Expected:** System should reject the cancellation with a `400 Bad Request`, per SRS 2.9.1 ("Cancel booking before the booking start time").
- **Actual:** The system accepts the cancellation and returns `200 OK`.
- **Root cause:** The backend `cancel()` function in `bookings.service.ts` only validates if the status is `'pending'` or `'approved'`. It fails to perform a temporal boundary check comparing the current server time to the slot's scheduled time.
- **Status:** Open

---

## DEF-008 detail

- **TC:** TC-ADMIN-006
- **Severity:** S2 (Major)
- **Title:** Missing feature: "Disable Room" completely is implemented only as "Block Slot"
- **Steps to reproduce:**
  1. Log in as an Admin and navigate to the admin dashboard.
  2. Attempt to disable a room indefinitely or for a prolonged period.
- **Expected:** As per SRS 2.6, admins should be able to temporarily or permanently disable a room entirely.
- **Actual:** Admins can only block specific 1h 15m slots on specific dates via `BlockedSlots`. There is no mechanism to set an `is_active` flag to false on a room.
- **Root cause:** The backend architecture did not implement a dedicated feature or boolean flag (`is_active: boolean`) on the `rooms` table to accommodate this requirement.
- **Status:** Open

---

## DEF-009 detail

- **TC:** TC-AUTH-001
- **Severity:** S3 (Minor)
- **Title:** Missing "Faculty/Teacher" user role
- **Steps to reproduce:**
  1. Attempt to create a user account via API with the role `faculty` or `teacher`.
- **Expected:** The user should be created successfully to satisfy SRS Objective 6 ("distinguish between a student and a faculty/teacher applicant").
- **Actual:** A database constraint violation or API validation error occurs.
- **Root cause:** The `user_role` ENUM in `supabase-schema.sql` only specifies `('student', 'programoffice', 'admin')`. The `faculty` role does not exist in the database or DTO schemas.
- **Status:** Open

---

## DEF-010 detail

- **TC:** TC-BOOK-010
- **Severity:** S1 (Critical)
- **Title:** Missing Range Validation on `slot_id` crashes the Database
- **Steps to reproduce:**
  1. Authenticate as a student.
  2. Submit a `POST` request to `/api/bookings` with `slot_id: 9999`.
- **Expected:** The system should return a graceful `400 Bad Request` validation error.
- **Actual:** The system throws an unhandled `500 Internal Server Error`.
- **Root cause:** In `CreateBookingDto` (`bookings.service.ts`), `slot_id` only has `@IsInt()`. It lacks `@Min(1)` and `@Max(7)`. The payload bypasses NestJS validation and hits the Supabase PostgreSQL Foreign Key constraint directly.
- **Status:** Open

---

## DEF-011 detail

- **TC:** TC-DATA-002
- **Severity:** S1 (Critical)
- **Title:** Deleting a user or room wipes out historical booking records (Audit Trail destruction)
- **Steps to reproduce:**
  1. Identify a user with past or active bookings.
  2. As an Admin, execute a `DELETE` request to `/api/users/:id` for that user.
  3. Query the `/api/bookings` endpoint.
- **Expected:** The booking records should remain in the database (e.g., setting the `user_id` to NULL or soft-deleting the user) to maintain an accurate audit history (SRS Objective 7).
- **Actual:** All bookings associated with the deleted user (or room) are completely erased from the database.
- **Root cause:** In `supabase-schema.sql`, the `bookings` table defines foreign keys with `ON DELETE CASCADE` for both `user_id` and `room_id`.
- **Status:** Open

---

## DEF-012 detail

- **TC:** TC-DATA-001
- **Severity:** S2 (Major)
- **Title:** Student cancellation overwrites the `reviewed_by` field with the Student's UUID
- **Steps to reproduce:**
  1. Create a booking as a Student.
  2. Approve the booking as a Program Office member.
  3. Cancel the approved booking as the Student.
  4. Inspect the booking record in the database.
- **Expected:** The `reviewed_by` field should retain the UUID of the Program Office member who approved it, while the cancellation actor should be tracked separately.
- **Actual:** The `reviewed_by` field is overwritten by the Student's UUID.
- **Root cause:** In `bookings.service.ts`, the `cancel()` function calls `return this.updateStatus(id, 'rejected', requesterId);`. This passes the student's ID into the `reviewed_by` column.
- **Status:** Open

---

## DEF-013 detail

- **TC:** TC-PO-001, TC-PERF-001
- **Severity:** S2 (Major)
- **Title:** `GET /bookings` fetches all historical records without pagination
- **Steps to reproduce:**
  1. Seed the database with a high volume of bookings (e.g., 5,000+).
  2. Log in as a Program Office member and navigate to the dashboard.
  3. Observe the network payload size and loading time.
- **Expected:** The API should return paginated results (e.g., limited to 50 or 100 records per request) to ensure system performance and responsiveness.
- **Actual:** The API fetches and returns every booking in the database simultaneously.
- **Root cause:** The `findAll` method in `bookings.service.ts` constructs a query (`this.supabase.db.from('bookings').select(SELECT)`) without appending `.limit()` or accepting pagination parameters.
- **Status:** Open

---

## DEF-014 detail

- **TC:** TC-SEC-001
- **Severity:** S2 (Major)
- **Title:** Booking `purpose` field is vulnerable to Cross-Site Scripting (XSS)
- **Steps to reproduce:**
  1. Authenticate as a student.
  2. Create a booking with a malicious payload in the purpose field, e.g., `<script>alert('XSS')</script>`.
  3. Navigate to the PO Dashboard to view the pending bookings.
- **Expected:** The backend should sanitize the input, or the API should reject payloads containing HTML/script tags.
- **Actual:** The malicious payload is accepted and stored in the database. (If the frontend does not safely escape it, it can execute).
- **Root cause:** The `CreateBookingDto` relies solely on `@IsString()` and `@IsNotEmpty()`. There is no sanitization layer (such as `class-sanitizer` or HTML escaping middleware) implemented in the NestJS backend.
- **Status:** Open



DEF-015 (Severity 2): The GET /api/bookings and GET /api/bookings/:id API endpoints explicitly omit the reviewed_by column in their SQL SELECT statements (src/bookings/bookings.service.ts). This breaks the audit trail visibility on the frontend, preventing users from seeing which PO member approved/rejected their request.