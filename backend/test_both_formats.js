import pg from 'pg';

console.log('Testing different connection formats...\n');

// Format 1: With project reference
const conn1 = 'postgresql://postgres.uvhqisidcqyflovtxume:nekofoxgod95@aws-1-us-east-2.pooler.supabase.com:6543/postgres';

// Format 2: Just postgres
const conn2 = 'postgresql://postgres:nekofoxgod95@aws-1-us-east-2.pooler.supabase.com:6543/postgres';

async function testConnection(connectionString, label) {
  const pool = new pg.Pool({
    connectionString: connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log(`Testing ${label}...`);
    const result = await pool.query('SELECT NOW()');
    console.log(`✅ SUCCESS with ${label}!`);
    console.log('Current time:', result.rows[0].now);
    await pool.end();
    return true;
  } catch (error) {
    console.log(`❌ FAILED with ${label}: ${error.message}\n`);
    await pool.end();
    return false;
  }
}

async function test() {
  const success1 = await testConnection(conn1, 'Format 1 (postgres.projectref)');
  if (success1) {
    console.log('\n✅ Use Format 1!');
    process.exit(0);
  }
  
  const success2 = await testConnection(conn2, 'Format 2 (just postgres)');
  if (success2) {
    console.log('\n✅ Use Format 2!');
    process.exit(0);
  }
  
  console.log('\n❌ Both formats failed. Need to check Supabase settings.');
  process.exit(1);
}

test();
