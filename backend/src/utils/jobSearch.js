import axios from "axios";
import "dotenv/config";

const url = "https://jsearch.p.rapidapi.com/search";

// Use consistent naming: RAPIDAPI_KEY (same as rapidApiService.js)
const headers = {
  "X-RapidAPI-Key": process.env.RAPIDAPI_KEY,
  "X-RapidAPI-Host": process.env.RAPIDAPI_HOST || "jsearch.p.rapidapi.com"
};

const fetchJobs = async (querystring) => {
  try {
    if (!process.env.RAPIDAPI_KEY) {
      console.warn('⚠️  RAPIDAPI_KEY not configured - job search disabled');
      return { data: [], error: 'API key not configured' };
    }
    
    console.log('🔍 Fetching jobs with query:', querystring);
    const response = await axios.get(url, { headers, params: querystring });
    
    return {
      data: response.data.data,
      status: response.data.status
    };
  } catch (error) {
    // Enhanced error handling
    if (error.response) {
      const status = error.response.status;
      console.error(`❌ Job search API error [${status}]:`, error.response.data?.message || error.message);
      
      if (status === 403) {
        console.error('🔑 Authentication Error - Possible causes:');
        console.error('   1. Invalid or expired RapidAPI key');
        console.error('   2. No active subscription to JSearch API');
        console.error('   3. API key does not have access to this endpoint');
        console.error('   → Visit https://rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch to check your subscription');
        return {
          data: [],
          error: 'API authentication failed. Please check your RapidAPI subscription and API key.',
          statusCode: 403
        };
      }
      
      if (status === 429) {
        console.error('⏱️  Rate limit exceeded');
        return {
          data: [],
          error: 'API rate limit exceeded. Please try again later.',
          statusCode: 429
        };
      }
      
      if (status === 401) {
        console.error('🔐 Unauthorized - Invalid API key');
        return {
          data: [],
          error: 'Invalid API credentials',
          statusCode: 401
        };
      }
      
      return {
        data: [],
        error: `API error: ${error.response.data?.message || error.message}`,
        statusCode: status
      };
    }
    
    console.error('❌ Job search API error:', error.message);
    return {
      data: [],
      error: error.message
    };
  }
}

export { fetchJobs };