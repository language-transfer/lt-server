const getClient = require('./client_utils');
const partitionUtils = require('./partition_utils');
const { DateTime } = require('luxon');
const finishesByCourseOSCountryPartition = require('./finishes-by-course-os-country-partition/upsert_for_partition');
const listenedMinutesByCourseDayPartition = require('./listened-minutes-by-course-day-partition/upsert_for_partition');

const fs = require('fs-extra');

const run = async (runWhich) => {
  if (await fs.exists('./pipeline-lock')) {
    console.error('Pipeline is locked');
    process.exit(1);
  }
  // this race condition isn't a huge deal. the goal is to prevent it from overloading, not because running twice at once breaks things
  await fs.writeFile('./pipeline-lock', '');

  const client = await getClient();

  const now = DateTime.now();
  const currentHourPartition = partitionUtils.getHourPartitionStringForServerTime(now.toMillis());
  const lastHourPartition = partitionUtils.getHourPartitionStringForServerTime(now.minus({ hours: 1 }).toMillis());
  
  const currentDayPartition = partitionUtils.getDayPartitionStringForServerTime(now.toMillis());
  const lastDayPartition = partitionUtils.getDayPartitionStringForServerTime(now.minus({ days: 1 }).toMillis());
  
  const runHourly = async query => {
    await query(client, lastHourPartition);
    await query(client, currentHourPartition);
  };

  const runDaily = async query => {
    if (runWhich !== 'daily') {
      return;
    }
    await query(client, lastDayPartition);
    await query(client, currentDayPartition);
  };

  await runHourly(finishesByCourseOSCountryPartition);
  
  await runDaily(listenedMinutesByCourseDayPartition);
  
  await fs.remove('./pipeline-lock');

  process.exit(0);
};

run(process.argv[2] || 'daily');
