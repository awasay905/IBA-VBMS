import { resetDatabase } from '../integration/helpers/seed.helper';

async function globalSetup() {
  console.log('Global Setup: Resetting Database for E2E tests...');
  await resetDatabase();
}

export default globalSetup;