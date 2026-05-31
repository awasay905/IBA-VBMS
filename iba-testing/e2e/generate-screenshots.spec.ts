import { Page, test } from "@playwright/test";
import fs from "fs";
import path from "path";

// Ensure screenshots folder exists before starting the execution
const SCREENSHOT_DIR = path.join(process.cwd(), "screenshots");
if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

/**
 * Utility helper to switch and handle theme changes smoothly,
 * capturing high-quality full HD screenshots for both Light and Dark themes.
 */
async function captureThemeScreenshots(page: Page, baseName: string, fullPage = true) {
    // 1. Force state checks to start with a consistent Light Mode representation
    let isDark = await page.evaluate(() => document.documentElement.classList.contains("dark"));
    if (isDark) {
        await toggleTheme(page);
    }

    // Allow CSS transition and layout shifts to stabilize
    await page.waitForTimeout(1200);
    await page.screenshot({
        path: path.join(SCREENSHOT_DIR, `${baseName}-light.png`),
        fullPage,
    });

    // 2. Toggle to Dark Mode
    await toggleTheme(page);
    await page.waitForTimeout(1200);
    await page.screenshot({
        path: path.join(SCREENSHOT_DIR, `${baseName}-dark.png`),
        fullPage,
    });

    // 3. Return context back to Light Mode to maintain state transitions
    await toggleTheme(page);
    await page.waitForTimeout(800);
}

/**
 * Handles target identification of theme toggle triggers
 * across both unauthorized (Login) and authenticated states (Header).
 */
async function toggleTheme(page: Page) {
    const loginToggle = page.locator('button[title="Dark mode"], button[title="Light mode"]');
    const appToggle = page.locator('button[title*="Switch to"]');

    if (await loginToggle.isVisible()) {
        await loginToggle.click();
    } else if (await appToggle.isVisible()) {
        // force:true bypasses pointer-event interception from overlays (e.g. open modals)
        await appToggle.click({ force: true });
    }
}

test.describe("GitHub Portfolio Asset Generator", () => {
    // Force a consistent 1440x900 viewport at 2x pixel density for crisp screenshots
    test.use({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });

    test("Generate System Screenshots", async ({ page }) => {
        test.setTimeout(180_000); // 3 minutes — accommodates all theme captures + navigation delays
        // --- 1. Login Page Screen ---
        await page.goto("/");
        await page.waitForLoadState("networkidle");
        await captureThemeScreenshots(page, "01-login-screen");

        // --- 2. Student Dashboard Flow ---
        // Click the quick-access Student Demo button on your landing card
        await page.getByRole("button", { name: "Student", exact: true }).click();
        await page.getByRole("button", { name: "Sign In to Portal" }).click();
        await page.waitForSelector("h1:has-text('Student Portal')");
        await page.waitForTimeout(1000);

        // My Reservations view
        await captureThemeScreenshots(page, "02-student-my-reservations");

        // Click New Request Wizard Tab
        await page.getByRole("button", { name: "New Request" }).click();
        await page.waitForTimeout(1200);

        // Optionally interact with step elements to populate data dynamically
        const buildingDropdown = page.locator("select").first();
        if (await buildingDropdown.isVisible()) {
            const dropdownOptions = await buildingDropdown.locator("option").all();
            if (dropdownOptions.length > 1) {
                // Select the first valid venue option to populate dynamic rooms
                await buildingDropdown.selectOption({ index: 1 });
                await page.waitForTimeout(1200);
            }
        }
        await captureThemeScreenshots(page, "03-student-request-wizard");

        // Log out student session
        await page.getByRole("button", { name: "Logout" }).click();
        await page.waitForSelector("input[placeholder='e.g. 12345']");

        // --- 3. Program Office (PO) Dashboard Flow ---
        await page.getByRole("button", { name: "Program Office" }).click();
        await page.getByRole("button", { name: "Sign In to Portal" }).click();
        await page.waitForSelector("h1:has-text('Program Office')");
        await page.waitForTimeout(1000);

        // Pending applications and conflict alerts
        await captureThemeScreenshots(page, "04-po-pending-requests");

        // Click Approved filters list
        await page.getByRole("button", { name: "Approved" }).click();
        await page.waitForTimeout(1200);
        await captureThemeScreenshots(page, "05-po-approved-requests");

        // Inspect detail workspace modals if an entry exists
        const viewDetailsBtn = page.locator('button[title="View Details"]').first();
        if (await viewDetailsBtn.isVisible()) {
            // Light mode — open modal, screenshot, close
            await viewDetailsBtn.click();
            await page.waitForTimeout(1200);
            await page.screenshot({
                path: path.join(SCREENSHOT_DIR, "06-po-details-modal-light.png"),
                fullPage: false,
            });
            await page.getByRole("button", { name: "Close" }).click();
            await page.waitForTimeout(800);

            // Switch to dark mode
            await toggleTheme(page);
            await page.waitForTimeout(800);

            // Dark mode — open modal, screenshot, close
            await viewDetailsBtn.click();
            await page.waitForTimeout(1200);
            await page.screenshot({
                path: path.join(SCREENSHOT_DIR, "06-po-details-modal-dark.png"),
                fullPage: false,
            });
            await page.getByRole("button", { name: "Close" }).click();
            await page.waitForTimeout(800);

            // Return to light mode
            await toggleTheme(page);
            await page.waitForTimeout(800);
        }

        // Log out PO session
        await page.getByRole("button", { name: "Logout" }).click();
        await page.waitForSelector("input[placeholder='e.g. 12345']");

        // --- 4. Admin Dashboard Flow ---
        await page.getByRole("button", { name: "Administrator" }).click();
        await page.getByRole("button", { name: "Sign In to Portal" }).click();
        await page.waitForSelector("h1:has-text('System Admin')");
        await page.waitForTimeout(1000);

        // Global Reservations Panel
        await captureThemeScreenshots(page, "07-admin-reservations");

        // Buildings Management
        await page.getByRole("button", { name: "Buildings" }).click();
        await page.waitForTimeout(1200);
        await captureThemeScreenshots(page, "08-admin-buildings");

        // Room Configs & Allocation Panel
        await page.getByRole("button", { name: "Rooms" }).click();
        await page.waitForTimeout(1200);
        await captureThemeScreenshots(page, "09-admin-rooms");

        // Student Enrollment Registry
        await page.getByRole("button", { name: "Students" }).click();
        await page.waitForTimeout(1200);
        await captureThemeScreenshots(page, "10-admin-students");

        // Staff Management Registry
        await page.getByRole("button", { name: "Staff" }).click();
        await page.waitForTimeout(1200);
        await captureThemeScreenshots(page, "11-admin-staff");

        // Finalize logout
        await page.getByRole("button", { name: "Logout" }).click();
    });
});
