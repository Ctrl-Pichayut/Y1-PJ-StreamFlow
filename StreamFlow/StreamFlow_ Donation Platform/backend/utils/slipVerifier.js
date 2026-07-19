const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');

/**
 @param {string} imagePath 
 @param {object} options 
 */
exports.verifySlip = async (imagePath, options = {}) => {
  try {
    const apiKey = process.env.SLIP_VERIFY_API_SECRET;

    const form = new FormData();
    form.append('image', fs.createReadStream(imagePath));


    Object.entries(options).forEach(([key, value]) => {
      form.append(key, String(value));
    });

    const response = await axios.post('https://api.thunder.in.th/v2/verify/bank', form, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        ...form.getHeaders()
      }
    });

    return response.data;
  } catch (error) {
    const errorData = error.response ? error.response.data : error.message;
    console.error('Thunder API Error:', errorData);
    return {
      success: false,
      error: errorData
    };
  }
};