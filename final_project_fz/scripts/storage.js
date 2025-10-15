// ===== STORAGE KEYS =====
const STORAGE_KEYS = {
    PORTFOLIO: 'finance_portfolio_holdings',
    TRANSACTIONS: 'finance_transactions',
    EXPENSES: 'finance_expenses',
    GOALS: 'finance_savings_goals',
    SETTINGS: 'finance_user_settings',
    CACHE: 'finance_api_cache'
};

// ===== UTILITY FUNCTIONS =====

/**
 * Parse JSON safely with error handling
 * @param {string} data - JSON string to parse
 * @param {*} defaultValue - Default value if parsing fails
 * @returns {*} Parsed data or default value
 */
function safeParse(data, defaultValue = null) {
    try {
        return data ? JSON.parse(data) : defaultValue;
    } catch (error) {
        console.error('Error parsing JSON:', error);
        return defaultValue;
    }
}

/**
 * Stringify data safely with error handling
 * @param {*} data - Data to stringify
 * @returns {string|null} Stringified data or null
 */
function safeStringify(data) {
    try {
        return JSON.stringify(data);
    } catch (error) {
        console.error('Error stringifying data:', error);
        return null;
    }
}

/**
 * Generate unique ID based on timestamp and random number
 * @returns {string} Unique identifier
 */
function generateId() {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// ===== PORTFOLIO HOLDINGS =====

const portfolioStorage = {
    /**
     * Load all portfolio holdings
     * @returns {Array} Array of holdings
     */
    load() {
        const data = localStorage.getItem(STORAGE_KEYS.PORTFOLIO);
        return safeParse(data, []);
    },

    /**
     * Save portfolio holdings
     * @param {Array} holdings - Array of holding objects
     * @returns {boolean} Success status
     */
    save(holdings) {
        const data = safeStringify(holdings);
        if (data) {
            localStorage.setItem(STORAGE_KEYS.PORTFOLIO, data);
            return true;
        }
        return false;
    },

    /**
     * Add a new holding to portfolio
     * @param {Object} holding - Holding object {symbol, quantity, avgCost, purchaseDate}
     * @returns {Object} Added holding with id
     */
    add(holding) {
        const holdings = this.load();
        const newHolding = {
            id: generateId(),
            symbol: holding.symbol.toUpperCase(),
            quantity: parseFloat(holding.quantity),
            avgCost: parseFloat(holding.avgCost),
            purchaseDate: holding.purchaseDate || new Date().toISOString(),
            createdAt: new Date().toISOString()
        };
        holdings.push(newHolding);
        this.save(holdings);
        return newHolding;
    },

    /**
     * Update an existing holding
     * @param {string} id - Holding ID
     * @param {Object} updates - Fields to update
     * @returns {boolean} Success status
     */
    update(id, updates) {
        const holdings = this.load();
        const index = holdings.findIndex(h => h.id === id);
        if (index !== -1) {
            holdings[index] = { ...holdings[index], ...updates, updatedAt: new Date().toISOString() };
            return this.save(holdings);
        }
        return false;
    },

    /**
     * Delete a holding by ID
     * @param {string} id - Holding ID
     * @returns {boolean} Success status
     */
    delete(id) {
        const holdings = this.load();
        const filtered = holdings.filter(h => h.id !== id);
        return this.save(filtered);
    },

    /**
     * Get holding by symbol
     * @param {string} symbol - Stock symbol
     * @returns {Object|null} Holding object or null
     */
    getBySymbol(symbol) {
        const holdings = this.load();
        return holdings.find(h => h.symbol === symbol.toUpperCase()) || null;
    },

    /**
     * Clear all portfolio holdings
     * @returns {boolean} Success status
     */
    clear() {
        localStorage.removeItem(STORAGE_KEYS.PORTFOLIO);
        return true;
    }
};

// ===== TRANSACTIONS =====

const transactionStorage = {
    /**
     * Load all transactions
     * @returns {Array} Array of transactions
     */
    load() {
        const data = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
        return safeParse(data, []);
    },

    /**
     * Save transactions
     * @param {Array} transactions - Array of transaction objects
     * @returns {boolean} Success status
     */
    save(transactions) {
        const data = safeStringify(transactions);
        if (data) {
            localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, data);
            return true;
        }
        return false;
    },

    /**
     * Add a new transaction
     * @param {Object} transaction - Transaction object {date, type, symbol, quantity, price, notes}
     * @returns {Object} Added transaction with id
     */
    add(transaction) {
        const transactions = this.load();
        const newTransaction = {
            id: generateId(),
            date: transaction.date || new Date().toISOString(),
            type: transaction.type, // 'buy' or 'sell'
            symbol: transaction.symbol.toUpperCase(),
            quantity: parseFloat(transaction.quantity),
            price: parseFloat(transaction.price),
            notes: transaction.notes || '',
            createdAt: new Date().toISOString()
        };
        transactions.push(newTransaction);
        this.save(transactions);
        return newTransaction;
    },

    /**
     * Get transactions by symbol
     * @param {string} symbol - Stock symbol
     * @returns {Array} Filtered transactions
     */
    getBySymbol(symbol) {
        const transactions = this.load();
        return transactions.filter(t => t.symbol === symbol.toUpperCase());
    },

    /**
     * Get transactions by type
     * @param {string} type - Transaction type ('buy' or 'sell')
     * @returns {Array} Filtered transactions
     */
    getByType(type) {
        const transactions = this.load();
        return transactions.filter(t => t.type === type);
    },

    /**
     * Get transactions within date range
     * @param {string} startDate - Start date (ISO string)
     * @param {string} endDate - End date (ISO string)
     * @returns {Array} Filtered transactions
     */
    getByDateRange(startDate, endDate) {
        const transactions = this.load();
        return transactions.filter(t => {
            const date = new Date(t.date);
            return date >= new Date(startDate) && date <= new Date(endDate);
        });
    },

    /**
     * Delete a transaction by ID
     * @param {string} id - Transaction ID
     * @returns {boolean} Success status
     */
    delete(id) {
        const transactions = this.load();
        const filtered = transactions.filter(t => t.id !== id);
        return this.save(filtered);
    },

    /**
     * Clear all transactions
     * @returns {boolean} Success status
     */
    clear() {
        localStorage.removeItem(STORAGE_KEYS.TRANSACTIONS);
        return true;
    }
};

// ===== EXPENSES =====

const expenseStorage = {
    /**
     * Load all expenses
     * @returns {Array} Array of expenses
     */
    load() {
        const data = localStorage.getItem(STORAGE_KEYS.EXPENSES);
        return safeParse(data, []);
    },

    /**
     * Save expenses
     * @param {Array} expenses - Array of expense objects
     * @returns {boolean} Success status
     */
    save(expenses) {
        const data = safeStringify(expenses);
        if (data) {
            localStorage.setItem(STORAGE_KEYS.EXPENSES, data);
            return true;
        }
        return false;
    },

    /**
     * Add a new expense
     * @param {Object} expense - Expense object {date, category, amount, description, merchant}
     * @returns {Object} Added expense with id
     */
    add(expense) {
        const expenses = this.load();
        const newExpense = {
            id: generateId(),
            date: expense.date || new Date().toISOString(),
            category: expense.category,
            amount: parseFloat(expense.amount),
            description: expense.description || '',
            merchant: expense.merchant || '',
            createdAt: new Date().toISOString()
        };
        expenses.push(newExpense);
        this.save(expenses);
        return newExpense;
    },

    /**
     * Get expenses by category
     * @param {string} category - Expense category
     * @returns {Array} Filtered expenses
     */
    getByCategory(category) {
        const expenses = this.load();
        return expenses.filter(e => e.category === category);
    },

    /**
     * Get expenses within date range
     * @param {string} startDate - Start date (ISO string)
     * @param {string} endDate - End date (ISO string)
     * @returns {Array} Filtered expenses
     */
    getByDateRange(startDate, endDate) {
        const expenses = this.load();
        return expenses.filter(e => {
            const date = new Date(e.date);
            return date >= new Date(startDate) && date <= new Date(endDate);
        });
    },

    /**
     * Calculate total expenses by category
     * @returns {Object} Object with categories as keys and totals as values
     */
    getTotalsByCategory() {
        const expenses = this.load();
        return expenses.reduce((totals, expense) => {
            totals[expense.category] = (totals[expense.category] || 0) + expense.amount;
            return totals;
        }, {});
    },

    /**
     * Update an expense
     * @param {string} id - Expense ID
     * @param {Object} updates - Fields to update
     * @returns {boolean} Success status
     */
    update(id, updates) {
        const expenses = this.load();
        const index = expenses.findIndex(e => e.id === id);
        if (index !== -1) {
            expenses[index] = { ...expenses[index], ...updates, updatedAt: new Date().toISOString() };
            return this.save(expenses);
        }
        return false;
    },

    /**
     * Delete an expense by ID
     * @param {string} id - Expense ID
     * @returns {boolean} Success status
     */
    delete(id) {
        const expenses = this.load();
        const filtered = expenses.filter(e => e.id !== id);
        return this.save(filtered);
    },

    /**
     * Clear all expenses
     * @returns {boolean} Success status
     */
    clear() {
        localStorage.removeItem(STORAGE_KEYS.EXPENSES);
        return true;
    }
};

// ===== GOALS =====

const goalStorage = {
    /**
     * Load all goals
     * @returns {Array} Array of goals
     */
    load() {
        const data = localStorage.getItem(STORAGE_KEYS.GOALS);
        return safeParse(data, []);
    },

    /**
     * Save goals
     * @param {Array} goals - Array of goal objects
     * @returns {boolean} Success status
     */
    save(goals) {
        const data = safeStringify(goals);
        if (data) {
            localStorage.setItem(STORAGE_KEYS.GOALS, data);
            return true;
        }
        return false;
    },

    /**
     * Add a new goal
     * @param {Object} goal - Goal object {title, targetAmount, currentAmount, deadline}
     * @returns {Object} Added goal with id
     */
    add(goal) {
        const goals = this.load();
        const newGoal = {
            id: generateId(),
            title: goal.title,
            targetAmount: parseFloat(goal.targetAmount),
            currentAmount: parseFloat(goal.currentAmount || 0),
            deadline: goal.deadline || null,
            createdAt: new Date().toISOString()
        };
        goals.push(newGoal);
        this.save(goals);
        return newGoal;
    },

    /**
     * Update a goal
     * @param {string} id - Goal ID
     * @param {Object} updates - Fields to update
     * @returns {boolean} Success status
     */
    update(id, updates) {
        const goals = this.load();
        const index = goals.findIndex(g => g.id === id);
        if (index !== -1) {
            goals[index] = { ...goals[index], ...updates, updatedAt: new Date().toISOString() };
            return this.save(goals);
        }
        return false;
    },

    /**
     * Update goal progress
     * @param {string} id - Goal ID
     * @param {number} amount - New current amount
     * @returns {boolean} Success status
     */
    updateProgress(id, amount) {
        return this.update(id, { currentAmount: parseFloat(amount) });
    },

    /**
     * Get goal progress percentage
     * @param {string} id - Goal ID
     * @returns {number|null} Progress percentage or null
     */
    getProgress(id) {
        const goals = this.load();
        const goal = goals.find(g => g.id === id);
        if (goal) {
            return Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
        }
        return null;
    },

    /**
     * Delete a goal by ID
     * @param {string} id - Goal ID
     * @returns {boolean} Success status
     */
    delete(id) {
        const goals = this.load();
        const filtered = goals.filter(g => g.id !== id);
        return this.save(filtered);
    },

    /**
     * Clear all goals
     * @returns {boolean} Success status
     */
    clear() {
        localStorage.removeItem(STORAGE_KEYS.GOALS);
        return true;
    }
};

// ===== SETTINGS =====

const settingsStorage = {
    /**
     * Default settings
     */
    defaults: {
        currency: 'USD',
        theme: 'light',
        refreshInterval: 60000, // 1 minute in milliseconds
        dateFormat: 'MM/DD/YYYY',
        language: 'en'
    },

    /**
     * Load settings
     * @returns {Object} Settings object
     */
    load() {
        const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
        const settings = safeParse(data, {});
        return { ...this.defaults, ...settings };
    },

    /**
     * Save settings
     * @param {Object} settings - Settings object
     * @returns {boolean} Success status
     */
    save(settings) {
        const data = safeStringify(settings);
        if (data) {
            localStorage.setItem(STORAGE_KEYS.SETTINGS, data);
            return true;
        }
        return false;
    },

    /**
     * Update specific setting
     * @param {string} key - Setting key
     * @param {*} value - Setting value
     * @returns {boolean} Success status
     */
    update(key, value) {
        const settings = this.load();
        settings[key] = value;
        return this.save(settings);
    },

    /**
     * Get specific setting
     * @param {string} key - Setting key
     * @returns {*} Setting value or undefined
     */
    get(key) {
        const settings = this.load();
        return settings[key];
    },

    /**
     * Reset to default settings
     * @returns {boolean} Success status
     */
    reset() {
        return this.save(this.defaults);
    },

    /**
     * Clear all settings
     * @returns {boolean} Success status
     */
    clear() {
        localStorage.removeItem(STORAGE_KEYS.SETTINGS);
        return true;
    }
};

// ===== CACHE =====

const cacheStorage = {
    /**
     * Load entire cache
     * @returns {Object} Cache object
     */
    load() {
        const data = localStorage.getItem(STORAGE_KEYS.CACHE);
        return safeParse(data, {
            stockPrices: {},
            exchangeRates: {},
            news: {}
        });
    },

    /**
     * Save entire cache
     * @param {Object} cache - Cache object
     * @returns {boolean} Success status
     */
    save(cache) {
        const data = safeStringify(cache);
        if (data) {
            localStorage.setItem(STORAGE_KEYS.CACHE, data);
            return true;
        }
        return false;
    },

    /**
     * Set cache entry with timestamp
     * @param {string} category - Cache category (stockPrices, exchangeRates, news)
     * @param {string} key - Cache key
     * @param {*} value - Value to cache
     * @param {number} ttl - Time to live in milliseconds (optional)
     * @returns {boolean} Success status
     */
    set(category, key, value, ttl = null) {
        const cache = this.load();
        if (!cache[category]) {
            cache[category] = {};
        }
        cache[category][key] = {
            data: value,
            timestamp: Date.now(),
            ttl: ttl
        };
        return this.save(cache);
    },

    /**
     * Get cache entry
     * @param {string} category - Cache category
     * @param {string} key - Cache key
     * @returns {*} Cached value or null if expired/not found
     */
    get(category, key) {
        const cache = this.load();
        if (cache[category] && cache[category][key]) {
            const entry = cache[category][key];
            // Check if cache has expired
            if (entry.ttl && Date.now() - entry.timestamp > entry.ttl) {
                this.delete(category, key);
                return null;
            }
            return entry.data;
        }
        return null;
    },

    /**
     * Check if cache entry is valid
     * @param {string} category - Cache category
     * @param {string} key - Cache key
     * @param {number} maxAge - Max age in milliseconds
     * @returns {boolean} True if valid
     */
    isValid(category, key, maxAge) {
        const cache = this.load();
        if (cache[category] && cache[category][key]) {
            const age = Date.now() - cache[category][key].timestamp;
            return age < maxAge;
        }
        return false;
    },

    /**
     * Delete specific cache entry
     * @param {string} category - Cache category
     * @param {string} key - Cache key
     * @returns {boolean} Success status
     */
    delete(category, key) {
        const cache = this.load();
        if (cache[category] && cache[category][key]) {
            delete cache[category][key];
            return this.save(cache);
        }
        return false;
    },

    /**
     * Clear entire category
     * @param {string} category - Cache category
     * @returns {boolean} Success status
     */
    clearCategory(category) {
        const cache = this.load();
        cache[category] = {};
        return this.save(cache);
    },

    /**
     * Clear expired cache entries
     * @returns {number} Number of entries cleared
     */
    clearExpired() {
        const cache = this.load();
        let cleared = 0;
        
        Object.keys(cache).forEach(category => {
            Object.keys(cache[category]).forEach(key => {
                const entry = cache[category][key];
                if (entry.ttl && Date.now() - entry.timestamp > entry.ttl) {
                    delete cache[category][key];
                    cleared++;
                }
            });
        });
        
        this.save(cache);
        return cleared;
    },

    /**
     * Clear all cache
     * @returns {boolean} Success status
     */
    clear() {
        localStorage.removeItem(STORAGE_KEYS.CACHE);
        return true;
    },

    /**
     * Get cache statistics
     * @returns {Object} Cache stats
     */
    getStats() {
        const cache = this.load();
        const stats = {
            totalEntries: 0,
            byCategory: {}
        };

        Object.keys(cache).forEach(category => {
            const count = Object.keys(cache[category]).length;
            stats.byCategory[category] = count;
            stats.totalEntries += count;
        });

        return stats;
    }
};

// ===== GENERAL STORAGE UTILITIES =====

const storageUtils = {
    /**
     * Get total storage usage in bytes
     * @returns {number} Storage size in bytes
     */
    getStorageSize() {
        let total = 0;
        for (let key in localStorage) {
            if (localStorage.hasOwnProperty(key)) {
                total += localStorage[key].length + key.length;
            }
        }
        return total;
    },

    /**
     * Get storage usage in KB
     * @returns {string} Storage size in KB
     */
    getStorageSizeKB() {
        return (this.getStorageSize() / 1024).toFixed(2) + ' KB';
    },

    /**
     * Clear all app data
     * @returns {boolean} Success status
     */
    clearAll() {
        portfolioStorage.clear();
        transactionStorage.clear();
        expenseStorage.clear();
        goalStorage.clear();
        settingsStorage.clear();
        cacheStorage.clear();
        return true;
    },

    /**
     * Export all data as JSON
     * @returns {Object} All app data
     */
    exportData() {
        return {
            portfolio: portfolioStorage.load(),
            transactions: transactionStorage.load(),
            expenses: expenseStorage.load(),
            goals: goalStorage.load(),
            settings: settingsStorage.load(),
            exportDate: new Date().toISOString()
        };
    },

    /**
     * Import data from JSON
     * @param {Object} data - Data object to import
     * @returns {boolean} Success status
     */
    importData(data) {
        try {
            if (data.portfolio) portfolioStorage.save(data.portfolio);
            if (data.transactions) transactionStorage.save(data.transactions);
            if (data.expenses) expenseStorage.save(data.expenses);
            if (data.goals) goalStorage.save(data.goals);
            if (data.settings) settingsStorage.save(data.settings);
            return true;
        } catch (error) {
            console.error('Error importing data:', error);
            return false;
        }
    }
};

// ===== EXPORT FUNCTIONS =====
window.storage = {
    portfolio: portfolioStorage,
    transactions: transactionStorage,
    expenses: expenseStorage,
    goals: goalStorage,
    settings: settingsStorage,
    cache: cacheStorage,
    utils: storageUtils
};

console.log('Storage module loaded successfully');
console.log('Available: storage.portfolio, storage.transactions, storage.expenses, storage.goals, storage.settings, storage.cache, storage.utils');