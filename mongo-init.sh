# https://stackoverflow.com/questions/42912755

mongo -- "$MONGO_INITDB_DATABASE" <<EOF
    const rootUser = '$MONGO_INITDB_ROOT_USERNAME';
    const rootPassword = '$(cat "$MONGO_INITDB_ROOT_PASSWORD_FILE")';
    const admin = db.getSiblingDB('admin');
    admin.auth(rootUser, rootPassword);

    const user = '$MONGO_INITDB_USERNAME';
    const passwd = '$(cat "$MONGO_INITDB_PASSWORD_FILE")';
    db.createUser({user: user, pwd: passwd, roles: ["readWrite"]});
EOF