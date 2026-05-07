import pg from 'pg';

const connectionString = 'postgresql://postgres.uvhqisidcqyflovtxume:nekofoxgod95@aws-1-us-east-2.pooler.supabase.com:6543/postgres';

const pool = new pg.Pool({
  connectionString: connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

async function test() {
  try {
    console.log('Testing connection...');
    const result = await pool.query('SELECT NOW()');
    console.log('✅ SUCCESS! Connected to Supabase PostgreSQL');
    console.log('Current time from database:', result.rows[0]);
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
}

test();
