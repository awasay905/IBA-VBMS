import request from "supertest";
import { BASE_URL } from "./env.helper";

/**
 * Sends a POST request to the login endpoint and returns the JWT access token.
 *
 * @param erp User's ERP ID or username
 * @param password User's plaintext password
 * @returns Promise resolving to the JWT token string
 */
export async function getToken(erp: string, password: string): Promise<string> {
    const response = await request(BASE_URL).post("/api/auth/login").send({ erp, password });

    if (response.status !== 200 && response.status !== 201) {
        throw new Error(
            `Failed to obtain token for user "${erp}". Status: ${response.status}. Error: ${JSON.stringify(response.body)}`,
        );
    }

    if (!response.body || !response.body.access_token) {
        throw new Error(`Login response for user "${erp}" did not include an access_token.`);
    }

    return response.body.access_token;
}

/**
 * Convenience helper to obtain a token for the seeded test student.
 */
export async function getStudentToken(): Promise<string> {
    return getToken("test-student", "testpass");
}

/**
 * Convenience helper to obtain a token for the seeded test student 2 (used for concurrency).
 */
export async function getStudent2Token(): Promise<string> {
    return getToken("test-student-2", "testpass");
}

/**
 * Convenience helper to obtain a token for the seeded test program office member.
 */
export async function getPOToken(): Promise<string> {
    return getToken("test-po", "testpass");
}

/**
 * Convenience helper to obtain a token for the seeded test administrator.
 */
export async function getAdminToken(): Promise<string> {
    return getToken("test-admin", "testpass");
}
