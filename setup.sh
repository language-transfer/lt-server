apt-get install -y fail2ban
apt-get install -y docker.io
apt-get install -y docker-compose

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

sed 's/# METRICS-SSL/listen 443 ssl; ssl_certificate \/opt\/metrics.pem; ssl_certificate_key \/opt\/metrics-key.pem;/' -i nginx.conf
sed 's/# DOWNLOAD-SSL/listen 443 ssl; ssl_certificate \/opt\/download.pem; ssl_certificate_key \/opt\/download-key.pem;/' -i nginx.conf

docker-compose stop
docker-compose up --detach

crontab /root/lt-server/crontab
