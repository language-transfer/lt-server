const doQuery = require('./upsert_for_partition.js');
const { DateTime } = require('luxon');
const partitionUtils = require('../partition_utils');
const getClient = require('../client_utils');

let { start } = partitionUtils.getServerTimeRangeForDayPartitionString('2022-12-14');

const run = async () => {
  const client = await getClient();

  while (start < +new Date()) {
    const partition = partitionUtils.getDayPartitionStringForServerTime(start);
    console.log(partition);

    await doQuery(client, partition);

    start = DateTime.fromMillis(start).plus({ days: 1 }).toMillis();
  }

  process.exit(0);
};

run();
