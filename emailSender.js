const nodemailer = require("nodemailer");
require("dotenv").config();

const sendVerificationEmail = async (email, otp) => {
  console.log("📧 Email function called with:", { email, otp });

  // Ensure environment variables are loaded
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error("❌ Missing email credentials in environment variables.");
    return;
  }

  console.log("📧 Sending email to:", email);

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS, // Use App Password if 2FA is enabled
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Your Verification Code",
    text: `Your OTP code is: ${otp}`,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Email sent successfully:", info.response);
  } catch (error) {
    console.error("❌ Error sending email:", error.message);
  }
};

module.exports = sendVerificationEmail;