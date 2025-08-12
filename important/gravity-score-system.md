# Kompleksowy System Gravity Score

## Wprowadzenie
Gravity Score to zaawansowany system oceny tokenów w ekosystemie blockchain, inspirowany koncepcją "grawitacji" OG Labs. System mierzy zdolność tokena do "przyciągania" inwestorów i aktywności, podobnie jak obiekty kosmiczne o większej masie generują silniejsze pole grawitacyjne.

## Podstawowy Wzór

```
Gravity Score = CORE × MOMENTUM × COMMUNITY × INNOVATION
```

Gdzie każdy składnik jest złożonym parametrem obliczanym na podstawie różnych metryk w bazie danych.

## Szczegółowe Komponenty

### 1. CORE (Fundamentals) = LR + MS + HD

- **LR (Liquidity Ratio)** = liquidity / market_cap
- **MS (Market Stability)** = 1 - (odchylenie_standardowe_ceny_7dni / średnia_cena_7dni)
  *Wykorzystuje dane z tabeli price_history*
- **HD (Holder Distribution)** = Log10(holders) * (1 - koncentracja_top_portfeli)
  *Koncentracja obliczana z tabeli transactions przez analizę największych portfeli*

### 2. MOMENTUM (Dynamics) = TR + VG + PG

- **TR (Transaction Rate)** = liczba_transakcji_7dni / średnia_liczba_transakcji_90dni
  *Dane z tabeli transactions*
- **VG (Volume Growth)** = volume_24h / średni_volume_7dni
- **PG (Price Growth)** = (current_price / średnia_cena_30dni) - 1

### 3. COMMUNITY (Engagement) = CR + ES + AS

- **CR (Community Rating)** = średnia(rating) z tabeli pool_ratings 
- **ES (Engagement Score)** = (liczba_komentarzy / holders) * (liczba_polubień / liczba_komentarzy)
  *Dane z tabel comments i comment_likes*
- **AS (Activity Spread)** = unikalne_adresy_aktywne_30dni / holders
  *Mierzone poprzez wszystkie interakcje w tabelach transactions, comments i comment_likes*

### 4. INNOVATION (Development) = SM + SI + TI

- **SM (Social Media Presence)** = Wskaźnik binarny (0,1) dla twitter_url i website_url
- **SI (Sustainability Index)** = reserve_usdt / market_cap
  *Mierzy zabezpieczenie puli w stablecoiny*
- **TI (Technology Integration)** = Złożony wskaźnik bazujący na analizie opisu projektu i powiązań z ekosystemem AI

## Formuła z Wagami

```
Base_Score = (CORE × 0.4) + (MOMENTUM × 0.3) + (COMMUNITY × 0.2) + (INNOVATION × 0.1)

gdzie:
CORE = (LR × 0.4) + (MS × 0.4) + (HD × 0.2)
MOMENTUM = (TR × 0.3) + (VG × 0.4) + (PG × 0.3)
COMMUNITY = (CR × 0.5) + (ES × 0.3) + (AS × 0.2)
INNOVATION = (SM × 0.2) + (SI × 0.5) + (TI × 0.3)
```

## Bonusy Ekosystemowe

Do bazowego wyniku dodajemy bonusy za powiązania z ekosystemem:

```
Final_Gravity_Score = Base_Score × (1 + ECOSYSTEM_BONUS)
```

Gdzie ECOSYSTEM_BONUS to suma następujących bonusów:

### 1. OG Name Bonus
- +1% (mnożnik 0.01) dla tokenów zawierających "0G" w nazwie lub symbolu

### 2. Zero_dex Leaderboard Bonus
- +10% (mnożnik 0.10) dla tokenów w top 10 rankingu Zero_dex
- +5% (mnożnik 0.05) dla tokenów w top 11-100 rankingu Zero_dex

## Implementacja i Integracja z Bazą Danych

Do bazy danych należy dodać nowe kolumny i tabelę:

```sql
-- Dodanie kolumny rangi w Zero_dex
ALTER TABLE pools ADD COLUMN zero_dex_rank INTEGER DEFAULT NULL;

-- Dodanie tabeli przechowującej wyniki Gravity Score
CREATE TABLE IF NOT EXISTS gravity_scores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  pool_id INTEGER NOT NULL,
  core_score REAL NOT NULL,
  momentum_score REAL NOT NULL,
  community_score REAL NOT NULL,
  innovation_score REAL NOT NULL,
  base_score REAL NOT NULL,
  ecosystem_bonus REAL NOT NULL,
  final_score REAL NOT NULL,
  calculation_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (pool_id) REFERENCES pools (id)
);

-- Indeks dla szybkiego wyszukiwania
CREATE INDEX IF NOT EXISTS idx_gravity_scores_pool_date ON gravity_scores (pool_id, calculation_date);
```

## Przykład Praktycznego Obliczenia

Dla tokenu "0G Finance" z następującymi danymi:
- liquidity: 500,000 USDT
- market_cap: 2,000,000 USDT
- odchylenie_cen_7dni: 0.05
- średnia_cena_7dni: 0.5
- holders: 1,000
- koncentracja_top_portfeli: 0.3
- liczba_transakcji_7dni: 500
- średnia_transakcji_90dni: 400
- volume_24h: 100,000
- średni_volume_7dni: 80,000
- current_price: 0.55
- średnia_cena_30dni: 0.5
- średnia_ocena: 4.2
- komentarze: 200
- polubienia: 500
- aktywne_adresy_30dni: 400
- twitter_url: tak
- website_url: tak
- reserve_usdt: 300,000
- TI: 0.7
- Nazwa zawiera "0G": tak
- Pozycja w rankingu: 8

Obliczenie:
```
LR = 500,000 / 2,000,000 = 0.25
MS = 1 - (0.05 / 0.5) = 0.9
HD = Log10(1,000) * (1 - 0.3) = 3 * 0.7 = 2.1

CORE = (0.25 × 0.4) + (0.9 × 0.4) + (2.1 × 0.2) = 0.1 + 0.36 + 0.42 = 0.88

TR = 500 / 400 = 1.25
VG = 100,000 / 80,000 = 1.25
PG = (0.55 / 0.5) - 1 = 0.1

MOMENTUM = (1.25 × 0.3) + (1.25 × 0.4) + (0.1 × 0.3) = 0.375 + 0.5 + 0.03 = 0.905

CR = 4.2
ES = (200 / 1,000) * (500 / 200) = 0.2 * 2.5 = 0.5
AS = 400 / 1,000 = 0.4

COMMUNITY = (4.2 × 0.5) + (0.5 × 0.3) + (0.4 × 0.2) = 2.1 + 0.15 + 0.08 = 2.33

SM = 1
SI = 300,000 / 2,000,000 = 0.15
TI = 0.7

INNOVATION = (1 × 0.2) + (0.15 × 0.5) + (0.7 × 0.3) = 0.2 + 0.075 + 0.21 = 0.485

Base_Score = (0.88 × 0.4) + (0.905 × 0.3) + (2.33 × 0.2) + (0.485 × 0.1)
Base_Score = 0.352 + 0.2715 + 0.466 + 0.0485 = 1.138

// Skalowanie do 0-1000
Base_Score = 1.138 * 1000 / 2 = 569

ECOSYSTEM_BONUS = 0.01 + 0.10 = 0.11
Final_Gravity_Score = 569 × 1.11 = 631.59 ≈ 632
```

Wynik 632 wskazuje na wysoką atrakcyjność tokena w skali 601-800.

## Skala Interpretacji

Gravity Score będzie przedstawiany w skali 0-1000, co pozwala na:

- **0-200**: Słaba atrakcyjność puli
- **201-400**: Poniżej przeciętnej
- **401-600**: Przeciętna atrakcyjność
- **601-800**: Wysoka atrakcyjność
- **801-1000**: Wyjątkowa atrakcyjność (grawitacyjny "czarna dziura" przyciągająca inwestorów)

## Cykl Aktualizacji i Prezentacja

1. **Cykl aktualizacji**:
   - Podstawowe metryki aktualizowane co godzinę
   - Pełny Gravity Score przeliczany raz dziennie
   - Historyczne wyniki przechowywane do analizy trendów

2. **Prezentacja w UI**:
   - Główny wynik Gravity Score (0-1000) wyświetlany przy każdym tokenie
   - Szczegółowa strona z rozbiciem na komponenty (CORE, MOMENTUM, COMMUNITY, INNOVATION)
   - Wizualizacja zmiany Gravity Score w czasie
   - Porównanie do średniej rynkowej i podobnych tokenów

## Potencjalne Rozszerzenia

W przyszłości system może być rozszerzony o:

1. Automatyczne wykrywanie i odrzucanie nietypowych skoków w metrykach (zabezpieczenie przed manipulacją)
2. Dynamiczne dostosowywanie wag w zależności od typu projektu
3. Dodatkowe bonusy za integracje z innymi projektami w ekosystemie
4. Uwzględnienie danych on-chain z innych sieci blockchain
5. Implementacja mechanizmów AI do bardziej zaawansowanej analizy opisów projektów



System Gravity Score jest zdecydowanie bardziej sprawiedliwy i miarodajny niż zwykły market cap z kilku powodów:
Wielowymiarowość - ocena opiera się na wielu czynnikach, nie tylko na kapitalizacji, co daje pełniejszy obraz wartości poola. Każdy komponent (core, momentum, community, innovation) chwyta inny aspekt "zdrowia" projektu.
Odporność na manipulacje - zmanipulowanie wielu różnych parametrów jednocześnie jest znacznie trudniejsze niż manipulacja samym market cap'em. Przykładowo, sztuczne pompowanie ceny może wpłynąć na market cap, ale nie zmieni danych o aktywności społeczności czy stabilności.
Nagradzanie zaangażowania - system docenia prawdziwe zaangażowanie społeczności (komentarze, oceny) i aktywność. Projekty z aktywną bazą użytkowników są wyżej cenione, co jest zdrowsze dla ekosystemu.
Równowaga między stabilnością a wzrostem - system balansuje między stabilnością (liquidity ratio, market stability) a dynamiką wzrostu (volume growth, price growth), więc docenia zarówno projekty stabilne, jak i rozwijające się.
Transparentność - wszystkie komponenty są jasno zdefiniowane i obliczane według określonych wzorów, co zwiększa przejrzystość.
Jeśli chodzi o bonusy ekosystemowe, zachęcają one do integracji z ekosystemem zer0_dex, co może budzić pytania o sprawiedliwość, ale z perspektywy rozwoju platformy ma to sens biznesowy - nagradzasz lojalność wobec ekosystemu.
Warto rozważyć okresową rekalibrację wag komponentów w oparciu o dane, aby system pozostał aktualny. Również śledzenie potencjalnych anomalii pomoże wykryć próby manipulacji.