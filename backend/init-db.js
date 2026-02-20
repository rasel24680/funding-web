require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');

async function initializeDatabase() {
  const schema = fs.readFileSync('./database/schema.sql', 'utf8');
  
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
  });

  try {
    // Split schema into individual statements
    const statements = schema
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);

    for (const statement of statements) {
      try {
        await connection.query(statement);
        console.log('✅ Executed statement');
      } catch (error) {
        if (error.code !== 'ER_DB_CREATE_EXISTS' && 
            error.code !== 'ER_TABLE_EXISTS_ERROR' &&
            !error.message.includes('already exists')) {
          console.error('Error:', error.message);
        }
      }
    }

    console.log('✅ Database initialized successfully');
  } finally {
    await connection.end();
  }
}

initializeDatabase().catch(error => {
  console.error('Failed to initialize database:', error);
  process.exit(1);
});
