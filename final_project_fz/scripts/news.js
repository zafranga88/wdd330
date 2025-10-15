// js/news.js

const NEWS_API_KEY = "12466edbae864629bca64d3643c72660"; 
const NEWS_API_URL = "https://newsapi.org/v2/top-headlines?category=business&language=en";
const CACHE_KEY = "cachedNews";
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

async function fetchNews() {
  // Check cache
  const cached = JSON.parse(localStorage.getItem(CACHE_KEY));
  const now = Date.now();

  if (cached && now - cached.timestamp < CACHE_DURATION) {
    console.log("🗞️ Loaded news from cache");
    return cached.data;
  }

  try {
    const response = await fetch(`${NEWS_API_URL}&apiKey=${NEWS_API_KEY}`);
    const data = await response.json();

    if (data.status !== "ok") throw new Error("Error fetching news");

    // Save to cache
    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ timestamp: now, data: data.articles })
    );

    console.log("✅ Fetched fresh news");
    return data.articles;
  } catch (error) {
    console.error("Error fetching news:", error);
    return [];
  }
}

function displayNews(articles) {
  const container = document.getElementById("news-container");
  container.innerHTML = "";

  const limitedArticles = articles.slice(0, 8); // Show up to 8

  limitedArticles.forEach((article) => {
    const card = document.createElement("div");
    card.className = "news-card";

    card.innerHTML = `
      <img src="${article.urlToImage || 'https://via.placeholder.com/300x180?text=No+Image'}" alt="News image" class="news-image">
      <div class="news-content">
        <h3 class="news-title">${article.title}</h3>
        <p class="news-description">${article.description || ""}</p>
        <div class="news-meta">
          <span>${new Date(article.publishedAt).toLocaleDateString()}</span>
          <span>${article.source.name || "Unknown source"}</span>
        </div>
        <a href="${article.url}" target="_blank" class="news-link">Read more →</a>
      </div>
    `;
    container.appendChild(card);
  });
}

// Initialize
(async () => {
  const articles = await fetchNews();
  displayNews(articles);
})();
