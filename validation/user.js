const userSchema = require('./schemas/userSchema');
const emailSchema = require('./schemas/emailSchema');

function userValidation(req, res, next) {
  if (userSchema.validate(req.body).error) {
    res.status(400).json({ message: userSchema.validate(req.body).error.message });
  } else {
    next();
  }
}

function emailValidation(req, res, next) {
  if (emailSchema.validate(req.body).error) {
    res.status(400).json({ message: userSchema.validate(req.body).error.message });
  } else {
    next();
  }
}

module.exports = {
  userValidation,
  emailValidation,
};
