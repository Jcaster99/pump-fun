# System Jednorazowego Odblokowywania Tokenów na Podstawie Gravity Score

## Wprowadzenie

Ten dokument opisuje model jednorazowego odblokowywania tokenów twórcy w oparciu o osiąganie określonych progów Gravity Score. System ten integruje mechanizm bonding curve z systemem oceny jakości projektu (Gravity Score), tworząc zachęty do długoterminowego rozwoju tokenów i ich ekosystemów.

## Model Odblokowywania Tokenów

Model zakłada, że twórca otrzymuje rezerwę tokenów podczas tworzenia projektu, ale tokeny te są zablokowane i odblokowywane jednorazowo po osiągnięciu konkretnych progów Gravity Score:

| Próg Gravity Score | Jednorazowe Odblokowanie |
|--------------------|--------------------------|
| 200 punktów        | 0.01% całkowitej podaży  |
| 400 punktów        | 0.02% całkowitej podaży  |
| 600 punktów        | 0.04% całkowitej podaży  |
| 800 punktów        | 0.08% całkowitej podaży  |
| 1000 punktów       | 0.10% całkowitej podaży  |

Zauważmy, że procentowe wartości rosną wykładniczo, nagradzając osiągnięcie wyższych poziomów Gravity Score.

## Implementacja w Smart Kontrakcie

Poniżej przedstawiono przykładową implementację mechanizmu jednorazowego odblokowywania tokenów w Solidity:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

interface IGravityScore {
    function getScore(address tokenAddress) external view returns (uint256);
}

contract GravityBondingCurveToken is ERC20, Ownable {
    // Adres kontraktu Gravity Score
    IGravityScore public gravityScoreContract;
    
    // Całkowita podaż tokenów
    uint256 public constant TOTAL_SUPPLY = 800000000 * 10**18; // 800 milionów
    
    // Tokeny zarezerwowane dla twórcy
    uint256 public constant CREATOR_RESERVE = TOTAL_SUPPLY * 15 / 100; // 15% całkowitej podaży
    
    // Struktura do śledzenia osiągniętych progów Gravity Score
    struct CreatorMilestones {
        bool reached200;
        bool reached400;
        bool reached600;
        bool reached800;
        bool reached1000;
        uint256 totalReleased;
    }
    
    // Mapowanie adresów twórców do ich kamieni milowych
    mapping(address => CreatorMilestones) public creatorMilestones;
    
    // Adres twórcy tokenu
    address public creator;
    
    // Mapping zapisujący timestamp osiągnięcia progu Gravity Score
    mapping(uint256 => uint256) public thresholdTimestamps;
    
    // Minimalna liczba dni wymagana do utrzymania progu Gravity Score
    uint256 public constant THRESHOLD_HOLD_DAYS = 7;
    
    // Wydarzenie emitowane przy odblokowaniu tokenów
    event TokensUnlocked(address indexed creator, uint256 gravityScore, uint256 amount);
    
    constructor(
        string memory name, 
        string memory symbol,
        address _creator,
        address _gravityScoreContract
    ) ERC20(name, symbol) {
        creator = _creator;
        gravityScoreContract = IGravityScore(_gravityScoreContract);
        
        // Zainicjalizuj strukturę kamieni milowych
        creatorMilestones[creator] = CreatorMilestones({
            reached200: false,
            reached400: false,
            reached600: false,
            reached800: false,
            reached1000: false,
            totalReleased: 0
        });
    }
    
    // Funkcja do sprawdzania i rejestrowania progów Gravity Score
    function checkGravityScoreThreshold() external {
        require(msg.sender == creator, "Tylko twórca może wywołać tę funkcję");
        
        uint256 currentScore = gravityScoreContract.getScore(address(this));
        
        // Zarejestruj timestamp osiągnięcia progu
        if (currentScore >= 200 && thresholdTimestamps[200] == 0) {
            thresholdTimestamps[200] = block.timestamp;
        }
        
        if (currentScore >= 400 && thresholdTimestamps[400] == 0) {
            thresholdTimestamps[400] = block.timestamp;
        }
        
        if (currentScore >= 600 && thresholdTimestamps[600] == 0) {
            thresholdTimestamps[600] = block.timestamp;
        }
        
        if (currentScore >= 800 && thresholdTimestamps[800] == 0) {
            thresholdTimestamps[800] = block.timestamp;
        }
        
        if (currentScore >= 1000 && thresholdTimestamps[1000] == 0) {
            thresholdTimestamps[1000] = block.timestamp;
        }
    }
    
    // Funkcja do odblokowywania tokenów po osiągnięciu progów
    function unlockTokens() external {
        require(msg.sender == creator, "Tylko twórca może odblokować tokeny");
        
        CreatorMilestones storage milestones = creatorMilestones[creator];
        uint256 tokensToRelease = 0;
        uint256 currentTime = block.timestamp;
        
        // Sprawdź próg 200
        if (!milestones.reached200 && 
            thresholdTimestamps[200] > 0 && 
            currentTime >= thresholdTimestamps[200] + THRESHOLD_HOLD_DAYS * 1 days) {
            
            tokensToRelease += CREATOR_RESERVE * 1 / 10000; // 0.01%
            milestones.reached200 = true;
        }
        
        // Sprawdź próg 400
        if (!milestones.reached400 && 
            thresholdTimestamps[400] > 0 && 
            currentTime >= thresholdTimestamps[400] + THRESHOLD_HOLD_DAYS * 1 days) {
            
            tokensToRelease += CREATOR_RESERVE * 2 / 10000; // 0.02%
            milestones.reached400 = true;
        }
        
        // Sprawdź próg 600
        if (!milestones.reached600 && 
            thresholdTimestamps[600] > 0 && 
            currentTime >= thresholdTimestamps[600] + THRESHOLD_HOLD_DAYS * 1 days) {
            
            tokensToRelease += CREATOR_RESERVE * 4 / 10000; // 0.04%
            milestones.reached600 = true;
        }
        
        // Sprawdź próg 800
        if (!milestones.reached800 && 
            thresholdTimestamps[800] > 0 && 
            currentTime >= thresholdTimestamps[800] + THRESHOLD_HOLD_DAYS * 1 days) {
            
            tokensToRelease += CREATOR_RESERVE * 8 / 10000; // 0.08%
            milestones.reached800 = true;
        }
        
        // Sprawdź próg 1000
        if (!milestones.reached1000 && 
            thresholdTimestamps[1000] > 0 && 
            currentTime >= thresholdTimestamps[1000] + THRESHOLD_HOLD_DAYS * 1 days) {
            
            tokensToRelease += CREATOR_RESERVE * 10 / 10000; // 0.10%
            milestones.reached1000 = true;
        }
        
        require(tokensToRelease > 0, "Brak tokenów do odblokowania");
        
        // Aktualizuj sumaryczną ilość odblokowanych tokenów
        milestones.totalReleased += tokensToRelease;
        
        // Mint tokenów dla twórcy
        _mint(creator, tokensToRelease);
        
        emit TokensUnlocked(creator, gravityScoreContract.getScore(address(this)), tokensToRelease);
    }
    
    // Funkcja do ustawiania adresu kontraktu Gravity Score (tylko właściciel)
    function setGravityScoreContract(address _gravityScoreContract) external onlyOwner {
        gravityScoreContract = IGravityScore(_gravityScoreContract);
    }
}
```

## Obliczanie Startowego Market Cap

W tym modelu, startowy market cap obliczany jest według standardowego modelu bonding curve:

1. Początkowo, żaden token nie jest w obiegu (circulation supply = 0)
2. Startowy market cap = 0
3. Gdy pierwsza osoba kupuje tokeny, market cap obliczany jest jako: cena × ilość tokenów w obiegu

Tokeny zarezerwowane dla twórcy są zazwyczaj poza obiegiem i nie wliczają się do bieżącego market cap, dopóki nie zostaną odblokowane. Można jednak wyświetlać dwie wartości:
- **Current Market Cap**: Oparty tylko na tokenach aktualnie w obiegu
- **Fully Diluted Market Cap**: Uwzględniający wszystkie potencjalne tokeny, w tym zarezerwowane dla twórcy

## Integracja z Bonding Curve

Aby w pełni zintegrować ten mechanizm z bonding curve, należy stworzyć dwa oddzielne kontrakty:

1. **Kontrakt Bonding Curve**: Odpowiedzialny za implementację mechanizmu handlowego
2. **Kontrakt Token z Gravity Score**: Odpowiedzialny za śledzenie i odblokowywanie tokenów twórcy

```solidity
// Pseudokod dla pełnej integracji
interface IBondingCurve {
    function buy(uint256 amount) external payable;
    function sell(uint256 amount) external;
    function getCurrentPrice() external view returns (uint256);
}

// W głównym kontrakcie zarządzającym
function createToken(string memory name, string memory symbol) external {
    // 1. Utwórz Token
    GravityBondingCurveToken newToken = new GravityBondingCurveToken(
        name, 
        symbol, 
        msg.sender, // twórca
        gravityScoreContract
    );
    
    // 2. Utwórz Bonding Curve dla tokenu
    BondingCurve newCurve = new BondingCurve(
        address(newToken),
        curveParams
    );
    
    // 3. Przypisz właściciela bonding curve
    newToken.transferOwnership(address(newCurve));
    
    // 4. Zapisz powiązania w rejestrze
    tokenToCurve[address(newToken)] = address(newCurve);
    creatorToToken[msg.sender] = address(newToken);
    
    emit TokenCreated(msg.sender, address(newToken), address(newCurve));
}
```

## Dodatkowe Rozszerzenia

### 1. Progresywny Gravity Score

Dodatkową motywacją dla twórców mogłoby być wprowadzenie bonusów za utrzymanie wysokiego Gravity Score przez dłuższy czas:

```solidity
// Dodatkowe zmienne
mapping(address => uint256) public highScoreDuration;
mapping(address => bool) public receivedLongTermBonus;

// Funkcja aktualizująca czas utrzymania wysokiego Gravity Score
function updateHighScoreDuration() external {
    uint256 currentGravityScore = gravityScoreContract.getScore(address(this));
    
    if (currentGravityScore >= 800) {
        highScoreDuration[address(this)] += 1 days;
        
        // Jeśli utrzymujesz wysoki score przez 90 dni, odblokuj dodatkowe 0.05%
        if (highScoreDuration[address(this)] >= 90 days && !receivedLongTermBonus[address(this)]) {
            uint256 bonusTokens = CREATOR_RESERVE * 5 / 10000; // 0.05%
            _mint(creator, bonusTokens);
            receivedLongTermBonus[address(this)] = true;
        }
    }
}
```

### 2. Modyfikacja Bonding Curve na Podstawie Gravity Score

Gravity Score może również wpływać na parametry samej bonding curve:

```solidity
// Modyfikator opłat transakcyjnych na podstawie Gravity Score
function getTransactionFee() public view returns (uint256) {
    uint256 gravityScore = gravityScoreContract.getScore(address(this));
    
    if (gravityScore < 200) return 200;     // 2.0%
    if (gravityScore < 400) return 180;     // 1.8%
    if (gravityScore < 600) return 160;     // 1.6%
    if (gravityScore < 800) return 120;     // 1.2%
    return 100;                             // 1.0%
}
```

### 3. Skalowanie Nagród

Jeśli jednorazowe odblokowywanie 0.01%-0.1% tokenów jest zbyt małe, można zwiększyć te wartości, na przykład:

| Próg Gravity Score | Jednorazowe Odblokowanie |
|--------------------|--------------------------|
| 200 punktów        | 0.1% całkowitej podaży   |
| 400 punktów        | 0.2% całkowitej podaży   |
| 600 punktów        | 0.4% całkowitej podaży   |
| 800 punktów        | 0.8% całkowitej podaży   |
| 1000 punktów       | 1.0% całkowitej podaży   |

W tym przypadku, twórca może łącznie odblokować 2.5% całkowitej podaży tokenów (przy całkowitej rezerwie 15%).

## Podsumowanie

System jednorazowego odblokowywania tokenów w oparciu o progi Gravity Score tworzy silną motywację dla twórców do rozwijania projektów z długoterminową wizją. Integracja tego mechanizmu z bonding curve zapewnia płynny start tokenów, a jednocześnie chroni przed wczesnymi dump'ami przez twórców.

Kluczowe zalety tego rozwiązania:
- Nagradzanie jakości projektu (Gravity Score) a nie tylko spekulacji
- Tworzenie zachęt dla długoterminowego zaangażowania twórców
- Zwiększanie bezpieczeństwa dla pierwszych inwestorów
- Prostota implementacji i przejrzystość dla wszystkich uczestników

System ten może być dalej rozbudowywany o dodatkowe mechanizmy, takie jak nagrody za utrzymanie wysokiego Gravity Score przez dłuższy czas, czy dynamiczne modyfikacje parametrów bonding curve.
