const doQuery = require('./upsert_for_partition.js');
const { DateTime } = require('luxon');
const partitionUtils = require('../partition_utils');
const getClient = require('../client_utils');

let { start } = partitionUtils.getServerTimeRangeForHourPartitionString('2021-07-09-00');

const run = async () => {
  const client = await getClient();

  while (start < +new Date()) {
    const partition = partitionUtils.getHourPartitionStringForServerTime(start);
    console.log(partition);

    await doQuery(client, partition);

    start = DateTime.fromMillis(start).plus({ hours: 1 }).toMillis();
  }
};

run();
