mkdir -p secrets

# generate a password for the mongo database
tr -cd '[:alnum:]' < /dev/urandom | fold -w64 | head -n1 > secrets/mongo_password
tr -cd '[:alnum:]' < /dev/urandom | fold -w64 | head -n1 > secrets/mongo_root_password

cd metrics
docker build -t metrics .
cd ..