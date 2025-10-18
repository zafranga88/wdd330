// ===== DATA STORAGE =====
// Load data from localStorage or initialize empty arrays
let incomeItems = JSON.parse(localStorage.getItem('incomeItems')) || [];
let spendingItems = JSON.parse(localStorage.getItem('spendingItems')) || [];
let savingsGoals = JSON.parse(localStorage.getItem('savingsGoals')) || [];

// ===== UTILITY FUNCTIONS =====

// Format number as currency
function formatCurrency(amount) {
    return `$${parseFloat(amount).toFixed(2)}`;
}

// Calculate percentage
function calculatePercentage(current, target) {
    return Math.min(Math.round((current / target) * 100), 100);
}

// Save data to localStorage
function saveToLocalStorage() {
    localStorage.setItem('spendingItems', JSON.stringify(spendingItems));
    localStorage.setItem('savingsGoals', JSON.stringify(savingsGoals));
    localStorage.setItem('incomeItems', JSON.stringify(incomeItems));  // ADD THIS LINE
}

// ===== SPENDING PAGE FUNCTIONS =====

// Add new spending item to the table
function addSpendingItem(description, amount, category) {
    const item = {
        id: Date.now(),
        description: description,
        amount: parseFloat(amount),
        category: category,
        date: new Date().toISOString()
    };
    
    // Add to array
    spendingItems.push(item);
    
    // Save to localStorage
    saveToLocalStorage();
    
    // Add to table
    displaySpendingItem(item);
}

// Display a spending item in the table
function displaySpendingItem(item) {
    const tbody = document.querySelector('table tbody');
    const row = document.createElement('tr');
    
    row.innerHTML = `
        <td>${item.description}</td>
        <td>${item.category}</td>
        <td class="number">${formatCurrency(item.amount)}</td>
        <td class="action-buttons">
            <button class="btn-edit-small" onclick="editSpendingItem(${item.id})" title="Edit">✏️</button>
            <button class="btn-delete-small" onclick="deleteSpendingItem(${item.id})" title="Delete">🗑️</button>
        </td>
    `;
    
    tbody.appendChild(row);
}

// Initialize spending page
function initSpendingPage() {
    const form = document.querySelector('form');
    
    if (!form) return; // Not on spending page
    
    // Load existing spending items
    const tbody = document.querySelector('table tbody');
    tbody.innerHTML = '';
    if (spendingItems.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: var(--medium-gray);">No spending recorded yet</td></tr>';
    } else {
    spendingItems.forEach(item => displaySpendingItem(item));
    }
    
    // Handle form submission
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const description = document.getElementById('description').value;
        const amount = document.getElementById('amount').value;
        const category = document.getElementById('category').value;
        
        addSpendingItem(description, amount, category);
        
        // Reset form
        form.reset();
    });
}

// Edit spending item
function editSpendingItem(id) {
    const item = spendingItems.find(i => i.id === id);
    if (!item) return;
    
    // Populate form
    document.getElementById('description').value = item.description;
    document.getElementById('amount').value = item.amount;
    document.getElementById('category').value = item.category;
    
    // Delete old item
    deleteSpendingItem(id, false);
    
    // Scroll to form
    document.querySelector('form').scrollIntoView({ behavior: 'smooth' });
}

// Delete spending item
function deleteSpendingItem(id, confirm = true) {
    if (confirm && !window.confirm('Are you sure you want to delete this spending item?')) {
        return;
    }
    
    // Remove from array
    spendingItems = spendingItems.filter(item => item.id !== id);
    
    // Save to localStorage
    saveToLocalStorage();
    
    // Refresh table
    const tbody = document.querySelector('table tbody');
    tbody.innerHTML = '';
    
    if (spendingItems.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: var(--medium-gray);">No spending recorded yet</td></tr>';
    } else {
        spendingItems.forEach(item => displaySpendingItem(item));
    }
    
    // Update dashboard
    updateDashboard();
}

// ===== INCOME PAGE FUNCTIONS =====

// Add new income item
function addIncomeItem(description, amount, source) {
    const item = {
        id: Date.now(),
        description: description,
        amount: parseFloat(amount),
        source: source,
        date: new Date().toISOString()
    };
    
    // Add to array
    incomeItems.push(item);
    
    // Save to localStorage
    saveToLocalStorage();
    
    // Add to table
    displayIncomeItem(item);
}

// Display an income item in the table
function displayIncomeItem(item) {
    const tbody = document.querySelector('#income-table tbody');
    if (!tbody) return;
    
    const row = document.createElement('tr');
    row.innerHTML = `
        <td>${item.description}</td>
        <td>${item.source}</td>
        <td class="number">${formatCurrency(item.amount)}</td>
        <td class="action-buttons">
            <button class="btn-edit-small" onclick="editIncomeItem(${item.id})" title="Edit">✏️</button>
            <button class="btn-delete-small" onclick="deleteIncomeItem(${item.id})" title="Delete">🗑️</button>
        </td>
    `;
    tbody.appendChild(row);
}

// Initialize income page
function initIncomePage() {
    const form = document.getElementById('income-form');
    if (!form) return; // Not on income section
    
    // Load existing income items
    const tbody = document.querySelector('#income-table tbody');
    if (tbody) {
        tbody.innerHTML = '';
        
        if (incomeItems.length === 0) {
            tbody.innerHTML = '<tr><td colspan="3" style="text-align: center; color: var(--medium-gray);">No income recorded yet</td></tr>';
        } else {
            incomeItems.forEach(item => displayIncomeItem(item));
        }
    }
    
    // Handle form submission
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const description = document.getElementById('income-description').value;
        const amount = document.getElementById('income-amount').value;
        const source = document.getElementById('income-source').value;
        
        addIncomeItem(description, amount, source);
        
        // Clear "no income" message
        const tbody = document.querySelector('#income-table tbody');
        if (tbody && tbody.querySelector('td[colspan]')) {
            tbody.innerHTML = '';
            incomeItems.forEach(item => displayIncomeItem(item));
        }
        
        // Reset form
        form.reset();
        
        // Update dashboard
        updateDashboard();
    });
}

// Edit income item
function editIncomeItem(id) {
    const item = incomeItems.find(i => i.id === id);
    if (!item) return;
    
    // Populate form
    document.getElementById('income-description').value = item.description;
    document.getElementById('income-amount').value = item.amount;
    document.getElementById('income-source').value = item.source;
    
    // Delete old item
    deleteIncomeItem(id, false);
    
    // Scroll to form
    document.getElementById('income-form').scrollIntoView({ behavior: 'smooth' });
}

// Delete income item
function deleteIncomeItem(id, confirm = true) {
    if (confirm && !window.confirm('Are you sure you want to delete this income item?')) {
        return;
    }
    
    // Remove from array
    incomeItems = incomeItems.filter(item => item.id !== id);
    
    // Save to localStorage
    saveToLocalStorage();
    
    // Refresh table
    const tbody = document.querySelector('#income-table tbody');
    tbody.innerHTML = '';
    
    if (incomeItems.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: var(--medium-gray);">No income recorded yet</td></tr>';
    } else {
        incomeItems.forEach(item => displayIncomeItem(item));
    }
    
    // Update dashboard
    updateDashboard();
}
// ===== GOALS PAGE FUNCTIONS =====

// Add new savings goal
function addSavingsGoal(name, targetAmount, currentProgress) {
    const goal = {
        id: Date.now(),
        name: name,
        targetAmount: parseFloat(targetAmount),
        currentProgress: parseFloat(currentProgress),
        dateCreated: new Date().toISOString()
    };
    
    // Add to array
    savingsGoals.push(goal);
    
    // Save to localStorage
    saveToLocalStorage();
    
    // Display goal card
    displayGoalCard(goal);
}

// Display a goal card
function displayGoalCard(goal) {
    const section = document.querySelector('section:last-of-type');
    const article = document.createElement('article');
    
    const percentage = calculatePercentage(goal.currentProgress, goal.targetAmount);
    
    article.innerHTML = `
        <h3>${goal.name}</h3>
        <p class="number">${formatCurrency(goal.currentProgress)} of ${formatCurrency(goal.targetAmount)}</p>
        <div class="progress-bar">
            <div class="progress-fill" style="width: ${percentage}%;"></div>
        </div>
        <p>${percentage}% Complete</p>
    `;
    
    section.appendChild(article);
}

// Initialize goals page
function initGoalsPage() {
    const form = document.querySelector('form');
    
    if (!form) return; // Not on goals page
    
    // Check if we're on the goals page by looking for goal-name input
    const goalNameInput = document.getElementById('goal-name');
    if (!goalNameInput) return;
    
    // Load existing goals
    const section = document.querySelector('section:last-of-type');
    const articles = section.querySelectorAll('article');
    articles.forEach(article => article.remove()); // Clear sample data
    savingsGoals.forEach(goal => displayGoalCard(goal));
    
    // Handle form submission
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const name = document.getElementById('goal-name').value;
        const targetAmount = document.getElementById('target-amount').value;
        const currentProgress = document.getElementById('current-progress').value;
        
        addSavingsGoal(name, targetAmount, currentProgress);
        
        // Reset form
        form.reset();
    });
}

// ===== DASHBOARD PAGE FUNCTIONS =====

// Update dashboard with totals
function updateDashboard() {
    // Try to find the Financial Overview section
    const sections = document.querySelectorAll('section');
    let financialSection = null;
    
    sections.forEach(section => {
        const h2 = section.querySelector('h2');
        if (h2 && h2.textContent.includes('Financial Overview')) {
            financialSection = section;
        }
    });
    
    if (!financialSection) return; // Not on dashboard
    
    const articles = financialSection.querySelectorAll('article');
    if (articles.length < 3) return;
    
    const savingsElement = articles[0].querySelector('p');
    const incomeElement = articles[1].querySelector('p');
    const expensesElement = articles[2].querySelector('p');
    
    if (!savingsElement || !incomeElement || !expensesElement) return;
    
    // Calculate totals
    const totalIncome = incomeItems.reduce((sum, item) => sum + item.amount, 0);
    const totalExpenses = spendingItems.reduce((sum, item) => sum + item.amount, 0);
    const goalsSavings = savingsGoals.reduce((sum, goal) => sum + goal.currentProgress, 0);
    
    // Total savings = goals + (income - expenses)
    const totalSavings = goalsSavings + (totalIncome - totalExpenses);
    
    // Update display
    savingsElement.textContent = formatCurrency(totalSavings);
    savingsElement.classList.add('number');
    
    incomeElement.textContent = formatCurrency(totalIncome);
    incomeElement.classList.add('number');
    
    expensesElement.textContent = formatCurrency(totalExpenses);
    expensesElement.classList.add('number');
}

// ===== INITIALIZE ON PAGE LOAD =====
document.addEventListener('DOMContentLoaded', function() {
    // Initialize based on which page we're on
    initSpendingPage();
    initIncomePage();  
    initGoalsPage();
    updateDashboard();
});



// ===== HAMBURGER MENU =====
document.addEventListener('DOMContentLoaded', function() {
    const hamburger = document.getElementById('hamburger');
    const nav = document.getElementById('nav');
    const overlay = document.getElementById('nav-overlay');
    
    if (hamburger && nav && overlay) {
        // Toggle menu
        hamburger.addEventListener('click', function() {
            hamburger.classList.toggle('active');
            nav.classList.toggle('active');
            overlay.classList.toggle('active');
        });
        
        // Close menu when clicking overlay
        overlay.addEventListener('click', function() {
            hamburger.classList.remove('active');
            nav.classList.remove('active');
            overlay.classList.remove('active');
        });
        
        // Close menu when clicking a nav link
        const navLinks = nav.querySelectorAll('a');
        navLinks.forEach(link => {
            link.addEventListener('click', function() {
                hamburger.classList.remove('active');
                nav.classList.remove('active');
                overlay.classList.remove('active');
            });
        });
    }
});