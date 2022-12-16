const partitionUtils = require('../partition_utils');
const getClient = require('../client_utils');
const ltUtils = require('../lt_utils');

const doQuery = async (client, partition) => {
  // const partition = process.argv[2];
  const { start, endExclusive } = partitionUtils.getServerTimeRangeForHourPartitionString(partition);

  const result = await client.query(`
    SELECT course, lesson, COUNT(1) count
    FROM activity
    WHERE
    action = 'finish_lesson'
    AND server_time >= $1
    AND server_time < $2
    GROUP BY course, lesson
  `, [start, endExclusive]);

  const filteredRows = result.rows.filter(r => ltUtils.getCourseNames().includes(r.course));
  
  for (const row of filteredRows) {
    // fine to do this serially, poitroae
    await client.query(`
      INSERT INTO finishes_by_course_lesson_partition (partition_hour, course, lesson, count)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (partition_hour, course, lesson) DO UPDATE SET count=excluded.count;
    `, [ partition, row.course, row.lesson, row.count  ]);
  }
};

if (require.main === module) {
  getClient().then(
    client => doQuery(client, process.argv[2]),
  ).then(() => process.exit(0));
}

module.exports = doQuery;
