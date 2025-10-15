// ===== CURRENCY CONVERTER WIDGET =====

// Supported currencies
const CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD'];

// Currency symbols
const CURRENCY_SYMBOLS = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    JPY: '¥',
    CAD: 'C$',
    AUD: 'A$'
};

// ===== INITIALIZE CURRENCY WIDGET =====
async function initCurrencyWidget() {
    // Only run on spending.html
    const currencySection = document.getElementById('currency-converter');
    if (!currencySection) return;
    
    try {
        // Load exchange rates
        await loadExchangeRates();
        
        // Setup event listeners
        setupCurrencyEventListeners();
        
        // Initial conversion
        performConversion();
        
    } catch (error) {
        console.error('Error initializing currency widget:', error);
        displayCurrencyError('Failed to load exchange rates. Please try again later.');
    }
}

// ===== LOAD EXCHANGE RATES =====
async function loadExchangeRates() {
    try {
        // Get rates from API (uses cache if available)
        const rates = await currencyAPI.getRates('USD');
        
        // Display rates in the table
        displayExchangeRates(rates);
        
        // Update last updated timestamp
        updateLastUpdated(rates.date);
        
    } catch (error) {
        console.error('Error loading exchange rates:', error);
        throw error;
    }
}

// ===== DISPLAY EXCHANGE RATES TABLE =====
function displayExchangeRates(ratesData) {
    const tbody = document.querySelector('#rates-table tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    CURRENCIES.forEach(currency => {
        if (currency === ratesData.base) {
            // Base currency (1.00)
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><strong>${currency}</strong></td>
                <td class="number">1.0000</td>
            `;
            tbody.appendChild(row);
        } else if (ratesData.rates[currency]) {
            // Other currencies
            const row = document.createElement('tr');
            const rate = ratesData.rates[currency].toFixed(4);
            row.innerHTML = `
                <td><strong>${currency}</strong></td>
                <td class="number">${rate}</td>
            `;
            tbody.appendChild(row);
        }
    });
}

// ===== SETUP EVENT LISTENERS =====
function setupCurrencyEventListeners() {
    const amountInput = document.getElementById('convert-amount');
    const fromSelect = document.getElementById('convert-from');
    const toSelect = document.getElementById('convert-to');
    const convertBtn = document.getElementById('convert-btn');
    const swapBtn = document.getElementById('swap-currencies');
    
    if (amountInput && fromSelect && toSelect) {
        // Convert on input change
        amountInput.addEventListener('input', performConversion);
        fromSelect.addEventListener('change', performConversion);
        toSelect.addEventListener('change', performConversion);
        
        // Convert button click
        if (convertBtn) {
            convertBtn.addEventListener('click', performConversion);
        }
        
        // Swap currencies button
        if (swapBtn) {
            swapBtn.addEventListener('click', swapCurrencies);
        }
    }
}

// ===== PERFORM CURRENCY CONVERSION =====
async function performConversion() {
    const amountInput = document.getElementById('convert-amount');
    const fromSelect = document.getElementById('convert-from');
    const toSelect = document.getElementById('convert-to');
    const resultDiv = document.getElementById('conversion-result');
    
    if (!amountInput || !fromSelect || !toSelect || !resultDiv) return;
    
    const amount = parseFloat(amountInput.value);
    const fromCurrency = fromSelect.value;
    const toCurrency = toSelect.value;
    
    // Validate input
    if (!amount || amount <= 0) {
        resultDiv.innerHTML = '<p>Please enter a valid amount</p>';
        return;
    }
    
    try {
        // Perform conversion using API
        const result = await currencyAPI.convert(amount, fromCurrency, toCurrency);
        
        // Display result
        const fromSymbol = CURRENCY_SYMBOLS[fromCurrency];
        const toSymbol = CURRENCY_SYMBOLS[toCurrency];
        
        resultDiv.innerHTML = `
            <div class="conversion-output">
                <p class="conversion-amount">
                    <span class="number">${fromSymbol}${amount.toFixed(2)}</span> ${fromCurrency}
                </p>
                <p class="conversion-equals">=</p>
                <p class="conversion-result-amount">
                    <span class="number">${toSymbol}${result.result.toFixed(2)}</span> ${toCurrency}
                </p>
                <p class="conversion-rate">
                    Rate: 1 ${fromCurrency} = ${result.rate.toFixed(4)} ${toCurrency}
                </p>
            </div>
        `;
        
    } catch (error) {
        console.error('Error performing conversion:', error);
        resultDiv.innerHTML = '<p class="error-message">Conversion failed. Please try again.</p>';
    }
}

// ===== SWAP CURRENCIES =====
function swapCurrencies() {
    const fromSelect = document.getElementById('convert-from');
    const toSelect = document.getElementById('convert-to');
    
    if (!fromSelect || !toSelect) return;
    
    // Swap the values
    const temp = fromSelect.value;
    fromSelect.value = toSelect.value;
    toSelect.value = temp;
    
    // Perform conversion with swapped values
    performConversion();
}

// ===== UPDATE LAST UPDATED TIMESTAMP =====
function updateLastUpdated(date) {
    const lastUpdatedElement = document.getElementById('rates-last-updated');
    if (!lastUpdatedElement) return;
    
    const updateDate = new Date(date);
    const formattedDate = updateDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    lastUpdatedElement.textContent = `Last updated: ${formattedDate}`;
}

// ===== DISPLAY ERROR MESSAGE =====
function displayCurrencyError(message) {
    const currencySection = document.getElementById('currency-converter');
    if (!currencySection) return;
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.innerHTML = `<p>${message}</p>`;
    currencySection.appendChild(errorDiv);
}

// ===== REFRESH RATES MANUALLY =====
async function refreshExchangeRates() {
    try {
        // Clear currency cache
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
            if (key.startsWith('exchange_')) {
                localStorage.removeItem(key);
            }
        });
        
        // Reload rates
        await loadExchangeRates();
        
        alert('Exchange rates refreshed successfully!');
        
    } catch (error) {
        console.error('Error refreshing rates:', error);
        alert('Failed to refresh rates. Please try again.');
    }
}

// ===== INITIALIZE ON PAGE LOAD =====
document.addEventListener('DOMContentLoaded', function() {
    initCurrencyWidget();
});

// ===== EXPORT FUNCTIONS =====
window.currencyWidget = {
    refresh: refreshExchangeRates,
    convert: performConversion
};
