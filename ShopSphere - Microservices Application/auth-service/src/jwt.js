const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET;
const EXPIRES = process.env.JWT_EXPIRES || '1d';

if (!SECRET || SECRET.length < 32) {
  throw new Error('JWT_SECRET must be set and contain at least 32 characters');
}

exports.signToken = (payload) => jwt.sign(payload, SECRET, { expiresIn: EXPIRES });
exports.verifyToken = (token) => jwt.verify(token, SECRET);
