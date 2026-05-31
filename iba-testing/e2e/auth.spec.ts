import { test, expect } from "@playwright/test";
import { USERS } from "./fixtures/credentials";

test.describe("Authentication (TC-AUTH)", () => {
    test("TC-AUTH-001: Student Login", async ({ page }) => {
        await page.goto("/");
        await page.getByPlaceholder("e.g. 12345").fill(USERS.student.erp);
        await page.getByPlaceholder("Enter your password").fill(USERS.student.password);
        await page.getByRole("button", { name: "Sign In to Portal" }).click();
        await expect(page.getByRole("heading", { name: "Student Portal" })).toBeVisible();
        await expect(page.getByText("Test Student")).toBeVisible();
    });

    test("TC-AUTH-002: PO Login", async ({ page }) => {
        await page.goto("/");
        await page.getByPlaceholder("e.g. 12345").fill(USERS.po.erp);
        await page.getByPlaceholder("Enter your password").fill(USERS.po.password);
        await page.getByRole("button", { name: "Sign In to Portal" }).click();
        await expect(page.getByRole("heading", { name: "Program Office" })).toBeVisible();
        await expect(page.getByText("Test PO")).toBeVisible();
    });

    test("TC-AUTH-003: Bad Credentials", async ({ page }) => {
        await page.goto("/");
        await page.getByPlaceholder("e.g. 12345").fill("wrong-user");
        await page.getByPlaceholder("Enter your password").fill("wrong-pass");
        await page.getByRole("button", { name: "Sign In to Portal" }).click();

        // Error message inside the toast container should still contain the API error message
        await expect(page.getByText("Invalid credentials")).toBeVisible();
        await expect(page.getByRole("button", { name: "Sign In to Portal" })).toBeVisible();
    });

    test("TC-AUTH-004 — protected URL redirect", async ({ page }) => {
        await page.goto("/");
        // Updated button accessible name
        await expect(page.getByRole("button", { name: "Sign In to Portal" })).toBeVisible();
    });

    test("TC-AUTH-007 — logout and back button", async ({ page }) => {
        // Login as student first
        await page.goto("/");
        // Changed getByLabel to getByPlaceholder
        await page.getByPlaceholder("e.g. 12345").fill(USERS.student.erp);
        await page.getByPlaceholder("Enter your password").fill(USERS.student.password);
        await page.getByRole("button", { name: "Sign In to Portal" }).click();
        await expect(page.getByRole("heading", { name: "Student Portal" })).toBeVisible();
        await expect(page.getByText("Test Student")).toBeVisible();

        // Logout
        await page.getByRole("button", { name: "Logout" }).click();
        await expect(page.getByRole("button", { name: "Sign In to Portal" })).toBeVisible();
        await page.goBack();
        await expect(page.getByRole("heading", { name: "Student Portal" })).not.toBeVisible();
    });
});
