// Simple Node.js script to test the API status endpoint

fetch('http://localhost:5000/api/status')
  .then(response => {
    console.log('Status:', response.status);
    return response.text();
  })
  .then(text => {
    console.log('Response:', text);
    try {
      const data = JSON.parse(text);
      console.log('Parsed JSON:', data);
    } catch (e) {
      console.log('Not valid JSON');
    }
  })
  .catch(error => {
    console.error('Error:', error);
  });