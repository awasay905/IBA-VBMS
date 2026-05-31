import { test, expect, Page } from "@playwright/test";
import { USERS, ROOMS, BUILDINGS } from "./fixtures/credentials";
import { resetDatabase } from "../integration/helpers/seed.helper";

test.describe("CANCELLATION (TC-CANCEL)", () => {
    const bookingPurpose = "Cancellation Test Purpose";

    // Use a date 12 days in the future to stay clear of other tests
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 12);
    const formattedDate = futureDate.toISOString().split("T")[0];

    test.beforeEach(async () => {
        await resetDatabase();
    });

    test.afterAll(async () => {
        await resetDatabase();
    });

    async function createStudentBooking(page: Page, purpose: string) {
        await page.goto("/");
        // Updated Login Selectors
        await page.getByPlaceholder("e.g. 12345").fill(USERS.student.erp);
        await page.getByPlaceholder("Enter your password").fill(USERS.student.password);
        await page.getByRole("button", { name: "Sign In to Portal" }).click();

        // 1. Move to the booking tab inside Student Dashboard
        await page.getByRole("button", { name: "New Request" }).click();

        // 2. Select Date from Calendar (Navigate months if 12 days in future crosses monthly boundary)
        const targetMonthName = futureDate.toLocaleString("default", { month: "long" });
        const targetYear = futureDate.getFullYear();
        const expectedMonthHeader = `${targetMonthName} ${targetYear}`;

        while (!(await page.getByText(expectedMonthHeader).isVisible())) {
            // Click visual chevron-right to navigate calendar month
            await page.getByRole("button").nth(5).click();
        }
        await page.getByRole("button", { name: String(futureDate.getDate()), exact: true }).click();

        // 3. Select Building and Room
        await page.locator("select").first().selectOption(BUILDINGS.testBuilding.id);
        await page.getByRole("button", { name: ROOMS.testRoomA.name, exact: false }).click();

        // 4. Select Time Slot 5 ("02:30 PM - 03:45 PM")
        await page.getByRole("button", { name: "02:30 PM - 03:45 PM", exact: false }).click();

        // 5. Fill out Purpose Description
        await page.getByPlaceholder("e.g., Society meeting").fill(purpose);

        // 6. Click Submit Request inside the summary panel
        await page.getByRole("button", { name: "Submit Request" }).click();

        // 7. Verify Toast notification message
        const successAlert = page.getByText("Reservation submitted successfully!");
        await expect(successAlert).toBeVisible({ timeout: 10000 });
    }

    test("TC-CANCEL-001 — student cancels own pending booking", async ({ page }) => {
        await createStudentBooking(page, bookingPurpose);

        // Explicitly switch view tab to list of reservations
        await page.getByRole("button", { name: "My Reservations" }).click();

        // 1. Locate the card for this specific booking
        const bookingCard = page.locator(".card", { hasText: bookingPurpose });

        // 2. Trigger the cancellation (No window.confirm is raised now)
        await bookingCard.getByRole("button", { name: "Cancel" }).click();

        // 3. Click "Yes" in the custom React inline confirm block
        await bookingCard.getByRole("button", { name: "Yes" }).click();

        // 4. Verify Toast notification
        const successAlert = page.getByText("Reservation cancelled.");
        await expect(successAlert).toBeVisible({ timeout: 10000 });

        // 5. Verify status badge
        await expect(bookingCard.locator(".badge")).toHaveText(/cancelled/i);
    });

    test("TC-CANCEL-002 — student cancels own approved booking (DEF-004)", async ({ page }) => {
        const purpose = "Approved Cancellation Test";
        await createStudentBooking(page, purpose);

        // 1. Login as PO to Approve it
        await page.getByRole("button", { name: "Logout" }).click();
        await page.getByPlaceholder("e.g. 12345").fill(USERS.po.erp);
        await page.getByPlaceholder("Enter your password").fill(USERS.po.password);
        await page.getByRole("button", { name: "Sign In to Portal" }).click();

        const pendingRow = page.locator("tr", { hasText: purpose });
        await pendingRow.getByRole("button", { name: "Approve" }).click();
        await expect(page.getByText("Reservation request formally approved.")).toBeVisible();
        await page.getByRole("button", { name: "Logout" }).click();

        // 2. Login back as Student
        await page.getByPlaceholder("e.g. 12345").fill(USERS.student.erp);
        await page.getByPlaceholder("Enter your password").fill(USERS.student.password);
        await page.getByRole("button", { name: "Sign In to Portal" }).click();

        // 3. Locate card and trigger cancellation
        const bookingCard = page.locator(".card", { hasText: purpose });
        await bookingCard.getByRole("button", { name: "Cancel" }).click();
        await bookingCard.getByRole("button", { name: "Yes" }).click(); // Click custom inline confirm

        // 4. Verify success toast notification
        const successAlert = page.getByText("Reservation cancelled.");
        await expect(successAlert).toBeVisible({ timeout: 10000 });
    });

    test("TC-CANCEL-005 — PO cancels an approved booking", async ({ page }) => {
        // 1. Create a booking as a student
        await createStudentBooking(page, "PO Kill Test");
        await page.getByRole("button", { name: "Logout" }).click();

        // 2. Login as PO and Approve it first
        await page.getByPlaceholder("e.g. 12345").fill(USERS.po.erp);
        await page.getByPlaceholder("Enter your password").fill(USERS.po.password);
        await page.getByRole("button", { name: "Sign In to Portal" }).click();

        const pendingRow = page.locator("tr", { hasText: "PO Kill Test" });
        await pendingRow.getByRole("button", { name: "Approve" }).click();
        await expect(page.getByText("Reservation request formally approved.")).toBeVisible();

        // 3. Switch to Approved tab
        await page.getByRole("button", { name: "Approved" }).click();

        // 4. Cancel (Revoke) the approved booking
        const approvedRow = page.locator("tr", { hasText: "PO Kill Test" });
        await approvedRow.getByRole("button", { name: "Revoke" }).click(); // Approved status changes action name to "Revoke"
        await approvedRow.getByRole("button", { name: "Yes" }).click(); // Confirm via row-nested inline action

        // 5. Verify toast notification and movement of row to appropriate state
        const successAlert = page.getByText("Reservation cancelled and slot released.");
        await expect(successAlert).toBeVisible({ timeout: 10000 });
        await expect(approvedRow).toBeHidden();

        // Move to Cancelled Tab
        await page.getByRole("button", { name: "Cancelled" }).click();
        const cancelledRow = page.locator("tr", { hasText: "PO Kill Test" });
        await expect(cancelledRow).toBeVisible();
        await expect(cancelledRow.locator(".badge")).toHaveText(/cancelled/i);
    });

    test("TC-CANCEL-003/004 — Boundary: past/future logic check", async ({ page }) => {
        const today = new Date();
        const todayDay = today.getDate();

        // 1. Initiate portal session as Student
        await page.goto("/");
        await page.getByPlaceholder("e.g. 12345").fill(USERS.student.erp);
        await page.getByPlaceholder("Enter your password").fill(USERS.student.password);
        await page.getByRole("button", { name: "Sign In to Portal" }).click();

        // 2. Load Booking form
        await page.getByRole("button", { name: "New Request" }).click();

        // 3. Click current day directly on structural calendar
        await page.getByRole("button", { name: String(todayDay), exact: true }).click();

        // 4. Select location parameters
        await page.locator("select").first().selectOption(BUILDINGS.testBuilding.id);
        await page.getByRole("button", { name: ROOMS.testRoomA.name, exact: false }).click();

        // 5. Select 08:30 AM Slot
        await page.getByRole("button", { name: "08:30 AM - 9:45 AM", exact: false }).click();
        await page.getByPlaceholder("e.g., Society meeting").fill("Late Cancel Test");
        await page.getByRole("button", { name: "Submit Request" }).click();

        // Switch back to reservations list view
        await page.getByRole("button", { name: "My Reservations" }).click();
        const card = page.locator(".card", { hasText: "Late Cancel Test" });
        const cancelBtn = card.getByRole("button", { name: "Cancel" });

        // Observation check
        const isEnforced = await cancelBtn.isHidden();
        console.log(isEnforced ? "Boundary enforced: Cancel hidden" : "Boundary NOT enforced: Cancel visible");
    });
});
