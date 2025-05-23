// Initialize state
let expenses = JSON.parse(localStorage.getItem('expenses')) || [];
let currentLanguage = localStorage.getItem('language') || 'en';
let currentCurrency = localStorage.getItem('currency') || 'USD';
let monthlyGoal = parseFloat(localStorage.getItem('monthlyGoal')) || 0;
let currentTheme = localStorage.getItem('theme') || 'light';
const exchangeRate = 5.00; // Fixed exchange rate: 1 USD = 5.00 BRL

// Charts
let pieChart = null;
let barChart = null;
let lineChart = null;

// DOM Elements
const expenseForm = document.getElementById('expenseForm');
const descriptionInput = document.getElementById('description');
const amountInput = document.getElementById('amount');
const categoryInput = document.getElementById('category');
const currencySelect = document.getElementById('currency');
const currencySymbol = document.getElementById('currencySymbol');
const exchangeRateElement = document.getElementById('exchangeRate');
const expenseList = document.getElementById('expenseList');
const totalAmountElement = document.getElementById('totalAmount');
const categorySummary = document.getElementById('categorySummary');
const goalAmount = document.getElementById('goalAmount');
const goalDisplay = document.getElementById('goalDisplay');
const spentAmount = document.getElementById('spentAmount');
const goalProgressBar = document.getElementById('goalProgressBar');

// Add to the top with other state variables
let selectedCategories = new Set(Object.keys(translations.en.categories));
let categoryFilterVisible = false;

// Financial tips array with translations
const financialTips = [
    {
        id: "rule_50_30_20",
        category: "budgeting",
        translations: {
            en: "Follow the 50/30/20 rule: Spend 50% on needs, 30% on wants, and save 20% of your income.",
            pt: "Siga a regra 50/30/20: Gaste 50% em necessidades, 30% em desejos e economize 20% da sua renda."
        }
    },
    {
        id: "emergency_fund",
        category: "savings",
        translations: {
            en: "Build an emergency fund that covers 3-6 months of living expenses.",
            pt: "Construa um fundo de emergência que cubra 3-6 meses de despesas."
        }
    },
    {
        id: "high_interest",
        category: "debt",
        translations: {
            en: "Pay off high-interest debt first while maintaining minimum payments on other debts.",
            pt: "Pague primeiro as dívidas com juros altos, mantendo pagamentos mínimos em outras dívidas."
        }
    },
    {
        id: "track_expenses",
        category: "budgeting",
        translations: {
            en: "Track all your expenses for a month to identify areas where you can cut back.",
            pt: "Acompanhe todas as suas despesas por um mês para identificar áreas onde pode economizar."
        }
    },
    {
        id: "auto_savings",
        category: "savings",
        translations: {
            en: "Set up automatic transfers to your savings account on payday.",
            pt: "Configure transferências automáticas para sua conta poupança no dia do pagamento."
        }
    },
    {
        id: "home_meals",
        category: "lifestyle",
        translations: {
            en: "Cook meals at home and bring lunch to work to reduce food expenses.",
            pt: "Cozinhe em casa e leve almoço para o trabalho para reduzir gastos com alimentação."
        }
    },
    {
        id: "review_subs",
        category: "optimization",
        translations: {
            en: "Review your subscriptions regularly and cancel unused services.",
            pt: "Revise suas assinaturas regularmente e cancele serviços não utilizados."
        }
    },
    {
        id: "compare_prices",
        category: "shopping",
        translations: {
            en: "Compare prices and use cashback apps when shopping.",
            pt: "Compare preços e use aplicativos de cashback ao fazer compras."
        }
    },
    {
        id: "retirement",
        category: "investment",
        translations: {
            en: "Invest in your retirement through employer-sponsored plans or IRAs.",
            pt: "Invista em sua aposentadoria através de planos patrocinados pelo empregador ou previdência privada."
        }
    },
    {
        id: "24hour_rule",
        category: "shopping",
        translations: {
            en: "Use the 24-hour rule: Wait before making large, non-essential purchases.",
            pt: "Use a regra das 24 horas: Espere antes de fazer compras grandes não essenciais."
        }
    },
    {
        id: "housing_cost",
        category: "budgeting",
        translations: {
            en: "Keep your housing costs below 30% of your monthly income.",
            pt: "Mantenha seus custos de moradia abaixo de 30% da sua renda mensal."
        }
    },
    {
        id: "free_entertainment",
        category: "lifestyle",
        translations: {
            en: "Look for free or low-cost entertainment options in your community.",
            pt: "Procure opções de entretenimento gratuitas ou de baixo custo em sua comunidade."
        }
    }
];

// Initialize currency
function initializeCurrency() {
    if (currencySelect) {
        currencySelect.value = currentCurrency;
    }
    updateCurrencySymbol();
}

// Update currency symbol
function updateCurrencySymbol() {
    if (currencySymbol) {
        currencySymbol.textContent = currentCurrency === 'USD' ? '$' : 'R$';
    }
}

// Convert amount between currencies
function convertAmount(amount, fromCurrency, toCurrency) {
    if (!amount || fromCurrency === toCurrency) return amount;
    return fromCurrency === 'USD'
        ? amount * exchangeRate  // USD to BRL
        : amount / exchangeRate; // BRL to USD
}

// Format amount with currency symbol
function formatAmount(amount, currency) {
    if (!amount) return currency === 'USD' ? '$0.00' : 'R$0,00';
    
    const formatter = new Intl.NumberFormat(currency === 'USD' ? 'en-US' : 'pt-BR', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
    
    return formatter.format(amount);
}

// Currency change handler
currencySelect.addEventListener('change', (e) => {
    const newCurrency = e.target.value;
    if (newCurrency !== currentCurrency) {
        currentCurrency = newCurrency;
        localStorage.setItem('currency', currentCurrency);
        updateCurrencySymbol();
        updateDisplay();
    }
});

// Initialize language
function initializeLanguage() {
    // Set HTML lang attribute
    document.documentElement.lang = currentLanguage;
    
    // Update language buttons
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.lang === currentLanguage);
    });
    
    // Update all translations
    updateTranslations();
}

function switchLanguage(lang) {
    if (currentLanguage === lang) return;
    
    currentLanguage = lang;
    localStorage.setItem('language', lang);
    document.documentElement.lang = lang;
    
    // Update language buttons
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.lang === lang);
    });
    
    // Update translations
    updateTranslations();
    
    // Refresh dynamic content
    updateDisplay();
}

function updateTranslations() {
    // Update text content
    document.querySelectorAll('[data-translate]').forEach(element => {
        const key = element.dataset.translate;
        const translation = getTranslation(key);
        if (translation) {
            element.textContent = translation;
        }
    });

    // Update placeholders
    document.querySelectorAll('[data-translate-placeholder]').forEach(element => {
        const key = element.dataset.translatePlaceholder;
        const translation = getTranslation(key);
        if (translation) {
            element.placeholder = translation;
        }
    });

    // Update document title
    document.title = getTranslation('title');

    // Update select options
    updateSelectOptions();
}

function getTranslation(key) {
    try {
        let translation = translations[currentLanguage];
        const keys = key.split('.');
        
        for (const k of keys) {
            if (translation && translation[k]) {
                translation = translation[k];
            } else {
                console.warn(`Translation missing for key: ${key} in language: ${currentLanguage}`);
                return getFallbackTranslation(key);
            }
        }
        
        return translation;
    } catch (error) {
        console.error('Error getting translation:', error);
        return getFallbackTranslation(key);
    }
}

function getFallbackTranslation(key) {
    try {
        let translation = translations['en'];
        const keys = key.split('.');
        
        for (const k of keys) {
            if (translation && translation[k]) {
                translation = translation[k];
            } else {
                return key;
            }
        }
        
        return translation;
    } catch (error) {
        console.error('Error getting fallback translation:', error);
        return key;
    }
}

function updateSelectOptions() {
    // Update currency select options
    const currencySelect = document.getElementById('currency');
    if (currencySelect) {
        Array.from(currencySelect.options).forEach(option => {
            const key = option.dataset.translate;
            if (key) {
                option.textContent = getTranslation(key);
            }
        });
    }

    // Update category select options
    const categorySelect = document.getElementById('category');
    if (categorySelect) {
        const categories = translations[currentLanguage].categories;
        categorySelect.innerHTML = Object.entries(categories)
            .map(([key, value]) => `<option value="${key}">${value}</option>`)
            .join('');
    }
}

// Initialize categories in the select element
function initializeCategories() {
    const categorySelect = document.getElementById('category');
    if (categorySelect) {
        categorySelect.innerHTML = ''; // Clear existing options
        Object.keys(translations[currentLanguage].categories).forEach(categoryKey => {
            const option = document.createElement('option');
            option.value = categoryKey;
            option.textContent = getTranslation(`categories.${categoryKey}`);
            categorySelect.appendChild(option);
        });
    }
}

// Format date according to current language
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString(currentLanguage, {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Save expenses to localStorage
function saveExpenses() {
    try {
        localStorage.setItem('expenses', JSON.stringify(expenses));
    } catch (error) {
        console.error('Error saving expenses:', error);
    }
}

// Calculate and update total amount
function updateTotalAmount() {
    try {
        const total = expenses.reduce((sum, expense) => {
            const convertedAmount = convertAmount(expense.amount, expense.currency, currentCurrency);
            return sum + (convertedAmount || 0);
        }, 0);
        
        totalAmountElement.textContent = formatAmount(total, currentCurrency);
        
        // Update goal progress if a goal is set
        if (monthlyGoal > 0) {
            const percentage = (total / monthlyGoal) * 100;
            goalProgressBar.style.width = Math.min(100, percentage) + '%';
            
            if (percentage >= 100) {
                goalProgressBar.className = 'progress danger';
            } else if (percentage >= 80) {
                goalProgressBar.className = 'progress warning';
            } else {
                goalProgressBar.className = 'progress';
            }
        }
    } catch (error) {
        console.error('Error updating total amount:', error);
        totalAmountElement.textContent = formatAmount(0, currentCurrency);
    }
}

// Calculate and update category summaries
function updateCategorySummary() {
    const categorySums = {};
    expenses.forEach(expense => {
        const convertedAmount = convertAmount(expense.amount, expense.currency, currentCurrency);
        if (categorySums[expense.category]) {
            categorySums[expense.category] += convertedAmount;
        } else {
            categorySums[expense.category] = convertedAmount;
        }
    });

    categorySummary.innerHTML = '';
    for (const category in categorySums) {
        const categoryCard = document.createElement('div');
        categoryCard.className = 'category-card';
        const categoryName = translations[currentLanguage].categories[category];
        categoryCard.innerHTML = `
            <h4>${categoryName}</h4>
            <p>${formatAmount(categorySums[category], currentCurrency)}</p>
        `;
        categorySummary.appendChild(categoryCard);
    }
}

// Update charts with proper error handling
function updateCharts() {
    try {
        if (!pieChart) {
            console.warn('Pie chart not initialized. Attempting to reinitialize...');
            initializeCharts();
            return;
        }

        console.log('Updating pie chart with new data...');
        const colors = getChartColors();

        // Calculate category totals
        const categoryTotals = {};
        expenses.forEach(expense => {
            const convertedAmount = convertAmount(expense.amount, expense.currency, currentCurrency);
            categoryTotals[expense.category] = (categoryTotals[expense.category] || 0) + convertedAmount;
        });

        // Sort categories by amount for better visualization
        const sortedCategories = Object.entries(categoryTotals)
            .sort(([, a], [, b]) => b - a)
            .reduce((acc, [key, value]) => {
                acc[key] = value;
                return acc;
            }, {});

        // Update Pie Chart
        pieChart.data.labels = Object.keys(sortedCategories).map(category => 
            translations[currentLanguage].categories[category]
        );
        pieChart.data.datasets[0].data = Object.values(sortedCategories);
        pieChart.data.datasets[0].backgroundColor = colors.categoryColors.slice(0, Object.keys(sortedCategories).length);
        pieChart.data.datasets[0].borderColor = colors.borderColor;

        // Update the chart
        pieChart.update('none'); // Use 'none' for smoother updates
        console.log('Pie chart updated');

    } catch (error) {
        console.error('Error updating pie chart:', error);
        // Try to recover by reinitializing
        try {
            initializeCharts();
        } catch (e) {
            console.error('Failed to recover chart:', e);
        }
    }
}

function calculateTrends(monthlyData, months) {
    const trends = {
        monthlyGrowth: 0,
        averageSpending: 0,
        highestSpending: 0,
        lowestSpending: Infinity,
        highestMonth: '',
        lowestMonth: ''
    };

    if (monthlyData.length > 0) {
        // Calculate monthly growth (comparing last two months)
        if (monthlyData.length >= 2) {
            const lastMonth = monthlyData[monthlyData.length - 1];
            const previousMonth = monthlyData[monthlyData.length - 2];
            trends.monthlyGrowth = previousMonth ? ((lastMonth - previousMonth) / previousMonth) * 100 : 0;
        }

        // Calculate average
        trends.averageSpending = monthlyData.reduce((a, b) => a + b, 0) / monthlyData.length;

        // Find highest and lowest
        monthlyData.forEach((amount, index) => {
            if (amount > trends.highestSpending) {
                trends.highestSpending = amount;
                trends.highestMonth = months[index];
            }
            if (amount < trends.lowestSpending) {
                trends.lowestSpending = amount;
                trends.lowestMonth = months[index];
            }
        });
    }

    return trends;
}

function updateTrendCards(trends) {
    // Update growth with color coding
    const growthElement = document.getElementById('monthlyGrowth');
    const growthValue = trends.monthlyGrowth.toFixed(1);
    const growthColor = growthValue > 0 ? 'var(--danger-color)' : 
                       growthValue < 0 ? 'var(--success-color)' : 
                       'var(--text-primary)';
    growthElement.textContent = `${growthValue}%`;
    growthElement.style.color = growthColor;

    // Update other trend cards
    document.getElementById('averageSpending').textContent = formatAmount(trends.averageSpending, currentCurrency);
    document.getElementById('highestSpending').textContent = formatAmount(trends.highestSpending, currentCurrency);
    document.getElementById('lowestSpending').textContent = formatAmount(trends.lowestSpending, currentCurrency);
}

// Initialize charts
function initializeCharts() {
    try {
        console.log('Initializing pie chart...');
        const colors = getChartColors();
        
        // Get canvas context
        const pieCtx = document.getElementById('pieChart');

        if (!pieCtx) {
            console.error('Pie chart canvas not found');
            return;
        }

        // Clear existing chart
        if (pieChart) {
            pieChart.destroy();
            pieChart = null;
        }

        // Calculate initial data
        const categoryTotals = {};
        expenses.forEach(expense => {
            const convertedAmount = convertAmount(expense.amount, expense.currency, currentCurrency);
            categoryTotals[expense.category] = (categoryTotals[expense.category] || 0) + convertedAmount;
        });

        const sortedCategories = Object.entries(categoryTotals)
            .sort(([, a], [, b]) => b - a)
            .reduce((acc, [key, value]) => {
                acc[key] = value;
                return acc;
            }, {});

        // Chart configuration
        const pieConfig = {
            type: 'pie',
            data: {
                labels: Object.keys(sortedCategories).map(category => 
                    translations[currentLanguage].categories[category]
                ),
                datasets: [{
                    data: Object.values(sortedCategories),
                    backgroundColor: colors.categoryColors.slice(0, Object.keys(sortedCategories).length),
                    borderColor: colors.borderColor,
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                layout: {
                    padding: {
                        top: 20,
                        bottom: 20,
                        left: 20,
                        right: 20
                    }
                },
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            color: colors.legendTextColor,
                            padding: 15,
                            usePointStyle: true,
                            font: {
                                size: 13,
                                weight: '600'
                            }
                        }
                    },
                    tooltip: {
                        backgroundColor: colors.tooltipBackground,
                        titleColor: colors.textColor,
                        bodyColor: colors.textColor,
                        padding: 12,
                        cornerRadius: 8,
                        callbacks: {
                            label: function(context) {
                                const value = context.raw;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                                return ` ${formatAmount(value, currentCurrency)} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        };

        // Initialize new chart
        console.log('Creating pie chart...');
        pieChart = new Chart(pieCtx, pieConfig);
        console.log('Pie chart created');
        
    } catch (error) {
        console.error('Error initializing pie chart:', error);
    }
}

// Set monthly goal
function setMonthlyGoal() {
    const newGoal = parseFloat(goalAmount.value);
    if (newGoal >= 0) {
        monthlyGoal = newGoal;
        localStorage.setItem('monthlyGoal', monthlyGoal);
        updateGoalProgress();
        goalAmount.value = '';
    }
}

// Update goal progress
function updateGoalProgress() {
    const total = expenses.reduce((sum, expense) => {
        const convertedAmount = convertAmount(expense.amount, expense.currency, currentCurrency);
        return sum + convertedAmount;
    }, 0);

    goalDisplay.textContent = formatAmount(monthlyGoal, currentCurrency);
    spentAmount.textContent = formatAmount(total, currentCurrency);

    if (monthlyGoal > 0) {
        const percentage = (total / monthlyGoal) * 100;
        goalProgressBar.style.width = Math.min(100, percentage) + '%';
        
        if (percentage >= 100) {
            goalProgressBar.className = 'progress danger';
        } else if (percentage >= 80) {
            goalProgressBar.className = 'progress warning';
        } else {
            goalProgressBar.className = 'progress';
        }
    } else {
        goalProgressBar.style.width = '0%';
    }
}

// Clear all expenses
function clearAllExpenses() {
    if (confirm(translations[currentLanguage].messages.confirmClear)) {
        expenses = [];
        localStorage.setItem('expenses', JSON.stringify(expenses));
        monthlyGoal = 0;
        localStorage.setItem('monthlyGoal', '0');
        updateDisplay();
    }
}

// Update all displays
function updateDisplay() {
    displayExpenses();
    updateTotalAmount();
    updateCategorySummary();
    updateCharts();
    updateGoalProgress();
    updateFinancialTip();
    updateSavingsRecommendations();
}

// Add expense
function addExpense(description, amount, category) {
    if (!description || !amount || !category) {
        console.error('Invalid expense data');
        return;
    }

    const expense = {
        id: Date.now(),
        description: description.trim(),
        amount: parseFloat(amount),
        category,
        currency: currentCurrency,
        date: new Date().toISOString().slice(0, 10)
    };

    expenses.push(expense);
    saveExpenses();
    updateDisplay();
    
    // Clear form
    descriptionInput.value = '';
    amountInput.value = '';
    categoryInput.selectedIndex = 0;
}

// Delete expense
function deleteExpense(id) {
    if (!id) return;
    
    if (confirm(translations[currentLanguage].messages.confirmClear)) {
        expenses = expenses.filter(expense => expense.id !== id);
        saveExpenses();
        updateDisplay();
    }
}

// Display expenses
function displayExpenses() {
    try {
        // Filter expenses by selected categories
        const filteredExpenses = expenses.filter(expense => 
            selectedCategories.has(expense.category)
        );

        // Update list view
        if (expenseList) {
            expenseList.innerHTML = '';
            if (filteredExpenses.length === 0) {
                expenseList.innerHTML = `
                    <div class="no-expenses">
                        <i class="fas fa-inbox"></i>
                        <p>${translations[currentLanguage].messages.noExpenses}</p>
                    </div>
                `;
            } else {
                filteredExpenses
                    .sort((a, b) => new Date(b.date) - new Date(a.date))
                    .forEach(expense => {
                        const expenseElement = document.createElement('div');
                        expenseElement.className = 'expense-item';
                        const categoryName = translations[currentLanguage].categories[expense.category];
                        const convertedAmount = convertAmount(expense.amount, expense.currency, currentCurrency);
                        
                        expenseElement.innerHTML = `
                            <div class="expense-info">
                                <strong>${expense.description}</strong>
                                <div class="expense-category">
                                    ${categoryName} - ${formatDate(expense.date)}
                                </div>
                            </div>
                            <span class="expense-amount">${formatAmount(convertedAmount, currentCurrency)}</span>
                            <button class="delete-btn" onclick="deleteExpense(${expense.id})" title="${translations[currentLanguage].buttons.delete}">
                                <i class="fas fa-trash-alt"></i>
                            </button>
                        `;
                        expenseList.appendChild(expenseElement);
                    });
            }
        }

        // Update table view
        const tableBody = document.getElementById('expenseTableBody');
        if (tableBody) {
            tableBody.innerHTML = '';
            if (filteredExpenses.length === 0) {
                const emptyRow = document.createElement('tr');
                emptyRow.innerHTML = `
                    <td colspan="5" class="no-expenses">
                        <i class="fas fa-inbox"></i>
                        <p>${translations[currentLanguage].messages.noExpenses}</p>
                    </td>
                `;
                tableBody.appendChild(emptyRow);
            } else {
                filteredExpenses
                    .sort((a, b) => new Date(b.date) - new Date(a.date))
                    .forEach(expense => {
                        const categoryName = translations[currentLanguage].categories[expense.category];
                        const convertedAmount = convertAmount(expense.amount, expense.currency, currentCurrency);
                        
                        const row = document.createElement('tr');
                        row.innerHTML = `
                            <td>${expense.description}</td>
                            <td>${categoryName}</td>
                            <td>${formatAmount(convertedAmount, currentCurrency)}</td>
                            <td>${formatDate(expense.date)}</td>
                            <td>
                                <div class="table-actions">
                                    <button class="delete-btn" onclick="deleteExpense(${expense.id})" title="${translations[currentLanguage].buttons.delete}">
                                        <i class="fas fa-trash-alt"></i>
                                    </button>
                                </div>
                            </td>
                        `;
                        tableBody.appendChild(row);
                    });
            }
        }
    } catch (error) {
        console.error('Error displaying expenses:', error);
    }
}

// View toggle functionality
function toggleView(viewType) {
    const listView = document.getElementById('expenseList');
    const tableView = document.getElementById('expenseTable');
    const listBtn = document.querySelector('[data-view="list"]');
    const tableBtn = document.querySelector('[data-view="table"]');

    if (!listView || !tableView || !listBtn || !tableBtn) return;

    if (viewType === 'table') {
        listView.classList.remove('active');
        tableView.classList.add('active');
        listBtn.classList.remove('active');
        tableBtn.classList.add('active');
    } else {
        listView.classList.add('active');
        tableView.classList.remove('active');
        listBtn.classList.add('active');
        tableBtn.classList.remove('active');
    }

    // Save view preference
    try {
        localStorage.setItem('preferredView', viewType);
    } catch (error) {
        console.error('Error saving view preference:', error);
    }
}

// Form submit handler
expenseForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const description = descriptionInput.value.trim();
    const amount = amountInput.value;
    const category = categoryInput.value;

    if (description && amount && category) {
        addExpense(description, amount, category);
        expenseForm.reset();
        updateCurrencySymbol();
    }
});

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    try {
        // Check if Chart.js is loaded
        if (typeof Chart === 'undefined') {
            console.error('Chart.js is not loaded. Please check your internet connection.');
            return;
        }

        // Set default chart font
        Chart.defaults.font.family = "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif";
        
        // Initialize all components
        initializeTheme();
        initializeLanguage();
        initializeCurrency();
        initializeCategories();
        initializeCategoryFilters();
        initializeCharts();
        updateDisplay();
        
        // Set up event listeners
        setupEventListeners();
    } catch (error) {
        console.error('Error initializing application:', error);
    }
});

// Set up event listeners
function setupEventListeners() {
    // Form submit handler
    if (expenseForm) {
        expenseForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const description = descriptionInput.value.trim();
            const amount = amountInput.value;
            const category = categoryInput.value;

            if (description && amount && category) {
                addExpense(description, amount, category);
            }
        });
    }

    // Currency change handler
    if (currencySelect) {
        currencySelect.addEventListener('change', (e) => {
            const newCurrency = e.target.value;
            if (newCurrency !== currentCurrency) {
                currentCurrency = newCurrency;
                localStorage.setItem('currency', currentCurrency);
                updateCurrencySymbol();
                updateDisplay();
            }
        });
    }

    // Category filter dropdown close on outside click
    document.addEventListener('click', (e) => {
        const dropdown = document.getElementById('categoryFilterDropdown');
        const filterToggle = document.querySelector('.filter-toggle');
        
        if (categoryFilterVisible && 
            dropdown && 
            filterToggle && 
            !dropdown.contains(e.target) && 
            !filterToggle.contains(e.target)) {
            categoryFilterVisible = false;
            dropdown.classList.remove('active');
        }
    });

    // View toggle buttons
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const viewType = btn.dataset.view;
            toggleView(viewType);
        });
    });

    // Chart type toggle
    document.querySelectorAll('.chart-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const type = tab.dataset.chart;
            switchChartType(type);
        });
    });
}

// Switch between chart types
function switchChartType(type) {
    const tabs = document.querySelectorAll('.chart-tab');
    const views = document.querySelectorAll('.chart-view');
    
    tabs.forEach(tab => {
        tab.classList.toggle('active', tab.dataset.chart === type);
    });
    
    views.forEach(view => {
        view.classList.toggle('active', view.id === `${type}ChartView`);
    });

    // Save chart preference
    try {
        localStorage.setItem('preferredChart', type);
    } catch (error) {
        console.error('Error saving chart preference:', error);
    }
}

// Initialize theme
function initializeTheme() {
    document.body.setAttribute('data-theme', currentTheme);
    updateChartColors();
}

// Toggle theme
function toggleTheme() {
    currentTheme = currentTheme === 'light' ? 'dark' : 'light';
    document.body.setAttribute('data-theme', currentTheme);
    localStorage.setItem('theme', currentTheme);
    updateChartColors();
}

// Update chart colors based on theme
function updateChartColors() {
    if (pieChart) {
        const colors = getChartColors();
        pieChart.data.datasets[0].backgroundColor = colors.categoryColors;
        pieChart.data.datasets[0].borderColor = colors.borderColor;
        pieChart.options.plugins.legend.labels.color = colors.legendTextColor;
        pieChart.options.plugins.tooltip.backgroundColor = colors.tooltipBackground;
        pieChart.options.plugins.tooltip.titleColor = colors.textColor;
        pieChart.options.plugins.tooltip.bodyColor = colors.textColor;
        pieChart.update();
    }
}

// Update chart colors based on theme
function getChartColors() {
    const isDark = document.body.getAttribute('data-theme') === 'dark';
    const baseColors = {
        food: '#2ecc71',        // Green
        dining: '#e67e22',      // Orange
        transportation: '#4a9eff', // Bright Blue
        utilities: '#9b59b6',   // Purple
        rent: '#e74c3c',        // Red
        entertainment: '#f1c40f', // Yellow
        healthcare: '#20c997',   // Teal
        insurance: '#60b0ff',   // Light Blue
        shopping: '#16a085',    // Dark Turquoise
        education: '#3498db',   // Blue
        fitness: '#27ae60',     // Dark Green
        travel: '#8e44ad',      // Purple
        pets: '#d35400',        // Dark Orange
        gifts: '#e84393',       // Pink
        savings: '#4a9eff',     // Bright Blue
        subscriptions: '#a8b2bd', // Light Gray
        maintenance: '#74b9ff', // Light Blue
        personal: '#ff7675',    // Light Red
        childcare: '#00cec9',   // Light Teal
        other: '#b2bec3'        // Gray
    };

    // Adjust opacity and brightness for dark mode
    const opacity = isDark ? 'ff' : '99';
    const colors = Object.values(baseColors).map(color => `${color}${opacity}`);

    return {
        categoryColors: colors,
        borderColor: isDark ? '#e9ecef' : '#2c3e50',
        textColor: isDark ? '#ffffff' : '#1a1a1a',
        legendTextColor: isDark ? '#ffffff' : '#2c3e50',
        gridColor: isDark ? '#3d466630' : '#00000015',
        tooltipBackground: isDark ? '#2d3555ee' : '#ffffffee',
        primary: isDark ? '#4a9eff' : '#1b4d89',
        primaryLight: isDark ? '#60b0ff' : '#2d6da3'
    };
}

// Add some CSS to style months with expenses
const style = document.createElement('style');
style.textContent = `
    .has-expenses {
        font-weight: 500;
        color: var(--primary-color);
    }
    
    [data-theme="dark"] .has-expenses {
        color: var(--primary-light);
    }
`;
document.head.appendChild(style);

// Add new functions for category filtering
function toggleCategoryFilter() {
    const dropdown = document.getElementById('categoryFilterDropdown');
    if (!dropdown) return;
    
    categoryFilterVisible = !categoryFilterVisible;
    dropdown.classList.toggle('active', categoryFilterVisible);
    
    // Initialize checkboxes if not already done
    if (categoryFilterVisible && !dropdown.querySelector('.category-checkbox')) {
        initializeCategoryCheckboxes();
    }
}

function initializeCategoryCheckboxes() {
    const container = document.getElementById('categoryCheckboxes');
    if (!container) return;
    
    container.innerHTML = '';
    
    Object.entries(translations[currentLanguage].categories).forEach(([key, label]) => {
        const div = document.createElement('div');
        div.className = 'category-checkbox';
        div.innerHTML = `
            <input type="checkbox" id="cat-${key}" 
                   ${selectedCategories.has(key) ? 'checked' : ''}
                   onchange="updateSelectedCategories('${key}', this.checked)">
            <label for="cat-${key}">${label}</label>
        `;
        container.appendChild(div);
    });
}

function updateSelectedCategories(category, isSelected) {
    if (!category) return;
    
    if (isSelected) {
        selectedCategories.add(category);
    } else {
        selectedCategories.delete(category);
    }
    
    // Save selected categories to localStorage
    try {
        localStorage.setItem('selectedCategories', JSON.stringify(Array.from(selectedCategories)));
    } catch (error) {
        console.error('Error saving selected categories:', error);
    }
    
    updateDisplay();
}

function toggleAllCategories(selectAll) {
    const categories = Object.keys(translations[currentLanguage].categories);
    selectedCategories = new Set(selectAll ? categories : []);
    
    // Update checkboxes
    document.querySelectorAll('.category-checkbox input[type="checkbox"]').forEach(checkbox => {
        checkbox.checked = selectAll;
    });
    
    // Save selected categories
    try {
        localStorage.setItem('selectedCategories', JSON.stringify(Array.from(selectedCategories)));
    } catch (error) {
        console.error('Error saving selected categories:', error);
    }
    
    updateDisplay();
}

// Initialize category filters
function initializeCategoryFilters() {
    try {
        // Load saved selected categories
        const savedCategories = localStorage.getItem('selectedCategories');
        if (savedCategories) {
            selectedCategories = new Set(JSON.parse(savedCategories));
        } else {
            // If no saved categories, select all by default
            selectedCategories = new Set(Object.keys(translations[currentLanguage].categories));
        }
        
        // Initialize checkboxes
        initializeCategoryCheckboxes();
    } catch (error) {
        console.error('Error initializing category filters:', error);
        // Fallback to all categories selected
        selectedCategories = new Set(Object.keys(translations[currentLanguage].categories));
    }
}

// Function to update financial tip
function updateFinancialTip() {
    const tipElement = document.getElementById('financialTip');
    if (!tipElement) return;

    const tips = Object.keys(translations[currentLanguage].tips)
        .filter(key => !['title', 'newTip'].includes(key))
        .map(key => translations[currentLanguage].tips[key]);

    const randomTip = tips[Math.floor(Math.random() * tips.length)];
    
    // Add fade-out effect
    tipElement.style.opacity = '0';
    
    setTimeout(() => {
        tipElement.innerHTML = `<p>${randomTip}</p>`;
        // Add fade-in effect
        tipElement.style.opacity = '1';
    }, 300);
}

// Function to generate savings recommendations based on spending patterns
function updateSavingsRecommendations() {
    const recommendationsContainer = document.getElementById('savingsRecommendations');
    const recommendations = generateRecommendations();
    
    recommendationsContainer.innerHTML = recommendations.map(rec => `
        <div class="recommendation-item">
            <div class="recommendation-icon">
                <i class="${rec.icon}"></i>
            </div>
            <div class="recommendation-content">
                <h4>${translations[currentLanguage].recommendations[rec.titleKey]}</h4>
                <p>${translations[currentLanguage].recommendations[rec.descKey]}</p>
            </div>
        </div>
    `).join('');
}

// Function to analyze spending and generate recommendations
function generateRecommendations() {
    const recommendations = [];
    const totalExpenses = expenses.reduce((sum, expense) => sum + convertAmount(expense.amount, expense.currency, currentCurrency), 0);
    
    // Calculate category percentages
    const categoryTotals = {};
    expenses.forEach(expense => {
        const amount = convertAmount(expense.amount, expense.currency, currentCurrency);
        categoryTotals[expense.category] = (categoryTotals[expense.category] || 0) + amount;
    });

    // Check for high food expenses (>15% of total)
    const foodExpenses = (categoryTotals.food || 0) + (categoryTotals.dining || 0);
    if (foodExpenses / totalExpenses > 0.15) {
        recommendations.push({
            icon: 'fas fa-utensils',
            titleKey: 'foodTitle',
            descKey: 'foodDesc'
        });
    }

    // Check for high entertainment expenses (>10% of total)
    if ((categoryTotals.entertainment || 0) / totalExpenses > 0.1) {
        recommendations.push({
            icon: 'fas fa-film',
            titleKey: 'entertainmentTitle',
            descKey: 'entertainmentDesc'
        });
    }

    // Check for low savings (<20% of total)
    if ((categoryTotals.savings || 0) / totalExpenses < 0.2) {
        recommendations.push({
            icon: 'fas fa-piggy-bank',
            titleKey: 'savingsTitle',
            descKey: 'savingsDesc'
        });
    }

    // Check for high subscription costs
    if ((categoryTotals.subscriptions || 0) / totalExpenses > 0.08) {
        recommendations.push({
            icon: 'fas fa-repeat',
            titleKey: 'subscriptionsTitle',
            descKey: 'subscriptionsDesc'
        });
    }

    return recommendations.slice(0, 3); // Return top 3 recommendations
}

// Update translations object to include new sections
// Remove duplicate translations object and newTranslations object since they are in translations.js 