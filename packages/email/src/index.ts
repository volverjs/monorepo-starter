import { type TransportOptions, createTransport } from 'nodemailer'
import type { User } from 'better-auth'
import type Mail from 'nodemailer/lib/mailer'
import { logger } from 'logger'
import { resetPasswordTemplate } from './templates'

const transport = createTransport({
    host: process.env.VITE_SMTP_HOST,
    port: process.env.VITE_SMTP_PORT,
    secure: process.env.VITE_SMTP_SECURE === 'true',
    auth: {
        user: process.env.VITE_SMTP_AUTH_USERNAME,
        pass: process.env.VITE_SMTP_AUTH_PASSWORD,
    },
} as TransportOptions)

async function sendEmail(options: Mail.Options) {
    if (!options.from && process.env.VITE_EMAIL_FROM) {
        options.from = process.env.VITE_EMAIL_FROM
    }
    if (!options.replyTo && process.env.VITE_EMAIL_REPLY_TO) {
        options.replyTo = process.env.VITE_EMAIL_REPLY_TO
    }
    try {
        await transport.sendMail(options)
    } catch (error) {
        logger.error('Error while sending the email:', error)
        throw error
    }
}

const sendResetPassword = async (options: {
    user: User
    url: string
    token: string
}) => {
    const inboxPreviewText = `Hello ${options.user.name},\n\nTo reset your password, please click the link below:\n\n${options.url}\n\nIf you did not request this email, please ignore it.\n\nThank you!`
    const html = resetPasswordTemplate({
        ...options,
        inboxPreviewText,
        frontendUrl: process.env.VITE_FRONTEND_URL,
    })
    await sendEmail({
        to: options.user.email,
        subject: 'Reset your password',
        html,
        text: inboxPreviewText,
    })
}

export { sendResetPassword }
