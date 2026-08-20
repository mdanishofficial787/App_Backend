const transporter = require("../config/email");

const sendEmail = async ({
    to,
    subject,
    text,
    html,
}) => {
    try {

        const mailOptions = {
            from: `"Ride & Serve" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            text,
            html,
        };

        // TEMPORARY DEBUG LOG
        console.log("Sending email to:", to);
        console.log("Email subject:", subject);

        const info = await transporter.sendMail(
            mailOptions
        );

        // TEMPORARY DEBUG LOG
        console.log(
            "Email sent successfully:",
            info.messageId
        );

        console.log(
            "Accepted:",
            info.accepted
        );

        console.log(
            "Rejected:",
            info.rejected
        );

        return info;

    } catch (error) {

        console.error(
            "Send Email Error:",
            error
        );

        throw error;
    }
};

module.exports = sendEmail;