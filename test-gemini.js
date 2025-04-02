// Test script for resume analysis with Gemini API
const resume = `
Software Engineer with 5 years of experience in web development using React, Node.js, and TypeScript. 
Developed and maintained multiple web applications with focus on performance optimization and responsive design. 
Implemented CI/CD pipelines using GitHub Actions and AWS. 
Experienced in database design with MongoDB and PostgreSQL.
`;

const options = {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    resumeText: resume
  })
};

// Make the request
fetch('http://localhost:5000/api/resume/analyze', options)
  .then(response => {
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }
    return response.json();
  })
  .then(data => {
    console.log('Success:', data);
  })
  .catch(error => {
    console.error('Error:', error);
  });