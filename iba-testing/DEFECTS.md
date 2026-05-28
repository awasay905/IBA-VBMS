# Defect Log

| ID | TC | Severity | Title | Status |
|---|---|---|---|---|
| DEF-001 | TC-CANCEL-001, 002, 005 | S2 | Cancelled bookings are incorrectly marked as 'rejected' | Open |
| DEF-002 | TC-BOOK-BUG, TC-CANCEL-BUG | S1 | Unconditional unique DB constraint prevents re-booking cancelled/rejected slots | Open |
| DEF-003 | TC-BOOK-PAST | S2 | Missing validation allows users to book rooms for past dates | Open |
|DEF-004	| TC-CANCEL-002	| S2	| Student dashboard does not show "Cancel" button for approved bookings |	Open |
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

- **TC:** "SHOULD allow re-booking a cancelled slot" & "BUG: Cancelled/Rejected slots should be re-bookable..."
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

- **TC:** "past date rejected (should block bookings on previous dates)"
- **Severity:** S2 (Major)
- **Title:** Missing validation allows users to book rooms for past dates
- **Steps to reproduce:**
  1. Authenticate as a student.
  2. Submit a `POST` request to `/api/bookings` using a date from the past (e.g., `"2020-01-01"`).
- **Expected:** The system should reject the request with a `400 Bad Request` validation error stating that past dates are not allowed.
- **Actual:** The system accepts the booking and returns a `201 Created`.
- **Root cause:** In `iba-backend\src\bookings\bookings.service.ts`, the `CreateBookingDto` only ensures the `date` parameter is a valid string:
  ```typescript
  export class CreateBookingDto {
    @IsUUID()                    room_id: string;
    @IsDateString()              date: string; // <-- Validates format, but not if it's in the future
    ...
  }
  ```
  There is no business logic in the `create` method nor a class-validator decorator (such as a custom `@IsFutureDate()` or `class-validator` equivalents) to prevent historical dates.
- **Status:** Open

--

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
- **Root cause:** In `iba-booking-frontend\src\pages\StudentDashboard.jsx`, the conditional rendering for the cancellation action is strictly limited to the "pending" string:
  ```javascript
  {/* Lines 253-263 in StudentDashboard.jsx */}
  {booking.status === "pending" && (
      <div className="...">
          <button onClick={() => handleCancel(booking.id)} ...>
              Cancel
          </button>
      </div>
  )}
  ```
  The logic fails to include the `approved` status in the allowed state for the UI button.
- **Status:** Open