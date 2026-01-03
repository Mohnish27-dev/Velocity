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
    const response = await axios.get(url, { headers, params: querystring });
    return {
      data: response.data.data ,
      status: response.data.status
    };
  } catch (error) {
    console.error('Job search API error:', error.message);
    return {
      data: [],
      error: error.message
    };
  }
}

export { fetchJobs };