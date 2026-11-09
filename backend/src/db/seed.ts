import { query, isDatabaseConnected } from '../config/database';
import { dbStore } from './store';

export const runSeed = async () => {
  console.log('[Database Seeder] Checking database connection...');

  if (!isDatabaseConnected) {
    console.log('[Database Seeder] PostgreSQL is not currently active. In-memory persistence is already pre-loaded with:');
    console.log(`- ${dbStore.vehicles.length} Vehicles`);
    console.log(`- ${dbStore.trips.length} Trips`);
    console.log(`- ${dbStore.drivers.length} Drivers`);
    console.log(`- ${dbStore.parties.length} Mandi Parties`);
    console.log(`- ${dbStore.partyPayments.length} Payment records`);
    console.log(`- ${dbStore.users.length} Users`);
    return;
  }

  try {
    console.log('[Database Seeder] Seeding PostgreSQL database...');
    // Seed company
    await query(
      `INSERT INTO companies (id, company_name, owner_name, mobile, email, address, city, state, gstin, pan_number)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (id) DO UPDATE SET company_name = EXCLUDED.company_name;`,
      [
        'comp-1',
        dbStore.companyProfile.companyName,
        dbStore.companyProfile.ownerName,
        dbStore.companyProfile.mobile,
        dbStore.companyProfile.email,
        dbStore.companyProfile.address,
        dbStore.companyProfile.city,
        dbStore.companyProfile.state,
        dbStore.companyProfile.gstin,
        dbStore.companyProfile.panNumber,
      ]
    );

    console.log('[Database Seeder] Successfully seeded companies.');
  } catch (err) {
    console.error('[Database Seeder Error]:', err);
  }
};

if (process.argv[1]?.endsWith('seed.ts') || process.argv[1]?.endsWith('seed.js')) {
  runSeed().then(() => process.exit(0));
}

