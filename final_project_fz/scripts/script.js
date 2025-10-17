// ===== DATA STORAGE =====
// Load data from localStorage or initialize empty arrays
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
    `;
    
    tbody.appendChild(row);
}

// Initialize spending page
function initSpendingPage() {
    const form = document.querySelector('form');
    
    if (!form) return; // Not on spending page
    
    // Load existing spending items
    const tbody = document.querySelector('table tbody');
    tbody.innerHTML = ''; // Clear sample data
    spendingItems.forEach(item => displaySpendingItem(item));
    
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
    const savingsElement = document.querySelector('article:nth-of-type(1) p');
    const expensesElement = document.querySelector('article:nth-of-type(3) p');
    
    if (!savingsElement || !expensesElement) return; // Not on dashboard
    
    // Calculate total savings from goals
    const totalSavings = savingsGoals.reduce((sum, goal) => sum + goal.currentProgress, 0);
    
    // Calculate total expenses
    const totalExpenses = spendingItems.reduce((sum, item) => sum + item.amount, 0);
    
    // Update display
    savingsElement.textContent = formatCurrency(totalSavings);
    savingsElement.classList.add('number');
    
    expensesElement.textContent = formatCurrency(totalExpenses);
    expensesElement.classList.add('number');
}

// ===== INITIALIZE ON PAGE LOAD =====
document.addEventListener('DOMContentLoaded', function() {
    // Initialize based on which page we're on
    initSpendingPage();
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