# Plan usprawnienia odczytu faktycznych ilości tokenów

## Problem
Aktualnie system zapisuje do bazy danych przewidywane ilości tokenów (`expectedAmount`) obliczone przed wykonaniem transakcji, które mogą nieznacznie różnić się od faktycznych ilości otrzymanych przez użytkownika.

## Rozwiązanie
Implementacja dokładnego odczytu faktycznych ilości tokenów/USDT otrzymanych podczas transakcji.

### Opcja 1: Parsowanie logów transakcji
```javascript
// W useSwap.js - funkcja executeSwap:
const receipt = await publicClient.waitForTransactionReceipt({ hash: swapTx });

// Analizuj logi transakcji, aby znaleźć event emitowany przez kontrakt
let actualTokenAmount = null;
if (receipt.logs && receipt.logs.length > 0) {
  // Znajdź właściwy log wydarzenia z transferem tokenów
  const transferLog = receipt.logs.find(log => 
    log.topics[0] === ethers.utils.id("Transfer(address,address,uint256)")
  );
  
  if (transferLog) {
    // Dekoduj dane z loga
    const decodedLog = ethers.utils.defaultAbiCoder.decode(
      ['uint256'], 
      transferLog.data
    );
    actualTokenAmount = decodedLog[0];
  }
}

// Zwróć rzeczywistą ilość tokenów/USDT
return {
  txHash: swapTx,
  expectedAmount: parseFloat(expectedAmount),
  actualAmount: actualTokenAmount ? 
    parseFloat(ethers.utils.formatUnits(actualTokenAmount, isBuy ? TOKEN_DECIMALS : USDT_DECIMALS)) 
    : parseFloat(expectedAmount),
  minAmount: parseFloat(minAmount)
};
```

### Opcja 2: Porównanie sald przed i po transakcji
```javascript
// Odczytaj saldo przed transakcją
const balanceBeforeBigInt = await publicClient.readContract({
  address: isBuy ? tokenAddress : USDT_ADDRESS,
  abi: ERC20_ABI,
  functionName: 'balanceOf',
  args: [wallet.address]
});

// Wykonaj transakcję... 

// Odczytaj saldo po transakcji
const balanceAfterBigInt = await publicClient.readContract({
  address: isBuy ? tokenAddress : USDT_ADDRESS,
  abi: ERC20_ABI,
  functionName: 'balanceOf',
  args: [wallet.address]
});

// Oblicz różnicę - to jest dokładna ilość otrzymanych tokenów/USDT
const actualAmountBigInt = balanceAfterBigInt.sub(balanceBeforeBigInt);
const actualAmount = parseFloat(ethers.utils.formatUnits(
  actualAmountBigInt, 
  isBuy ? TOKEN_DECIMALS : USDT_DECIMALS
));
```

## Modyfikacje w zapisie transakcji

W `PoolActionPanel.Logic.js` zmodyfikować:

```javascript
// W handleSubmit
const result = await executeSwap({...});

// Zmodyfikuj lastTradeInfo, aby zawierał rzeczywistą ilość
setLastTradeInfo({
  ...lastTradeInfo,
  actualAmount: result.actualAmount
});

// W useEffect obserwującym lastSwapHash
await savePoolTransaction({
  // ... inne pola
  token_amount: isBuy ? lastTradeInfo.actualAmount : lastTradeInfo.inputAmount,
  usdt_amount: isBuy ? lastTradeInfo.inputAmount : lastTradeInfo.actualAmount,
  // ... reszta pól
});
```

## Korzyści
1. Dokładne śledzenie rzeczywistych ilości tokenów w transakcjach
2. Większa zgodność danych w bazie z faktycznym stanem blockchain
3. Lepsza jakość danych do analiz

## Plan wdrożenia
1. Zmodyfikować funkcję `executeSwap` w `useSwap.js`
2. Zaktualizować `handleSubmit` i obserwator `lastSwapHash` w `PoolActionPanel.Logic.js`
3. Dostosować zapis do bazy danych w `savePoolTransaction`
4. Opcjonalnie: wyświetlanie rzeczywistej otrzymanej ilości w UI

## Implementacja (zrobione ✅)

Zaimplementowano rozwiązanie oparte na porównaniu sald (opcja 2) z następującymi usprawnieniami:

1. **Odczyt rzeczywistych ilości**:
   - W `useSwap.js` funkcja `executeSwap` została zaktualizowana o odczyt sald przed i po transakcji
   - Różnica w saldach reprezentuje rzeczywistą ilość tokenów/USDT, które użytkownik otrzymał

2. **Przechowywanie danych**:
   - W komponencie `PoolActionPanel.Logic.js` dodano aktualizację `lastTradeInfo` o rzeczywistą wartość
   - Wartość ta jest używana przy zapisie do bazy danych, zastępując wcześniejszą przewidywaną wartość

3. **Interfejs użytkownika**:
   - Dodano opcjonalne wyświetlanie panelu informacyjnego z porównaniem przewidywanej i rzeczywistej wartości
   - Panel pokazuje się po zakończonej transakcji, pokazując użytkownikowi zarówno przewidywaną jak i rzeczywistą kwotę

4. **Rozwiązanie serwerowe**:
   - Nie wymagało żadnych zmian w API ani strukturze bazy danych serwera
   - Istniejące pola `token_amount` i `usdt_amount` są używane, ale z dokładnymi wartościami

Wdrożone rozwiązanie zapewnia dokładne śledzenie rzeczywistych wartości przy minimalnych zmianach w kodzie. 

## Aktualna logika zapisu danych transakcji

Po wprowadzeniu wszystkich usprawnień, proces zapisu transakcji działa następująco:

### 1. Obliczanie rzeczywistych wartości (w `useSwap.js`)
- Przed wykonaniem transakcji odczytujemy saldo tokenu
- Po wykonaniu transakcji ponownie odczytujemy saldo
- Obliczamy dokładną różnicę (actualAmount) poprzez proste odejmowanie wartości BigInt
- Jeśli z jakiegoś powodu saldo nie zmieniło się, używamy wartości przewidywanej (expectedAmount)
- Wszystkie wartości są konwertowane do czytelnego formatu przy użyciu `ethers.utils.formatUnits`

```javascript
// Uproszczona logika
const balanceBeforeBigInt = await readBalance(tokenAddress);
// Wykonaj transakcję...
const balanceAfterBigInt = await readBalance(tokenAddress);
const actualAmountBigInt = balanceAfterBigInt - balanceBeforeBigInt; 
const actualAmount = ethers.utils.formatUnits(actualAmountBigInt.toString(), decimals);
```

### 2. Przekazywanie wartości przez komponent (w `PoolActionPanel.Logic.js`)
- Po zakończonej transakcji aktualizujemy `lastTradeInfo` o rzeczywistą wartość
- Przy zapisie transakcji używamy bezpośrednio wartości rzeczywistej, bez dodatkowego formatowania
- Wartości są przekazywane do API w oryginalnej precyzji

```javascript
// Przekazanie bezpośrednio bez formatowania
await savePoolTransaction({
  // ...
  token_amount: isBuy ? lastTradeInfo.actualAmount : lastTradeInfo.inputAmount,
  usdt_amount: isBuy ? lastTradeInfo.inputAmount : lastTradeInfo.actualAmount,
  // ...
});
```

### 3. Konwersja wartości na stringi (w `poolTransactionsApi.js`)
- Wszystkie wartości liczbowe są konwertowane na stringi przed wysłaniem do API
- Używamy prostej konwersji `toString()` zamiast formatowania, aby zachować pełną precyzję

```javascript
const ensureString = (val) => {
  if (val === null || val === undefined) return null;
  return val.toString(); // Bezpośrednia konwersja na string bez formatowania
};

// Zastosowanie
token_amount: ensureString(transaction.token_amount),
usdt_amount: ensureString(transaction.usdt_amount),
```

### 4. Zapis w bazie danych (w `transactionsController.js`)
- Wartości są odbierane i przetwarzane jako stringi, aby zachować pełną precyzję
- Bezpośrednio zapisujemy je do bazy danych bez żadnych dodatkowych konwersji

```javascript
// Zachowanie stringów na każdym etapie
const tokenAmountStr = String(tokenAmount);
const usdtAmountStr = String(usdtAmount);

// Zapis do bazy
insertStmt.run(
  // ...
  tokenAmountStr, // Dokładna wartość string z frontendu
  usdtAmountStr,  // Dokładna wartość string z frontendu
  // ...
);
```

### 5. Struktura modelu danych (w `pool.js`)
- Logika modelu zapisuje transakcje zachowując oryginalne wartości
- Nie wykonujemy żadnych operacji mogących zmienić precyzję liczb

### Korzyści wdrożonego rozwiązania
1. **Dokładność**: Zapisywane są rzeczywiste, faktyczne wartości z blockchaina
2. **Niezawodność**: Wyeliminowanie problemu utraty precyzji przy konwersjach JS
3. **Transparentność**: Użytkownik widzi i ma zapisane dokładnie takie wartości, jakie faktycznie otrzymał
4. **Spójność danych**: Wartości wyświetlane, przesyłane i zapisywane są identyczne

Rozwiązanie gwarantuje, że wartości pokazywane użytkownikowi w interfejsie są identyczne z wartościami zapisywanymi w bazie danych, eliminując problemy z precyzją liczb zmiennoprzecinkowych w JavaScript. 