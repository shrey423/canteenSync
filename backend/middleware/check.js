const jwt = require('jsonwebtoken');

// Your token and secret key
const token = '$2b$10$aGs3mVHfhWZdUOvlVrAXOOitNneugiKCK9ydazuK5UejJK9gaQgDy';
const secretKey = 'secret';

// Verify and decode the token
try {
  const decoded = jwt.verify(token, secretKey);
  console.log('Decoded payload:', decoded);
} catch (err) {
  console.error('Invalid token:', err.message);
}
