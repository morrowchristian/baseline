/* backend/server.js */
const express = require('express');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const app = express();

app.use(express.json());

app.post('/password-reset', (req, res) => {
  const { email } = req.body;
  const token = crypto.randomBytes(20).toString('hex');

  // Save the token and email in your database (not shown here)
  // Example: saveToken(email, token);

  const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: 'your-email@gmail.com',
      pass: 'your-email-password'
    }
  });

  const mailOptions = {
    to: email,
    from: 'your-email@gmail.com',
    subject: 'Password Reset',
    text: `You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n
           Please click on the following link, or paste this into your browser to complete the process:\n\n
           http://your-frontend-url/reset-password/${token}\n\n
           If you did not request this, please ignore this email and your password will remain unchanged.\n`
  };

  transporter.sendMail(mailOptions, (err) => {
    if (err) {
      return res.status(500).send('Error sending email');
    }
    res.status(200).send('Password reset link sent');
  });
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});