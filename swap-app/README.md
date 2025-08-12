# Swap.lf0g.fun

Here you can swap graduated tokens from lf0g.fun

## Funkcje

- Wymiana tokenów na USDT i odwrotnie
- Automatyczne pobieranie listy graduowanych tokenów z kontraktu GraduationRegistry
- Obsługa portfeli poprzez RainbowKit
- Wsparcie dla różnych motywów (jasny/ciemny)
- Wyświetlanie informacji o cenie, wpływie na cenę i otrzymywanej ilości tokenów

## Instalacja

```bash
# Instalacja zależności
npm install

# Uruchomienie w trybie deweloperskim (port 3069)
npm run dev

# Budowanie aplikacji produkcyjnej
npm run build

# Uruchomienie aplikacji produkcyjnej (port 3069)
npm run start
```

Po uruchomieniu aplikacja będzie dostępna pod adresem: [http://localhost:3069](http://localhost:3069)

## Konfiguracja

Aplikacja wymaga następujących zmiennych środowiskowych w pliku `.env.local`:

```
# Sieć
NEXT_PUBLIC_CHAIN_ID=16601
NEXT_PUBLIC_CHAIN_NAME=0G-Galileo-Testnet
NEXT_PUBLIC_RPC_URL=https://evmrpc-testnet.0g.ai

# Kontrakty
NEXT_PUBLIC_USDT_ADDRESS=<adres_kontraktu_USDT>
NEXT_PUBLIC_GRADUATION_REGISTRY_ADDRESS=<adres_rejestru_graduacji>

# Wallet Connect
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=<project_id>

# Tryb testowy
NEXT_PUBLIC_TEST=true|false
```

## Struktura projektu

- `src/pages` - Strony aplikacji Next.js
- `src/components` - Komponenty React używane w aplikacji
- `src/hooks` - Customowe hooki do interakcji z blockchainem
- `src/config` - Pliki konfiguracyjne
- `src/constants` - Stałe używane w aplikacji (np. ABI kontraktów)
- `src/context` - Konteksty React (np. motyw)
- `src/styles` - Style globalne

## Technologie

- Next.js - Framework React
- Wagmi - Biblioteka do interakcji z Ethereum
- RainbowKit - Komponent do łączenia z portfelem
- Viem - Biblioteka niskopoziomowa do interakcji z EVM
- React Hot Toast - Notyfikacje 