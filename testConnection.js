const pool = require('./db');

// Try to get a connection from the pool
pool.getConnection((err, connection) => {
  if (err) {
    console.error('Error connecting to database:', err);
    return;
  }

  console.log('Connected to database!');

  // Execute a simple query to test the connection
  connection.query('SELECT 1 + 1 AS result', (err, results) => {
    connection.release(); // Release the connection
    if (err) {
      console.error('Error executing query:', err);
      return;
    }

    console.log('Query result:', results[0].result);

    // Close the pool
    pool.end((err) => {
      if (err) {
        console.error('Error closing pool:', err);
        return;
      }
      console.log('Pool closed.');
    });
  });
});
