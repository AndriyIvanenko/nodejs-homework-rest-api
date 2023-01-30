const express = require('express');
const {
  registration,
  login,
  currentUser,
  logout,
  updateSubscription,
  changeAvatar,
  userVerification,
} = require('../../controllers/users');
const { tryCatchWrapper } = require('../../helpers');
const { authorization, upload, sendConfirmationEmail } = require('../../middleware');
const { userValidation } = require('../../validation/user');

const usersRouter = express.Router();

usersRouter.post(
  '/register',
  userValidation,
  sendConfirmationEmail,
  tryCatchWrapper(registration)
);
usersRouter.get('/login', userValidation, tryCatchWrapper(login));
usersRouter.get('/current', tryCatchWrapper(authorization), tryCatchWrapper(currentUser));
usersRouter.post('/logout', tryCatchWrapper(authorization), tryCatchWrapper(logout));
usersRouter.patch('/', tryCatchWrapper(authorization), tryCatchWrapper(updateSubscription));
usersRouter.patch(
  '/avatar',
  tryCatchWrapper(authorization),
  upload.single('avatar'),
  tryCatchWrapper(changeAvatar)
);
usersRouter.get('/verify/:verificationToken', tryCatchWrapper(userVerification));

module.exports = usersRouter;
