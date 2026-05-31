import { test, expect } from "@playwright/test";
import { USERS, ROOMS, BUILDINGS } from "./fixtures/credentials";
import { resetDatabase } from "../integration/helpers/seed.helper";

test.describe("PO (TC-PO)", () => {
    const bookingPurpose = "Test Booking";

    // Use 8 days from now to avoid colliding with the 7-day seed data
    const eightDaysFromNow = new Date();
    eightDaysFromNow.setDate(eightDaysFromNow.getDate() + 8);

    // After all tests are done, reset db for next browser
    test.afterAll(async () => {
        await resetDatabase();
    });

    // Reset DB and create a booking before each test to ensure we have a pending booking to approve/reject
    test.beforeEach(async ({ page }) => {
        await resetDatabase();

        const day = eightDaysFromNow.getDate();
        const shortMonthUpper = eightDaysFromNow.toLocaleDateString("en-US", { month: "short" }).toUpperCase();

        // 1. Login Student
        await page.goto("/");
        await page.getByPlaceholder("e.g. 12345").fill(USERS.student.erp);
        await page.getByPlaceholder("Enter your password").fill(USERS.student.password);
        await page.getByRole("button", { name: "Sign In to Portal" }).click();
        await expect(page.getByRole("heading", { name: "Student Portal" })).toBeVisible();
        await expect(page.getByText("Test Student")).toBeVisible();

        // 2. Open New Request form
        await page.getByRole("button", { name: "New Request" }).click();

        // 3. Select Date from Calendar
        const targetMonthName = eightDaysFromNow.toLocaleString("default", { month: "long" });
        const targetYear = eightDaysFromNow.getFullYear();
        const expectedMonthHeader = `${targetMonthName} ${targetYear}`;

        while (!(await page.getByText(expectedMonthHeader).isVisible())) {
            await page.getByRole("button").nth(5).click();
        }
        await page.getByRole("button", { name: String(day), exact: true }).click();

        // 4. Select Building & Room
        await page.locator("select").first().selectOption(BUILDINGS.testBuilding.id);
        const roomButton = page.getByRole("button", { name: ROOMS.testRoomA.name, exact: false });
        await expect(roomButton).toBeVisible();
        await roomButton.click();

        // 5. Select Time Slot 3 ("11:30 AM - 12:45 PM")
        await page.getByRole("button", { name: "11:30 AM - 12:45 PM", exact: false }).click();
        await page.getByPlaceholder("e.g., Society meeting").fill(bookingPurpose);

        // 6. Submit request
        await page.getByRole("button", { name: "Submit Request" }).click();

        // 7. Verify Success Toast
        const successAlert = page.getByText("Reservation submitted successfully!");
        await expect(successAlert).toBeVisible({ timeout: 10000 });

        // 8. Locate card in Reservations list
        const newBookingCard = page.locator(".card", { hasText: bookingPurpose });
        await expect(newBookingCard).toBeVisible({ timeout: 10000 });

        // Scoped inner assertions to confirm card metadata
        await expect(newBookingCard.getByText("Test Room A")).toBeVisible();
        await expect(newBookingCard.getByText("Test Building")).toBeVisible();
        await expect(newBookingCard.getByText("11:30 AM - 12:45 PM")).toBeVisible();
        await expect(newBookingCard.locator(".badge")).toHaveText(/pending/i);
        await expect(newBookingCard.getByText(shortMonthUpper, { exact: true })).toBeVisible();
        await expect(newBookingCard.getByText(day.toString(), { exact: true })).toBeVisible();

        // Logout
        await page.getByRole("button", { name: "Logout" }).click();
    });

    test("TC-PO-001 — view pending requests", async ({ page }) => {
        // Login as PO
        await page.goto("/");
        await page.getByPlaceholder("e.g. 12345").fill(USERS.po.erp);
        await page.getByPlaceholder("Enter your password").fill(USERS.po.password);
        await page.getByRole("button", { name: "Sign In to Portal" }).click();
        await expect(page.getByRole("heading", { name: "Program Office" })).toBeVisible();
        await expect(page.getByText("Test PO")).toBeVisible();

        // Making sure we are on pending tab
        await expect(page.getByRole("cell", { name: "Pending" })).toBeVisible();

        // Verify the booking details exist in the workspace table
        await expect(page.locator("tbody")).toContainText(ROOMS.testRoomA.name);
        await expect(page.locator("tbody")).toContainText(BUILDINGS.testBuilding.name);
        await expect(page.locator("tbody")).toContainText(bookingPurpose);
        await expect(page.getByRole("cell", { name: bookingPurpose })).toBeVisible();
    });

    test("TC-PO-002 — approve a pending request", async ({ page }) => {
        // Login as PO
        await page.goto("/");
        await page.getByPlaceholder("e.g. 12345").fill(USERS.po.erp);
        await page.getByPlaceholder("Enter your password").fill(USERS.po.password);
        await page.getByRole("button", { name: "Sign In to Portal" }).click();
        await expect(page.getByRole("heading", { name: "Program Office" })).toBeVisible();
        await expect(page.getByText("Test PO")).toBeVisible();

        // Making sure we are on pending tab
        await expect(page.getByRole("cell", { name: "Pending" })).toBeVisible();

        // Find row by purpose
        const pendingRow = page.locator("tr", { hasText: bookingPurpose });
        await expect(pendingRow).toBeVisible();

        // Approved action is direct (no nested confirm step required)
        await pendingRow.getByRole("button", { name: "Approve" }).click();

        // Wait for success toast
        const successAlert = page.getByText("Reservation request formally approved.");
        await expect(successAlert).toBeVisible({ timeout: 10000 });

        // Go to approved bookings tab
        await page.getByRole("button", { name: "Approved" }).click();

        // Verify row exists inside the Approved tab list
        const approvedRow = page.locator("tr", { hasText: bookingPurpose });
        await expect(approvedRow).toBeVisible();

        // Assert row metadata
        await expect(approvedRow).toContainText(USERS.student.erp);
        await expect(approvedRow).toContainText(ROOMS.testRoomA.name);
        await expect(approvedRow.locator(".badge")).toHaveText(/approved/i);
        await expect(approvedRow).toContainText("11:30 AM - 12:45 PM");
    });

    test("TC-PO-003 — reject a pending request", async ({ page }) => {
        // Login as PO
        await page.goto("/");
        await page.getByPlaceholder("e.g. 12345").fill(USERS.po.erp);
        await page.getByPlaceholder("Enter your password").fill(USERS.po.password);
        await page.getByRole("button", { name: "Sign In to Portal" }).click();
        await expect(page.getByRole("heading", { name: "Program Office" })).toBeVisible();
        await expect(page.getByText("Test PO")).toBeVisible();

        // Making sure we are on pending tab
        await expect(page.getByRole("cell", { name: "Pending" })).toBeVisible();

        // Find row specifically by unique purpose
        const pendingRow = page.locator("tr", { hasText: bookingPurpose });
        await expect(pendingRow).toBeVisible();

        // Trigger rejection flow
        await pendingRow.getByRole("button", { name: "Reject" }).click();

        // Click "Yes" inside the row-nested confirm popup block
        await pendingRow.getByRole("button", { name: "Yes" }).click();

        // Await Toast feedback
        const successAlert = page.getByText("Reservation request rejected.");
        await expect(successAlert).toBeVisible({ timeout: 10000 });

        // Go to rejected bookings tab
        await page.getByRole("button", { name: "Rejected" }).click();

        // Verify row inside Rejected tab
        const rejectedRow = page.locator("tr", { hasText: bookingPurpose });
        await expect(rejectedRow).toBeVisible();

        // Assert row metadata
        await expect(rejectedRow).toContainText(USERS.student.erp);
        await expect(rejectedRow).toContainText(ROOMS.testRoomA.name);
        await expect(rejectedRow.locator(".badge")).toHaveText(/rejected/i);
        await expect(rejectedRow).toContainText("11:30 AM - 12:45 PM");
    });

    test("TC-PO-004 — conflict resolution: auto-reject overlapping requests", async ({ page }) => {
        const dateForConflict = eightDaysFromNow;
        const day = dateForConflict.getDate();
        const purposeA = "Student A - High Priority Meeting";
        const purposeB = "Student B - Overlapping Request";

        // Helper workflow to submit student requests
        const submitStudentRequest = async (erp: string, pass: string, purpose: string) => {
            await page.goto("/");
            await page.getByPlaceholder("e.g. 12345").fill(erp);
            await page.getByPlaceholder("Enter your password").fill(pass);
            await page.getByRole("button", { name: "Sign In to Portal" }).click();

            await page.locator(".nav-tabs").getByRole("button", { name: "New Request" }).click();

            // Select Date
            const targetMonthName = dateForConflict.toLocaleString("default", { month: "long" });
            const targetYear = dateForConflict.getFullYear();
            const expectedMonthHeader = `${targetMonthName} ${targetYear}`;

            while (!(await page.getByText(expectedMonthHeader).isVisible())) {
                await page.getByRole("button").nth(5).click();
            }
            await page.getByRole("button", { name: String(day), exact: true }).click();

            // Select Building & Room
            await page.locator("select").first().selectOption(BUILDINGS.testBuilding.id);
            const roomButton = page.getByRole("button", { name: ROOMS.testRoomA.name, exact: false });
            await expect(roomButton).toBeVisible();
            await roomButton.click();

            // Select Time Slot 4 ("01:00 PM - 02:15 PM")
            await page.getByRole("button", { name: "01:00 PM - 02:15 PM", exact: false }).click();

            // Fill Purpose & Submit
            await page.getByPlaceholder("e.g., Society meeting").fill(purpose);
            await page.getByRole("button", { name: "Submit Request" }).click();
            await expect(page.getByText("Reservation submitted successfully!")).toBeVisible();
            await page.getByRole("button", { name: "Logout" }).click();
        };

        // --- STEP 1: Student A creates booking ---
        await submitStudentRequest(USERS.student.erp, USERS.student.password, purposeA);

        // --- STEP 2: Student B creates overlapping booking ---
        await submitStudentRequest(USERS.student2.erp, USERS.student2.password, purposeB);

        // --- STEP 3: PO Approves Student A ---
        await page.goto("/");
        await page.getByPlaceholder("e.g. 12345").fill(USERS.po.erp);
        await page.getByPlaceholder("Enter your password").fill(USERS.po.password);
        await page.getByRole("button", { name: "Sign In to Portal" }).click();

        // Find row for Student A and click Approve
        const rowA = page.locator("tr", { hasText: purposeA });
        await rowA.getByRole("button", { name: "Approve" }).click();
        await expect(page.getByText("Reservation request formally approved.")).toBeVisible();

        // --- STEP 4: Verify Student B is automatically Rejected ---
        await page.getByRole("button", { name: "Rejected" }).click();

        // Assert Student B exists in the Rejected list
        const rowB = page.locator("tr", { hasText: USERS.student2.erp });
        await expect(rowB).toBeVisible();
        await expect(rowB.locator(".badge")).toHaveText(/rejected/i);
        await expect(rowB).toContainText(purposeB);
    });
});
