import { test, expect } from "@playwright/test";
import { USERS, ROOMS, BUILDINGS } from "./fixtures/credentials";
import { resetDatabase } from "../integration/helpers/seed.helper";

test.describe("PO (TC-PO)", () => {
    const bookingPurpose = "Test Booking";

    // Use 8 days from now to avoid colliding with the 7-day seed data
    const eightDaysFromNow = new Date();
    eightDaysFromNow.setDate(eightDaysFromNow.getDate() + 8);

    // Format the date to YYYY-MM-DD using local time to prevent timezone shift issues
    const year = eightDaysFromNow.getFullYear();
    const monthVal = String(eightDaysFromNow.getMonth() + 1).padStart(2, "0");
    const dayVal = String(eightDaysFromNow.getDate()).padStart(2, "0");
    const formatted = `${year}-${monthVal}-${dayVal}`;

    // After all tests are done, reset db for next broswer
    test.afterAll(async () => {
        await resetDatabase();
    });

    // Reset DB and create a booking before each test to ensure we have a pending booking to approve/reject
    test.beforeEach(async ({ page }) => {
        await resetDatabase();

        const timeSlot = 3; // 11:30 - 12:45

        // Get Day Number (e.g., "30") from local date
        const day = eightDaysFromNow.getDate();

        // Get Short Month Name (e.g., "May" or "Jun") from local date
        const shortMonth = eightDaysFromNow.toLocaleDateString("en-US", { month: "short" });

        // Login
        await page.goto("/");
        await page.getByLabel("ERP / Username").fill(USERS.student.erp);
        await page.getByLabel("Password").fill(USERS.student.password);
        await page.getByRole("button", { name: "Sign In" }).click();
        await expect(page.getByRole("heading", { name: "My Bookings" })).toBeVisible();
        await expect(page.getByText("Test Student")).toBeVisible();

        // Select Building
        await page.getByRole("combobox").first().selectOption(BUILDINGS.testBuilding.id);

        // Wait for the Room dropdown to become active and populated
        const roomDropdown = page.getByRole("combobox").nth(1);
        await expect(roomDropdown).not.toBeDisabled();
        await expect(roomDropdown.locator("option").nth(1)).toBeAttached();

        // Select Room
        await roomDropdown.selectOption(ROOMS.testRoomA.id);
        await page.locator('input[type="date"]').fill(formatted);
        await page.getByRole("combobox").nth(2).selectOption(timeSlot.toString());
        await page.getByRole("textbox", { name: "Describe the activity..." }).fill(bookingPurpose);

        // 1. Submit the form
        await page.getByRole("button", { name: "Submit Booking Request" }).click();

        // 2. Wait for either success or catch the error message for debugging
        const successAlert = page.getByText("Booking request submitted successfully!");
        const errorAlert = page.locator(".alert-error");

        await expect(async () => {
            const errorVisible = await errorAlert.isVisible();
            if (errorVisible) {
                const errorText = await errorAlert.textContent();
                throw new Error(`Booking submission failed with UI error: "${errorText}"`);
            }
            await expect(successAlert).toBeVisible({ timeout: 10000 });
        }).toPass({ timeout: 20000 });

        // 3. Wait for success alert to disappear
        await expect(successAlert).toBeHidden({ timeout: 10000 });

        // 4. Locate the specific newly created booking block to prevent strict-mode ambiguity
        const newBookingCard = page.locator(".card", { hasText: bookingPurpose });
        await expect(newBookingCard).toBeVisible({ timeout: 10000 });

        // Perform inner assertions scoped strictly inside the new booking card
        await expect(newBookingCard.getByRole("heading", { name: "Test Room A" })).toBeVisible();
        await expect(newBookingCard.getByText("Test Building")).toBeVisible();
        await expect(newBookingCard.locator("span").filter({ hasText: ":30 - 12:45" })).toBeVisible();
        await expect(newBookingCard.getByText("pending")).toBeVisible();
        await expect(newBookingCard.getByText(shortMonth, { exact: true })).toBeVisible();
        await expect(newBookingCard.getByText(day.toString(), { exact: true })).toBeVisible();

        // Logout after creating the booking
        await page.getByRole("button", { name: "Logout" }).click();
    });

    test("TC-PO-001 — view pending requests", async ({ page }) => {
        // Login as PO
        await page.goto("/");
        await page.getByLabel("ERP / Username").fill(USERS.po.erp);
        await page.getByLabel("Password").fill(USERS.po.password);
        await page.getByRole("button", { name: "Sign In" }).click();
        await expect(page.getByRole("heading", { name: "Booking Requests Management" })).toBeVisible();
        await expect(page.getByText("Test PO")).toBeVisible();

        // Making sure we are on pending tab
        await expect(page.getByRole("cell", { name: "pending" })).toBeVisible();

        // Verify the booking details are correct
        await expect(page.locator("tbody")).toContainText(ROOMS.testRoomA.name);
        await expect(page.locator("tbody")).toContainText(BUILDINGS.testBuilding.name);
        await expect(page.locator("tbody")).toContainText(bookingPurpose);
        await expect(page.getByRole("cell", { name: bookingPurpose })).toBeVisible();
    });

    test("TC-PO-002 — approve a pending request", async ({ page }) => {
        // Login as PO
        await page.goto("/");
        await page.getByLabel("ERP / Username").fill(USERS.po.erp);
        await page.getByLabel("Password").fill(USERS.po.password);
        await page.getByRole("button", { name: "Sign In" }).click();
        await expect(page.getByRole("heading", { name: "Booking Requests Management" })).toBeVisible();
        await expect(page.getByText("Test PO")).toBeVisible();

        // Making sure we are on pending tab
        await expect(page.getByRole("cell", { name: "pending" })).toBeVisible();

        // Find the row specifically by the unique purpose
        const pendingRow = page.locator("tr", { hasText: bookingPurpose });
        await expect(pendingRow).toBeVisible();

        // Click Approve inside THAT specific row
        await pendingRow.getByRole("button", { name: "Approve" }).click();

        // Wait for the success alert to appear and verify its text ()
        const successAlert = page.getByText("Booking approved successfully!");
        const errorAlert = page.locator(".alert-error");

        await expect(async () => {
            const errorVisible = await errorAlert.isVisible();
            if (errorVisible) {
                const errorText = await errorAlert.textContent();
                throw new Error(`Booking approval failed with UI error: "${errorText}"`);
            }
            await expect(successAlert).toBeVisible({ timeout: 10000 });
        }).toPass({ timeout: 20000 });

        // Go to approved bookings tab
        await page.getByRole("button", { name: "Approved" }).click();

        // Verify the row now exists in the Approved tab
        const approvedRow = page.locator("tr", { hasText: bookingPurpose });
        await expect(approvedRow).toBeVisible();
        await expect(page.locator("tbody")).toContainText("approved");

        // 6. Assertions within the row to ensure data integrity
        await expect(approvedRow).toContainText(USERS.student.erp);
        await expect(approvedRow).toContainText(ROOMS.testRoomA.name);
        await expect(approvedRow).toContainText("approved");

        // Fix: Use the correct time string for slot 3
        await expect(approvedRow).toContainText("11:30 - 12:45");
    });

    test("TC-PO-003 — reject a pending request", async ({ page }) => {
        // Login as PO
        await page.goto("/");
        await page.getByLabel("ERP / Username").fill(USERS.po.erp);
        await page.getByLabel("Password").fill(USERS.po.password);
        await page.getByRole("button", { name: "Sign In" }).click();
        await expect(page.getByRole("heading", { name: "Booking Requests Management" })).toBeVisible();
        await expect(page.getByText("Test PO")).toBeVisible();

        // Making sure we are on pending tab
        await expect(page.getByRole("cell", { name: "pending" })).toBeVisible();

        // Find the row specifically by the unique purpose
        const pendingRow = page.locator("tr", { hasText: bookingPurpose });
        await expect(pendingRow).toBeVisible();

        // Click Reject inside THAT specific row
        await pendingRow.getByRole("button", { name: "Reject" }).click();

        // Wait for the success alert to appear and verify its text ()
        const successAlert = page.getByText("Booking rejected successfully!");
        const errorAlert = page.locator(".alert-error");

        await expect(async () => {
            const errorVisible = await errorAlert.isVisible();
            if (errorVisible) {
                const errorText = await errorAlert.textContent();
                throw new Error(`Booking rejection failed with UI error: "${errorText}"`);
            }
            await expect(successAlert).toBeVisible({ timeout: 10000 });
        }).toPass({ timeout: 20000 });

        // Go to rejected bookings tab
        await page.getByRole("button", { name: "Rejected" }).click();

        // Verify the row now exists in the Rejected tab
        const rejectedRow = page.locator("tr", { hasText: bookingPurpose });
        await expect(rejectedRow).toBeVisible();
        await expect(page.locator("tbody")).toContainText("rejected");

        // 6. Assertions within the row to ensure data integrity
        await expect(rejectedRow).toContainText(USERS.student.erp);
        await expect(rejectedRow).toContainText(ROOMS.testRoomA.name);
        await expect(rejectedRow).toContainText("rejected");

        // Fix: Use the correct time string for slot 3
        await expect(rejectedRow).toContainText("11:30 - 12:45");
    });

    test("TC-PO-004 — conflict resolution: auto-reject overlapping requests", async ({ page }) => {
        const dateForConflict = formatted; // Using the same date as other tests
        const slotForConflict = "4"; // Using slot 4 (13:00 - 14:15)
        const purposeA = "Student A - High Priority Meeting";
        const purposeB = "Student B - Overlapping Request";

        // --- STEP 1: Student 1 creates a booking ---
        await page.goto("/");
        await page.getByLabel("ERP / Username").fill(USERS.student.erp);
        await page.getByLabel("Password").fill(USERS.student.password);
        await page.getByRole("button", { name: "Sign In" }).click();

        await page.getByRole("combobox").first().selectOption(BUILDINGS.testBuilding.id);
        await page.getByRole("combobox").nth(1).selectOption(ROOMS.testRoomA.id);
        await page.locator('input[type="date"]').fill(dateForConflict);
        await page.getByRole("combobox").nth(2).selectOption(slotForConflict);
        await page.getByPlaceholder("Describe the activity...").fill(purposeA);
        await page.getByRole("button", { name: "Submit Booking Request" }).click();
        await expect(page.getByText("Booking request submitted successfully!")).toBeVisible();
        await page.getByRole("button", { name: "Logout" }).click();

        // --- STEP 2: Student 2 attempts to create an overlapping booking ---
        // NOTE: This step will FAIL today because of DEF-002.
        // Once you fix the DB constraint to a Partial Index, this will pass.
        await page.getByLabel("ERP / Username").fill(USERS.student2.erp);
        await page.getByLabel("Password").fill(USERS.student2.password);
        await page.getByRole("button", { name: "Sign In" }).click();

        await page.getByRole("combobox").first().selectOption(BUILDINGS.testBuilding.id);
        await page.getByRole("combobox").nth(1).selectOption(ROOMS.testRoomA.id);
        await page.locator('input[type="date"]').fill(dateForConflict);
        await page.getByRole("combobox").nth(2).selectOption(slotForConflict);
        await page.getByPlaceholder("Describe the activity...").fill(purposeB);
        await page.getByRole("button", { name: "Submit Booking Request" }).click();

        // This assertion expects the system to allow multiple "Pending" requests
        await expect(page.getByText("Booking request submitted successfully!")).toBeVisible();
        await page.getByRole("button", { name: "Logout" }).click();

        // --- STEP 3: PO Approves Student A ---
        await page.getByLabel("ERP / Username").fill(USERS.po.erp);
        await page.getByLabel("Password").fill(USERS.po.password);
        await page.getByRole("button", { name: "Sign In" }).click();

        // Find the row for Student A and Approve
        const rowA = page.locator("tr", { hasText: purposeA });
        await rowA.getByRole("button", { name: "Approve" }).click();
        await expect(page.getByText("Booking approved successfully!")).toBeVisible();

        // --- STEP 4: Verify Student B is automatically Rejected ---
        // Switch to the 'Rejected' tab
        await page.getByRole("button", { name: "Rejected" }).click();

        // Assert that Student B's request is now here by looking for their ERP
        // purposeB might have changed, but USERS.student2.erp is guaranteed to be there
        const rowB = page.locator("tr", { hasText: USERS.student2.erp });
        await expect(rowB).toBeVisible();
        await expect(rowB).toContainText("rejected");

        // Optional: verify the original purpose is still there if you didn't overwrite it
        await expect(rowB).toContainText(purposeB);
    });
});
