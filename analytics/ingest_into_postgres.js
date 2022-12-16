const pg = require('pg');
const mongodb = require('mongodb');
const fs = require('fs-extra');
const client = new pg.Client({
	user: process.env.POSTGRES_USER,
	password: fs.readFileSync(process.env.POSTGRES_PASSWORD_FILE).toString().trim(),
	host: 'postgres',
	post: 5432,
	database: 'lt_analytics',
});

const run = async () => {
  const mongoPassword = (await fs.readFile(process.env.POSTGRES_PASSWORD_FILE)).toString().trim(); // shhhhhhhhhhhhhh

  const mongoClient = await new Promise((done, err) => {
    const mongoClient = new mongodb.MongoClient(
      `mongodb://lt_db_user:${
        mongoPassword /* boy let's hope that's alphanumeric like it's supposed to be */
	    }@mongo/lt_logged_data`,
	  );

	  const connect = (retriesLeft) => {
	    console.log("connect", retriesLeft);
	    if (retriesLeft === 0) {
	    	err("IT DON'T WORK");
     		return;
	    }
	    mongoClient.connect((e, client) => {
    		if (e) {
		      setTimeout(() => connect(retriesLeft - 1), 1000);
    		  return;
    		}
    		done(client);
	    });
	  };

	  connect(60);
	});

  const mongoDatabase = mongoClient.db("lt_logged_data");
  const collection = mongoDatabase.collection("activity");

  await client.connect();

  let locked = false;
  const ingest = async () => {
    if (locked) {
      console.error('ingestion overloaded');
      process.exit(1);
      return; // bro idk
    }
    
    locked = true;
    
    const currentTime = +new Date();
    const tenMinutesAgo = currentTime - 1000 * 60 * 10;
    console.log(+new Date(), 'ingesting all since', tenMinutesAgo)

    const cursor = collection.find({ server_time: { $gt: tenMinutesAgo } });

    let i = 0;
    let failures = 0;

    for await (const doc of cursor) {
      i++;
      try {
        await client.query(`INSERT INTO activity (
          id,
          local_time,
          timezone_offset,
          user_token,

          ip_hash,
          ip_salt_hash,
          ip_country,

          server_time,

          device_os,
          device_os_version,
          app_version,

          action,
          surface,
          course,
          metadata_version,
          lesson,
          position,
          setting_value,

          is_from_google_instrumentation
        ) VALUES (
          $1, $2, $3, $4,
          $5, $6, $7,
          $8,
          $9, $10, $11,
          $12, $13, $14, $15, $16, $17, $18,
          $19
        ) ON CONFLICT (id) DO NOTHING`, [
          doc._id.toString(),
          doc.local_time || null,
          doc.timezone_offset || null,
          doc.user_token || null,

          doc.ip_hash || null,
          doc.ip_salt_hash || null,
          doc.ip_country || null,

          doc.server_time,

          doc.device_os?.substring(0, 64) || null,
          doc.device_os_version?.substring(0, 32) || null,
          doc.app_version?.substring(0, 32) || null,

          doc.action?.substring(0, 128) || null,
          doc.surface?.substring(0, 128) || null,
          doc.course?.toString()?.substring(0, 32) || null,
          // doc.course?.substring(0, 32) || null,
          doc.metadata_version?.toString()?.substring(0, 16) || null,
          doc.lesson?.toString()?.substring(0, 32) || null,
          doc.position || null,
          doc.setting_value?.toString()?.substring(0, 256) || null,

          doc.is_from_google_instrumentation || null,
        ]);
      } catch (e) {
        failures++;
        try {
          await client.query(
            'INSERT INTO failed_ingestions (id, current_server_time) VALUES ($1, $2)',
            [doc?._id?.toString(), +new Date()],
          );
        } catch (e) {
          fs.writeFileSync('ingestion_failure_failure'); // lol
          console.error('ingestion failure failed');
        }
      }
    }
    console.log(+new Date(), 'ingested (non-unique)', i, 'with', failures, 'failures');
    locked = false;
  };

  setInterval(ingest, 5 * 60 * 1000);
  ingest();
};

run();
