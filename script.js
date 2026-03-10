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
    'Food & Drinks': '#f59e0b', // Amber
    'Shopping': '#ec4899', // Pink
    'Housing': '#6366f1', // Indigo
    'Transport': '#06b6d4', // Cyan
    'Health': '#10b981', // Emerald
    'Entertainment': '#8b5cf6', // Violet
    'Others': '#94a3b8'  // Slate
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
}

// --- Logic ---
function addTransaction(e) {
    e.preventDefault();

    const description = document.getElementById('description').value;
    const amount = +document.getElementById('amount').value;
    const type = document.getElementById('type').value;
    const category = document.getElementById('category').value;

    const transaction = {
        id: generateID(),
        description,
        amount: type === 'expense' ? -amount : amount,
        type,
        category,
        date: new Date().toLocaleDateString()
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

    balanceEl.innerText = `$${total}`;
    incomeEl.innerText = `$${income}`;
    expenseEl.innerText = `$${expense}`;

    // 3. Update Budget Progress
    const expenseNum = parseFloat(expense);
    const percentage = Math.min((expenseNum / monthlyBudget) * 100, 100);
    budgetProgress.style.width = `${percentage}%`;
    budgetPercentEl.innerText = `${Math.round(percentage)}%`;
    spentAmtEl.innerText = `$${expenseNum.toLocaleString()}`;

    // Update colors based on budget health
    if (percentage > 90) budgetProgress.style.background = 'var(--rose)';
    else if (percentage > 70) budgetProgress.style.background = '#f59e0b';
    else budgetProgress.style.background = 'linear-gradient(to right, var(--primary), var(--indigo))';

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
        const categoryColor = categoryColors[transaction.category] || '#94a3b8';

        item.innerHTML = `
            <div class="item-icon" style="background: ${categoryColor}15; color: ${categoryColor}">
                <i data-lucide="${categoryIcon}"></i>
            </div>
            <div class="item-info">
                <span class="item-title">${transaction.description}</span>
                <span class="item-category">${transaction.category} • ${transaction.date}</span>
            </div>
            <div class="item-amount ${colorClass}">
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

    // Default config
    spendingChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: [],
            datasets: [{
                data: [],
                backgroundColor: [],
                borderWidth: 0,
                hoverOffset: 20
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        color: '#94a3b8',
                        font: { family: 'Outfit', size: 12 },
                        padding: 20,
                        usePointStyle: true
                    }
                }
            },
            cutout: '70%'
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
