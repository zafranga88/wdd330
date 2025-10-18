// ===== PORTFOLIO MODULE =====
// This module handles portfolio display, stock search, and real-time data

// ===== GLOBAL STATE =====

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
 * Display stock chart using Vanilla JavaScript Canvas
 */
function displayStockChart(timeSeries, symbol) {
    const chartContainer = document.getElementById('stock-chart');
    
    if (!timeSeries || timeSeries.length === 0) {
        chartContainer.innerHTML = '<p style="text-align: center; color: var(--medium-gray); padding: 2rem;">No chart data available</p>';
        return;
    }
    
    // Clear container
    chartContainer.innerHTML = '';
    
    // Create canvas
    const canvas = document.createElement('canvas');
    canvas.id = 'price-chart';
    canvas.width = 800;
    canvas.height = 400;
    canvas.style.width = '100%';
    canvas.style.height = 'auto';
    chartContainer.appendChild(canvas);
    
    const ctx = canvas.getContext('2d');
    const padding = 60;
    const chartWidth = canvas.width - padding * 2;
    const chartHeight = canvas.height - padding * 2;
    
    // Prepare data (reverse to show chronological order)
    const reversedData = [...timeSeries].reverse();
    const prices = reversedData.map(d => d.close);
    const dates = reversedData.map(d => {
        const date = new Date(d.date);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });
    
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice || 1; // Prevent division by zero
    
    // Determine color based on trend
    const firstPrice = prices[0];
    const lastPrice = prices[prices.length - 1];
    const isPositive = lastPrice >= firstPrice;
    const lineColor = isPositive ? '#10B981' : '#EF4444';
    const fillColor = isPositive ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)';
    
    // Clear canvas with white background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw grid lines and Y-axis labels
    ctx.strokeStyle = '#E5E7EB';
    ctx.lineWidth = 1;
    ctx.fillStyle = '#6B7280';
    ctx.font = '11px Inter, sans-serif';
    
    for (let i = 0; i <= 5; i++) {
        const y = padding + (chartHeight / 5) * i;
        
        // Grid line
        ctx.beginPath();
        ctx.moveTo(padding, y);
        ctx.lineTo(canvas.width - padding, y);
        ctx.stroke();
        
        // Y-axis label
        const price = maxPrice - (priceRange / 5) * i;
        ctx.textAlign = 'right';
        ctx.fillText('$' + price.toFixed(2), padding - 10, y + 4);
    }
    
    // Draw filled area under the line
    ctx.fillStyle = fillColor;
    ctx.beginPath();
    
    prices.forEach((price, index) => {
        const x = padding + (chartWidth / (prices.length - 1)) * index;
        const y = padding + chartHeight - ((price - minPrice) / priceRange) * chartHeight;
        
        if (index === 0) {
            ctx.moveTo(x, canvas.height - padding);
            ctx.lineTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    });
    
    ctx.lineTo(padding + chartWidth, canvas.height - padding);
    ctx.closePath();
    ctx.fill();
    
    // Draw line chart
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    prices.forEach((price, index) => {
        const x = padding + (chartWidth / (prices.length - 1)) * index;
        const y = padding + chartHeight - ((price - minPrice) / priceRange) * chartHeight;
        
        if (index === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    });
    
    ctx.stroke();
    
    // Draw X-axis labels (show every 5th date)
    ctx.fillStyle = '#6B7280';
    ctx.font = '11px Inter, sans-serif';
    ctx.textAlign = 'center';
    
    dates.forEach((date, index) => {
        if (index % 5 === 0 || index === dates.length - 1) {
            const x = padding + (chartWidth / (prices.length - 1)) * index;
            ctx.fillText(date, x, canvas.height - padding + 20);
        }
    });
    
    // Draw title
    ctx.fillStyle = '#1F2937';
    ctx.font = 'bold 14px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${symbol} - 30 Day Price History`, canvas.width / 2, 30);
    
    // Add hover interaction
    addChartHoverInteraction(canvas, ctx, prices, dates, minPrice, maxPrice, priceRange, padding, chartWidth, chartHeight, lineColor);
}

/**
 * Add hover tooltip to chart
 */
function addChartHoverInteraction(canvas, ctx, prices, dates, minPrice, maxPrice, priceRange, padding, chartWidth, chartHeight, lineColor) {
    const tooltip = document.createElement('div');
    tooltip.style.cssText = `
        position: absolute;
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 8px 12px;
        border-radius: 6px;
        font-size: 12px;
        pointer-events: none;
        display: none;
        z-index: 1000;
        font-family: Inter, sans-serif;
    `;
    canvas.parentElement.style.position = 'relative';
    canvas.parentElement.appendChild(tooltip);
    
    canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;
        
        // Find closest data point
        let closestIndex = -1;
        let closestDistance = Infinity;
        
        prices.forEach((price, index) => {
            const pointX = padding + (chartWidth / (prices.length - 1)) * index;
            const pointY = padding + chartHeight - ((price - minPrice) / priceRange) * chartHeight;
            const distance = Math.sqrt(Math.pow(x - pointX, 2) + Math.pow(y - pointY, 2));
            
            if (distance < 30 && distance < closestDistance) {
                closestDistance = distance;
                closestIndex = index;
            }
        });
        
        if (closestIndex !== -1) {
            tooltip.style.display = 'block';
            tooltip.style.left = (e.clientX - rect.left + 10) + 'px';
            tooltip.style.top = (e.clientY - rect.top - 50) + 'px';
            tooltip.innerHTML = `
                <div style="font-weight: bold; margin-bottom: 4px;">${dates[closestIndex]}</div>
                <div>Price: $${prices[closestIndex].toFixed(2)}</div>
            `;
            
            // Draw hover point
            const pointX = padding + (chartWidth / (prices.length - 1)) * closestIndex;
            const pointY = padding + chartHeight - ((prices[closestIndex] - minPrice) / priceRange) * chartHeight;
            
            // Redraw chart (this prevents multiple dots)
            displayStockChart(timeSeries, symbol);
            
            // Draw hover point
            ctx.fillStyle = lineColor;
            ctx.beginPath();
            ctx.arc(pointX, pointY, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 2;
            ctx.stroke();
        } else {
            tooltip.style.display = 'none';
        }
    });
    
    canvas.addEventListener('mouseleave', () => {
        tooltip.style.display = 'none';
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