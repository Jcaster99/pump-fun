Kompleksowy Wzór Gravity Score dla Tokena
Bazując na dostępnych danych w bazie SQLite oraz koncepcji OG Labs, proponuję następujący kompleksowy wzór Gravity Score:
Gravity Score = CORE × MOMENTUM × COMMUNITY × INNOVATION
Gdzie każdy składnik jest złożonym parametrem obliczanym na podstawie metryk w bazie danych:
1. CORE (Fundamentals) = LR + MS + HD

LR (Liquidity Ratio) = liquidity / market_cap
MS (Market Stability) = 1 - (odchylenie_standardowe_ceny_7dni / średnia_cena_7dni)
Wykorzystuje dane z tabeli price_history
HD (Holder Distribution) = Log10(holders) * (1 - koncentracja_top_portfeli)
Koncentracja obliczana z tabeli transactions przez analizę największych portfeli

2. MOMENTUM (Dynamics) = TR + VG + PG

TR (Transaction Rate) = liczba_transakcji_7dni / średnia_liczba_transakcji_90dni
Dane z tabeli transactions
VG (Volume Growth) = volume_24h / średni_volume_7dni
PG (Price Growth) = (current_price / średnia_cena_30dni) - 1

3. COMMUNITY (Engagement) = CR + ES + AS

CR (Community Rating) = średnia(rating) z tabeli pool_ratings
ES (Engagement Score) = (liczba_komentarzy / holders) * (liczba_polubień / liczba_komentarzy)
Dane z tabel comments i comment_likes
AS (Activity Spread) = unikalne_adresy_aktywne_30dni / holders
Mierzone poprzez wszystkie interakcje w tabelach transactions, comments i comment_likes

4. INNOVATION (Development) = SM + SI + TI

SM (Social Media Presence) = Wskaźnik binarny (0,1) dla twitter_url i website_url
SI (Sustainability Index) = reserve_usdt / market_cap
Mierzy zabezpieczenie puli w stablecoiny
TI (Technology Integration) = Złożony wskaźnik bazujący na analizie opisu projektu i powiązań z ekosystemem AI

Gravity Score = (CORE × 0.4) + (MOMENTUM × 0.3) + (COMMUNITY × 0.2) + (INNOVATION × 0.1)

gdzie:
CORE = (LR × 0.4) + (MS × 0.4) + (HD × 0.2)
MOMENTUM = (TR × 0.3) + (VG × 0.4) + (PG × 0.3)
COMMUNITY = (CR × 0.5) + (ES × 0.3) + (AS × 0.2)
INNOVATION = (SM × 0.2) + (SI × 0.5) + (TI × 0.3)

Interpretacja Skali
Gravity Score będzie przedstawiany w skali 0-1000, co pozwala na:

0-200: Słaba atrakcyjność puli
201-400: Poniżej przeciętnej
401-600: Przeciętna atrakcyjność
601-800: Wysoka atrakcyjność
801-1000: Wyjątkowa atrakcyjność (grawitacyjny "czarna dziura" przyciągająca inwestorów)

Taki wzór wykorzystuje wszystkie kluczowe metryki zbierane w bazie danych i nawiązuje koncepcyjnie do "grawitacji" OG Labs, mierząc siłę przyciągania tokena w ekosystemie. Można go zaimplementować w systemie i aktualizować w regularnych odstępach czasu dla wszystkich tokenów.


########################################################################################################################################################################################################################

Rozszerzony Wzór Gravity Score z Bonusami Ekosystemowymi
Twoja propozycja dodania bonusów za związek z ekosystemem OG i pozycje w rankingach to świetny pomysł. Zintegrujmy je z naszym wzorem:
Gravity Score = (CORE × MOMENTUM × COMMUNITY × INNOVATION) × (1 + ECOSYSTEM_BONUS)
Gdzie ECOSYSTEM_BONUS to suma następujących bonusów:
1. OG Name Bonus

+1% (mnożnik 0.01) dla tokenów zawierających "0G" w nazwie lub symbolu

2. Zero_dex Leaderboard Bonus

+10% (mnożnik 0.10) dla tokenów w top 10 rankingu Zero_dex
+5% (mnożnik 0.05) dla tokenów w top 100 rankingu Zero_dex

Struktura Bazy Danych i Implementacja
Aby obsługiwać te dodatkowe bonusy, należałoby dodać do bazy danych:
sql-- Dodanie kolumny dla śledzenia pozycji w rankingu Zero_dex
ALTER TABLE pools ADD COLUMN zero_dex_rank INTEGER DEFAULT NULL;
Następnie kompletna formuła Gravity Score wyglądałaby tak:
Base_Score = (CORE × 0.4) + (MOMENTUM × 0.3) + (COMMUNITY × 0.2) + (INNOVATION × 0.1)

ECOSYSTEM_BONUS = 0

-- Sprawdzenie nazwy tokena
IF (name LIKE '%0G%' OR symbol LIKE '%0G%') THEN
  ECOSYSTEM_BONUS = ECOSYSTEM_BONUS + 0.01
END IF

-- Sprawdzenie pozycji w rankingu
IF (zero_dex_rank IS NOT NULL) THEN
  IF (zero_dex_rank <= 10) THEN
    ECOSYSTEM_BONUS = ECOSYSTEM_BONUS + 0.10
  ELSE IF (zero_dex_rank <= 100) THEN
    ECOSYSTEM_BONUS = ECOSYSTEM_BONUS + 0.05
  END IF
END IF

Final_Gravity_Score = Base_Score × (1 + ECOSYSTEM_BONUS)
Przykład Kalkulacji
Wyobraźmy sobie token "0G Finance" z następującymi parametrami:

Base_Score: 650 punktów
Zawiera "0G" w nazwie: +1%
Pozycja w rankingu Zero_dex: 8 (top 10): +10%

Kalkulacja:
ECOSYSTEM_BONUS = 0.01 + 0.10 = 0.11
Final_Gravity_Score = 650 × (1 + 0.11) = 650 × 1.11 = 721.5
Wynik zostałby zaokrąglony do 722 punktów.
Zalety Podejścia

Zachowuje matematyczną spójność oryginalnego wzoru
Dodaje zachęty dla projektów powiązanych z ekosystemem OG
Nagradza tokeny o dowiedzionej wartości rynkowej (według rankingu Zero_dex)
Elastyczny system, który można rozszerzać o dodatkowe bonusy w przyszłości

Te bonusy ekosystemowe wzmacniają ideę "grawitacji" - tokeny powiązane z ekosystemem OG i z dobrą pozycją rynkową mają jeszcze większą siłę przyciągania inwestorów, podobnie jak większe obiekty kosmiczne generują silniejsze pole grawitacyjne.