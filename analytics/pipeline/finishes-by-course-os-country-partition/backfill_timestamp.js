//sigh

const { DateTime } = require('luxon');
const partitionUtils = require('../partition_utils');
const getClient = require('../client_utils');

let { start } = partitionUtils.getServerTimeRangeForHourPartitionString('2020-04-01-00');

const run = async () => {
  const client = await getClient();

  while (start < +new Date()) {
    const partition = partitionUtils.getHourPartitionStringForServerTime(start);
    console.log(partition);

    await client.query(`
      UPDATE finishes_by_course_os_country_partition
      SET partition_hour_datetime = $1
      WHERE partition_hour = $2;
    `, [ DateTime.fromMillis(start).toISO(), partition])

    start = DateTime.fromMillis(start).plus({ hours: 1 }).toMillis();
  }

  process.exit(0);
};

run();
