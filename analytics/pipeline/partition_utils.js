const { DateTime } = require('luxon');

module.exports = {
  getHourPartitionStringForServerTime: serverTime => {
    return DateTime.fromMillis(serverTime).toFormat('yyyy-MM-dd-HH');
  },

  getServerTimeRangeForHourPartitionString: hourPartition => {
    const bits = hourPartition.split('-');
    if (bits.length !== 4) throw 'Wrong partition type';

    const start = DateTime.fromObject({
      years: parseInt(bits[0], 10),
      months: parseInt(bits[1], 10),
      days: parseInt(bits[2], 10), 
      hours: parseInt(bits[3], 10),
    });

    const endExclusive = start.plus({ hours: 1 });

    return {
      start: start.toMillis(),
      endExclusive: endExclusive.toMillis(),
    };
  },
  
  getDayPartitionStringForServerTime: serverTime => {
    return DateTime.fromMillis(serverTime).toFormat('yyyy-MM-dd');
  },

  getServerTimeRangeForDayPartitionString: dayPartition => {
    const bits = dayPartition.split('-');
    if (bits.length !== 3) throw 'Wrong partition type';

    const start = DateTime.fromObject({
      years: parseInt(bits[0], 10),
      months: parseInt(bits[1], 10),
      days: parseInt(bits[2], 10), 
    });

    const endExclusive = start.plus({ days: 1 });

    return {
      start: start.toMillis(),
      endExclusive: endExclusive.toMillis(),
    };
  },
};
