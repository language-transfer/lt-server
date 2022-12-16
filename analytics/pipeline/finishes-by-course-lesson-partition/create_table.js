const getClient = require('../client_utils');

const run = async () => {
	const client = await getClient();
	await client.query(`
		CREATE TABLE IF NOT EXISTS finishes_by_course_lesson_partition (
      partition_hour CHAR(13) NOT NULL,
      course VARCHAR(32) NOT NULL,
      lesson VARCHAR(32) NOT NULL,
      count BIGINT NOT NULL,

      PRIMARY KEY (partition_hour, course, lesson)
		);
	`);
	await client.query(`
		CREATE INDEX IF NOT EXISTS index_finishes_by_course_lesson_partition_course_lesson ON finishes_by_course_lesson_partition (
			course,
      lesson
		);
	`);
  process.exit(0);
};

run();
