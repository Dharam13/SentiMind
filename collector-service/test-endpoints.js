/**
 * Test script to verify Collector Service endpoints
 * Run this after starting the service: npm run test
 */

const axios = require("axios");

const BASE_URL = "http://localhost:8021";
const TEST_KEYWORD = "nvidia"; // Neutral test keyword
const TEST_PROJECT_ID = 1;

const endpoints = [
  { 
    name: "Health Check", 
    path: "/health", 
    method: "GET",
    timeout: 5000,
    description: "Service health status"
  },
  { 
    name: "Reddit", 
    path: `/api/collect/reddit?keyword=${TEST_KEYWORD}&projectId=${TEST_PROJECT_ID}&limit=5&hours=24`, 
    method: "GET",
    timeout: 30000,
    description: "Reddit mentions (no API key required)"
  },
  { 
    name: "Twitter", 
    path: `/api/collect/twitter?keyword=${TEST_KEYWORD}&projectId=${TEST_PROJECT_ID}&limit=5&hours=24`, 
    method: "GET",
    timeout: 30000,
    description: "Twitter/X mentions via Twitter API.io"
  },
  { 
    name: "YouTube", 
    path: `/api/collect/youtube?keyword=${TEST_KEYWORD}&projectId=${TEST_PROJECT_ID}&limit=5&hours=24`, 
    method: "GET",
    timeout: 30000,
    description: "YouTube video mentions"
  },
  { 
    name: "Tumblr", 
    path: `/api/collect/tumblr?keyword=${TEST_KEYWORD}&projectId=${TEST_PROJECT_ID}&limit=5&hours=24`, 
    method: "GET",
    timeout: 30000,
    description: "Tumblr blog mentions"
  },
  { 
    name: "News", 
    path: `/api/collect/news?keyword=${TEST_KEYWORD}&projectId=${TEST_PROJECT_ID}&limit=5&hours=24`, 
    method: "GET",
    timeout: 30000,
    description: "News articles from multiple providers (with 24h→7d fallback)"
  },
];

async function testEndpoint(endpoint) {
  try {
    const url = `${BASE_URL}${endpoint.path}`;
    console.log(`\n🧪 Testing ${endpoint.name}...`);
    if (endpoint.description) {
      console.log(`   ℹ️  ${endpoint.description}`);
    }
    console.log(`   ${endpoint.method} ${url}`);
    
    const startTime = Date.now();
    const response = await axios({
      method: endpoint.method,
      url,
      timeout: endpoint.timeout || 30000,
    });
    const duration = Date.now() - startTime;

    console.log(`   ✅ Status: ${response.status} (${duration}ms)`);
    
    if (endpoint.path.includes("/api/collect")) {
      const data = response.data;
      console.log(`   📊 Platform: ${data.platform}`);
      console.log(`   🔑 Keyword: ${data.keyword}`);
      console.log(`   ⏰ Hours Used: ${data.hoursUsed}`);
      console.log(`   📈 Mentions Found: ${data.count}`);
      
      if (data.count > 0 && data.mentions && data.mentions.length > 0) {
        const firstMention = data.mentions[0];
        console.log(`   📝 First mention:`);
        console.log(`      Author: ${firstMention.author || "N/A"}`);
        console.log(`      URL: ${firstMention.sourceUrl || "N/A"}`);
        console.log(`      Content: ${(firstMention.content || "").substring(0, 80)}...`);
      } else if (data.message) {
        console.log(`   ℹ️  ${data.message}`);
      }
    } else {
      console.log(`   📦 Response:`, JSON.stringify(response.data, null, 2));
    }
    
    return { success: true, endpoint: endpoint.name, duration };
  } catch (error) {
    console.log(`   ❌ Failed: ${error.message}`);
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      const errorData = error.response.data;
      if (errorData.error) {
        console.log(`   Error: ${errorData.error}`);
      }
      if (errorData.details) {
        console.log(`   Details:`, JSON.stringify(errorData.details, null, 2));
      }
      if (errorData.upstreamStatus) {
        console.log(`   Upstream Status: ${errorData.upstreamStatus}`);
      }
    } else if (error.code === "ECONNREFUSED") {
      console.log(`   ⚠️  Connection refused - is the service running on port 8021?`);
    } else if (error.code === "ETIMEDOUT") {
      console.log(`   ⚠️  Request timed out - API may be slow or rate limited`);
    }
    return { success: false, endpoint: endpoint.name, error: error.message };
  }
}

async function runTests() {
  console.log("=".repeat(70));
  console.log("Collector Service Endpoint Tests");
  console.log("=".repeat(70));
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Test Keyword: ${TEST_KEYWORD}`);
  console.log(`Test Project ID: ${TEST_PROJECT_ID}`);
  console.log(`Total Endpoints: ${endpoints.length}`);
  console.log("=".repeat(70));

  const results = [];
  let totalDuration = 0;
  
  for (let i = 0; i < endpoints.length; i++) {
    const endpoint = endpoints[i];
    const result = await testEndpoint(endpoint);
    results.push(result);
    
    if (result.duration) {
      totalDuration += result.duration;
    }
    
    // Rate limit protection - longer delay for Google Search
    const delay = endpoint.rateLimitDelay || 1000;
    if (i < endpoints.length - 1) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  console.log("\n" + "=".repeat(70));
  console.log("Test Summary");
  console.log("=".repeat(70));
  
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  const avgDuration = totalDuration > 0 ? Math.round(totalDuration / results.length) : 0;
  
  console.log(`✅ Successful: ${successful}/${results.length}`);
  console.log(`❌ Failed: ${failed}/${results.length}`);
  console.log(`⏱️  Average Response Time: ${avgDuration}ms`);
  console.log(`⏱️  Total Test Duration: ${Math.round(totalDuration / 1000)}s`);
  
  if (successful > 0) {
    console.log("\n✅ Successful endpoints:");
    results.filter(r => r.success).forEach(r => {
      const duration = r.duration ? ` (${r.duration}ms)` : "";
      console.log(`   ✓ ${r.endpoint}${duration}`);
    });
  }
  
  if (failed > 0) {
    console.log("\n❌ Failed endpoints:");
    results.filter(r => !r.success).forEach(r => {
      console.log(`   ✗ ${r.endpoint}: ${r.error}`);
    });
    console.log("\n💡 Troubleshooting:");
    console.log("   - Check that the service is running: npm run dev");
    console.log("   - Verify API keys in .env file");
    console.log("   - Check MongoDB connection");
    console.log("   - Review error messages above for specific issues");
  }
  
  console.log("=".repeat(70));
}

runTests().catch(console.error);
