import { test, expect } from "@playwright/test";
import { USERS } from "./fixtures/credentials";

test.describe("Authentication (TC-AUTH)", () => {
    test("TC-AUTH-001: Student Login", async ({ page }) => {
        await page.goto("/");
        await page.getByLabel("ERP / Username").fill(USERS.student.erp);
        await page.getByLabel("Password").fill(USERS.student.password);
        await page.getByRole("button", { name: "Sign In" }).click();
        await expect(page.getByRole("heading", { name: "My Bookings" })).toBeVisible();
        await expect(page.getByText("Test Student")).toBeVisible();
    });

    test("TC-AUTH-002: PO Login", async ({ page }) => {
        await page.goto("/");
        await page.getByLabel("ERP / Username").fill(USERS.po.erp);
        await page.getByLabel("Password").fill(USERS.po.password);
        await page.getByRole("button", { name: "Sign In" }).click();
        await expect(page.getByRole("heading", { name: "Booking Requests Management" })).toBeVisible();
        await expect(page.getByText("Test PO")).toBeVisible();
    });

    test("TC-AUTH-003: Bad Credentials", async ({ page }) => {
        await page.goto("/");
        await page.getByLabel("ERP / Username").fill("wrong-user");
        await page.getByLabel("Password").fill("wrong-pass");
        await page.getByRole("button", { name: "Sign In" }).click();

        await expect(page.getByText("Invalid credentials")).toBeVisible();
        await expect(page.getByRole("button", { name: "Sign In" })).toBeVisible();
    });

    test("TC-AUTH-004 — protected URL redirect", async ({ page }) => {
        await page.goto("/");
        await expect(page.getByRole("button", { name: "Sign In" })).toBeVisible();
    });

    test("TC-AUTH-007 — logout and back button", async ({ page }) => {
        // Login as student first
        await page.goto("/");
        await page.getByLabel("ERP / Username").fill(USERS.student.erp);
        await page.getByLabel("Password").fill(USERS.student.password);
        await page.getByRole("button", { name: "Sign In" }).click();
        await expect(page.getByRole("heading", { name: "My Bookings" })).toBeVisible();
        await expect(page.getByText("Test Student")).toBeVisible();

        // Logout
        await page.getByRole("button", { name: "Logout" }).click();
        await expect(page.getByRole("button", { name: "Sign In" })).toBeVisible();
        await page.goBack();
        await expect(page.getByRole("heading", { name: "My Bookings" })).not.toBeVisible();
    });
});
