# Dokumentacja Systemu Gravity Score
**Wersja:** 2.2  
**Data:** Czerwiec 2025  
**Autorzy:** Zespół lf0g.fun

## Spis treści

1. [Wprowadzenie](#wprowadzenie)
2. [Przegląd Systemu](#przegląd-systemu)
3. [Komponenty Gravity Score](#komponenty-gravity-score)
4. [Mechanizmy Anty-Manipulacyjne](#mechanizmy-anty-manipulacyjne)
5. [Algorytm Obliczania](#algorytm-obliczania)
6. [Normalizacja i Interpretacja Wyników](#normalizacja-i-interpretacja-wyników)
7. [Zabezpieczenia przed Manipulacją](#zabezpieczenia-przed-manipulacją)
8. [Przykłady Obliczeniowe](#przykłady-obliczeniowe)
9. [Implementacja Techniczna](#implementacja-techniczna)
10. [Wytyczne dot. Utrzymania i Aktualizacji](#wytyczne-dot-utrzymania-i-aktualizacji)
11. [Załączniki](#załączniki)

## Wprowadzenie

Gravity Score to zaawansowany system metryczny zaprojektowany do kompleksowej oceny wartości, potencjału i zdrowia tokenów bazujących na mechanizmie bonding curve w ekosystemie lf0g.fun. System kładzie główny nacisk na kapitalizację rynkową jako obiektywny wskaźnik wartości tokenu, jednocześnie uwzględniając inne istotne metryki jakościowe.

### Cele Systemu

- Dostarczenie użytkownikom wiarygodnej metryki do podejmowania świadomych decyzji
- Nagradzanie projektów z realną wartością rynkową
- Promowanie zdrowych praktyk w ekosystemie bonding curve
- **Zapewnienie odporności na manipulacje i sztuczne pompowanie wskaźników**

## Przegląd Systemu

Gravity Score jest obliczany jako ważona suma dwóch głównych komponentów:

### Formuła Podstawowa

```
Gravity Score = (Market_Cap_Component * 70%) + (Other_Components * 30%)
```

## Komponenty Gravity Score

### 1. Kapitalizacja Rynkowa (70%)

**Definicja:** Bezpośrednia miara ekonomicznej wartości tokenu.

**Formuła:**
```
Market_Cap_Component = min(Time_Weighted_Market_Cap / 100, 700)
```

**Parametry:**
- `Time_Weighted_Market_Cap`: 7-dniowa średnia kapitalizacja rynkowa w USD
- Za każde $100 kapitalizacji rynkowej przyznawany jest 1 punkt
- Maksymalnie 700 punktów (dla kapitalizacji $70,000+)

**Interpretacja:**
- 0-200: Niska kapitalizacja rynkowa
- 201-400: Rosnąca kapitalizacja
- 401-600: Ugruntowana pozycja rynkowa
- 601-700: Wysoka kapitalizacja rynkowa

### 2. Pozostałe Komponenty (30%)

#### 2.1. Wykorzystanie Krzywej (10%)

**Formuła:**
```
Curve_Utilization = ((total_supply - total_supply_tokenAMM) / total_supply) * 100
```

**Parametry:**
- `total_supply`: Całkowita podaż tokenów
- `total_supply_tokenAMM`: Liczba tokenów pozostających w puli AMM

#### 2.2. Metryki Posiadaczy (8%)

**Formuła:**
```
Holder_Metrics = min(log10(real_holders_count) * 25, 100)
```

**Parametry:**
- `real_holders_count`: Liczba unikalnych adresów posiadających token (z wykluczeniem kontraktu bonding curve)

#### 2.3. Stabilność Cenowa (5%)

**Formuła:**
```
Price_Stability = (1 - (price_volatility_7d / average_price_7d)) * 100
```

**Parametry:**
- `price_volatility_7d`: Odchylenie standardowe ceny w ciągu 7 dni
- `average_price_7d`: Średnia cena w ciągu 7 dni

#### 2.4. Aktywność Społeczności (7%)

**Formuła:**
```
Community_Activity = (Comment_Score * 0.3) + (Voter_Score * 0.3) + (Transaction_Score * 0.4)

gdzie:
- Comment_Score = min(comments_count * 2, 100)
- Voter_Score = min(unique_voters * 5, 100)
- Transaction_Score = min(unique_transacting_users_7d * 10, 100)
```

## Mechanizmy Anty-Manipulacyjne

### 1. Kapitalizacja Ważona Czasowo

**Problem:** Krótkoterminowe skoki ceny mogą sztucznie zawyżać kapitalizację rynkową.
**Rozwiązanie:** Kapitalizacja rynkowa jest obliczana jako średnia 7-dniowa, co zmniejsza wpływ chwilowych manipulacji cenowych.

### 2. Minimalna Aktywność Transakcyjna

**Problem:** Tokeny mogą mieć wysokie oceny, ale minimalną faktyczną aktywność.
**Rozwiązanie:** Projekty z mniej niż 5 unikalnymi użytkownikami transakcji w ciągu 7 dni otrzymują karę 20% dla komponentu "Pozostałe metryki".

### 3. Minimalna Liczba Posiadaczy

**Problem:** Tokeny dystrybuowane między bardzo małą liczbę portfeli mogą nadal gromadzić punkty.
**Rozwiązanie:** Projekty z mniej niż 10 unikalnymi posiadaczami (z wyłączeniem twórcy i kontraktu) otrzymują karę 50% dla komponentu "Pozostałe metryki".

### 4. Rzeczywista Liczba Posiadaczy

**Problem:** Kontrakt bonding curve przechowuje dużą część tokenów we wczesnych etapach.
**Rozwiązanie:** Wszystkie metryki związane z posiadaczami wykluczają adres kontraktu bonding curve.

## Algorytm Obliczania

Pełny algorytm obliczania Gravity Score:

1. Oblicz komponent kapitalizacji rynkowej (70% całości)
2. Oblicz pozostałe komponenty (30% całości)
3. Zastosuj mnożniki kar za niską aktywność lub niewystarczającą dystrybucję posiadaczy
4. Zsumuj ważone komponenty, aby uzyskać surowy wynik
5. Ogranicz końcowy wynik do maksymalnie 1000 punktów

## Normalizacja i Interpretacja Wyników

- **0-200**: Token we wczesnej fazie z ograniczoną kapitalizacją rynkową i/lub adopcją
- **201-400**: Rozwijający się token z umiarkowaną kapitalizacją rynkową
- **401-600**: Ugruntowany token z solidną kapitalizacją rynkową i zdrowymi metrykami
- **601-800**: Silny token o znaczącej wartości rynkowej i dobrych fundamentach
- **801-1000**: Token premium o wysokiej kapitalizacji rynkowej i doskonałych metrykach

## Zabezpieczenia przed Manipulacją

System Gravity Score zawiera liczne zabezpieczenia, które chronią przed sztucznym pompowaniem wyników:

### 1. Separacja kontraktu bonding curve

**Problem:** Bonding curve trzyma większość tokenów we wczesnych fazach, co zniekształca metryki posiadaczy.
**Rozwiązanie:** Adres kontraktu bonding curve (tożsamy z token_address) jest wykluczany przy obliczaniu metryk posiadaczy.

### 2. Współczynnik zaufania dla głosów

**Problem:** Pojedyncze głosy o wysokiej ocenie mogą nieproporcjonalnie wpływać na wynik.
**Rozwiązanie:** Głosy są ważone współczynnikiem zaufania, który zależy od ich liczby. Oceny z niewielkiej liczby głosów są mieszane z wartością neutralną (50), aby ograniczyć ich wpływ.

### 3. Skale logarytmiczne zamiast liniowych

**Problem:** Liniowe skale są podatne na manipulację przez pojedyncze działania.
**Rozwiązanie:** Komponenty takie jak Comment_Activity, Comment_Popularity i Activity_Score używają skal logarytmicznych, które wymagają wykładniczo większej aktywności do uzyskania wyższych wyników.

### 4. Weryfikacja unikalnych głosujących

**Problem:** Wielokrotne głosy z tego samego adresu mogą sztucznie zawyżać zaangażowanie.
**Rozwiązanie:** Bonusy za uczestnictwo w głosowaniach bazują na liczbie unikalnych głosujących, a nie łącznej liczbie głosów.

### 5. Potwierdzenie pozycji w leaderboard

**Problem:** Nieprawidłowe dane o pozycji w Zero_dex Leaderboard.
**Rozwiązanie:** System weryfikuje, czy creator_address rzeczywiście znajduje się na liście leaderboard, zanim przyzna bonus.

## Przykłady Obliczeniowe

### Przykład 1: Nowy Token z Wysokim Zaangażowaniem

```
Dane:
- total_supply = 1,000,000
- total_supply_tokenAMM = 800,000
- price_now = 0.10
- price_30d_ago = 0.08
- price_volatility_7d = 0.02
- average_price_7d = 0.10
- holders_count = 50
- holders_growth_30d = 90%
- gravity_vote_avg = 4.2
- gravity_votes_count = 10
- comments_count = 20
- total_likes = 60
- transactions_7d = 100
- graduation = 'no'
- creation_date = 30 dni temu

Obliczenia:
1. Curve_Utilization = ((1,000,000 - 800,000) / 1,000,000) * 100 = 20%
2. Price_Performance = (min(0.10/0.08, 5)/5 * 100 * 0.5) + ((1-(0.02/0.10)) * 100 * 0.5) = 12.5 + 40 = 52.5
3. Holder_Metrics = (log10(50)/3 * 75) + (90 * 25) = 13.99 + 22.5 = 36.49
4. Community_Engagement = ((4.2/5) * 100 * 0.6) + (min((20/50) * 20, 100) * 0.2) + (min((60/20)/5 * 100, 100) * 0.2) = 50.4 + 8 + 12 = 70.4
5. Activity_Score = min((100/(50*0.5)) * 100, 100) = 100

Raw_Gravity_Score = (20 * 0.3) + (52.5 * 0.2) + (36.49 * 0.15) + (70.4 * 0.25) + (100 * 0.1) = 6 + 10.5 + 5.47 + 17.6 + 10 = 49.57

Bonusy:
- Graduation: Nie (0%)
- Wiek: <180 dni (0%)
- Głosowanie: 10/50 = 20% (>15%, +5%)

Total_Bonus_Multiplier = 1 + 0.05 = 1.05

Final_Gravity_Score = 49.57 * 1.05 = 52.05
Display_Gravity_Score = min(52.05 * 10, 1000) = 520.5 ≈ 521
```

### Przykład 2: Dojrzały Token z Graduation

```
Dane:
- total_supply = 1,000,000
- total_supply_tokenAMM = 200,000
- price_now = 0.50
- price_30d_ago = 0.40
- price_volatility_7d = 0.05
- average_price_7d = 0.50
- holders_count = 500
- holders_growth_30d = 15%
- gravity_vote_avg = 4.5
- gravity_votes_count = 100
- comments_count = 200
- total_likes = 800
- transactions_7d = 400
- graduation = 'yes'
- creation_date = 400 dni temu

Obliczenia:
1. Curve_Utilization = ((1,000,000 - 200,000) / 1,000,000) * 100 = 80%
2. Price_Performance = (min(0.50/0.40, 5)/5 * 100 * 0.5) + ((1-(0.05/0.50)) * 100 * 0.5) = 12.5 + 45 = 57.5
3. Holder_Metrics = (log10(500)/3 * 75) + (15 * 25) = 20.88 + 3.75 = 24.63
4. Community_Engagement = ((4.5/5) * 100 * 0.6) + (min((200/500) * 20, 100) * 0.2) + (min((800/200)/5 * 100, 100) * 0.2) = 54 + 8 + 16 = 78
5. Activity_Score = min((400/(500*0.5)) * 100, 100) = 100

Raw_Gravity_Score = (80 * 0.3) + (57.5 * 0.2) + (24.63 * 0.15) + (78 * 0.25) + (100 * 0.1) = 24 + 11.5 + 3.69 + 19.5 + 10 = 68.69

Bonusy:
- Graduation: Tak (+10%)
- Wiek: >365 dni (+10%)
- Głosowanie: 100/500 = 20% (>15%, +5%)

Total_Bonus_Multiplier = 1 + 0.10 + 0.10 + 0.05 = 1.25

Final_Gravity_Score = 68.69 * 1.25 = 85.86
Display_Gravity_Score = min(85.86 * 10, 1000) = 858.6 ≈ 859
```

## Implementacja Techniczna

### Pseudokod

```javascript
function calculateGravityScore(pool) {
    // 1. Curve Utilization
    const curveUtilization = ((pool.total_supply - pool.total_supply_tokenAMM) / pool.total_supply) * 100;
    
    // 2. Price Performance
    const priceChange = Math.min(pool.price / pool.price_30d_ago, 5) / 5 * 100;
    const priceStability = (1 - (pool.price_volatility_7d / pool.average_price_7d)) * 100;
    const pricePerformance = (priceChange * 0.5) + (priceStability * 0.5);
    
    // 3. Holder Metrics (z wykluczeniem bonding curve)
    // Pobierz wszystkich posiadaczy
    const holders = getHolders(pool.id);
    
    // Zlicz rzeczywistych posiadaczy (bez bonding curve)
    let realHolderCount = 0;
    for (const holder of holders) {
        if (holder.address.toLowerCase() !== pool.token_address.toLowerCase()) {
            realHolderCount++;
        }
    }
    
    const holderScore = (Math.log10(Math.max(1, realHolderCount)) / 3) * 75;
    const holderGrowth = Math.min(pool.holders_growth_30d, 100) * 25;
    const holderMetrics = holderScore + holderGrowth;
    
    // 4. Community Engagement z współczynnikiem zaufania i skalą logarytmiczną
    let gravityVoteScore = 50; // Domyślna wartość 
    
    if (pool.gravity_votes_count > 0) {
        if (pool.gravity_votes_count > 10) {
            gravityVoteScore = (pool.gravity_vote_avg / 5) * 100;
        } else {
            const confidenceFactor = Math.min(pool.gravity_votes_count / 10, 1);
            gravityVoteScore = (confidenceFactor * (pool.gravity_vote_avg / 5) * 100) + 
                              ((1 - confidenceFactor) * 50);
        }
    }
    
    // Logarytmiczna skala dla aktywności komentarzy
    const commentToHolderRatio = pool.holders_count > 0 ? pool.comments_count / pool.holders_count : 0;
    const commentActivity = (Math.log(1 + 10 * commentToHolderRatio) / Math.log(11)) * 100;
    
    // Logarytmiczna skala dla popularności komentarzy
    let commentPopularity = 0;
    if (pool.comments_count > 0) {
        const likesPerComment = pool.total_likes / pool.comments_count;
        commentPopularity = (Math.log(1 + 2 * likesPerComment) / Math.log(5)) * 100;
    }
    
    const communityEngagement = (gravityVoteScore * 0.6) + (commentActivity * 0.2) + (commentPopularity * 0.2);
    
    // 5. Activity Score z logarytmiczną skalą
    let activityScore = 0;
    if (pool.holders_count > 0) {
        const txToHolderRatio = pool.transactions_7d / pool.holders_count;
        activityScore = (Math.log(1 + txToHolderRatio) / Math.log(3)) * 100;
    }
    
    // 6. Raw Gravity Score
    const rawGravityScore = (curveUtilization * 0.3) + 
                           (pricePerformance * 0.2) + 
                           (holderMetrics * 0.15) + 
                           (communityEngagement * 0.25) +
                           (activityScore * 0.1);
    
    // 7. Apply Bonuses
    let bonusMultiplier = 1.0;
    
    // Graduation bonus
    if (curveUtilization >= 75) {
        bonusMultiplier += 0.10;
    }
    
    // Age bonus
    const daysSinceCreation = (Date.now() - new Date(pool.creation_date)) / (1000 * 60 * 60 * 24);
    if (daysSinceCreation > 365) {
        bonusMultiplier += 0.10;
    } else if (daysSinceCreation > 180) {
        bonusMultiplier += 0.05;
    }
    
    // Vote participation bonus z unikalnymi głosującymi
    const uniqueVotersCount = countUniqueVoters(pool.id);
    const uniqueVotersRatio = pool.holders_count > 0 ? uniqueVotersCount / pool.holders_count : 0;
    
    if (uniqueVotersRatio >= 0.20) {
        bonusMultiplier += 0.05;
    } else if (uniqueVotersRatio >= 0.10) {
        bonusMultiplier += 0.03;
    } else if (uniqueVotersRatio >= 0.05) {
        bonusMultiplier += 0.01;
    }
    
    // Zero_dex Leaderboard Bonus
    if (pool.creator_address && pool.creator_address !== '') {
        const creatorRank = getCreatorLeaderboardRank(pool.creator_address);
        
        if (creatorRank !== null) {
            if (creatorRank <= 50) {
                bonusMultiplier += 0.10;
            } else if (creatorRank <= 200) {
                bonusMultiplier += 0.07;
            } else if (creatorRank <= 500) {
                bonusMultiplier += 0.05;
            } else if (creatorRank <= 1000) {
                bonusMultiplier += 0.03;
            } else if (creatorRank <= 5000) {
                bonusMultiplier += 0.01;
            }
        }
    }
    
    // 8. Final Gravity Score
    const finalGravityScore = rawGravityScore * bonusMultiplier;
    
    // 9. Normalize to 0-1000 range
    return Math.min(Math.round(finalGravityScore * 10), 1000);
}
```

### Wymagane Dane Wejściowe

Dla pełnego obliczenia Gravity Score, system wymaga następujących danych dla każdego tokenu:

1. **Dane Bonding Curve:**
   - `total_supply`: Całkowita podaż tokenów
   - `total_supply_tokenAMM`: Tokeny pozostające w puli AMM
   - `token_address`: Adres kontraktu tokenu (tożsamy z adresem bonding curve)

2. **Dane Cenowe:**
   - `price`: Aktualna cena
   - `price_30d_ago`: Cena sprzed 30 dni
   - `price_volatility_7d`: Odchylenie standardowe ceny w ciągu 7 dni
   - `average_price_7d`: Średnia cena w ciągu 7 dni

3. **Dane Posiadaczy:**
   - `holders`: Lista wszystkich posiadaczy z adresami i ilościami
   - `holders_growth_30d`: Procentowy wzrost liczby posiadaczy w ciągu 30 dni

4. **Dane Społeczności:**
   - `gravity_vote_avg`: Średnia ocen (1-5)
   - `gravity_votes_count`: Liczba głosów
   - `unique_voters_count`: Liczba unikalnych głosujących
   - `comments_count`: Liczba komentarzy
   - `total_likes`: Suma polubień komentarzy

5. **Dane Aktywności:**
   - `transactions_7d`: Liczba transakcji w ciągu 7 dni

6. **Dane Statusu:**
   - `creation_date`: Data utworzenia tokenu
   - `creator_address`: Adres twórcy tokenu
   - `creator_leaderboard_rank`: Pozycja twórcy w Zero_dex Leaderboard

## Wytyczne dot. Utrzymania i Aktualizacji

### Zalecana Częstotliwość Aktualizacji

- **Codziennie:** Aktualizacja wszystkich metryk bazujących na danych on-chain
- **Co godzinę:** Aktualizacja ocen i statystyk społecznościowych
- **Co tydzień:** Przegląd wag komponentów i wartości progowych bonusów

### Proces Kontroli Jakości

1. **Monitoring Wartości Odstających:** Regularne sprawdzanie tokenów z nietypowo wysokimi lub niskimi wynikami
2. **Analiza Porównawcza:** Okresowe porównywanie wyników Gravity Score z innymi wskaźnikami rynkowymi
3. **Audyt Danych:** Regularne weryfikowanie dokładności i kompletności danych wejściowych

### Zalecenia dot. Przyszłych Ulepszeń

1. **Integracja Zewnętrznych Danych:** Rozważenie dodania danych z zewnętrznych platform społecznościowych (Twitter, Discord)
2. **Analiza Sentymentu:** Implementacja analizy sentymentu komentarzy
3. **Dynamiczne Wagi:** System, który automatycznie dostosowuje wagi komponentów na podstawie ich korelacji z faktyczną wydajnością tokenu

## Załączniki

### A. Słownik Terminów

- **Bonding Curve:** Algorytmiczny mechanizm ustalania ceny, gdzie cena tokenu wzrasta wraz ze zwiększaniem podaży
- **Graduation:** Status osiągnięty, gdy co najmniej 75% całkowitej podaży tokenów zostało wykupionych z puli AMM
- **Gravity Vote:** System oceniania tokenów przez społeczność w skali 1-5
- **Raw Gravity Score:** Podstawowy wynik przed zastosowaniem bonusów
- **Final Gravity Score:** Wynik po zastosowaniu mnożników bonusowych
- **Display Gravity Score:** Znormalizowany wynik w skali 0-1000
- **Współczynnik zaufania:** Wartość od 0 do 1 określająca, jak bardzo system "ufa" wynikom bazującym na małej liczbie danych
- **Zero_dex Leaderboard:** Ranking najaktywniejszych uczestników ekosystemu, bazujący na całkowitej liczbie interakcji

### B. Historia Zmian Dokumentu

| Wersja | Data       | Opis Zmian                                 | Autor     |
|--------|------------|-------------------------------------------|-----------|
| 0.1    | 2025-04-01 | Wstępny szkic                             | Zespół lf0g.fun |
| 0.5    | 2025-04-15 | Dodanie komponentu Community Engagement   | Zespół lf0g.fun |
| 0.9    | 2025-04-30 | Dodanie bonusów i przykładów              | Zespół lf0g.fun |
| 1.0    | 2025-05-10 | Finalizacja i publikacja                  | Zespół lf0g.fun |
| 1.1    | 2025-06-20 | Dodanie zabezpieczeń przed manipulacją, skorygowanie formuł | Zespół lf0g.fun |
| 2.2    | 2023-06-20 | Dodanie kapitalizacji rynkowej jako głównego komponentu | Zespół lf0g.fun |

---

© 2023 lf0g.fun. Wszelkie prawa zastrzeżone.