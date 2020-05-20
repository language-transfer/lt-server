# Installation

On a fresh Linode running Ubuntu 20.04 LTS:

    git clone https://github.com/language-transfer/lt-server
    cd lt-server
    ./setup.sh

# Usage

To interact with the mongodb server:

`docker exec -it lt-server_mongo_1 mongo "mongodb://lt_db_user@127.0.0.1:27017/lt_logged_data"`

Use the password in `secrets/mongo_password`, then you can:

`> db.activity.find()`

# Attribution

We fetch location data from IP2Location LITE data: https://lite.ip2location.com.
