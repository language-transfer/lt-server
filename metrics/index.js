import express from "express";
import bodyParser from "body-parser";
import crypto from "crypto";
import processIP from "./ip-data.js";

const PORT = 6774;

const BYTE_LIMIT = 2048;
const PERMITTED_FIELDS = new Set([
  "local_time",
  "timezone_offset",
  "user_token",

  "ip_hash",
  "ip_salt_hash",
  "ip_country",
  "server_time",

  "device_os",
  "device_os_version",
  "app_version",

  "action",
  "surface",
  "course",
  "metadata_version",
  "lesson",
  "position",
  "setting_value",

  "is_from_google_instrumentation",
]);

import fs from "fs";
import mongodb from "mongodb";

new Promise((done, error) =>
  fs.readFile("/opt/secrets/mongo_password", (_e, file) => {
    const mongoPassword = file.toString().trim();
    const mongoClient = new mongodb.MongoClient(
      `mongodb://lt_db_user:${
        mongoPassword /* boy let's hope that's alphanumeric like it's supposed to be */
      }@mongo/lt_logged_data`,
      {
        reconnectTries: 50,
        reconnectInterval: 5000,
      }
    );

    const connect = (retriesLeft) => {
      console.log("connect", retriesLeft);
      if (retriesLeft === 0) {
        error("IT DON'T WORK");
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
  })
)
  .then((client) => {
    const db = client.db("lt_logged_data");
    const collection = db.collection("activity");

    return collection;
  })
  .then((collection) => {
    const app = express();
    app.use(bodyParser.json({ limit: BYTE_LIMIT }));
    app.enable("trust proxy");

    app.post("/log", async (req, res) => {
      const ipData = await processIP(req.ip);

      const token = req.body.user_token || null;
      let tokenHash = null;
      if (token !== null) {
        const hashObject = crypto.createHash("sha256");
        hashObject.update(token);
        tokenHash = hashObject.digest("base64");
      }

      const allData = {
        ...req.body,
        ...ipData,
        server_time: +new Date(),
        user_token: tokenHash,
      };

      if (!Object.keys(allData).every((field) => PERMITTED_FIELDS.has(field))) {
        res.status(400).send();
        return;
      }

      collection.insertOne(allData);
      res.status(200).send();
    });

    app.listen(PORT);
  });
