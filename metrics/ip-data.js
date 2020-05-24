import memoize from "p-memoize";
import csv from "csv-parser";
import fs from "fs";
import ipAddress from "ip-address";
import crypto, { Hash } from "crypto";

// we don't want to store users' IP addresses.
// BUT: it'd be nice to store a hash of their IP, which could help understand if we're being hammered by one node.
// to do this in a privacy-aware way, we have to rotate out a salt.
// we store the hash of this salt (not the salt itself! that makes it too easy to figure out the IP) just so we can see when it rotates,
// this is also where we grab the probable country associated with the IP, for analytics. then we dump it.

let lastSaltRefreshTime = 0;
let salt = null;
let saltHash = null;

const REFRESH_AFTER = 60 * 60 * 1000; // 1 hour

const genIPv4Table = memoize(async () => {
  const table = [];

  return await new Promise((done) => {
    fs.createReadStream("IP2LOCATION-LITE-DB1.CSV")
      .pipe(
        csv({
          headers: ["rangeStart", "rangeEnd", "countryCode", "_"],
          mapValues: ({ header, index, value }) =>
            header.includes("range") ? BigInt(value) : value,
        })
      )
      .on("data", (data) => table.push(data))
      .on("end", () => {
        done(table);
      });
  });
});

const genIPv6Table = memoize(async () => {
  const table = [];

  return await new Promise((done) => {
    fs.createReadStream("IP2LOCATION-LITE-DB1.IPV6.CSV")
      .pipe(
        csv({
          headers: ["rangeStart", "rangeEnd", "countryCode", "_"],
          mapValues: ({ header, index, value }) =>
            header.includes("range") ? BigInt(value) : value,
        })
      )
      .on("data", (data) => table.push(data))
      .on("end", () => {
        done(table);
      });
  });
});

const locate = (address, table) => {
  let lowInclusive = 0;
  let highInclusive = table.length - 1;
  let i = 0;
  while (lowInclusive <= highInclusive) {
    const index = Math.floor((highInclusive - lowInclusive) / 2 + lowInclusive);
    if (address < table[index].rangeStart) {
      highInclusive = index - 1;
    } else if (address > table[index].rangeEnd) {
      lowInclusive = index + 1;
    } else {
      return table[index].countryCode;
    }
  }

  // oh no
  return null;
};

const locateIPv4 = async (ip) => {
  const table = await genIPv4Table();
  return locate(ip, table);
};

const locateIPv6 = async (ip) => {
  const table = await genIPv6Table();
  return locate(ip, table);
};

const getIPObject = (ip) => {
  const as4 = new ipAddress.Address4(ip);
  if (as4.isValid()) {
    return as4;
  }

  const as6 = new ipAddress.Address6(ip);
  if (!as6.isValid()) {
    return null;
  }

  if (as6.v4) {
    return as6.to4();
  }

  return as6;
};

// https://firebase.google.com/docs/test-lab/android/overview#and_mobile_advertising
const GOOGLE_IP_BLOCKS = [
  "108.177.6.0/23",
  "74.125.122.32/29",
  "216.239.44.24/29",
  "34.68.194.64/29",
  "34.69.234.64/29",
  "34.73.34.72/29",
  "34.73.178.72/29",
  "35.192.160.56/29",
  "35.196.166.80/29",
  "35.196.169.240/29",
  "35.203.128.0/28",
  "35.234.176.160/28",
  "35.243.2.0/27",
  "199.192.115.0/30",
  "199.192.115.8/30",
  "199.192.115.16/29",
].map((ip) => new ipAddress.Address4(ip));

const isFromGoogleInstrumentation = (ip) => {
  return GOOGLE_IP_BLOCKS.some((block) => ip.isInSubnet(block));
};

const processIP = async (ip) => {
  const ipObject = getIPObject(ip);
  const asNumber = BigInt(ipObject.bigInteger());

  const ip_country = await (ipObject.v4
    ? locateIPv4(asNumber)
    : locateIPv6(asNumber));

  if (+new Date() - lastSaltRefreshTime > REFRESH_AFTER) {
    lastSaltRefreshTime = +new Date();
    salt = crypto.randomBytes(16);
    const saltHashObject = crypto.createHash("sha256");
    saltHashObject.update(salt);
    saltHash = saltHashObject.digest("base64");
  }

  const ipHashObject = crypto.createHash("sha256");
  ipHashObject.update(salt);
  ipHashObject.update(asNumber.toString());
  const ip_hash = ipHashObject.digest("base64");

  return {
    ip_hash,
    ip_salt_hash: saltHash,
    ip_country,
    is_from_google_instrumentation: isFromGoogleInstrumentation(ipObject),
  };
};

export default processIP;
