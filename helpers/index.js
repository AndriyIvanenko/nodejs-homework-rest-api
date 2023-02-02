const nodemailer = require('nodemailer');
// const sendgridMail = require('@sendgrid/mail');

// const { SENDGRID_API_KEY, PORT } = process.env;
const { MAILTRAP_PASSWORD, PORT } = process.env;

function tryCatchWrapper(endpointFunction) {
  return async (req, res, next) => {
    try {
      await endpointFunction(req, res, next);
    } catch (error) {
      next(error);
    }
  };
}

async function sendConfirmationEmail(email, token, next) {
  const verificationEmail = {
    to: email,
    from: 'andriy.ivanenko@gmail.com',
    subject: 'Please confirm your e-mail address',
    html: `<h3>For confirmation your e-mail address click link below</h3> <a href="http://localhost:${PORT}/api/users/verify/${token}">Confirm your email</a>`,
    text: 'test',
  };

  // -----------------SANDGRID--------------------------

  // sendgridMail.setApiKey(SENDGRID_API_KEY);
  // try {
  //   await sendgridMail.send(verificationEmail);
  // } catch (error) {
  //   next(error);
  // }

  // -----------------NODEMAILER-----------------------

  const transport = nodemailer.createTransport({
    host: 'sandbox.smtp.mailtrap.io',
    port: 2525,
    auth: {
      user: '596bce0032e1e1',
      pass: MAILTRAP_PASSWORD,
    },
  });

  try {
    await transport.sendMail(verificationEmail);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  tryCatchWrapper,
  sendConfirmationEmail,
};
