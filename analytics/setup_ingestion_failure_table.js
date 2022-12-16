const pg = require('pg');
const fs = require('fs');
const client = new pg.Client({
	user: process.env.POSTGRES_USER,
	password: fs.readFileSync(process.env.POSTGRES_PASSWORD_FILE).toString().trim(),
	host: '127.0.0.1',
	post: 5432,
	database: 'lt_analytics',
});

const run = async () => {
	await client.connect();
	await client.query(`
		CREATE TABLE IF NOT EXISTS failed_ingestions (
			id CHAR(24),
      current_server_time BIGINT
		);
	`);
  process.exit(0);
};

run();
