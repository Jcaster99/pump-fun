# Instrukcja wdrożenia aplikacji zer0checker.xyz (maj 2025)

Poniżej znajdziesz szczegółową instrukcję wdrożenia aplikacji zer0checkerv3 na serwerze VPS, skonfigurowanej do komunikacji z API leaderboard-service.

## 1. Konfiguracja domeny zer0checker.xyz w Namecheap

1. Zaloguj się do panelu Namecheap
2. Przejdź do zarządzania domeną zer0checker.xyz
3. Wybierz "Advanced DNS"
4. Dodaj/edytuj rekord:
   - Typ: A Record
   - Host: @ (dla głównej domeny)
   - Wartość: [Adres IP twojego VPS]
   - TTL: Automatic
5. Dodaj kolejny rekord dla www:
   - Typ: A Record 
   - Host: www
   - Wartość: [Adres IP twojego VPS]
   - TTL: Automatic

## 2. Klonowanie repozytorium i konfiguracja aplikacji

```bash
# Przejdź do katalogu na aplikacje
cd /var/www

# Klonowanie repozytorium
git clone https://github.com/desu777/zer0checkerv3.git
cd zer0checkerv3

# Konfiguracja zmiennych środowiskowych - utwórz plik .env
cat > .env << EOL
REACT_APP_API_URL=https://api-endpoint-if-needed.com
REACT_APP_LEADERBOARD_API_URL=https://dexchecker.lf0g.fun
EOL

# Instalacja zależności
npm install

# Budowanie wersji produkcyjnej
npm run build
```

## 3. Konfiguracja Nginx

```bash
# Utwórz konfigurację Nginx
sudo nano /etc/nginx/sites-available/zer0checker.xyz
```

Zawartość pliku:

```nginx
server {
    listen 80;
    server_name zer0checker.xyz www.zer0checker.xyz;
    
    # Serwujemy bezpośrednio z katalogu build
    root /var/www/zer0checkerv3/build;
    index index.html;

    # Przekierowanie dla React Router (SPA)
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Konfiguracja cache dla statycznych plików
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }

    # Zabezpieczenia
    add_header X-Content-Type-Options nosniff;
    add_header X-Frame-Options SAMEORIGIN;
    add_header X-XSS-Protection "1; mode=block";
}
```

Aktywacja konfiguracji:

```bash
sudo ln -s /etc/nginx/sites-available/zer0checker.xyz /etc/nginx/sites-enabled/
sudo nginx -t  # Sprawdź poprawność konfiguracji
sudo systemctl restart nginx
```

## 4. Konfiguracja SSL/TLS za pomocą Certbot

```bash
# Uzyskaj certyfikat SSL
sudo certbot --nginx -d zer0checker.xyz -d www.zer0checker.xyz

# Certbot automatycznie zaktualizuje konfigurację Nginx
```

## 5. Testowanie wdrożenia

1. Otwórz przeglądarkę i przejdź do `https://zer0checker.xyz`
2. Upewnij się, że aplikacja działa poprawnie i komunikuje się z leaderboard API na `https://dexchecker.lf0g.fun`
3. Przetestuj funkcje wyszukiwania i sortowania danych w leaderboard

## 6. Aktualizacja aplikacji w przyszłości

```bash
# Przejdź do katalogu projektu
cd /var/www/zer0checkerv3

# Pobierz zmiany z repozytorium
git pull

# Zainstaluj nowe zależności (jeśli są)
npm install

# Zbuduj aplikację ponownie
npm run build

# Restart Nginx (opcjonalnie)
sudo systemctl restart nginx
```

## 7. Rozwiązywanie problemów

### Problemy z CORS:

Jeśli napotkasz błędy CORS, upewnij się, że leaderboard-service na dexchecker.lf0g.fun ma poprawnie skonfigurowany CORS dla domen:
- https://zer0checker.xyz
- https://www.zer0checker.xyz

### Logi i debugging:

```bash
# Sprawdź logi Nginx
sudo tail -f /var/log/nginx/error.log

# Sprawdź status Nginx
sudo systemctl status nginx
```

### Problemy z routingiem:

Jeśli pojawiają się problemy z routingiem SPA (Single Page Application), upewnij się, że konfiguracja `try_files $uri $uri/ /index.html;` jest poprawna w konfiguracji Nginx. 