const getClient = require('../client_utils');

const run = async () => {
	const client = await getClient();
	await client.query(`
		CREATE TABLE IF NOT EXISTS static_lesson_durations (
      lesson_id VARCHAR(64) NOT NULL,
      course VARCHAR(32) NOT NULL,
      lesson_index VARCHAR(3) NOT NULL,
      metadata_version VARCHAR(16) NOT NULL,

      duration DOUBLE PRECISION NOT NULL,

      PRIMARY KEY (course, lesson_index, metadata_version)
		);
	`);
	/*await client.query(`
		CREATE INDEX IF NOT EXISTS index_static_lesson_durations_course_lesson_index_metadata_version ON static_lesson_durations (
      course,
      lesson_index,
      metadata_version
		);
	`);*/
  process.exit(0);
};

run();
