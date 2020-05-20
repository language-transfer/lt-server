apt-get install -y fail2ban
apt-get install -y docker.io
apt-get install -y docker-compose
apt-get install -y certbot

mkdir -p secrets

# generate a password for the mongo database
tr -cd '[:alnum:]' < /dev/urandom | fold -w64 | head -n1 > secrets/mongo_password
tr -cd '[:alnum:]' < /dev/urandom | fold -w64 | head -n1 > secrets/mongo_root_password

cd metrics
docker build -t metrics .
cd ..

docker-compose up --detach

# certbot
mkdir -p certbot-challenge
certbot certonly --webroot -w /root/lt-server/certbot-challenge/ -d metrics-lt.syntaxblitz.net -m lt-certbot@tacosareawesome.com --agree-tos --no-eff-email
certbot certonly --webroot -w /root/lt-server/certbot-challenge/ -d download-lt.syntaxblitz.net -m lt-certbot@tacosareawesome.com --agree-tos --no-eff-email

sed 's/#del//g' -i nginx.conf
sed 's/#del//g' -i docker-compose.yml

docker-compose stop
docker-compose up --detach

crontab /root/lt-server/crontab
