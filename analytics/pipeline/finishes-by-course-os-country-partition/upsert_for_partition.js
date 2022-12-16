const partitionUtils = require('../partition_utils');
const getClient = require('../client_utils');
const ltUtils = require('../lt_utils');
const { DateTime } = require('luxon');

const pgFormat = require('pg-format');

const doQuery = async (client, partition) => {
  // const partition = process.argv[2];
  const { start, endExclusive } = partitionUtils.getServerTimeRangeForHourPartitionString(partition);

  //console.log(+new Date(), 'before query');
  const result = await client.query(`
    SELECT course, device_os, ip_country, COUNT(1) count
    FROM activity
    WHERE
    action = 'finish_lesson'
    AND server_time >= $1
    AND server_time < $2
    GROUP BY course, device_os, ip_country
  `, [start, endExclusive]);

  //console.log(+new Date(), 'after query');
  const filteredRows = result.rows.filter(r => ltUtils.getCourseNames().includes(r.course));

  const insertRows = filteredRows.map(row => [ partition, DateTime.fromMillis(start).toISO(), row.course, row.device_os || 'unknown', row.ip_country || '??', row.count ]);

  if (insertRows.length === 0) {
    console.error('no rows for partition', partition);
    return;
  }
  // console.log(insertRows);

  await client.query(pgFormat(`
    INSERT INTO finishes_by_course_os_country_partition (partition_hour, partition_hour_datetime, course, os, country, count)
    VALUES %L
    ON CONFLICT (partition_hour, course, os, country) DO UPDATE SET count=excluded.count;
  `, insertRows));
  //console.log(+new Date(), 'after insert');
};

if (require.main === module) {
  getClient().then(
    client => doQuery(client, process.argv[2]),
  ).then(() => process.exit(0));
}

module.exports = doQuery;
