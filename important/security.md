# Dokumentacja Zabezpieczeń lf0g.fun

## Zaimplementowane zabezpieczenia

### 1. Uwierzytelnianie poprzez Portfel (Wallet Authentication)
- **Biblioteka**: `wagmi`, `@rainbow-me/rainbowkit`
- **Funkcje**: `useWallet`, `signMessageAsync`
- **Ochrona przed**: Nieautoryzowanym dostępem do zasobów, podszywaniem się pod użytkowników
- **Opis**: Aplikacja wymaga połączenia z portfelem kryptowalutowym (np. MetaMask), co zapewnia uwierzytelnienie poprzez podpis kryptograficzny. Ten mechanizm gwarantuje, że tylko faktyczny właściciel portfela może wykonywać operacje w jego imieniu.

### 2. Weryfikacja Podpisu Blockchain
- **Biblioteka**: `ethers`
- **Funkcje**: `verifyMessage`
- **Ochrona przed**: Fałszywym uwierzytelnianiem, atakami typu replay
- **Opis**: System weryfikuje podpisy kryptograficzne pochodzące z portfeli Ethereum. Ta metoda zapewnia niemożliwość podszywania się pod innych użytkowników.

### 3. Ograniczanie Liczby Zapytań (Rate Limiting)
- **Biblioteka**: `express-rate-limit`
- **Funkcje**: `standardLimiter`, `authLimiter`, `createLimiter`
- **Ochrona przed**: Atakami typu brute force, DoS (Denial of Service)
- **Opis**: Zaimplementowano limity zapytań dla różnych typów endpointów:
  - Standardowe limity: 100 zapytań na 15 minut
  - Endpointy uwierzytelniania: 10 zapytań na 15 minut
  - Endpointy do tworzenia zasobów: 20 zapytań na 15 minut

### 4. Ochrona przed SQL Injection
- **Funkcje**: `validateOrderBy`, `validateOrder`, sanityzacja parametrów wyszukiwania
- **Ochrona przed**: Atakami typu SQL Injection
- **Opis**: Wszystkie parametry używane w zapytaniach SQL są walidowane i sanityzowane. Implementacja obejmuje:
  - Białą listę dozwolonych kolumn do sortowania
  - Parametryzowane zapytania
  - Walidację parametrów numerycznych

### 5. Ochrona przed XSS (Cross-Site Scripting)
- **Funkcje**: `sanitizeInput`
- **Ochrona przed**: Atakami typu XSS, wstrzykiwaniem kodu HTML/JavaScript
- **Opis**: Wszystkie dane wprowadzane przez użytkownika są sanityzowane przez zamianę znaków specjalnych HTML na ich encje (np. `<` na `&lt;`), co uniemożliwia wstrzyknięcie złośliwego kodu.

### 6. Bezpieczne Przesyłanie Plików
- **Biblioteki**: `multer`, `sharp`, `crypto`
- **Funkcje**: `generateSafeFilename`, `processImage`, walidacja typów plików
- **Ochrona przed**: Uploadem złośliwych plików, XSS poprzez metadane plików, atakami na system plików
- **Opis**: Implementacja obejmuje:
  - Walidację typów MIME i rozszerzeń plików
  - Ograniczenie rozmiaru plików do 500KB
  - Bezpieczne generowanie losowych nazw plików
  - Weryfikację czy przesyłany plik jest faktycznie obrazem
  - Przetwarzanie obrazów (zmniejszenie do maksymalnie 256x256 pikseli)

### 7. Bezpieczne Nagłówki HTTP
- **Biblioteka**: `helmet`
- **Ochrona przed**: Różnymi atakami bazującymi na nagłówkach HTTP, clickjacking, sniffing MIME
- **Opis**: Biblioteka Helmet automatycznie ustawia szereg bezpiecznych nagłówków HTTP:
  - `Content-Security-Policy`: Ogranicza źródła, z których mogą być ładowane zasoby
  - `X-XSS-Protection`: Włącza wbudowaną w przeglądarki ochronę przed XSS
  - `X-Frame-Options`: Zapobiega wyświetlaniu strony w ramkach (ochrona przed clickjacking)
  - `X-Content-Type-Options`: Zapobiega MIME-sniffing

### 8. Konfiguracja CORS
- **Biblioteka**: `cors`
- **Ochrona przed**: Nieautoryzowanymi żądaniami międzydomenowymi, atakami CSRF
- **Opis**: Zaimplementowano restrykcyjną politykę CORS, która:
  - Ogranicza pochodzenie żądań do określonej listy domen
  - Definiuje dozwolone metody HTTP (GET, POST, PUT, DELETE)
  - Włącza obsługę credentials (ciasteczek) tylko dla zaufanych domen
  - Ustawia czas cache'owania zapytań preflight na 24 godziny

### 9. Walidacja Danych Wejściowych
- **Funkcje**: `isValidEthereumAddress`, `isValidContractAddress`, `isValidNumber`, `isValidUsername`, `isValidId`
- **Ochrona przed**: Wstrzykiwaniem nieprawidłowych danych, obchodzeniem walidacji formularzy
- **Opis**: Wszystkie dane wejściowe są walidowane pod kątem formatu i wartości:
  - Adresy Ethereum i kontraktów (format 0x + 40 znaków hex)
  - Nazwy użytkowników (tylko bezpieczne znaki: litery, cyfry, podkreślenia)
  - Wartości numeryczne (prawidłowe liczby)
  - Identyfikatory (dodatnie liczby całkowite)

### 10. Bezpieczna Obsługa Błędów
- **Ochrona przed**: Wyciekiem informacji, błędami aplikacji
- **Opis**: Implementacja obejmuje:
  - Globalne middleware do obsługi błędów
  - Ukrywanie szczegółów technicznych błędów w produkcji
  - Logowanie błędów bez ujawniania ich użytkownikom
  - Obsługę nieistniejących tras

### 11. Kliencki system buforowania zapytań
- **Funkcje**: `cache.has`, `cache.get`, `cache.set`, `clearCache`
- **Ochrona przed**: Redundantnymi żądaniami, nadmiernym obciążeniem API
- **Opis**: Zaimplementowano prosty mechanizm buforowania zapytań po stronie klienta:
  - Buforowanie odpowiedzi API z czasowym wygasaniem (30 sekund)
  - Różne czasy ważności bufora dla różnych typów danych (np. wyszukiwanie - 5s)
  - Oczyszczanie bufora po operacjach mutacji (POST, PUT)
  - Znaczne zmniejszenie liczby żądań HTTP do API

## Uwagi dotyczące bezpieczeństwa

### Domyślne wartości kluczy JWT
- **Lokalizacja**: `server/src/middleware/auth.js` (linia 5)
- **Problem**: Zdefiniowana jest domyślna wartość dla `JWT_SECRET`: `'secret_token_change_in_production'`
- **Rekomendacja**: Przed wdrożeniem do produkcji należy zmienić tę wartość na silny, losowy ciąg znaków i ustawić ją jako zmienną środowiskową `JWT_SECRET`

## Zalecenia do dalszej implementacji

1. Implementacja CSRF tokenów dla formularzy
2. Szyfrowanie wrażliwych danych w bazie danych
3. Dodanie drugiego czynnika uwierzytelniania (2FA)
4. Bardziej zaawansowane zarządzanie sesją użytkownika
5. Audyt bezpieczeństwa i regularne skanowanie kodu
6. Automatyczne kopie zapasowe bazy danych
7. Monitorowanie nietypowej aktywności i alertowanie
