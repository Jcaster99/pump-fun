# Kompleksowy poradnik wdrożenia aplikacji lf0g.fun na serwer

## 1. Przygotowanie serwera

```bash
# Połączenie z serwerem
ssh root@217.76.49.255

# Aktualizacja systemu
apt update && apt upgrade -y

# Instalacja wymaganych zależności
apt install -y nodejs npm git nginx certbot python3-certbot-nginx

# Instalacja menadżera procesów PM2
npm install -y pm2 -g

# Utworzenie katalogu na aplikację
mkdir -p /var/www/lf0g.fun
```

## 2. Klonowanie repozytorium

```bash
# Przejście do katalogu aplikacji
cd /var/www/lf0g.fun

# Klonowanie repozytorium (zakładając, że masz dostęp do repo)
git clone [URL_TWOJEGO_REPOZYTORIUM] .

# Instalacja wszystkich zależności
npm run install-all
```

## 3. Konfiguracja zmiennych środowiskowych

### client/.env
```
REACT_APP_PRODUCTION=true
REACT_APP_API_URL=https://api.lf0g.fun/api
COMPILER_URL=https://compiler.lf0g.fun
REACT_APP_WALLET_CONNECT_PROJECT_ID=34121ad34d9bc22e1afc6f45f72b3fdd
REACT_APP_LEADERBOARD_API_URL=https://leaderboard.lf0g.fun
REACT_APP_TRANSACTION_WEBSOCKET_URL=https://transactions.lf0g.fun
PUBLIC_URL=https://lf0g.fun
```

### server/.env
```
PORT=5000
JWT_SECRET=[WYGENERUJ_SILNE_HASŁO]
NODE_ENV=production
```

### leaderboard-service/.env
```
LEADERBOARD_API_PORT=3004
LEADERBOARD_DB_PATH=./leaderboard.sqlite
LEADERBOARD_SCHEMA_PATH=./schema.sql
ENABLE_SCHEDULED_UPDATES=true
UPDATE_SCHEDULE=*/30 * * * *
CHAIN_ID=80087
SWAP_CONTRACT=0x16a811adc55499b4456f562c54f120356f1559a268
POOLS_CONTRACT=0x9367fc0a8b1d99437c0053aaa517b4f9e130086ae
MAX_WALLETS=100
BLOCKS_PER_BATCH=1000
INITIAL_TRANSACTION_HASH=0x13e8824245cbfcc8f26773436ca889467bae8c6620634784d875709ce9bd6056e
REACT_APP_PRODUCTION=true
```

### token-compiler-service/.env
```
PORT=3003
NODE_ENV=production
```

### transaction-broadcast-service/.env
```
PORT=3005
NODE_ENV=production
```

## 4. Konfiguracja zabezpieczeń CORS

### W token-compiler-service/index.js:
```javascript
app.use(cors({
  origin: ['https://lf0g.fun', 'https://www.lf0g.fun'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));
```

### W leaderboard-service/src/services/ApiService.js:
```javascript
app.use(cors({
  origin: ['https://lf0g.fun', 'https://www.lf0g.fun'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));
```

### W transaction-broadcast-service/server.js:
```javascript
cors: {
  origin: ['https://lf0g.fun', 'https://www.lf0g.fun'],
  methods: ['GET', 'POST']
}
```

## 5. Budowanie aplikacji klienckiej

```bash
cd /var/www/lf0g.fun/client
npm run build
```

## 6. Konfiguracja Nginx

Utwórz pliki konfiguracyjne dla każdej subdomeny:

### /etc/nginx/sites-available/lf0g.fun
```nginx
server {
    listen 80;
    server_name lf0g.fun www.lf0g.fun;

    root /var/www/lf0g.fun/client/build;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /docs {
        try_files $uri $uri/ /docs/index.html;
    }
}
```

### /etc/nginx/sites-available/api.lf0g.fun
```nginx
server {
    listen 80;
    server_name api.lf0g.fun;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### /etc/nginx/sites-available/compiler.lf0g.fun
```nginx
server {
    listen 80;
    server_name compiler.lf0g.fun;

    location / {
        proxy_pass http://localhost:3003;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### /etc/nginx/sites-available/leaderboard.lf0g.fun
```nginx
server {
    listen 80;
    server_name leaderboard.lf0g.fun;

    location / {
        proxy_pass http://localhost:3004;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### /etc/nginx/sites-available/transactions.lf0g.fun
```nginx
server {
    listen 80;
    server_name transactions.lf0g.fun;

    location / {
        proxy_pass http://localhost:3005;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }
}
```

Aktywacja konfiguracji:
```bash
cd /etc/nginx/sites-enabled
ln -s /etc/nginx/sites-available/lf0g.fun
ln -s /etc/nginx/sites-available/api.lf0g.fun
ln -s /etc/nginx/sites-available/compiler.lf0g.fun
ln -s /etc/nginx/sites-available/leaderboard.lf0g.fun
ln -s /etc/nginx/sites-available/transactions.lf0g.fun

# Sprawdzenie konfiguracji
nginx -t

# Restart Nginx
systemctl restart nginx
```

## 7. Konfiguracja SSL

```bash
# Uzyskanie certyfikatów SSL dla wszystkich subdomen
certbot --nginx -d lf0g.fun -d www.lf0g.fun -d api.lf0g.fun -d compiler.lf0g.fun -d leaderboard.lf0g.fun -d transactions.lf0g.fun
```

## 8. Uruchomienie usług

```bash
cd /var/www/lf0g.fun

# Uruchomienie wszystkich usług jako procesy w tle
pm2 start server/src/index.js --name api-server
pm2 start token-compiler-service/index.js --name compiler
pm2 start leaderboard-service/src/index.js --name leaderboard
pm2 start transaction-broadcast-service/server.js --name transactions

# Zapisanie konfiguracji PM2
pm2 save

# Konfiguracja automatycznego startu po restarcie serwera
pm2 startup
```

## 9. Konfiguracja kopii zapasowych

```bash
# Dodanie skryptu backup-databases.js do crona
crontab -e
```

Dodaj linię:
```
0 2 * * * cd /var/www/lf0g.fun && node backup-databases.js
```

## 10. Monitoring

```bash
# Monitorowanie procesów
pm2 monit

# Sprawdzenie logów
pm2 logs
```

## 11. Konfiguracja DNS

Upewnij się, że rekordy DNS są poprawnie skonfigurowane:
- A Record @ -> 217.76.49.255
- A Record www -> 217.76.49.255
- A Record api -> 217.76.49.255
- A Record compiler -> 217.76.49.255
- A Record leaderboard -> 217.76.49.255
- A Record transactions -> 217.76.49.255

## 12. Testowanie

Po wdrożeniu sprawdź, czy wszystkie funkcje działają poprawnie:
1. Odwiedź stronę główną: https://lf0g.fun
2. Sprawdź dokumentację: https://lf0g.fun/docs
3. Zweryfikuj, czy API działa: https://api.lf0g.fun/api/health
   Oczekiwana odpowiedź: `{"status":"ok","message":"lf0g.fun API is running"}`
4. Sprawdź usługę leaderboard: https://leaderboard.lf0g.fun/api/health
   Oczekiwana odpowiedź: `{"status":"ok","service":"leaderboard-service","timestamp":"2025-04-28T21:13:18.112Z"}`

## Rozwiązywanie problemów

1. Sprawdź logi PM2: `pm2 logs`
2. Sprawdź logi Nginx: `tail -f /var/log/nginx/error.log`
3. Zweryfikuj status usług: `pm2 status`
4. Sprawdź konfigurację CORS w przypadku problemów z komunikacją między usługami

Ta konfiguracja umożliwi uruchomienie aplikacji lf0g.fun w środowisku produkcyjnym z odpowiednimi subdomenami. 