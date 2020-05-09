mkdir -p secrets
tr -cd '[:alnum:]' < /dev/urandom | fold -w64 | head -n1 > secrets/postgres_password
