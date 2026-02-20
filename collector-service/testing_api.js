const Parser = require("rss-parser");
const parser = new Parser();

// 🔥 Change keyword here
const KEYWORD = "iphone";

async function fetchLinkedInViaGoogleNews() {
  try {
    // Google News RSS with LinkedIn site filter
    const url = `https://news.google.com/rss/search?q=site:linkedin.com/posts+${KEYWORD}&hl=en-IN&gl=IN&ceid=IN:en`;

    const feed = await parser.parseURL(url);

    console.log("====== LINKEDIN MENTIONS (via Google News) ======");

    if (feed.items.length === 0) {
      console.log("No LinkedIn mentions found.");
      return;
    }

    feed.items.forEach((item, index) => {
      console.log(`\nPost ${index + 1}`);
      console.log("Title:", item.title);
      console.log("Link:", item.link);
      console.log("Published:", item.pubDate);
    });

  } catch (error) {
    console.error("Error:", error.message);
  }
}

fetchLinkedInViaGoogleNews();