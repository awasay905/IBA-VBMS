import { test, expect } from "@playwright/test";
import { USERS, ROOMS, BUILDINGS } from "./fixtures/credentials";
import { resetDatabase } from "../integration/helpers/seed.helper";

test.describe("Booking (TC-Book)", () => {
    // After all is better as globalsetup clears it once, and then for next browser we reset it
    test.afterAll(async () => {
        await resetDatabase();
    });

    test("TC-BOOK-001 — full booking flow", async ({ page }) => {
        const bookingPurpose = "Test Booking";

        // Use 8 days from now to avoid colliding with the 7-day seed data
        const eightDaysFromNow = new Date();
        eightDaysFromNow.setDate(eightDaysFromNow.getDate() + 8);

        // Format the date to YYYY-MM-DD using local time to prevent timezone shift issues
        const year = eightDaysFromNow.getFullYear();
        const monthVal = String(eightDaysFromNow.getMonth() + 1).padStart(2, "0");
        const dayVal = String(eightDaysFromNow.getDate()).padStart(2, "0");
        const formatted = `${year}-${monthVal}-${dayVal}`;

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
    });

    test("TC-BOOK-002 — duplicate slot rejected", async ({ page }) => {
        const bookingPurpose = "Duplicate Test Booking First";

        // Use 9 days from now to keep dates separate from previous tests
        const nineDaysFromNow = new Date();
        nineDaysFromNow.setDate(nineDaysFromNow.getDate() + 9);

        const year = nineDaysFromNow.getFullYear();
        const monthVal = String(nineDaysFromNow.getMonth() + 1).padStart(2, "0");
        const dayVal = String(nineDaysFromNow.getDate()).padStart(2, "0");
        const formatted = `${year}-${monthVal}-${dayVal}`;

        const timeSlot = "2"; // Represents slot 2

        // Login
        await page.goto("/");
        await page.getByLabel("ERP / Username").fill(USERS.student.erp);
        await page.getByLabel("Password").fill(USERS.student.password);
        await page.getByRole("button", { name: "Sign In" }).click();
        await expect(page.getByRole("heading", { name: "My Bookings" })).toBeVisible();

        // Helper function to handle dropdown selections and text fills
        const fillAndSubmitForm = async (purpose: string) => {
            await page.getByRole("combobox").first().selectOption(BUILDINGS.testBuilding.id);
            const roomDropdown = page.getByRole("combobox").nth(1);
            await expect(roomDropdown).not.toBeDisabled();
            await expect(roomDropdown.locator("option").nth(1)).toBeAttached();
            await roomDropdown.selectOption(ROOMS.testRoomA.id);
            await page.locator('input[type="date"]').fill(formatted);
            await page.getByRole("combobox").nth(2).selectOption(timeSlot);
            await page.getByRole("textbox", { name: "Describe the activity..." }).fill(purpose);
            await page.getByRole("button", { name: "Submit Booking Request" }).click();
        };

        // First booking attempt
        await fillAndSubmitForm(bookingPurpose);

        // Verify first submission success
        const successAlert = page.getByText("Booking request submitted successfully!");
        await expect(successAlert).toBeVisible();
        await expect(successAlert).toBeHidden({ timeout: 10000 });

        // Try submitting the exact same room, date, and slot
        await fillAndSubmitForm("Duplicate Test Booking Second");

        // Assert that the request fails with an error alert containing a rejection message
        const errorAlert = page.locator(".alert-error");
        await expect(errorAlert).toBeVisible({ timeout: 10000 });
        await expect(errorAlert).toHaveText(/already|conflict|booked|overlap/i);
    });

    test("TC-BOOK-008 — missing purpose", async ({ page }) => {
        // Use 10 days from now
        const tenDaysFromNow = new Date();
        tenDaysFromNow.setDate(tenDaysFromNow.getDate() + 10);

        const year = tenDaysFromNow.getFullYear();
        const monthVal = String(tenDaysFromNow.getMonth() + 1).padStart(2, "0");
        const dayVal = String(tenDaysFromNow.getDate()).padStart(2, "0");
        const formatted = `${year}-${monthVal}-${dayVal}`;

        const timeSlot = "3";

        // Login
        await page.goto("/");
        await page.getByLabel("ERP / Username").fill(USERS.student.erp);
        await page.getByLabel("Password").fill(USERS.student.password);
        await page.getByRole("button", { name: "Sign In" }).click();
        await expect(page.getByRole("heading", { name: "My Bookings" })).toBeVisible();

        // Fill building, room, date, and slot
        await page.getByRole("combobox").first().selectOption(BUILDINGS.testBuilding.id);
        const roomDropdown = page.getByRole("combobox").nth(1);
        await expect(roomDropdown).not.toBeDisabled();
        await expect(roomDropdown.locator("option").nth(1)).toBeAttached();
        await roomDropdown.selectOption(ROOMS.testRoomA.id);
        await page.locator('input[type="date"]').fill(formatted);
        await page.getByRole("combobox").nth(2).selectOption(timeSlot);

        // Leave the purpose field empty
        const purposeField = page.getByRole("textbox", { name: "Describe the activity..." });
        await purposeField.fill("");

        // Submit
        await page.getByRole("button", { name: "Submit Booking Request" }).click();

        // Handle both native HTML5 validation constraints and custom UI alerts
        const hasRequiredAttribute = (await purposeField.getAttribute("required")) !== null;
        if (hasRequiredAttribute) {
            // Evaluate the HTML5 validity state of the textarea
            const isValid = await purposeField.evaluate((el: HTMLTextAreaElement) => el.checkValidity());
            expect(isValid).toBe(false);
        } else {
            // Fallback to checking for application UI error notifications
            const errorAlert = page.locator(".alert-error");
            await expect(errorAlert).toBeVisible();
        }
    });
});
