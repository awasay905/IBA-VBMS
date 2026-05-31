import { test, expect } from "@playwright/test";
import { BUILDINGS, USERS } from "./fixtures/credentials";
import { resetDatabase } from "../integration/helpers/seed.helper";

test.describe("Admin Management (TC-ADMIN)", () => {
    // Ensures DB is clean for every browser
    test.afterAll(async () => {
        await resetDatabase();
    });

    test("TC-ADMIN-001 — add student", async ({ page }) => {
        const testErp = "new-test-student";
        const testName = "New Test Student";
        const testEmail = "new-test-student@test.test";
        const testPassword = "testpass";

        // 1. Login as Admin
        await page.goto("/");
        await page.getByPlaceholder("e.g. 12345").fill(USERS.admin.erp);
        await page.getByPlaceholder("Enter your password").fill(USERS.admin.password);
        await page.getByRole("button", { name: "Sign In to Portal" }).click();

        // 2. Click Students Tab
        await page.getByRole("button", { name: "Students" }).click();

        // 3. Insert Details
        await page.getByPlaceholder("e.g. 24510").fill(testErp);
        await page.getByPlaceholder("Jane Doe").fill(testName);
        await page.getByPlaceholder("student@iba.edu.pk").fill(testEmail);
        await page.getByPlaceholder("••••••••").fill(testPassword);

        // 4. Click Add Student
        await page.getByRole("button", { name: "Enroll Student" }).click();

        // 5. Await and see the confirmation dialogue
        // 5.1 Wait for either success or catch the error message for debugging
        const successAlert = page.getByText("Student enrolled successfully.");
        const errorAlert = page.locator(".alert-error");

        await expect(async () => {
            const errorVisible = await errorAlert.isVisible();
            if (errorVisible) {
                const errorText = await errorAlert.textContent();
                throw new Error(`Student addition failed with UI error: "${errorText}"`);
            }
            await expect(successAlert).toBeVisible({ timeout: 10000 });
        }).toPass({ timeout: 20000 });

        // 5.2 Wait for success alert to disappear
        await expect(successAlert).toBeHidden({ timeout: 10000 });

        // 6. Assertions
        await expect(page.locator("tbody")).toContainText(testEmail);
        await expect(page.locator("tbody")).toContainText(testErp);
        await expect(page.locator("tbody")).toContainText(testName);
    });

    test("TC-ADMIN-002 — add student with duplicate ERP", async ({ page }) => {
        // 1. Login as Admin
        await page.goto("/");
        await page.getByPlaceholder("e.g. 12345").fill(USERS.admin.erp);
        await page.getByPlaceholder("Enter your password").fill(USERS.admin.password);
        await page.getByRole("button", { name: "Sign In to Portal" }).click();

        // 2. Click Students Tab
        await page.getByRole("button", { name: "Students" }).click();

        // 3. Insert Details of student already seeded in DB
        await page.getByPlaceholder("e.g. 24510").fill(USERS.student.erp);
        await page.getByPlaceholder("Jane Doe").fill("testName");
        await page.getByPlaceholder("student@iba.edu.pk").fill("testEmail@email.email");
        await page.getByPlaceholder("••••••••").fill(USERS.student.password);

        // 4. Click Add Student
        await page.getByRole("button", { name: "Enroll Student" }).click();

        // 5. Await and see the confirmation dialogue
        // 5.1 Wait for error
        const errorAlert = page.getByText("ERP/username already exists");

        await expect(async () => {
            const errorVisible = await errorAlert.isVisible();
            if (!errorVisible) {
                const errorText = await errorAlert.textContent();
                throw new Error(`Student duplicate addition failed with UI error: "${errorText}"`);
            }
        }).toPass({ timeout: 20000 });

        // 5.2 Wait for error alert to disappear
        await expect(errorAlert).toBeHidden({ timeout: 10000 });
    });

    test("TC-ADMIN-003 — add po", async ({ page }) => {
        const testErp = "new-test-po";
        const testName = "New Test PO";
        const testEmail = "new-test-po@test.test";
        const testPassword = "testpass";

        // 1. Login as Admin
        await page.goto("/");
        await page.getByPlaceholder("e.g. 12345").fill(USERS.admin.erp);
        await page.getByPlaceholder("Enter your password").fill(USERS.admin.password);
        await page.getByRole("button", { name: "Sign In to Portal" }).click();

        // 2. Click PO Members Tab
        await page.getByRole("button", { name: "Staff" }).click();

        // 3. Insert Details
        await page.getByPlaceholder("e.g. PO-102").fill(testErp);
        await page.getByPlaceholder("John Smith").fill(testName);
        await page.getByPlaceholder("po@iba.edu.pk").fill(testEmail);
        await page.getByPlaceholder("••••••••").fill(testPassword);

        // 4. Click Add PO Member
        await page.getByRole("button", { name: "Appoint Staff" }).click();

        // 5. Await and see the confirmation dialogue
        // 5.1 Wait for either success or catch the error message for debugging
        const successAlert = page.getByText("PO Member appointed successfully.");
        const errorAlert = page.locator(".alert-error");

        await expect(async () => {
            const errorVisible = await errorAlert.isVisible();
            if (errorVisible) {
                const errorText = await errorAlert.textContent();
                throw new Error(`PO Member addition failed with UI error: "${errorText}"`);
            }
            await expect(successAlert).toBeVisible({ timeout: 10000 });
        }).toPass({ timeout: 20000 });

        // 5.2 Wait for success alert to disappear
        await expect(successAlert).toBeHidden({ timeout: 10000 });

        // 6. Assertions
        await expect(page.locator("tbody")).toContainText(testEmail);
        await expect(page.locator("tbody")).toContainText(testErp);
        await expect(page.locator("tbody")).toContainText(testName);
    });

    test("TC-ADMIN-004 — add building", async ({ page }) => {
        const testBuildingName = "New Test Building";
        const testBuildingLocation = "New Test Campus";

        // 1. Login as Admin
        await page.goto("/");
        await page.getByPlaceholder("e.g. 12345").fill(USERS.admin.erp);
        await page.getByPlaceholder("Enter your password").fill(USERS.admin.password);
        await page.getByRole("button", { name: "Sign In to Portal" }).click();

        // 2. Click Buildings Tab
        await page.getByRole("button", { name: "Buildings" }).click();

        // 3. Insert Details
        await page.getByPlaceholder("e.g. Aman CED").fill(testBuildingName);
        await page.getByPlaceholder("e.g. Main Campus").fill(testBuildingLocation);

        // 4. Add
        await page.getByRole("button", { name: "Register Building" }).click();

        // 5. Await and see the confirmation dialogue
        // 5.1 Wait for either success or catch the error message for debugging
        const successAlert = page.getByText("Building registered successfully.");
        const errorAlert = page.locator(".alert-error");

        await expect(async () => {
            const errorVisible = await errorAlert.isVisible();
            if (errorVisible) {
                const errorText = await errorAlert.textContent();
                throw new Error(`Building addition failed with UI error: "${errorText}"`);
            }
            await expect(successAlert).toBeVisible({ timeout: 10000 });
        }).toPass({ timeout: 20000 });

        // 5.2 Wait for success alert to disappear
        await expect(successAlert).toBeHidden({ timeout: 10000 });

        // 6. Assertions
        await expect(page.locator("tbody")).toContainText(testBuildingName);
        await expect(page.locator("tbody")).toContainText(testBuildingLocation);
    });

    test("TC-ADMIN-005 — add room", async ({ page }) => {
        const newRoomName = "new-test-room";
        const newRoomCapacity = "69";
        const newRoomType = "Seminar Hall";
        const newRoomBuilding = BUILDINGS.testBuilding;

        // 1. Login as Admin
        await page.goto("/");
        await page.getByPlaceholder("e.g. 12345").fill(USERS.admin.erp);
        await page.getByPlaceholder("Enter your password").fill(USERS.admin.password);
        await page.getByRole("button", { name: "Sign In to Portal" }).click();

        // 2. Click Rooms Tab
        await page.getByRole("button", { name: "Rooms" }).click();

        // 3. Fill Details
        await page.getByPlaceholder("e.g. Tabba-201").fill(newRoomName);
        await page.getByRole("combobox").first().selectOption(newRoomBuilding.id);
        await page.getByPlaceholder("e.g. 50").fill(newRoomCapacity);
        await page.getByRole("combobox").nth(1).selectOption(newRoomType);

        // 4. Add
        await page.getByRole("button", { name: "Allocate Room" }).click();

        // 5. Await and see the confirmation dialogue
        // 5.1 Wait for either success or catch the error message for debugging
        const successAlert = page.getByText("Room allocated successfully.");
        const errorAlert = page.locator(".alert-error");

        await expect(async () => {
            const errorVisible = await errorAlert.isVisible();
            if (errorVisible) {
                const errorText = await errorAlert.textContent();
                throw new Error(`Room addition failed with UI error: "${errorText}"`);
            }
            await expect(successAlert).toBeVisible({ timeout: 10000 });
        }).toPass({ timeout: 20000 });

        // 5.2 Wait for success alert to disappear
        await expect(successAlert).toBeHidden({ timeout: 10000 });

        // 6. Assertions
        await expect(page.locator("tbody")).toContainText(newRoomName);
        await expect(page.locator("tbody")).toContainText(newRoomBuilding.name);
        await expect(page.locator("tbody")).toContainText(newRoomType);
        await expect(page.locator("tbody")).toContainText(newRoomCapacity);
    });
});
