import jwt from 'jsonwebtoken';

const generateToken = (userId) => {
  const JWT_SECRET = process.env.JWT_SECRET || 'secret';
  return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: '30d' });
};

export default generateToken;
