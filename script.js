// --- State Management ---
let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
const monthlyBudget = 5000;

// --- Elements ---
const balanceEl = document.getElementById('total-balance');
const incomeEl = document.getElementById('total-income');
const expenseEl = document.getElementById('total-expense');
const listEl = document.getElementById('transaction-list');
const form = document.getElementById('transaction-form');
const modal = document.getElementById('transaction-modal');
const openModalBtn = document.getElementById('open-modal-btn');
const closeModalBtn = document.getElementById('close-modal-btn');
const budgetProgress = document.getElementById('budget-progress');
const budgetPercentEl = document.getElementById('budget-percentage');
const spentAmtEl = document.getElementById('spent-amt');
const budgetAmtEl = document.getElementById('budget-amt');


// --- Icons Mapping ---
const categoryIcons = {
    'Food & Drinks': 'coffee',
    'Shopping': 'shopping-bag',
    'Housing': 'home',
    'Transport': 'car',
    'Health': 'heart-pulse',
    'Entertainment': 'popcorn',
    'Others': 'layers'
};

const categoryColors = {
    'Food & Drinks': 'hsl(35, 92%, 50%)', // Amber
    'Shopping': 'hsl(330, 81%, 60%)',    // Pink
    'Housing': 'hsl(263, 70%, 50%)',     // Purple
    'Transport': 'hsl(199, 89%, 48%)',    // Blue
    'Health': 'hsl(150, 100%, 40%)',     // Emerald
    'Entertainment': 'hsl(280, 70%, 60%)', // Violet
    'Others': 'hsl(215, 15%, 45%)'       // Slate
};

// --- Initialization ---
function init() {
    if (transactions.length === 0) {
        transactions = [
            { id: 1, description: 'Freelance Project', amount: 3500.00, type: 'income', category: 'Others', date: '2026-03-01' },
            { id: 2, description: 'Monthly Rent', amount: -1200.00, type: 'expense', category: 'Housing', date: '2026-03-02' },
            { id: 3, description: 'Grocery Shopping', amount: -245.50, type: 'expense', category: 'Food & Drinks', date: '2026-03-05' },
            { id: 4, description: 'Netflix Subscription', amount: -15.99, type: 'expense', category: 'Entertainment', date: '2026-03-07' },
            { id: 5, description: 'Gym Membership', amount: -50.00, type: 'expense', category: 'Health', date: '2026-03-08' }
        ];
        updateLocalStorage();
    }
    updateUI();
    initChart();
    if (budgetAmtEl) budgetAmtEl.innerText = `$${monthlyBudget.toLocaleString()}`;
}

// --- Logic ---
function addTransaction(e) {
    e.preventDefault();

    const description = document.getElementById('description').value;
    const amountValue = +document.getElementById('amount').value;
    const type = document.getElementById('type').value;
    const category = document.getElementById('category').value;

    const transaction = {
        id: generateID(),
        description,
        amount: type === 'expense' ? -amountValue : amountValue,
        type,
        category,
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    };

    transactions.push(transaction);
    updateLocalStorage();
    updateUI();
    closeModal();
    form.reset();
}

function generateID() {
    return Math.floor(Math.random() * 100000000);
}

function updateUI() {
    // 1. Update List
    renderTransactions();

    // 2. Update Stats
    const amounts = transactions.map(t => t.amount);
    const total = amounts.reduce((acc, item) => (acc += item), 0).toFixed(2);
    const income = amounts
        .filter(item => item > 0)
        .reduce((acc, item) => (acc += item), 0)
        .toFixed(2);
    const expense = (
        amounts.filter(item => item < 0).reduce((acc, item) => (acc += item), 0) * -1
    ).toFixed(2);

    balanceEl.innerText = `$${parseFloat(total).toLocaleString()}`;
    incomeEl.innerText = `$${parseFloat(income).toLocaleString()}`;
    expenseEl.innerText = `$${parseFloat(expense).toLocaleString()}`;

    // 3. Update Budget Progress
    const expenseNum = parseFloat(expense);
    const percentage = Math.min((expenseNum / monthlyBudget) * 100, 100);
    budgetProgress.style.width = `${percentage}%`;
    budgetPercentEl.innerText = `${Math.round(percentage)}%`;
    spentAmtEl.innerText = `$${expenseNum.toLocaleString()}`;

    // Update colors based on budget health
    if (percentage > 90) budgetProgress.style.background = 'var(--accent-rose)';
    else if (percentage > 70) budgetProgress.style.background = 'hsl(35, 92%, 50%)';
    else budgetProgress.style.background = 'linear-gradient(to right, var(--primary), var(--accent-blue))';

    // 4. Re-init Chart
    updateChart();
}

function renderTransactions() {
    listEl.innerHTML = '';

    if (transactions.length === 0) {
        listEl.innerHTML = `
            <div class="empty-state">
                <i data-lucide="receipt"></i>
                <p>No transactions yet. Start by adding one!</p>
            </div>
        `;
        lucide.createIcons();
        return;
    }

    // Sort by date (descending) or just most recent first
    [...transactions].reverse().slice(0, 5).forEach(transaction => {
        const sign = transaction.amount < 0 ? '-' : '+';
        const colorClass = transaction.amount < 0 ? 'text-rose' : 'text-emerald';
        const item = document.createElement('div');
        item.classList.add('transaction-item');

        const categoryIcon = categoryIcons[transaction.category] || 'layers';
        const categoryColor = categoryColors[transaction.category] || 'hsl(215, 15%, 45%)';

        item.innerHTML = `
            <div class="icon-box" style="background: ${categoryColor}20; color: ${categoryColor}">
                <i data-lucide="${categoryIcon}"></i>
            </div>
            <div class="info-box">
                <span class="title">${transaction.description}</span>
                <span class="meta">${transaction.category} • ${transaction.date}</span>
            </div>
            <div class="amount-box ${colorClass}">
                ${sign}$${Math.abs(transaction.amount).toFixed(2)}
            </div>
        `;
        listEl.appendChild(item);
    });

    lucide.createIcons();
}

function updateLocalStorage() {
    localStorage.setItem('transactions', JSON.stringify(transactions));
}

// --- Chart setup ---
let spendingChart;

function initChart() {
    const ctx = document.getElementById('spendingChart').getContext('2d');

    spendingChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: [],
            datasets: [{
                data: [],
                backgroundColor: [],
                borderWidth: 2,
                borderColor: 'rgba(255, 255, 255, 0.05)',
                hoverOffset: 15,
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: 'hsl(215, 20%, 65%)',
                        font: { family: 'Outfit', size: 11, weight: '500' },
                        padding: 20,
                        usePointStyle: true,
                        pointStyle: 'circle'
                    }
                },
                tooltip: {
                    backgroundColor: 'hsl(222, 47%, 11%)',
                    titleFont: { family: 'Outfit', size: 14 },
                    bodyFont: { family: 'Outfit', size: 13 },
                    padding: 12,
                    cornerRadius: 12,
                    displayColors: true
                }
            },
            cutout: '75%'
        }
    });

    updateChart();
}

function updateChart() {
    if (!spendingChart) return;

    const categoryData = {};
    transactions.filter(t => t.amount < 0).forEach(t => {
        categoryData[t.category] = (categoryData[t.category] || 0) + Math.abs(t.amount);
    });

    const labels = Object.keys(categoryData);
    const data = Object.values(categoryData);
    const colors = labels.map(label => categoryColors[label]);

    spendingChart.data.labels = labels;
    spendingChart.data.datasets[0].data = data;
    spendingChart.data.datasets[0].backgroundColor = colors;
    spendingChart.update();
}

// --- Modal Controls ---
function openModal() { modal.classList.add('active'); }
function closeModal() { modal.classList.remove('active'); }

// --- Event Listeners ---
openModalBtn.addEventListener('click', openModal);
closeModalBtn.addEventListener('click', closeModal);
form.addEventListener('submit', addTransaction);

window.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
});

// Run Init
init();
