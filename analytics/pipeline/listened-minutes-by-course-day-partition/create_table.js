const getClient = require('../client_utils');

const run = async () => {
	const client = await getClient();
	await client.query(`
		CREATE TABLE IF NOT EXISTS listened_minutes_by_course_day_partition (
      partition_day CHAR(10) NOT NULL,
      partition_day_date DATE NOT NULL,
      course VARCHAR(32) NOT NULL,
      minutes DOUBLE PRECISION NOT NULL,

      PRIMARY KEY (partition_day, course)
		);
	`);
  await client.query(`
    CREATE INDEX index_listened_minutes_by_course_day_partition_partition_day_date_course ON listened_minutes_by_course_day_partition (
      partition_day_date,
      course
    )
  `)
  process.exit(0);
};

run();
