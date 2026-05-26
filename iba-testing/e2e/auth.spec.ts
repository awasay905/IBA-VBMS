import { test, expect } from "@playwright/test";
import { USERS } from "./fixtures/credentials";

test.describe("Authentication (TC-AUTH)", () => {
    test("TC-AUTH-001: Student Login and Dashboard Visibility", async ({ page }) => {
        await page.goto("/");
        await page.getByLabel("ERP / Username").fill(USERS.student.erp);
        await page.getByLabel("Password").fill(USERS.student.password);
        await page.getByRole("button", { name: "Sign In" }).click();

        // Assert student elements are visible
        await expect(page.getByText("Request a Room")).toBeVisible();
        await expect(page.getByText("Test Student")).toBeVisible();
    });

    test("TC-AUTH-003: Bad Credentials", async ({ page }) => {
        await page.goto("/");
        await page.getByLabel("ERP / Username").fill("wrong-user");
        await page.getByLabel("Password").fill("wrong-pass");
        await page.getByRole("button", { name: "Sign In" }).click();

        await expect(page.getByText('Invalid credentials')).toBeVisible();
        await expect(page.getByRole("button", { name: "Sign In" })).toBeVisible();
    });

});
