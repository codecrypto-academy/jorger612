const pool = require('./config/database');

async function setupDatabase() {
  try {
    console.log('🔍 Testing database connection...');
    
    // Test the connection
    const result = await pool.query('SELECT NOW()');
    console.log('✅ Database connection successful!');
    console.log(`📅 Server time: ${result.rows[0].now}`);
    
    // Check if company table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'company'
      );
    `);
    
    if (tableCheck.rows[0].exists) {
      console.log('✅ Company table already exists');
      
      // Count existing records
      const countResult = await pool.query('SELECT COUNT(*) FROM company');
      console.log(`📊 Found ${countResult.rows[0].count} companies in the database`);
    } else {
      console.log('❌ Company table does not exist');
      console.log('💡 Please run the database.sql script to create the table');
    }
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.log('\n🔧 Troubleshooting tips:');
    console.log('1. Make sure PostgreSQL container is running');
    console.log('2. Check if the container is accessible on localhost:5432');
    console.log('3. Verify the database credentials in config/database.js');
    console.log('4. Run: docker-compose up -d db');
  } finally {
    await pool.end();
  }
}

// Run setup if this file is executed directly
if (require.main === module) {
  setupDatabase();
}

module.exports = setupDatabase; 