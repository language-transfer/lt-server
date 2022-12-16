const getClient = require('../client_utils');

const run = async () => {
	const client = await getClient();
	await client.query(`
		CREATE TABLE IF NOT EXISTS finishes_by_course_os_country_partition (
      partition_hour CHAR(13) NOT NULL,
      partition_hour_datetime TIMESTAMP NOT NULL,
      course VARCHAR(32) NOT NULL,
      os VARCHAR(64) NOT NULL,
      country CHAR(2) NOT NULL,
      count BIGINT NOT NULL,

      PRIMARY KEY (partition_hour, course, os, country)
		);
	`);
  /*await client.query(`
  CREATE VIEW IF NOT EXISTS view_finishes_by_course_partition AS
    SELECT course, partition_hour, max(partition_hour_datetime), sum(count)
    FROM finishes_by_course_os_country_partition
    GROUP BY course, partition_hour;
  `);*/ // this isn't useful
	await client.query(`
		CREATE INDEX IF NOT EXISTS index_finishes_by_course_os_country_partition_partition_course_country_os ON finishes_by_course_os_country_partition (
			partition_hour,
      course,
      country,
      os
		);
	`);
  process.exit(0);
};

run();
