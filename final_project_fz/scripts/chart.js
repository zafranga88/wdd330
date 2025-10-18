

function createStockChart(canvasId, data, symbol) {
    const container = document.getElementById(canvasId);
    
    if (!data || data.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--medium-gray); padding: 2rem;">No data available</p>';
        return;
    }
    
    // Clear container
    container.innerHTML = '';
    
    // Create canvas
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 400;
    canvas.style.width = '100%';
    canvas.style.height = 'auto';
    container.appendChild(canvas);
    
    const ctx = canvas.getContext('2d');
    const padding = 50;
    const chartWidth = canvas.width - padding * 2;
    const chartHeight = canvas.height - padding * 2;
    
    // Get price data (reverse to show oldest to newest)
    const prices = data.reverse().map(d => d.close);
    const dates = data.map(d => new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
    
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice;
    
    // Clear canvas
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw grid lines
    ctx.strokeStyle = '#E5E7EB';
    ctx.lineWidth = 1;
    
    for (let i = 0; i <= 5; i++) {
        const y = padding + (chartHeight / 5) * i;
        ctx.beginPath();
        ctx.moveTo(padding, y);
        ctx.lineTo(canvas.width - padding, y);
        ctx.stroke();
        
        // Y-axis labels
        const price = maxPrice - (priceRange / 5) * i;
        ctx.fillStyle = '#6B7280';
        ctx.font = '12px Inter, sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText('$' + price.toFixed(2), padding - 10, y + 4);
    }
    
    // Draw line chart
    ctx.strokeStyle = '#1E40AF';
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
    
    // Draw points
    ctx.fillStyle = '#1E40AF';
    prices.forEach((price, index) => {
        const x = padding + (chartWidth / (prices.length - 1)) * index;
        const y = padding + chartHeight - ((price - minPrice) / priceRange) * chartHeight;
        
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();
    });
    
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
    ctx.font = 'bold 16px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${symbol} - 30 Day Price History`, canvas.width / 2, 25);
    
    // Add hover interaction
    addChartHover(canvas, ctx, prices, dates, minPrice, maxPrice, priceRange, padding, chartWidth, chartHeight);
}

function addChartHover(canvas, ctx, prices, dates, minPrice, maxPrice, priceRange, padding, chartWidth, chartHeight) {
    const tooltip = document.createElement('div');
    tooltip.style.position = 'absolute';
    tooltip.style.background = 'rgba(31, 41, 55, 0.9)';
    tooltip.style.color = 'white';
    tooltip.style.padding = '8px 12px';
    tooltip.style.borderRadius = '6px';
    tooltip.style.fontSize = '12px';
    tooltip.style.pointerEvents = 'none';
    tooltip.style.display = 'none';
    tooltip.style.zIndex = '1000';
    canvas.parentElement.style.position = 'relative';
    canvas.parentElement.appendChild(tooltip);
    
    canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleX;
        
        // Find closest data point
        let closestIndex = -1;
        let closestDistance = Infinity;
        
        prices.forEach((price, index) => {
            const pointX = padding + (chartWidth / (prices.length - 1)) * index;
            const pointY = padding + chartHeight - ((price - minPrice) / priceRange) * chartHeight;
            const distance = Math.sqrt(Math.pow(x - pointX, 2) + Math.pow(y - pointY, 2));
            
            if (distance < 20 && distance < closestDistance) {
                closestDistance = distance;
                closestIndex = index;
            }
        });
        
        if (closestIndex !== -1) {
            tooltip.style.display = 'block';
            tooltip.style.left = (e.clientX - rect.left + 10) + 'px';
            tooltip.style.top = (e.clientY - rect.top - 40) + 'px';
            tooltip.innerHTML = `
                <strong>${dates[closestIndex]}</strong><br>
                Price: $${prices[closestIndex].toFixed(2)}
            `;
        } else {
            tooltip.style.display = 'none';
        }
    });
    
    canvas.addEventListener('mouseleave', () => {
        tooltip.style.display = 'none';
    });
}

// Export function
window.createStockChart = createStockChart;