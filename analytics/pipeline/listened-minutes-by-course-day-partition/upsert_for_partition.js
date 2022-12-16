const partitionUtils = require('../partition_utils');
const getClient = require('../client_utils');
const ltUtils = require('../lt_utils');
const { DateTime } = require('luxon');

const pgFormat = require('pg-format');

const doQuery = async (client, partition) => {
  const { start, endExclusive } = partitionUtils.getServerTimeRangeForDayPartitionString(partition);

  const result = await client.query(`
    SELECT activity.course course, sum(duration) seconds
    FROM activity
    INNER JOIN static_lesson_durations
      ON activity.lesson = static_lesson_durations.lesson_index
      AND activity.course = static_lesson_durations.course
      AND activity.metadata_version = static_lesson_durations.metadata_version
    WHERE
      action = 'finish_lesson'
      AND server_time >= $1
      AND server_time < $2
    GROUP BY activity.course
  `, [start, endExclusive]);

  //console.log(+new Date(), 'after query');
  const filteredRows = result.rows.filter(r => ltUtils.getCourseNames().includes(r.course));

  const insertRows = filteredRows.map(row => [ partition, DateTime.fromMillis(start).toISO(), row.course, row.seconds / 60 ]); // hmm not sure i should've converted units whatever

  if (insertRows.length === 0) {
    console.error('no rows for partition', partition);
    return;
  }
  // console.log(insertRows);

  await client.query(pgFormat(`
    INSERT INTO listened_minutes_by_course_day_partition (partition_day, partition_day_date, course, minutes)
    VALUES %L
    ON CONFLICT (partition_day, course) DO UPDATE SET minutes=excluded.minutes;
  `, insertRows));
  //console.log(+new Date(), 'after insert');
};

if (require.main === module) {
  getClient().then(
    client => doQuery(client, process.argv[2]),
  ).then(() => process.exit(0));
}

module.exports = doQuery;
