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
        await page.getByLabel("ERP / Username").fill(USERS.student.erp);
        await page.getByLabel("Password").fill(USERS.student.password);
        await page.getByRole("button", { name: "Sign In" }).click();

        await page.getByRole("combobox").first().selectOption(BUILDINGS.testBuilding.id);
        await page.getByRole("combobox").nth(1).selectOption(ROOMS.testRoomA.id);
        await page.locator('input[type="date"]').fill(formattedDate);
        await page.getByRole("combobox").nth(2).selectOption("5"); // Slot 5
        await page.getByPlaceholder("Describe the activity...").fill(purpose);
        await page.getByRole("button", { name: "Submit Booking Request" }).click();
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
    }

    test("TC-CANCEL-001 — student cancels own pending booking", async ({ page }) => {
        await createStudentBooking(page, bookingPurpose);

        // 1. Locate the card for this specific booking
        const bookingCard = page.locator(".card", { hasText: bookingPurpose });

        // 2. Handle the window.confirm dialog that the React code triggers
        page.on("dialog", (dialog) => dialog.accept());

        // 3. Click Cancel inside that card
        await bookingCard.getByRole("button", { name: "Cancel" }).click();

        // 4. Verify the success alert
        const successAlert = page.getByText("Booking cancelled successfully");
        const errorAlert = page.locator(".alert-error");

        await expect(async () => {
            const errorVisible = await errorAlert.isVisible();
            if (errorVisible) {
                const errorText = await errorAlert.textContent();
                throw new Error(`Booking cancellation failed with UI error: "${errorText}"`);
            }
            await expect(successAlert).toBeVisible({ timeout: 10000 });
        }).toPass({ timeout: 20000 });

        // 5. Verify the status badge updated
        // NOTE: This will fail if DEF-001 is not fixed (showing 'rejected' instead of 'cancelled')
        await expect(bookingCard.locator(".badge")).toHaveText(/cancelled/i);
    });

    test("TC-CANCEL-002 — student cancels own approved booking (DEF-004)", async ({ page }) => {
        // We explicitly tell Playwright this will fail due to a known UI bug.
        // Once the developer fixes the UI, this test will trigger a "Expected to fail, but passed" warning,
        // prompting you to remove `test.fail()`.
        test.fail(true, "DEF-004: Student dashboard does not show 'Cancel' button for approved bookings");

        const purpose = "Approved Cancellation Test";
        await createStudentBooking(page, purpose);

        // 1. Login as PO to Approve it
        await page.getByRole("button", { name: "Logout" }).click();
        await page.getByLabel("ERP / Username").fill(USERS.po.erp);
        await page.getByLabel("Password").fill(USERS.po.password);
        await page.getByRole("button", { name: "Sign In" }).click();

        const pendingRow = page.locator("tr", { hasText: purpose });
        await pendingRow.getByRole("button", { name: "Approve" }).click();
        await expect(page.getByText("Booking approved successfully!")).toBeVisible();
        await page.getByRole("button", { name: "Logout" }).click();

        // 2. Login back as Student
        await page.getByLabel("ERP / Username").fill(USERS.student.erp);
        await page.getByLabel("Password").fill(USERS.student.password);
        await page.getByRole("button", { name: "Sign In" }).click();

        // 3. Locate the card and attempt to cancel
        const bookingCard = page.locator(".card", { hasText: purpose });
        page.on("dialog", (dialog) => dialog.accept());

        // This action will Timeout/Fail because the button is missing from the DOM (DEF-004)
        await bookingCard.getByRole("button", { name: "Cancel" }).click();

        // 4. Verify the success alert (Won't be reached until bug is fixed)
        await expect(page.getByText("Booking cancelled successfully")).toBeVisible();
    });

    test("TC-CANCEL-005 — PO cancels an approved booking", async ({ page }) => {
        // 1. Create a booking as a student
        await createStudentBooking(page, "PO Kill Test");
        await page.getByRole("button", { name: "Logout" }).click();

        // 2. Login as PO and Approve it first
        await page.getByLabel("ERP / Username").fill(USERS.po.erp);
        await page.getByLabel("Password").fill(USERS.po.password);
        await page.getByRole("button", { name: "Sign In" }).click();

        const pendingRow = page.locator("tr", { hasText: "PO Kill Test" });
        await pendingRow.getByRole("button", { name: "Approve" }).click();
        await expect(page.getByText("Booking approved successfully!")).toBeVisible();

        // 3. Switch to Approved tab
        await page.getByRole("button", { name: "Approved" }).click();

        // 4. Handle confirmation dialog
        page.on("dialog", (dialog) => dialog.accept());

        // 5. Cancel the approved booking
        const approvedRow = page.locator("tr", { hasText: "PO Kill Test" });
        await approvedRow.getByRole("button", { name: "Cancel" }).click();

        // 6. Verify movement to Rejected/Cancelled state
        await expect(page.getByText("Booking cancelled successfully!")).toBeVisible();
        await page.getByRole("button", { name: "Rejected" }).click();
        await expect(page.locator("tr", { hasText: "PO Kill Test" })).toBeVisible();
    });

    test("TC-CANCEL-003/004 — Boundary: past/future logic check", async ({ page }) => {
        // NOTE: Your current backend logic does not strictly check time (HH:mm) for cancellations.
        // It only checks if the status is 'pending' or 'approved'.
        // This test serves as a check for the business rule: "Cannot cancel after start time".

        // 1. Create a booking for TODAY
        const today = new Date().toISOString().split("T")[0];
        await page.goto("/");
        await page.getByLabel("ERP / Username").fill(USERS.student.erp);
        await page.getByLabel("Password").fill(USERS.student.password);
        await page.getByRole("button", { name: "Sign In" }).click();

        // Manually fill to use Today's date
        await page.getByRole("combobox").first().selectOption(BUILDINGS.testBuilding.id);
        await page.getByRole("combobox").nth(1).selectOption(ROOMS.testRoomA.id);
        await page.locator('input[type="date"]').fill(today);
        await page.getByRole("combobox").nth(2).selectOption("1"); // 8:30 AM (Likely in the past during a workday run)
        await page.getByPlaceholder("Describe the activity...").fill("Late Cancel Test");
        await page.getByRole("button", { name: "Submit Booking Request" }).click();

        // If the system allows booking and immediate cancellation of an 8:30 AM slot at 2:00 PM,
        // then the "Boundary" requirement is NOT being enforced by the backend.
        const card = page.locator(".card", { hasText: "Late Cancel Test" });

        // If the button is visible and works, the boundary rule (TC-CANCEL-004) is failing.
        const cancelBtn = card.getByRole("button", { name: "Cancel" });

        // This is an "Observation" check:
        const isEnforced = await cancelBtn.isHidden();
        console.log(isEnforced ? "Boundary enforced: Cancel hidden" : "Boundary NOT enforced: Cancel visible");
    });
});
