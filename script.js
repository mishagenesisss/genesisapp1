// Инициализация Telegram WebApp
const tg = window.Telegram.WebApp;
tg.expand();

// Хранилище данных (в реальном приложении используйте localStorage или IndexedDB)
let userData = {
    id: tg.initDataUnsafe.user?.id || Math.floor(Math.random() * 1000000),
    name: tg.initDataUnsafe.user?.first_name || 'Гость',
    balance: 10.00, // Начальный баланс
    gamesPlayed: 0,
    wins: 0,
    losses: 0,
    referralCode: `REF${tg.initDataUnsafe.user?.id || Math.floor(Math.random() * 10000)}`,
    referrals: [],
    referralBalance: 0,
    transactions: [],
    gameHistory: []
};

// Коэффициенты для игр
const GAME_COEFFICIENTS = {
    dice: 5,
    even_odd: 1.8,
    high_low: 1.8,
    darts: { '🔴 Красное': 1.8, '⚪ Белое': 2.5 },
    football: { '⚽ Гол': 1.5, '❌ Мимо': 2.0 },
    basketball: { '🏀 Гол': 1.5, '❌ Мимо': 2.0 },
    bowling: { '🎳 Страйк': 3.0, '🎯 Спэр': 1.2 },
    roulette: { '🔴 Красное': 1.8, '⚫ Чёрное': 1.8, '🟢 Зелёное (0)': 30 }
};

// Рулетка
const ROULETTE_NUMBERS = [
    { number: 0, color: '🟢' },
    { number: 32, color: '🔴' }, { number: 15, color: '⚫' }, 
    { number: 19, color: '🔴' }, { number: 4, color: '⚫' },
    // ... все остальные числа рулетки
];

// Элементы интерфейса
const elements = {
    mainMenu: document.getElementById('main-menu'),
    depositForm: document.getElementById('deposit-form'),
    withdrawForm: document.getElementById('withdraw-form'),
    diceGame: document.getElementById('dice-game-container'),
    profileContainer: document.getElementById('profile-container'),
    referralContainer: document.getElementById('referral-container'),
    helpContainer: document.getElementById('help-container'),
    resultContainer: document.getElementById('result-container'),
    backButtons: document.querySelectorAll('.back-btn'),
    userBalance: document.getElementById('user-balance'),
    refreshBalance: document.getElementById('refresh-balance'),
    depositAmount: document.getElementById('deposit-amount'),
    submitDeposit: document.getElementById('submit-deposit'),
    withdrawAmount: document.getElementById('withdraw-amount'),
    withdrawWallet: document.getElementById('withdraw-wallet'),
    submitWithdraw: document.getElementById('submit-withdraw'),
    diceBetAmount: document.getElementById('dice-bet-amount'),
    numberButtons: document.querySelectorAll('.number-btn'),
    profileId: document.getElementById('profile-id'),
    profileName: document.getElementById('profile-name'),
    profileBalance: document.getElementById('profile-balance'),
    profileGames: document.getElementById('profile-games'),
    profileWins: document.getElementById('profile-wins'),
    profileLosses: document.getElementById('profile-losses'),
    profileWinrate: document.getElementById('profile-winrate'),
    referralLink: document.getElementById('referral-link'),
    referralCount: document.getElementById('referral-count'),
    referralEarnings: document.getElementById('referral-earnings'),
    withdrawReferral: document.getElementById('withdraw-referral'),
    resultTitle: document.getElementById('result-title'),
    resultContent: document.getElementById('result-content'),
    playAgain: document.getElementById('play-again')
};

// Текущее состояние игры
let currentGame = null;
let currentBet = 0;
let currentChoice = null;

// Инициализация приложения
document.addEventListener('DOMContentLoaded', () => {
    loadUserData();
    setupEventListeners();
});

// Настройка обработчиков событий
function setupEventListeners() {
    // Кнопки меню
    document.getElementById('deposit-btn').addEventListener('click', () => showSection('deposit-form'));
    document.getElementById('withdraw-btn').addEventListener('click', () => showSection('withdraw-form'));
    document.getElementById('dice-game').addEventListener('click', () => {
        currentGame = 'dice';
        showSection('dice-game-container');
    });
    document.getElementById('even-odd-game').addEventListener('click', () => {
        currentGame = 'even_odd';
        startGame('even_odd');
    });
    document.getElementById('high-low-game').addEventListener('click', () => {
        currentGame = 'high_low';
        startGame('high_low');
    });
    document.getElementById('darts-game').addEventListener('click', () => {
        currentGame = 'darts';
        startGame('darts');
    });
    document.getElementById('football-game').addEventListener('click', () => {
        currentGame = 'football';
        startGame('football');
    });
    document.getElementById('basketball-game').addEventListener('click', () => {
        currentGame = 'basketball';
        startGame('basketball');
    });
    document.getElementById('bowling-game').addEventListener('click', () => {
        currentGame = 'bowling';
        startGame('bowling');
    });
    document.getElementById('roulette-game').addEventListener('click', () => {
        currentGame = 'roulette';
        startGame('roulette');
    });
    document.getElementById('profile-btn').addEventListener('click', () => showSection('profile-container'));
    document.getElementById('referral-btn').addEventListener('click', () => showSection('referral-container'));
    document.getElementById('help-btn').addEventListener('click', () => showSection('help-container'));
    
    // Кнопки "Назад"
    elements.backButtons.forEach(btn => {
        btn.addEventListener('click', () => showSection('main-menu'));
    });
    
    // Обновление баланса
    elements.refreshBalance.addEventListener('click', loadUserData);
    
    // Депозит
    elements.submitDeposit.addEventListener('click', processDeposit);
    
    // Вывод
    elements.submitWithdraw.addEventListener('click', processWithdraw);
    
    // Игра в кубик
    elements.numberButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            currentChoice = this.dataset.number;
            processDiceGame();
        });
    });
    
    // Вывод реферальных средств
    elements.withdrawReferral.addEventListener('click', withdrawReferralEarnings);
    
    // Играть снова
    elements.playAgain.addEventListener('click', () => {
        if (currentGame) {
            showSection(currentGame + '-container');
        } else {
            showSection('main-menu');
        }
    });
}

// Показать секцию
function showSection(sectionId) {
    // Скрыть все секции
    Object.values(elements).forEach(el => {
        if (el.classList?.contains?.('app-container')) return;
        if (el.nodeType === 1) el.style.display = 'none';
    });
    
    // Показать нужную секцию
    if (sectionId === 'main-menu') {
        elements.mainMenu.style.display = 'block';
    } else {
        document.getElementById(sectionId).style.display = 'block';
    }
}

// Загрузка данных пользователя
function loadUserData() {
    updateUI();
}

// Обновление интерфейса
function updateUI() {
    // Баланс
    elements.userBalance.textContent = `${userData.balance.toFixed(2)} USD`;
    
    // Профиль
    elements.profileId.textContent = userData.id;
    elements.profileName.textContent = userData.name;
    elements.profileBalance.textContent = `${userData.balance.toFixed(2)} USD`;
    elements.profileGames.textContent = userData.gamesPlayed;
    elements.profileWins.textContent = userData.wins;
    elements.profileLosses.textContent = userData.losses;
    elements.profileWinrate.textContent = userData.gamesPlayed > 0 
        ? `${(userData.wins / userData.gamesPlayed * 100).toFixed(1)}%` 
        : '0%';
    
    // Реферальная система
    elements.referralLink.textContent = `https://t.me/${tg.initDataUnsafe.user?.username || 'bot'}_bot?start=${userData.referralCode}`;
    elements.referralCount.textContent = userData.referrals.length;
    elements.referralEarnings.textContent = `${userData.referralBalance.toFixed(2)} USD`;
    elements.withdrawReferral.style.display = userData.referralBalance >= 1 ? 'block' : 'none';
}

// Обработка депозита
function processDeposit() {
    const amount = parseFloat(elements.depositAmount.value);
    
    if (isNaN(amount) || amount < 0.1) {
        alert('Минимальная сумма пополнения - 0.1 USD');
        return;
    }
    
    // В реальном приложении здесь была бы интеграция с платежной системой
    userData.balance += amount;
    userData.transactions.push({
        type: 'deposit',
        amount: amount,
        date: new Date().toISOString()
    });
    
    alert(`Баланс пополнен на ${amount.toFixed(2)} USD!`);
    elements.depositAmount.value = '';
    updateUI();
    showSection('main-menu');
}

// Обработка вывода
function processWithdraw() {
    const amount = parseFloat(elements.withdrawAmount.value);
    const wallet = elements.withdrawWallet.value.trim();
    
    if (isNaN(amount) || amount < 0.1) {
        alert('Минимальная сумма вывода - 0.1 USD');
        return;
    }
    
    if (userData.balance < amount) {
        alert('Недостаточно средств на балансе');
        return;
    }
    
    if (!wallet) {
        alert('Введите адрес кошелька');
        return;
    }
    
    // В реальном приложении здесь была бы интеграция с платежной системой
    userData.balance -= amount;
    userData.transactions.push({
        type: 'withdraw',
        amount: amount,
        wallet: wallet,
        date: new Date().toISOString(),
        status: 'completed'
    });
    
    alert(`Запрос на вывод ${amount.toFixed(2)} USD на кошелек ${wallet} принят!`);
    elements.withdrawAmount.value = '';
    elements.withdrawWallet.value = '';
    updateUI();
    showSection('main-menu');
}

// Начало игры
function startGame(gameType) {
    const bet = prompt(`Введите сумму ставки (минимум 0.1 USD):`);
    const amount = parseFloat(bet);
    
    if (isNaN(amount) || amount < 0.1) {
        alert('Неверная сумма ставки');
        return;
    }
    
    if (userData.balance < amount) {
        alert('Недостаточно средств на балансе');
        return;
    }
    
    currentBet = amount;
    
    if (gameType === 'even_odd') {
        const choice = prompt('Выберите "Чёт" или "Нечёт":').toLowerCase();
        if (choice !== 'чёт' && choice !== 'нечёт') {
            alert('Пожалуйста, выберите "Чёт" или "Нечёт"');
            return;
        }
        currentChoice = choice;
        playGame();
    } 
    // Аналогично для других игр...
    else if (gameType === 'roulette') {
        const choice = prompt('Выберите "🔴 Красное", "⚫ Чёрное" или "🟢 Зелёное (0)":');
        if (choice !== '🔴 Красное' && choice !== '⚫ Чёрное' && choice !== '🟢 Зелёное (0)') {
            alert('Пожалуйста, выберите "🔴 Красное", "⚫ Чёрное" или "🟢 Зелёное (0)"');
            return;
        }
        currentChoice = choice;
        playGame();
    }
}

// Обработка игры в кубик
function processDiceGame() {
    const amount = parseFloat(elements.diceBetAmount.value);
    
    if (isNaN(amount) || amount < 0.1) {
        alert('Неверная сумма ставки');
        return;
    }
    
    if (userData.balance < amount) {
        alert('Недостаточно средств на балансе');
        return;
    }
    
    currentBet = amount;
    playGame();
}

// Игровая логика
function playGame() {
    // Снимаем ставку
    userData.balance -= currentBet;
    userData.gamesPlayed++;
    
    let result, win, winAmount, coefficient;
    
    // Логика для разных игр
    if (currentGame === 'dice') {
        const resultNum = Math.floor(Math.random() * 6) + 1;
        win = parseInt(currentChoice) === resultNum;
        coefficient = win ? GAME_COEFFICIENTS.dice : 0;
        winAmount = win ? currentBet * coefficient : 0;
        result = `Выпало: ${resultNum}`;
    }
    else if (currentGame === 'even_odd') {
        const resultNum = Math.floor(Math.random() * 6) + 1;
        const resultType = resultNum % 2 === 0 ? 'чёт' : 'нечёт';
        win = currentChoice === resultType;
        coefficient = win ? GAME_COEFFICIENTS.even_odd : 0;
        winAmount = win ? currentBet * coefficient : 0;
        result = `Выпало: ${resultNum} (${resultType})`;
    }
    else if (currentGame === 'roulette') {
        const { number, color } = ROULETTE_NUMBERS[Math.floor(Math.random() * ROULETTE_NUMBERS.length)];
        win = currentChoice.includes(color);
        coefficient = win ? GAME_COEFFICIENTS.roulette[currentChoice] : 0;
        winAmount = win ? currentBet * coefficient : 0;
        result = `Выпало: ${number} ${color}`;
    }
    
    // Обновляем баланс и статистику
    if (win) {
        userData.balance += winAmount;
        userData.wins++;
    } else {
        userData.losses++;
    }
    
    // Сохраняем историю игры
    userData.gameHistory.push({
        game: currentGame,
        bet: currentBet,
        choice: currentChoice,
        result: result,
        win: win,
        winAmount: winAmount,
        date: new Date().toISOString()
    });
    
    // Показываем результат
    showGameResult({
        game: currentGame,
        bet: currentBet,
        choice: currentChoice,
        result: result,
        win: win,
        winAmount: winAmount,
        coefficient: coefficient
    });
    
    updateUI();
}

// Показать результат игры
function showGameResult(result) {
    showSection('result-container');
    elements.resultTitle.textContent = result.win ? '🎉 Вы выиграли!' : '❌ Вы проиграли';
    
    let resultHtml = `
        <p>Игра: ${result.game}</p>
        <p>Ставка: ${result.bet.toFixed(2)} USD</p>
        <p>Ваш выбор: ${result.choice}</p>
        <p>Результат: ${result.result}</p>
    `;
    
    if (result.win) {
        resultHtml += `
            <p class="win-result">Выигрыш: ${result.winAmount.toFixed(2)} USD</p>
            <p>Коэффициент: ×${result.coefficient}</p>
        `;
    } else {
        resultHtml += `<p class="lose-result">Вы проиграли ${result.bet.toFixed(2)} USD</p>`;
    }
    
    elements.resultContent.innerHTML = resultHtml;
}

// Вывод реферальных средств
function withdrawReferralEarnings() {
    if (userData.referralBalance < 1) {
        alert('Минимальная сумма вывода - 1 USD');
        return;
    }
    
    if (confirm(`Вы уверены, что хотите вывести ${userData.referralBalance.toFixed(2)} USD реферальных средств на основной баланс?`)) {
        userData.balance += userData.referralBalance;
        userData.referralBalance = 0;
        updateUI();
        alert('Реферальные средства переведены на основной баланс!');
    }
}