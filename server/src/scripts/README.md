# Skrypty zarządzania serwerem lf0g.fun

Ten katalog zawiera skrypty narzędziowe do zarządzania serwerem lf0g.fun.

## Skrypt czyszczenia nieaktywnych puli

### `cleanInactivePools.js`

Skrypt automatycznie usuwa pule, które nie miały żadnych transakcji w ostatnich 48 godzinach.

#### Jak działa

1. Skrypt identyfikuje wszystkie pule, które nie miały transakcji w ciągu ostatnich 48 godzin
2. Dla każdej takiej puli:
   - Usuwa wszystkie powiązane transakcje
   - Usuwa wszystkie polubienia komentarzy
   - Usuwa wszystkie komentarze
   - Usuwa historię cen (jeśli tabela istnieje)
   - Usuwa plik obrazu puli (jeśli istnieje)
   - Usuwa samą pulę

#### Konfiguracja w cron

Aby uruchamiać skrypt automatycznie co 24 godziny, dodaj następujący wpis do crontab:

```bash
# Uruchamianie oczyszczania nieaktywnych puli codziennie o północy
0 0 * * * cd /ścieżka/do/serwera && node src/scripts/cleanInactivePools.js >> /var/log/lf0g/pool-cleanup.log 2>&1
```

Upewnij się, że katalog `/var/log/lf0g/` istnieje i ma odpowiednie uprawnienia do zapisu.

Aby edytować crontab, użyj:

```bash
crontab -e
```

#### Ręczne uruchomienie

Aby uruchomić skrypt ręcznie:

```bash
cd /ścieżka/do/serwera
node src/scripts/cleanInactivePools.js
```

## Skrypt weryfikacji rezerw puli

### `verifyPoolReserves.js`

Skrypt weryfikuje rezerwy puli w bazie danych w porównaniu z aktualnym stanem na blockchainie. Używa modelu AMM V2 (Automated Market Maker V2) do obliczania poprawnych metryk (cena, płynność, kapitalizacja rynkowa).

#### Wymagania

Skrypt wymaga paczki `ethers.js` w wersji 5.x. Została ona dodana do zależności projektu w pliku `package.json`. Upewnij się, że zależności są zaktualizowane:

```bash
cd /ścieżka/do/serwera
npm install
```

#### Jak działa

1. Skrypt pobiera wszystkie pule z bazy danych (lub konkretną pulę, jeśli określono)
2. Dla każdej puli łączy się z blockchainem i pobiera aktualne rezerwy
3. Porównuje rezerwy w bazie danych z rezerwami na blockchainie
4. Jeśli wykryje rozbieżności większe niż 1%, raportuje je i opcjonalnie aktualizuje bazę danych
5. Przelicza również wszystkie powiązane metryki (cena, płynność, kapitalizacja rynkowa) na podstawie formuły AMM V2

#### Użycie

```bash
# Sprawdź wszystkie pule i pokaż raport rozbieżności (bez wprowadzania zmian w bazie danych)
node src/scripts/verifyPoolReserves.js

# Sprawdź wszystkie pule i automatycznie aktualizuj bazę danych, jeśli wykryto rozbieżności
node src/scripts/verifyPoolReserves.js --update

# Sprawdź tylko konkretną pulę (określoną przez adres kontraktu)
node src/scripts/verifyPoolReserves.js --pool=0x1234...abcd

# Sprawdź konkretną pulę i aktualizuj ją, jeśli znaleziono rozbieżności
node src/scripts/verifyPoolReserves.js --pool=0x1234...abcd --update
```

#### Konfiguracja w cron

Aby regularnie weryfikować rezerwy puli (np. co 6 godzin) i automatycznie aktualizować bazę danych, użyj:

```bash
# Weryfikacja puli co 6 godzin i automatyczna aktualizacja bazy danych
0 */6 * * * cd /ścieżka/do/serwera && node src/scripts/verifyPoolReserves.js --update >> /var/log/lf0g/pool-verification.log 2>&1
```

#### Zmienne środowiskowe

Skrypt może być konfigurowany za pomocą zmiennych środowiskowych:

- `RPC_URL` - URL punktu końcowego RPC blockchainu (domyślnie: 'https://evmrpc-testnet.0g.ai')
- `NETWORK` - Identyfikator sieci (domyślnie: '0G-Galileo-Testnet')

Na przykład:
```bash
RPC_URL=https://mój-własny-rpc.io node src/scripts/verifyPoolReserves.js
```

## Skrypt pomocniczy do testowania

### `markPoolsInactive.js`

Ten skrypt pozwala oznaczyć wybrane pule jako nieaktywne poprzez przesunięcie znaczników czasu ich transakcji na 49 godzin wstecz (co spowoduje, że zostaną wykryte jako nieaktywne przez `cleanInactivePools.js`).

#### Użycie

```bash
# Oznacz wszystkie pule jako nieaktywne
node src/scripts/markPoolsInactive.js --all

# Oznacz konkretną pulę jako nieaktywną po ID
node src/scripts/markPoolsInactive.js --pool-id=123

# Oznacz konkretną pulę jako nieaktywną po symbolu
node src/scripts/markPoolsInactive.js --symbol=BTC
```

Uwaga: Ten skrypt służy głównie do celów testowych i nie powinien być używany w środowisku produkcyjnym, chyba że jest to absolutnie konieczne.

## Skrypt aktualizacji Gravity Score

### `updateGravityScore.js`

Skrypt służy do obliczania i aktualizacji Gravity Score dla pul tokenów. Implementuje nowy system oceny Gravity Score, który składa się z pięciu komponentów i systemu bonusów.

#### Jak działa

1. Skrypt pobiera dane puli z bazy danych
2. Dla każdej puli oblicza następujące komponenty Gravity Score:
   - Curve Utilization (30%) - stopień zakupu tokenów z puli AMM
   - Price Performance (20%) - historyczna wydajność cenowa tokenu
   - Holder Metrics (15%) - zdrowie bazy posiadaczy tokenu
   - Community Engagement (25%) - poziom i jakość zaangażowania społeczności
   - Activity Score (10%) - poziom aktywności transakcyjnej

3. Następnie stosuje bonusy za osiągnięcia:
   - Bonus za Graduation (+10%) - dla pul z co najmniej 75% tokenów zakupionych z AMM
   - Bonus za Wiek Projektu (do +10%) - dla stabilnych, długo istniejących projektów
   - Bonus za Uczestnictwo w Głosowaniach (do +5%) - dla projektów z wysokim zaangażowaniem w głosowaniu

4. Oblicza finalny Gravity Score i aktualizuje bazę danych

#### Użycie

```bash
# Aktualizuj Gravity Score dla wszystkich pul
node src/scripts/updateGravityScore.js

# Aktualizuj Gravity Score tylko dla konkretnej puli
node src/scripts/updateGravityScore.js --poolId=123
```

#### Konfiguracja w cron

Aby regularnie aktualizować Gravity Score dla wszystkich pul, dodaj następujący wpis do crontab:

```bash
# Aktualizacja Gravity Score co 12 godzin
0 */12 * * * cd /ścieżka/do/serwera && node src/scripts/updateGravityScore.js >> /var/log/lf0g/gravity-score-update.log 2>&1
```

## Skrypt aktualizacji Gravity Score na blockchainie

### `updateBlockchainGravityScore.js`

Skrypt do aktualizacji wartości Gravity Score na blockchainie. Pobiera dane z bazy danych SQLite i wysyła je do kontraktu GravityScoreSystem.

#### Jak działa

1. Pobiera dane o Gravity Score z bazy danych SQLite
2. Łączy się z blockchainem za pomocą podanego klucza prywatnego
3. Wysyła transakcję z aktualizacją wartości Gravity Score dla wszystkich tokenów jednocześnie lub dla pojedynczego tokenu

#### Uruchamianie

```bash
# Aktualizacja wszystkich tokenów
node src/scripts/updateBlockchainGravityScore.js

# Aktualizacja pojedynczego tokenu
node src/scripts/updateBlockchainGravityScore.js 0x1234567890123456789012345678901234567890

# Uruchomienie jako część zwykłej aktualizacji Gravity Score
node src/scripts/updateGravityScore.js --updateBlockchain
```

#### Wymagania

- Klucz prywatny portfela (zmienna `private_lf0g` w pliku .env)
- Adres portfela (zmienna `wallet_lf0g` w pliku .env)
- URL punktu dostępowego RPC (zmienna `RPC_URL` w pliku .env)
- Aktualny plik `deployment-info.json` w folderze `lf0gfactory` z adresem kontraktu GravityScoreSystem

## Uwagi dotyczące bezpieczeństwa

- Przed uruchomieniem skryptów w środowisku produkcyjnym, zawsze wykonaj kopię zapasową bazy danych.
- Skrypty modyfikują bazę danych bezpośrednio, więc upewnij się, że rozumiesz ich działanie przed użyciem.
- Zalecane jest pierwsze przetestowanie skryptów w środowisku deweloperskim.

## Rozwiązywanie problemów

Jeśli skrypt napotka na błędy podczas usuwania puli:

1. Sprawdź logi, aby zidentyfikować konkretny problem
2. Upewnij się, że baza danych nie jest zablokowana przez inne procesy
3. Sprawdź czy struktura bazy danych jest zgodna z oczekiwaną przez skrypt
4. Wykonaj ręczne czyszczenie dla problematycznych puli, jeśli to konieczne 