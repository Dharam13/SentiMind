require("dotenv").config();
const axios = require("axios");

const API_KEY = process.env.NEWSDATA_API_KEY;

async function testNewsData() {
  try {
    const response = await axios.get("https://newsdata.io/api/1/news", {
      params: {
        apikey: API_KEY,
        q: "Tesla",          // change keyword here
        language: "en",
        country: "in",       // optional
      },
    });

    console.log("Status:", response.status);
    console.log("Total Results:", response.data.totalResults);
    console.log("Sample Article:\n", response.data.results[0]);

  } catch (error) {
    console.error("Error:", error.response?.data || error.message);
  }
}

testNewsData();