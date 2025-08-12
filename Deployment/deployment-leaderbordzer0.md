# Instrukcja wdrożenia leaderboard-service na VPS (maj 2025)

Poniżej znajdziesz szczegółową instrukcję krok po kroku, jak wdrożyć serwis leaderboard-service na subdomenie dexchecker.lf0g.fun.

## 1. Konfiguracja domeny/subdomeny w Namecheap

1. Zaloguj się do panelu Namecheap
2. Przejdź do zarządzania domeną lf0g.fun
3. Wybierz "Advanced DNS"
4. Dodaj nowy rekord:
   - Typ: A Record
   - Host: dexchecker
   - Wartość: [Adres IP twojego VPS]
   - TTL: Automatic

## 2. Przygotowanie serwera VPS

```bash
# Aktualizacja systemu
sudo apt update
sudo apt upgrade -y

# Instalacja potrzebnych narzędzi
sudo apt install -y build-essential git curl nano

# Instalacja Node.js 24 LTS (najnowsza wersja w maju 2025)
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt install -y nodejs

# Weryfikacja wersji Node.js i npm
node -v  # Powinno pokazać v24.x.x
npm -v   # Powinno pokazać najnowszą wersję npm

# Instalacja PM2 globalnie (narzędzie do zarządzania procesami)
sudo npm install -g pm2

# Instalacja Nginx
sudo apt install -y nginx
```

## 3. Klonowanie repozytorium

```bash
# Utworzenie katalogu na aplikacje
mkdir -p /var/www
cd /var/www

# Klonowanie repozytorium
git clone https://github.com/desu777/lf0g.fun---bonding-curve.git
cd lf0g.fun---bonding-curve/leaderboard-service

# Instalacja zależności
npm install
```

## 4. Konfiguracja zmiennych środowiskowych

```bash
# Utworzenie pliku .env
nano .env
```

Zawartość pliku .env (dostosuj wartości zgodnie z twoimi potrzebami):

```
# Port dla API
LEADERBOARD_API_PORT=3004

# Ścieżki do bazy danych
LEADERBOARD_DB_PATH=./leaderboard.sqlite
LEADERBOARD_SCHEMA_PATH=./schema.sql

# Ścieżki do endpointów API
RPC_ENDPOINT=https://evmrpc-testnet.0g.ai
CHAIN_ID=16601

# Kontrakty do monitorowania
SWAP_CONTRACT=0x16a811adc55A99b4456F62c54F12D3561559a268
POOLS_CONTRACT=0x93e7FC0bBB1db9437Cd053AAA517b4f9e13DB6AE

# Początkowy hash transakcji
INITIAL_TRANSACTION_HASH=0xf799797e9ed99f236950b44cf0ade50439f383603ce64563012bd901b92bf2a2
```

## 5. Konfiguracja Nginx jako reverse proxy

```bash
# Utworzenie konfiguracji Nginx dla subdomeny
sudo nano /etc/nginx/sites-available/dexchecker.lf0g.fun
```

Zawartość pliku:

```nginx
server {
    listen 80;
    server_name dexchecker.lf0g.fun;

    location / {
        proxy_pass http://localhost:3004;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Włączenie konfiguracji:

```bash
sudo ln -s /etc/nginx/sites-available/dexchecker.lf0g.fun /etc/nginx/sites-enabled/
sudo nginx -t  # Sprawdź, czy konfiguracja jest poprawna
sudo systemctl restart nginx
```

## 6. Konfiguracja SSL/TLS za pomocą Certbot

```bash
# Instalacja Certbot
sudo apt install -y certbot python3-certbot-nginx

# Uzyskanie certyfikatu SSL
sudo certbot --nginx -d dexchecker.lf0g.fun

# Certbot automatycznie zaktualizuje konfigurację Nginx, aby używać HTTPS
```

## 7. Uruchomienie aplikacji za pomocą PM2

```bash
cd /var/www/lf0g.fun---bonding-curve/leaderboard-service

# Inicjalizacja bazy danych (opcjonalnie, jeśli potrzebne)
node src/utils/initDatabase.js

# Uruchomienie aplikacji przez PM2
pm2 start src/index.js --name leaderboard-service

# Konfiguracja PM2, aby uruchamiał aplikację po restarcie serwera
pm2 startup
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u $(whoami) --hp $(eval echo ~$(whoami))
pm2 save
```

## 8. Monitorowanie aplikacji

```bash
# Sprawdzenie statusu
pm2 status

# Sprawdzenie logów
pm2 logs leaderboard-service

# Monitorowanie zasobów
pm2 monit
```

## 9. Testowanie wdrożenia

1. Otwórz przeglądarkę i przejdź do `https://dexchecker.lf0g.fun/api/leaderboard`
2. Sprawdź czy API zwraca oczekiwane dane

## 10. Aktualizacja aplikacji w przyszłości

```bash
cd /var/www/lf0g.fun---bonding-curve
git pull origin master
cd leaderboard-service
npm install
pm2 restart leaderboard-service
```

## Rozwiązywanie problemów

1. Sprawdź logi aplikacji: `pm2 logs leaderboard-service`
2. Sprawdź logi Nginx: `sudo tail -f /var/log/nginx/error.log`
3. Sprawdź status aplikacji: `pm2 status`
4. Sprawdź status Nginx: `sudo systemctl status nginx` 