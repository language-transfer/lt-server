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
		CREATE TABLE IF NOT EXISTS activity (
			id CHAR(24) NOT NULL,
			local_time BIGINT,
			timezone_offset SMALLINT,
			user_token VARCHAR(64),

			ip_hash VARCHAR(64),
			ip_salt_hash VARCHAR(64),
			ip_country CHAR(2),

			server_time BIGINT NOT NULL,

			device_os VARCHAR(64),
			device_os_version VARCHAR(32),
			app_version VARCHAR(32),

			action VARCHAR(128),
			surface VARCHAR(128),
			course VARCHAR(32),
			metadata_version VARCHAR(16), -- I think this is sent to the server as an int but we can coerce it
			lesson VARCHAR(32), -- same, I think the app might even be inconsistent about what it sends here
			position DOUBLE PRECISION,
			setting_value VARCHAR(256),

			is_from_google_instrumentation BOOLEAN,

			PRIMARY KEY (id)
		);
	`);
	await client.query(`
		CREATE INDEX IF NOT EXISTS index_activity_server_time ON activity (
			server_time
		);
		
		CREATE INDEX IF NOT EXISTS index_activity_user_token ON activity (
			user_token
		);
		
		CREATE INDEX IF NOT EXISTS index_activity_course_lesson ON activity (
			course,
			lesson
		);
		
		CREATE INDEX IF NOT EXISTS index_activity_lesson ON activity (
			lesson -- not sure if query optimizers are smart enough to use the above index for like 'WHERE lesson > 10' since there are only a few courses
		);

		CREATE INDEX IF NOT EXISTS index_activity_action_surface ON activity (
			action,
			surface
		);
	`);
  process.exit(0);
};

run();
