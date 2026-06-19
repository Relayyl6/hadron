import nodemailer from "nodemailer";
import dotenv from "dotenv";
import ejs from "ejs";
import path from "path"

dotenv.config()

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: true, // use STARTTLS (upgrade connection to TLS after connecting)
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  logger: true,
  debug: true,
})

// Render an ejs email template here 
const renderEmailTemplate = async (templateName: string, templateDate: Record<string, any>): Promise<string> => {
    const templatePath = path.join(
        __dirname,
        "assets",
        "email-template",
        `${templateName}.ejs`
    );

    return ejs.renderFile(templatePath, templateDate)
}

export const sendEmail = async (
    to: string,
    subject: string,
    templateName: string,
    templateData: Record<string, any>
) => {
    try {
        const html = await renderEmailTemplate(templateName, templateData);

        await transporter.sendMail({
            from: `${process.env.SMTP_USER}`, // sender address
            to: to, // list of recipients
            subject, // subject line
            html, // HTML body
        });

        return true
    } catch (error) {
        console.log("Error sending email", error);
        throw new Error("Failed to send email");
    }
}