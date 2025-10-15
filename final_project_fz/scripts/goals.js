// ===== GOALS MANAGEMENT LOGIC =====

// Load goals from localStorage
let goals = JSON.parse(localStorage.getItem('savingsGoals')) || [];

// ===== UTILITY FUNCTIONS =====

// Format currency
function formatCurrency(amount) {
    return `$${parseFloat(amount).toFixed(2)}`;
}

// Calculate percentage
function calculatePercentage(current, target) {
    if (target === 0) return 0;
    return Math.min(Math.round((current / target) * 100), 100);
}

// Format date for input
function formatDateForInput(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
}

// Format date for display
function formatDateForDisplay(dateString) {
    if (!dateString) return 'No deadline';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Check if deadline is approaching or passed
function getDeadlineStatus(deadline) {
    if (!deadline) return 'none';
    
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const daysUntil = Math.ceil((deadlineDate - now) / (1000 * 60 * 60 * 24));
    
    if (daysUntil < 0) return 'overdue';
    if (daysUntil <= 30) return 'warning';
    return 'normal';
}

// Save goals to localStorage
function saveGoals() {
    localStorage.setItem('savingsGoals', JSON.stringify(goals));
}

// ===== CREATE GOAL CARD =====
function createGoalCard(goal) {
    const article = document.createElement('article');
    article.className = 'goal-card';
    article.dataset.goalId = goal.id;
    
    const percentage = calculatePercentage(goal.currentProgress, goal.targetAmount);
    const deadlineStatus = getDeadlineStatus(goal.deadline);
    const deadlineClass = deadlineStatus !== 'none' ? `deadline-${deadlineStatus}` : '';
    
    article.innerHTML = `
        <div class="goal-header">
            <h3>${goal.name}</h3>
            <div class="goal-actions">
                <button class="btn-edit" onclick="editGoal(${goal.id})" title="Edit Goal">✏️</button>
                <button class="btn-delete" onclick="deleteGoal(${goal.id})" title="Delete Goal">🗑️</button>
            </div>
        </div>
        
        <div class="goal-amounts">
            <p class="number goal-progress">${formatCurrency(goal.currentProgress)}</p>
            <p class="goal-divider">of</p>
            <p class="number goal-target">${formatCurrency(goal.targetAmount)}</p>
        </div>
        
        <div class="progress-bar">
            <div class="progress-fill" style="width: ${percentage}%;"></div>
        </div>
        
        <div class="goal-stats">
            <p class="goal-percentage">${percentage}% Complete</p>
            ${goal.deadline ? `<p class="goal-deadline ${deadlineClass}">${formatDateForDisplay(goal.deadline)}</p>` : ''}
        </div>
        
        ${goal.deadline && deadlineStatus === 'overdue' ? '<p class="deadline-alert">⚠️ Deadline passed</p>' : ''}
        ${goal.deadline && deadlineStatus === 'warning' ? '<p class="deadline-alert warning">⏰ Deadline approaching</p>' : ''}
    `;
    
    return article;
}

// ===== DISPLAY ALL GOALS =====
function displayGoals() {
    const goalsContainer = document.querySelector('#goals-container');
    if (!goalsContainer) return;
    
    // Clear container
    goalsContainer.innerHTML = '';
    
    // Check if there are goals
    if (goals.length === 0) {
        goalsContainer.innerHTML = '<p class="no-goals">No savings goals yet. Add your first goal above!</p>';
        return;
    }
    
    // Sort goals by deadline (soonest first, then by creation date)
    const sortedGoals = [...goals].sort((a, b) => {
        if (!a.deadline && !b.deadline) return b.id - a.id;
        if (!a.deadline) return 1;
        if (!b.deadline) return -1;
        return new Date(a.deadline) - new Date(b.deadline);
    });
    
    // Create and append goal cards
    sortedGoals.forEach(goal => {
        const card = createGoalCard(goal);
        goalsContainer.appendChild(card);
    });
}

// ===== ADD NEW GOAL =====
function addGoal(name, targetAmount, currentProgress, deadline) {
    const goal = {
        id: Date.now(),
        name: name,
        targetAmount: parseFloat(targetAmount),
        currentProgress: parseFloat(currentProgress),
        deadline: deadline || null,
        dateCreated: new Date().toISOString()
    };
    
    goals.push(goal);
    saveGoals();
    displayGoals();
    
    return goal;
}

// ===== EDIT GOAL =====
function editGoal(goalId) {
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;
    
    // Populate form with goal data
    document.getElementById('goal-name').value = goal.name;
    document.getElementById('target-amount').value = goal.targetAmount;
    document.getElementById('current-progress').value = goal.currentProgress;
    document.getElementById('goal-deadline').value = formatDateForInput(goal.deadline);
    
    // Change form to edit mode
    const form = document.querySelector('form');
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.textContent = 'Update Goal';
    submitBtn.dataset.editId = goalId;
    
    // Add cancel button if not exists
    let cancelBtn = form.querySelector('.btn-cancel');
    if (!cancelBtn) {
        cancelBtn = document.createElement('button');
        cancelBtn.type = 'button';
        cancelBtn.className = 'btn-cancel';
        cancelBtn.textContent = 'Cancel';
        cancelBtn.onclick = cancelEdit;
        submitBtn.parentNode.insertBefore(cancelBtn, submitBtn.nextSibling);
    }
    
    // Scroll to form
    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ===== UPDATE GOAL =====
function updateGoal(goalId, name, targetAmount, currentProgress, deadline) {
    const goalIndex = goals.findIndex(g => g.id === goalId);
    if (goalIndex === -1) return;
    
    goals[goalIndex] = {
        ...goals[goalIndex],
        name: name,
        targetAmount: parseFloat(targetAmount),
        currentProgress: parseFloat(currentProgress),
        deadline: deadline || null
    };
    
    saveGoals();
    displayGoals();
    cancelEdit();
}

// ===== DELETE GOAL =====
function deleteGoal(goalId) {
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;
    
    const confirmed = confirm(`Are you sure you want to delete "${goal.name}"?`);
    if (!confirmed) return;
    
    goals = goals.filter(g => g.id !== goalId);
    saveGoals();
    displayGoals();
}

// ===== CANCEL EDIT =====
function cancelEdit() {
    const form = document.querySelector('form');
    const submitBtn = form.querySelector('button[type="submit"]');
    const cancelBtn = form.querySelector('.btn-cancel');
    
    // Reset form
    form.reset();
    
    // Reset submit button
    submitBtn.textContent = 'Add Goal';
    delete submitBtn.dataset.editId;
    
    // Remove cancel button
    if (cancelBtn) {
        cancelBtn.remove();
    }
}

// ===== HANDLE FORM SUBMISSION =====
function handleGoalFormSubmit(e) {
    e.preventDefault();
    
    const name = document.getElementById('goal-name').value.trim();
    const targetAmount = document.getElementById('target-amount').value;
    const currentProgress = document.getElementById('current-progress').value;
    const deadline = document.getElementById('goal-deadline').value;
    
    // Validate inputs
    if (!name || !targetAmount || !currentProgress) {
        alert('Please fill in all required fields');
        return;
    }
    
    if (parseFloat(targetAmount) <= 0) {
        alert('Target amount must be greater than 0');
        return;
    }
    
    if (parseFloat(currentProgress) < 0) {
        alert('Current progress cannot be negative');
        return;
    }
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const editId = submitBtn.dataset.editId;
    
    if (editId) {
        // Update existing goal
        updateGoal(parseInt(editId), name, targetAmount, currentProgress, deadline);
    } else {
        // Add new goal
        addGoal(name, targetAmount, currentProgress, deadline);
        e.target.reset();
    }
}

// ===== UPDATE GOAL PROGRESS =====
function updateGoalProgress(goalId, newProgress) {
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;
    
    goal.currentProgress = parseFloat(newProgress);
    saveGoals();
    displayGoals();
}

// ===== QUICK ADD PROGRESS =====
function quickAddProgress(goalId, amount) {
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;
    
    goal.currentProgress += parseFloat(amount);
    
    // Don't exceed target
    if (goal.currentProgress > goal.targetAmount) {
        goal.currentProgress = goal.targetAmount;
    }
    
    saveGoals();
    displayGoals();
}

// ===== CALCULATE TOTAL SAVINGS =====
function calculateTotalSavings() {
    return goals.reduce((total, goal) => total + goal.currentProgress, 0);
}

// ===== INITIALIZE GOALS PAGE =====
function initGoalsPage() {
    const form = document.querySelector('form');
    const goalNameInput = document.getElementById('goal-name');
    
    // Check if we're on goals page
    if (!form || !goalNameInput) return;
    
    // Add deadline field if not exists
    addDeadlineField();
    
    // Display existing goals
    displayGoals();
    
    // Handle form submission
    form.addEventListener('submit', handleGoalFormSubmit);
    
    // Update dashboard if on goals page
    updateDashboardSavings();
}

// ===== ADD DEADLINE FIELD TO FORM =====
function addDeadlineField() {
    const form = document.querySelector('form');
    const currentProgressInput = document.getElementById('current-progress');
    
    if (!currentProgressInput) return;
    
    // Check if deadline field already exists
    if (document.getElementById('goal-deadline')) return;
    
    // Create deadline field
    const label = document.createElement('label');
    label.setAttribute('for', 'goal-deadline');
    label.textContent = 'Deadline (Optional)';
    
    const input = document.createElement('input');
    input.type = 'date';
    input.id = 'goal-deadline';
    input.name = 'goal-deadline';
    
    // Insert after current progress field
    const submitBtn = form.querySelector('button[type="submit"]');
    form.insertBefore(label, submitBtn);
    form.insertBefore(input, submitBtn);
}

// ===== UPDATE DASHBOARD WITH TOTAL SAVINGS =====
function updateDashboardSavings() {
    const totalSavings = calculateTotalSavings();
    
    // This will be used by the main dashboard
    localStorage.setItem('totalSavings', totalSavings.toFixed(2));
}

// ===== CREATE GOALS CONTAINER IF NOT EXISTS =====
function ensureGoalsContainer() {
    const section = document.querySelector('section:last-of-type');
    if (!section) return;
    
    let container = document.getElementById('goals-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'goals-container';
        section.appendChild(container);
    }
}

// ===== INITIALIZE ON PAGE LOAD =====
document.addEventListener('DOMContentLoaded', function() {
    ensureGoalsContainer();
    initGoalsPage();
});

// ===== EXPORT FUNCTIONS FOR GLOBAL ACCESS =====
window.editGoal = editGoal;
window.deleteGoal = deleteGoal;
window.updateGoalProgress = updateGoalProgress;
window.quickAddProgress = quickAddProgress;