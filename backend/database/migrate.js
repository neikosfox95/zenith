// ============================================================
// DATABASE MIGRATION SCRIPT
// Run this to initialize PostgreSQL analytics database
// ============================================================

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool, { query } from '../lib/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function migrate() {
  console.log('🚀 Starting database migration...\n');

  try {
    // Read schema file
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    // Execute schema
    console.log('📝 Creating tables and indexes...');
    await query(schema);
    console.log('✅ Schema created successfully!\n');

    // Verify tables
    const tables = await query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);

    console.log('📊 Created tables:');
    tables.rows.forEach(row => {
      console.log(`   ✓ ${row.table_name}`);
    });

    console.log(`\n✅ Migration complete! Created ${tables.rows.length} tables.`);

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

// Run migration
migrate();
