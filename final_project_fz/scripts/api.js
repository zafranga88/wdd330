// ===== API CONFIGURATION =====
const API_KEYS = {
    alphaVantage: '6PEG6DZL5GWW7DQI', 
    newsApi: '12466edbae864629bca64d3643c72660', 
    
};

const API_ENDPOINTS = {
    alphaVantage: 'https://www.alphavantage.co/query',
    newsApi: 'https://newsapi.org/v2',
    exchangeRate: 'https://api.exchangerate-api.com/v4/latest'
};

// ===== CACHE UTILITY FUNCTIONS =====

// Check if cached data is still valid
function isCacheValid(cacheKey, expiryHours) {
    const cached = localStorage.getItem(cacheKey);
    if (!cached) return false;
    
    const data = JSON.parse(cached);
    const now = new Date().getTime();
    const cacheAge = now - data.timestamp;
    const expiryTime = expiryHours * 60 * 60 * 1000; // Convert hours to milliseconds
    
    return cacheAge < expiryTime;
}

// Get data from cache
function getFromCache(cacheKey) {
    const cached = localStorage.getItem(cacheKey);
    if (!cached) return null;
    
    const data = JSON.parse(cached);
    return data.value;
}

// Save data to cache
function saveToCache(cacheKey, value) {
    const cacheData = {
        timestamp: new Date().getTime(),
        value: value
    };
    localStorage.setItem(cacheKey, JSON.stringify(cacheData));
}

// ===== ALPHA VANTAGE API (STOCK MARKET DATA) =====

// Get current stock quote
async function getStockQuote(symbol) {
    const cacheKey = `stock_quote_${symbol}`;
    
    // Check cache (valid for 1 hour)
    if (isCacheValid(cacheKey, 1)) {
        console.log(`Using cached data for ${symbol}`);
        return getFromCache(cacheKey);
    }
    
    try {
        const url = `${API_ENDPOINTS.alphaVantage}?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${API_KEYS.alphaVantage}`;
        const response = await fetch(url);
        const data = await response.json();
        
        // Check for API errors
        if (data['Error Message'] || data['Note']) {
            throw new Error(data['Error Message'] || 'API rate limit reached');
        }
        
        const quote = data['Global Quote'];
        const result = {
            symbol: quote['01. symbol'],
            price: parseFloat(quote['05. price']),
            change: parseFloat(quote['09. change']),
            changePercent: quote['10. change percent'],
            volume: parseInt(quote['06. volume']),
            latestTradingDay: quote['07. latest trading day']
        };
        
        // Save to cache
        saveToCache(cacheKey, result);
        return result;
        
    } catch (error) {
        console.error('Error fetching stock quote:', error);
        throw error;
    }
}

// Get daily time series data (historical prices)
async function getStockTimeSeries(symbol, days = 30) {
    const cacheKey = `stock_timeseries_${symbol}`;
    
    // Check cache (valid for 24 hours)
    if (isCacheValid(cacheKey, 24)) {
        console.log(`Using cached time series data for ${symbol}`);
        return getFromCache(cacheKey);
    }
    
    try {
        const url = `${API_ENDPOINTS.alphaVantage}?function=TIME_SERIES_DAILY&symbol=${symbol}&apikey=${API_KEYS.alphaVantage}`;
        const response = await fetch(url);
        const data = await response.json();
        
        // Check for API errors
        if (data['Error Message'] || data['Note']) {
            throw new Error(data['Error Message'] || 'API rate limit reached');
        }
        
        const timeSeries = data['Time Series (Daily)'];
        const result = [];
        
        // Convert to array and limit to requested days
        for (const [date, values] of Object.entries(timeSeries).slice(0, days)) {
            result.push({
                date: date,
                open: parseFloat(values['1. open']),
                high: parseFloat(values['2. high']),
                low: parseFloat(values['3. low']),
                close: parseFloat(values['4. close']),
                volume: parseInt(values['5. volume'])
            });
        }
        
        // Save to cache
        saveToCache(cacheKey, result);
        return result;
        
    } catch (error) {
        console.error('Error fetching time series:', error);
        throw error;
    }
}

// Search for stock symbols
async function searchStockSymbol(keywords) {
    const cacheKey = `stock_search_${keywords}`;
    
    // Check cache (valid for 7 days)
    if (isCacheValid(cacheKey, 168)) {
        console.log(`Using cached search results for ${keywords}`);
        return getFromCache(cacheKey);
    }
    
    try {
        const url = `${API_ENDPOINTS.alphaVantage}?function=SYMBOL_SEARCH&keywords=${keywords}&apikey=${API_KEYS.alphaVantage}`;
        const response = await fetch(url);
        const data = await response.json();
        
        // Check for API errors
        if (data['Error Message'] || data['Note']) {
            throw new Error(data['Error Message'] || 'API rate limit reached');
        }
        
        const matches = data['bestMatches'] || [];
        const result = matches.map(match => ({
            symbol: match['1. symbol'],
            name: match['2. name'],
            type: match['3. type'],
            region: match['4. region'],
            currency: match['8. currency']
        }));
        
        // Save to cache
        saveToCache(cacheKey, result);
        return result;
        
    } catch (error) {
        console.error('Error searching symbols:', error);
        throw error;
    }
}

// ===== NEWS API (FINANCIAL NEWS) =====

// Get financial news by keyword
async function getNewsByKeyword(keyword, pageSize = 10) {
    const cacheKey = `news_keyword_${keyword}`;
    
    // Check cache (valid for 24 hours)
    if (isCacheValid(cacheKey, 24)) {
        console.log(`Using cached news for ${keyword}`);
        return getFromCache(cacheKey);
    }
    
    try {
        const url = `${API_ENDPOINTS.newsApi}/everything?q=${keyword}&sortBy=publishedAt&pageSize=${pageSize}&apiKey=${API_KEYS.newsApi}`;
        const response = await fetch(url);
        const data = await response.json();
        
        // Check for API errors
        if (data.status === 'error') {
            throw new Error(data.message || 'News API error');
        }
        
        const result = data.articles.map(article => ({
            headline: article.title,
            summary: article.description,
            date: article.publishedAt,
            source: article.source.name,
            url: article.url,
            thumbnail: article.urlToImage,
            author: article.author
        }));
        
        // Save to cache
        saveToCache(cacheKey, result);
        return result;
        
    } catch (error) {
        console.error('Error fetching news by keyword:', error);
        throw error;
    }
}

// Get top finance headlines
async function getTopFinanceHeadlines(country = 'us', pageSize = 10) {
    const cacheKey = `news_headlines_${country}`;
    
    // Check cache (valid for 24 hours)
    if (isCacheValid(cacheKey, 24)) {
        console.log(`Using cached headlines for ${country}`);
        return getFromCache(cacheKey);
    }
    
    try {
        const url = `${API_ENDPOINTS.newsApi}/top-headlines?country=${country}&category=business&pageSize=${pageSize}&apiKey=${API_KEYS.newsApi}`;
        const response = await fetch(url);
        const data = await response.json();
        
        // Check for API errors
        if (data.status === 'error') {
            throw new Error(data.message || 'News API error');
        }
        
        const result = data.articles.map(article => ({
            headline: article.title,
            summary: article.description,
            date: article.publishedAt,
            source: article.source.name,
            url: article.url,
            thumbnail: article.urlToImage,
            author: article.author
        }));
        
        // Save to cache
        saveToCache(cacheKey, result);
        return result;
        
    } catch (error) {
        console.error('Error fetching top headlines:', error);
        throw error;
    }
}

// ===== EXCHANGERATE API (CURRENCY CONVERSION) =====

// Get latest exchange rates
async function getExchangeRates(baseCurrency = 'USD') {
    const cacheKey = `exchange_rates_${baseCurrency}`;
    
    // Check cache (valid for 24 hours)
    if (isCacheValid(cacheKey, 24)) {
        console.log(`Using cached exchange rates for ${baseCurrency}`);
        return getFromCache(cacheKey);
    }
    
    try {
        const url = `${API_ENDPOINTS.exchangeRate}/${baseCurrency}`;
        const response = await fetch(url);
        const data = await response.json();
        
        // Extract relevant currencies
        const currencies = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD'];
        const result = {
            base: data.base,
            date: data.date,
            rates: {}
        };
        
        currencies.forEach(currency => {
            if (data.rates[currency]) {
                result.rates[currency] = data.rates[currency];
            }
        });
        
        // Save to cache
        saveToCache(cacheKey, result);
        return result;
        
    } catch (error) {
        console.error('Error fetching exchange rates:', error);
        throw error;
    }
}

// Convert currency
async function convertCurrency(amount, fromCurrency, toCurrency) {
    try {
        const rates = await getExchangeRates(fromCurrency);
        
        if (!rates.rates[toCurrency]) {
            throw new Error(`Exchange rate not available for ${toCurrency}`);
        }
        
        const convertedAmount = amount * rates.rates[toCurrency];
        
        return {
            amount: amount,
            from: fromCurrency,
            to: toCurrency,
            rate: rates.rates[toCurrency],
            result: parseFloat(convertedAmount.toFixed(2)),
            date: rates.date
        };
        
    } catch (error) {
        console.error('Error converting currency:', error);
        throw error;
    }
}

// ===== UTILITY FUNCTIONS =====

// Clear all API caches
function clearAllCaches() {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
        if (key.startsWith('stock_') || key.startsWith('news_') || key.startsWith('exchange_')) {
            localStorage.removeItem(key);
        }
    });
    console.log('All API caches cleared');
}

// Get cache statistics
function getCacheStats() {
    const keys = Object.keys(localStorage);
    const stats = {
        stock: 0,
        news: 0,
        exchange: 0,
        total: 0
    };
    
    keys.forEach(key => {
        if (key.startsWith('stock_')) stats.stock++;
        if (key.startsWith('news_')) stats.news++;
        if (key.startsWith('exchange_')) stats.exchange++;
    });
    
    stats.total = stats.stock + stats.news + stats.exchange;
    return stats;
}

// ===== EXPORT FUNCTIONS =====
// These functions are now available globally
window.stockAPI = {
    getQuote: getStockQuote,
    getTimeSeries: getStockTimeSeries,
    searchSymbol: searchStockSymbol
};

window.newsAPI = {
    searchNews: getNewsByKeyword,
    getHeadlines: getTopFinanceHeadlines
};

window.currencyAPI = {
    getRates: getExchangeRates,
    convert: convertCurrency
};

window.apiUtils = {
    clearCaches: clearAllCaches,
    getCacheStats: getCacheStats
};

console.log('API module loaded successfully');
console.log('Available APIs: stockAPI, newsAPI, currencyAPI, apiUtils');