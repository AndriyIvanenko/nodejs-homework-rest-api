const jwt = require('jsonwebtoken');
const HttpError = require('../helpers/httpError');
const { User } = require('../models/user');

const multer = require('multer');
const path = require('path');

const sendgridMail = require('@sendgrid/mail');
const { nanoid } = require('nanoid');

const { JWT_SECRET, SENDGRID_API_KEY, PORT } = process.env;

async function authorization(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const [type, token] = authHeader.split(' ');

  if (type !== 'Bearer') {
    throw new HttpError(401, 'Token type must be Bearer');
  }
  if (!token) {
    throw new HttpError(401, 'No token provided');
  }

  try {
    const { id } = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(id);

    req.user = user;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new HttpError(401, 'jwt token is expired');
    }
    throw new HttpError(401, error.message);
  }

  next();
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.resolve(__dirname, '../tmp'));
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
  limits: {
    fileSize: 1048576,
  },
});
const upload = multer({
  storage,
});

function sendConfirmationEmail(req, res, next) {
  sendgridMail.setApiKey(SENDGRID_API_KEY);
  const verificationToken = nanoid();
  req.body.verificationToken = verificationToken;

  const email = {
    to: 'andriy.ivanenko@gmail.com',
    from: 'andriy.ivanenko@gmail.com',
    subject: 'Please confirm your e-mail address',
    html: `<h3>For confirmation your e-mail address click link below</h3> <a href="http://localhost:${PORT}/api/users/verify/:${verificationToken}">Confirm your email</a>`,
    text: 'test',
  };
  sendgridMail
    .send(email)
    .then(() => {
      console.log('Email sent');
      next();
    })
    .catch(error => {
      console.error(error);
    });
}

module.exports = {
  authorization,
  upload,
  sendConfirmationEmail,
};
