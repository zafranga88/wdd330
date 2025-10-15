// ===== PORTFOLIO MODULE =====
// This module handles portfolio display, stock search, and real-time data

// ===== GLOBAL STATE =====
let currentChart = null;
let searchTimeout = null;

// ===== UTILITY FUNCTIONS =====

/**
 * Format currency with proper decimals
 */
function formatCurrency(amount) {
    return `$${parseFloat(amount).toFixed(2)}`;
}

/**
 * Format number with commas
 */
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/**
 * Show loading indicator
 */
function showLoading(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = '<div class="loading">Loading...</div>';
    }
}

/**
 * Show error message
 */
function showError(elementId, message) {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = `<div class="error-message">${message}</div>`;
    }
}

// ===== STOCK SEARCH FUNCTIONALITY =====

/**
 * Initialize stock search
 */
function initStockSearch() {
    const searchInput = document.getElementById('stock-search');
    const searchResults = document.getElementById('search-results');
    
    if (!searchInput) return;

    searchInput.addEventListener('input', async (e) => {
        const query = e.target.value.trim();
        
        // Clear previous timeout
        if (searchTimeout) {
            clearTimeout(searchTimeout);
        }

        // Clear results if query is too short
        if (query.length < 2) {
            searchResults.innerHTML = '';
            searchResults.style.display = 'none';
            return;
        }

        // Debounce search
        searchTimeout = setTimeout(async () => {
            await performStockSearch(query);
        }, 500);
    });

    // Close search results when clicking outside
    document.addEventListener('click', (e) => {
        if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
            searchResults.style.display = 'none';
        }
    });
}

/**
 * Perform stock symbol search
 */
async function performStockSearch(query) {
    const searchResults = document.getElementById('search-results');
    
    try {
        searchResults.innerHTML = '<div class="search-loading">Searching...</div>';
        searchResults.style.display = 'block';

        // Use the API module's search function
        const results = await window.stockAPI.searchSymbol(query);

        if (results.length === 0) {
            searchResults.innerHTML = '<div class="search-no-results">No results found</div>';
            return;
        }

        // Display results
        let html = '<div class="search-results-list">';
        results.slice(0, 8).forEach(result => {
            html += `
                <div class="search-result-item" data-symbol="${result.symbol}">
                    <div class="search-result-symbol">${result.symbol}</div>
                    <div class="search-result-name">${result.name}</div>
                    <div class="search-result-meta">${result.type} • ${result.region}</div>
                </div>
            `;
        });
        html += '</div>';

        searchResults.innerHTML = html;

        // Add click handlers to results
        document.querySelectorAll('.search-result-item').forEach(item => {
            item.addEventListener('click', () => {
                const symbol = item.dataset.symbol;
                document.getElementById('stock-search').value = symbol;
                searchResults.style.display = 'none';
                loadStockData(symbol);
            });
        });

    } catch (error) {
        console.error('Search error:', error);
        searchResults.innerHTML = '<div class="search-error">Search failed. Please try again.</div>';
    }
}

// ===== STOCK DATA DISPLAY =====

/**
 * Load and display stock data
 */
async function loadStockData(symbol) {
    if (!symbol) return;

    showLoading('stock-info');
    showLoading('stock-chart');

    try {
        // Load quote and time series data
        const [quote, timeSeries] = await Promise.all([
            window.stockAPI.getQuote(symbol),
            window.stockAPI.getTimeSeries(symbol, 30)
        ]);

        displayStockInfo(quote);
        displayStockChart(timeSeries, symbol);

    } catch (error) {
        console.error('Error loading stock data:', error);
        showError('stock-info', 'Failed to load stock data. Please try again.');
        showError('stock-chart', 'Chart unavailable.');
    }
}

/**
 * Display stock quote information
 */
function displayStockInfo(quote) {
    const stockInfo = document.getElementById('stock-info');
    
    const changeColor = quote.change >= 0 ? 'var(--success-green)' : 'var(--danger-red)';
    const changeSign = quote.change >= 0 ? '+' : '';

    stockInfo.innerHTML = `
        <div class="stock-info-grid">
            <div class="stock-info-main">
                <h3>${quote.symbol}</h3>
                <div class="stock-price">${formatCurrency(quote.price)}</div>
                <div class="stock-change" style="color: ${changeColor};">
                    ${changeSign}${formatCurrency(quote.change)} (${changeSign}${parseFloat(quote.changePercent).toFixed(2)}%)
                </div>
                <button class="quick-add-btn" data-symbol="${quote.symbol}" data-price="${quote.price}">
                    + Add to Portfolio
                </button>
            </div>
            <div class="stock-info-details">
                <div class="stock-detail">
                    <span class="label">Volume:</span>
                    <span class="value number">${formatNumber(quote.volume)}</span>
                </div>
                <div class="stock-detail">
                    <span class="label">Last Updated:</span>
                    <span class="value">${quote.latestTradingDay}</span>
                </div>
            </div>
        </div>
    `;
}

/**
 * Display stock chart using Chart.js
 */
function displayStockChart(timeSeries, symbol) {
    const chartContainer = document.getElementById('stock-chart');
    
    // Destroy existing chart
    if (currentChart) {
        currentChart.destroy();
    }

    // Prepare data (reverse to show chronological order)
    const reversedData = [...timeSeries].reverse();
    const labels = reversedData.map(item => item.date);
    const prices = reversedData.map(item => item.close);

    // Create canvas
    chartContainer.innerHTML = '<canvas id="price-chart"></canvas>';
    const ctx = document.getElementById('price-chart').getContext('2d');

    // Determine color based on trend
    const firstPrice = prices[0];
    const lastPrice = prices[prices.length - 1];
    const isPositive = lastPrice >= firstPrice;
    const lineColor = isPositive ? '#10B981' : '#EF4444';
    const gradientColor = isPositive ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)';

    // Create gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, gradientColor);
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

    currentChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: `${symbol} Price`,
                data: prices,
                borderColor: lineColor,
                backgroundColor: gradient,
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointRadius: 0,
                pointHoverRadius: 6,
                pointHoverBackgroundColor: lineColor,
                pointHoverBorderColor: '#fff',
                pointHoverBorderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    titleFont: {
                        size: 14,
                        weight: 'bold'
                    },
                    bodyFont: {
                        size: 13
                    },
                    callbacks: {
                        label: function(context) {
                            return 'Price: $' + context.parsed.y.toFixed(2);
                        }
                    }
                }
            },
            scales: {
                x: {
                    display: true,
                    grid: {
                        display: false
                    },
                    ticks: {
                        maxTicksLimit: 6,
                        font: {
                            size: 11
                        }
                    }
                },
                y: {
                    display: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)',
                        drawBorder: false
                    },
                    ticks: {
                        callback: function(value) {
                            return '$' + value.toFixed(2);
                        },
                        font: {
                            size: 11
                        }
                    }
                }
            },
            interaction: {
                mode: 'nearest',
                axis: 'x',
                intersect: false
            }
        }
    });
}

// ===== PORTFOLIO HOLDINGS DISPLAY =====

/**
 * Display portfolio holdings table
 */
async function displayPortfolioHoldings() {
    const holdings = window.storage.portfolio.load();
    const tbody = document.querySelector('#portfolio-table tbody');
    
    if (!tbody) return;

    if (holdings.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 2rem; color: var(--medium-gray);">No holdings yet. Search for a stock to add to your portfolio.</td></tr>';
        updatePortfolioSummary([]);
        return;
    }

    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Loading portfolio data...</td></tr>';

    try {
        // Fetch current prices for all holdings
        const holdingsWithPrices = await Promise.all(
            holdings.map(async (holding) => {
                try {
                    const quote = await window.stockAPI.getQuote(holding.symbol);
                    return { ...holding, currentPrice: quote.price, change: quote.change, changePercent: quote.changePercent };
                } catch (error) {
                    console.error(`Error loading price for ${holding.symbol}:`, error);
                    return { ...holding, currentPrice: null };
                }
            })
        );

        // Display holdings
        tbody.innerHTML = '';
        holdingsWithPrices.forEach(holding => {
            const currentValue = holding.currentPrice ? holding.quantity * holding.currentPrice : 0;
            const costBasis = holding.quantity * holding.avgCost;
            const gain = currentValue - costBasis;
            const gainPercent = ((gain / costBasis) * 100).toFixed(2);
            const gainColor = gain >= 0 ? 'var(--success-green)' : 'var(--danger-red)';

            const row = document.createElement('tr');
            row.innerHTML = `
                <td><strong>${holding.symbol}</strong></td>
                <td class="number">${holding.quantity}</td>
                <td class="number">${formatCurrency(holding.avgCost)}</td>
                <td class="number">${holding.currentPrice ? formatCurrency(holding.currentPrice) : 'N/A'}</td>
                <td class="number">${holding.currentPrice ? formatCurrency(currentValue) : 'N/A'}</td>
                <td class="number" style="color: ${gainColor}; font-weight: 600;">
                    ${holding.currentPrice ? `${gain >= 0 ? '+' : ''}${formatCurrency(gain)} (${gainPercent}%)` : 'N/A'}
                </td>
            `;
            tbody.appendChild(row);
        });

        // Update portfolio summary
        updatePortfolioSummary(holdingsWithPrices);

    } catch (error) {
        console.error('Error displaying portfolio:', error);
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--danger-red);">Error loading portfolio data.</td></tr>';
    }
}

/**
 * Update portfolio summary statistics
 */
function updatePortfolioSummary(holdings) {
    let totalValue = 0;
    let totalCost = 0;

    holdings.forEach(holding => {
        if (holding.currentPrice) {
            totalValue += holding.quantity * holding.currentPrice;
            totalCost += holding.quantity * holding.avgCost;
        }
    });

    const totalGain = totalValue - totalCost;
    const totalGainPercent = totalCost > 0 ? ((totalGain / totalCost) * 100).toFixed(2) : 0;
    const gainColor = totalGain >= 0 ? 'var(--success-green)' : 'var(--danger-red)';

    const summaryElement = document.getElementById('portfolio-summary');
    if (summaryElement) {
        summaryElement.innerHTML = `
            <div class="summary-grid">
                <div class="summary-item">
                    <div class="summary-label">Total Value</div>
                    <div class="summary-value number">${formatCurrency(totalValue)}</div>
                </div>
                <div class="summary-item">
                    <div class="summary-label">Total Cost</div>
                    <div class="summary-value number">${formatCurrency(totalCost)}</div>
                </div>
                <div class="summary-item">
                    <div class="summary-label">Total Gain/Loss</div>
                    <div class="summary-value number" style="color: ${gainColor};">
                        ${totalGain >= 0 ? '+' : ''}${formatCurrency(totalGain)} (${totalGainPercent}%)
                    </div>
                </div>
            </div>
        `;
    }
}

// ===== ADD TO PORTFOLIO FORM =====

/**
 * Initialize add to portfolio form
 */
function initAddToPortfolioForm() {
    const form = document.getElementById('add-holding-form');
    if (!form) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const symbol = document.getElementById('holding-symbol').value.trim().toUpperCase();
        const quantity = parseFloat(document.getElementById('holding-quantity').value);
        const avgCost = parseFloat(document.getElementById('holding-cost').value);
        const purchaseDate = document.getElementById('holding-date').value;

        if (!symbol || !quantity || !avgCost) {
            alert('Please fill in all required fields.');
            return;
        }

        // Add to portfolio
        window.storage.portfolio.add({
            symbol: symbol,
            quantity: quantity,
            avgCost: avgCost,
            purchaseDate: purchaseDate || new Date().toISOString().split('T')[0]
        });

        // Reset form
        form.reset();

        // Reload portfolio display
        displayPortfolioHoldings();

        // Show success message
        alert(`Successfully added ${quantity} shares of ${symbol} to your portfolio!`);
    });
}

// ===== QUICK ADD BUTTON =====

/**
 * Add quick add button handler
 */
function initQuickAddButton() {
    const stockInfo = document.getElementById('stock-info');
    if (!stockInfo) return;

    // Add event delegation for dynamically created buttons
    stockInfo.addEventListener('click', (e) => {
        if (e.target.classList.contains('quick-add-btn')) {
            const symbol = e.target.dataset.symbol;
            const price = parseFloat(e.target.dataset.price);
            
            // Pre-fill the form
            document.getElementById('holding-symbol').value = symbol;
            document.getElementById('holding-cost').value = price;
            document.getElementById('holding-quantity').focus();

            // Scroll to form
            document.getElementById('add-holding-form').scrollIntoView({ behavior: 'smooth' });
        }
    });
}

// ===== INITIALIZATION =====

/**
 * Initialize portfolio page
 */
function initPortfolioPage() {
    // Check if we're on the index page (portfolio dashboard)
    const isIndexPage = window.location.pathname.endsWith('index.html') || 
                       window.location.pathname === '/' ||
                       window.location.pathname.endsWith('/');
    
    if (!isIndexPage) return;

    console.log('Initializing portfolio page...');

    // Initialize components
    initStockSearch();
    initAddToPortfolioForm();
    initQuickAddButton();
    displayPortfolioHoldings();

    // Set up refresh button
    const refreshBtn = document.getElementById('refresh-portfolio');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            displayPortfolioHoldings();
        });
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', initPortfolioPage);

// Export functions for external use
window.portfolioModule = {
    loadStockData,
    displayPortfolioHoldings,
    refreshPortfolio: displayPortfolioHoldings
};

console.log('Portfolio module loaded successfully');