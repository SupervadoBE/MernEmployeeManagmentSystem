import nodemailer from "nodemailer"

const transporter = nodemailer.createTransport({
    host: "smtp-relay.brevo.com",
    port: 587,
    // secure: false, // use STARTTLS (upgrade connection to TLS after connecting)
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
})

const sendEmail = async ({to, subject, body}) => {
    try {
        const response = await transporter.sendMail({
            from: process.env.SENDER_EMAIL,
            to,
            subject,
            html:body
        })

        return response    
    } catch (error) {
        console.error("E-posta gönderim hatası:", error)
        throw error // Inngest'in hatayı yakalayıp tekrar denemesi (retry) için kritik   
    }
}

export default sendEmail