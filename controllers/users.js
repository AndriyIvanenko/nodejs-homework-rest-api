const jwt = require('jsonwebtoken');
const HttpError = require('../helpers/httpError');

const { User } = require('../models/user');
const bcrypt = require('bcrypt');
const gravatar = require('gravatar');
const Jimp = require('jimp');

const fs = require('fs');
const path = require('path');

const { sendConfirmationEmail } = require('../helpers');
const { nanoid } = require('nanoid');

const { STATIC_URL, PORT } = process.env;

async function registration(req, res, next) {
  const { email, password } = req.body;
  const avatarURL = gravatar.url(email, { s: '250', r: 'x', d: 'retro' }, true);
  const verificationToken = nanoid();

  try {
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      email,
      password: hashedPassword,
      avatarURL,
      verificationToken,
    });
    const responseData = {
      user: {
        email,
        subscription: newUser.subscription,
      },
    };

    sendConfirmationEmail(email, verificationToken, next);

    res.status(201).json({ ...responseData });
  } catch (error) {
    if (error.code === 11000) {
      throw new HttpError(409, 'Email in use');
    }
    next(error);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const { JWT_SECRET } = process.env;

    const storedUser = await User.findOne({ email });
    if (!storedUser) {
      throw new HttpError(401, 'Email or password is wrong');
    }

    if (!storedUser.verify) {
      throw new HttpError(401, 'Email is not confirmed, please check your email box');
    }

    const isPasswordValid = await bcrypt.compare(password, storedUser.password);
    if (!isPasswordValid) {
      throw new HttpError(401, 'Email or password is wrong');
    }

    const payload = { id: storedUser._id };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
    await User.findByIdAndUpdate(storedUser._id, { token });

    const responseData = {
      token,
      user: {
        email: storedUser.email,
        subscription: storedUser.subscription,
      },
    };
    res.status(200).json({ ...responseData });
  } catch (error) {
    next(error);
  }
}

async function currentUser(req, res, next) {
  const { email, subscription } = req.user;

  res.status(200).json({ email, subscription });
}

async function logout(req, res, next) {
  const { id } = req.user;

  try {
    await User.findByIdAndUpdate(id, { token: null });
    res.status(204).json();
  } catch (error) {
    next(error);
  }
}

async function updateSubscription(req, res, next) {
  const { id } = req.user;
  const { subscription } = req.body;

  if (subscription !== 'starter' && subscription !== 'pro' && subscription !== 'business') {
    throw new HttpError(400, 'Subscription must be < starter >, < pro > or < business >');
  }

  try {
    await User.findByIdAndUpdate(id, { subscription });
    res.status(201).json({ message: `Suscription updated to < ${subscription} >` });
  } catch (error) {
    next(error);
  }
}

async function changeAvatar(req, res, next) {
  const { filename } = req.file;
  const { id } = req.user;

  const splitedFilename = filename.split('.');
  const fileExt = splitedFilename[splitedFilename.length - 1];
  const newFilename = id + '.' + fileExt;

  const tmpPath = path.resolve(__dirname, '../tmp', filename);
  const publicPath = path.resolve(__dirname, '../public/avatars', newFilename);

  await Jimp.read(tmpPath)
    .then(async image => {
      await image.resize(250, Jimp.AUTO).writeAsync(tmpPath);
    })
    .then(() => {
      fs.renameSync(tmpPath, publicPath);
    })
    .catch(error => {
      throw new Error(error);
    });

  try {
    const avatarURL = STATIC_URL + PORT + '/avatars/' + newFilename;
    const user = await User.findByIdAndUpdate(id, { avatarURL: avatarURL }, { new: true });
    res.status(200).json(user.avatarURL);
  } catch (error) {
    next(error);
  }
}

async function userVerification(req, res, next) {
  const { verificationToken } = req.params;
  try {
    const user = await User.findOne({ verificationToken });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await User.findByIdAndUpdate(user._id, {
      verify: true,
      verificationToken: '',
    });
    res.status(200).json({ message: 'Verification successful' });
  } catch (error) {
    next(error);
  }
}

async function secondVerificationEmailSend(req, res, next) {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Missing required field email' });
  }

  try {
    const user = await User.findOne({ email });

    if (user.verify) {
      return res.status(400).json({ message: 'Verification has already been passed' });
    }

    const token = user.verificationToken;
    sendConfirmationEmail(email, token, next);
    res.status(200).json({ message: 'Verification email sent' });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  registration,
  login,
  currentUser,
  logout,
  updateSubscription,
  changeAvatar,
  userVerification,
  secondVerificationEmailSend,
};
