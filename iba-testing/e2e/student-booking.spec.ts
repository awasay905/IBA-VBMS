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

        // Get Day Number (e.g., "30") from local date
        const day = eightDaysFromNow.getDate();

        // Get Short Month Name (e.g., "May" or "Jun") from local date (convert to uppercase for card date block matching)
        const shortMonthUpper = eightDaysFromNow.toLocaleDateString("en-US", { month: "short" }).toUpperCase();

        // Login
        await page.goto("/");
        await page.getByPlaceholder("e.g. 12345").fill(USERS.student.erp);
        await page.getByPlaceholder("Enter your password").fill(USERS.student.password);
        await page.getByRole("button", { name: "Sign In to Portal" }).click();
        await expect(page.getByRole("heading", { name: "Student Portal" })).toBeVisible();
        await expect(page.getByText("Test Student")).toBeVisible();

        // 1. Click New Request tab
        await page.getByRole("button", { name: "New Request" }).click();

        // 2. Select Date from Calendar (Navigate months if needed)
        const targetMonthName = eightDaysFromNow.toLocaleString("default", { month: "long" });
        const targetYear = eightDaysFromNow.getFullYear();
        const expectedMonthHeader = `${targetMonthName} ${targetYear}`;

        while (!(await page.getByText(expectedMonthHeader).isVisible())) {
            // Click visual chevron-right to navigate calendar month
            await page.getByRole("button").nth(5).click();
        }
        await page.getByRole("button", { name: String(day), exact: true }).click();

        // 3. Select Building
        await page.locator("select").first().selectOption(BUILDINGS.testBuilding.id);

        // 4. Click Room Button (Rooms render as buttons instead of a select dropdown)
        const roomButton = page.getByRole("button", { name: ROOMS.testRoomA.name, exact: false });
        await expect(roomButton).toBeVisible();
        await roomButton.click();

        // 5. Select Time Slot 3 ("11:30 AM - 12:45 PM")
        await page.getByRole("button", { name: "11:30 AM - 12:45 PM", exact: false }).click();

        // 6. Fill out Purpose Description
        await page.getByPlaceholder("e.g., Society meeting").fill(bookingPurpose);

        // 7. Submit Request
        await page.getByRole("button", { name: "Submit Request" }).click();

        // 8. Assert Success Toast
        const successAlert = page.getByText("Reservation submitted successfully!");
        await expect(successAlert).toBeVisible({ timeout: 10000 });

        // 9. Locate the specific newly created booking block inside the visual listing
        const newBookingCard = page.locator(".card", { hasText: bookingPurpose });
        await expect(newBookingCard).toBeVisible({ timeout: 10000 });

        // Perform inner assertions scoped inside the card
        await expect(newBookingCard.getByText("Test Room A")).toBeVisible();
        await expect(newBookingCard.getByText("Test Building")).toBeVisible();
        await expect(newBookingCard.getByText("11:30 AM - 12:45 PM")).toBeVisible();
        await expect(newBookingCard.locator(".badge")).toHaveText(/pending/i);
        await expect(newBookingCard.getByText(shortMonthUpper, { exact: true })).toBeVisible();
        await expect(newBookingCard.getByText(day.toString(), { exact: true })).toBeVisible();
    });

    test("TC-BOOK-002 — duplicate slot rejected", async ({ page }) => {
        const bookingPurpose = "Duplicate Test Booking First";

        // Use 9 days from now to keep dates separate from previous tests
        const nineDaysFromNow = new Date();
        nineDaysFromNow.setDate(nineDaysFromNow.getDate() + 9);
        const day = nineDaysFromNow.getDate();

        // Login
        await page.goto("/");
        await page.getByPlaceholder("e.g. 12345").fill(USERS.student.erp);
        await page.getByPlaceholder("Enter your password").fill(USERS.student.password);
        await page.getByRole("button", { name: "Sign In to Portal" }).click();
        await expect(page.getByRole("heading", { name: "Student Portal" })).toBeVisible();

        // Helper function to navigate step-by-step wizard
        const fillAndSubmitForm = async (purpose: string) => {
            await page.getByRole("button", { name: "New Request" }).click();

            // Select Date from Calendar
            const targetMonthName = nineDaysFromNow.toLocaleString("default", { month: "long" });
            const targetYear = nineDaysFromNow.getFullYear();
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

            // Select Time Slot 2 ("10:00 AM - 11:15 AM")
            await page.getByRole("button", { name: "10:00 AM - 11:15 AM", exact: false }).click();

            // Fill Purpose & Submit
            await page.getByPlaceholder("e.g., Society meeting").fill(purpose);
            await page.getByRole("button", { name: "Submit Request" }).click();
        };

        // First booking attempt
        await fillAndSubmitForm(bookingPurpose);

        // Verify first submission success toast
        const successAlert = page.getByText("Reservation submitted successfully!");
        await expect(successAlert).toBeVisible();

        // Try submitting the exact same room, date, and slot
        await fillAndSubmitForm("Duplicate Test Booking Second");

        // Assert that duplicate requests trigger a rejection toast message
        const errorAlert = page.getByText(/already|conflict|booked|overlap/i);
        await expect(errorAlert).toBeVisible({ timeout: 10000 });
    });

    test("TC-BOOK-008 — missing purpose", async ({ page }) => {
        // Use 10 days from now
        const tenDaysFromNow = new Date();
        tenDaysFromNow.setDate(tenDaysFromNow.getDate() + 10);
        const day = tenDaysFromNow.getDate();

        // Login
        await page.goto("/");
        await page.getByPlaceholder("e.g. 12345").fill(USERS.student.erp);
        await page.getByPlaceholder("Enter your password").fill(USERS.student.password);
        await page.getByRole("button", { name: "Sign In to Portal" }).click();
        await expect(page.getByRole("heading", { name: "Student Portal" })).toBeVisible();

        // Fill building, room, date, and slot
        await page.getByRole("button", { name: "New Request" }).click();

        // Select Date from Calendar
        const targetMonthName = tenDaysFromNow.toLocaleString("default", { month: "long" });
        const targetYear = tenDaysFromNow.getFullYear();
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

        // Select Time Slot 3 ("11:30 AM - 12:45 PM")
        await page.getByRole("button", { name: "11:30 AM - 12:45 PM", exact: false }).click();

        // Leave purpose field empty
        const purposeField = page.getByPlaceholder("e.g., Society meeting");
        await purposeField.fill("");

        // In the updated StudentDashboard.jsx, the Submit button is disabled if purpose.trim() is false
        // This ensures the application validation is enforced visually in the DOM
        const submitButton = page.getByRole("button", { name: "Submit Request" });
        await expect(submitButton).toBeDisabled();
    });
});
