const jwt = require('jsonwebtoken');
const { HttpError } = require('../helpers/index');
const { User } = require('../models/user');

const { JWT_SECRET } = process.env;

async function authorization(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const [type, token] = authHeader.split(' ');

  if (type !== 'Bearer') {
    throw HttpError(401, 'token type must be Bearer');
  }

  if (!token) {
    throw HttpError(401, 'no token provided');
  }

  try {
    const { id } = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(id);

    req.user = user;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw HttpError(401, 'jwt token is expired');
    }
    throw HttpError(401, error.message);
  }

  next();
}

module.exports = {
  authorization,
};
