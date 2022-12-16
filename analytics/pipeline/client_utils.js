const pg = require('pg');
const fs = require('fs-extra');

module.exports = async () => {
  const password = await fs.readFile('/root/lt-server/secrets/mongo_password').then(b => b.toString().trim());
  const client = new pg.Client({
	  user: 'lt_db_user',
  	password,
  	host: '127.0.0.1',
  	post: 5432,
  	database: 'lt_analytics',
  });
  await client.connect();
  return client;
};
