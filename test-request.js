const http = require('http');

const options = {
  hostname: 'localhost',
  port: 4500,
  path: '/api/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  }
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log('Login Response:', res.statusCode, data));
});

req.on('error', e => console.error(e));
req.write(JSON.stringify({ email: 'test@example.com', password: 'password' })); // Mock
req.end();
