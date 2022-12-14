const nodemailer = require('nodemailer')
const { google } = require('googleapis')

const sendEmail = async (email) => {
    try {
        const oAuth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_EMAIL_CLIENT_ID,
            process.env.GOOGLE_EMAIL_CLIENT_SECRET,
            process.env.GOOGLE_EMAIL_REDIRECT_URI
        )
        oAuth2Client.setCredentials({
            refresh_token: process.env.GOOGLE_EMAIL_REFRESH_TOKEN,
        })
        const accessToken = await oAuth2Client.getAccessToken()
        const transport = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                type: 'OAuth2',
                user: process.env.GOOGLE_EMAIL_USER,
                clientId: process.env.GOOGLE_EMAIL_CLIENT_ID,
                clientSecret: process.env.GOOGLE_EMAIL_CLIENT_SECRET,
                refreshToken: process.env.GOOGLE_EMAIL_REFRESH_TOKEN,
                accessToken: accessToken,
            },
        })
        const options = {
            from: 'THANH KHOI <lethanhkhoi081001@gmail.com>',
            to: email,
            subject: 'Hello User 🚀',
            text: 'This email is sent from the command line',
            html: `<p>🙋🏻‍♀️ This is a <b>verified email</b> Please click to this link to active your email <a href="https://presentation-server.onrender.com/api/verifyEmail/${email}">Active Email</a>.</p>`,
        }
        const result = await transport.sendMail(options)
        return true
    } catch (error) {
        console.log('error', error)
        return false
    }
}

const sendEmailInvite = async (email, inviteId, userId) => {
    try {
        const oAuth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_EMAIL_CLIENT_ID,
            process.env.GOOGLE_EMAIL_CLIENT_SECRET,
            process.env.GOOGLE_EMAIL_REDIRECT_URI
        )
        oAuth2Client.setCredentials({
            refresh_token: process.env.GOOGLE_EMAIL_REFRESH_TOKEN,
        })
        const accessToken = await oAuth2Client.getAccessToken()
        const transport = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                type: 'OAuth2',
                user: process.env.GOOGLE_EMAIL_USER,
                clientId: process.env.GOOGLE_EMAIL_CLIENT_ID,
                clientSecret: process.env.GOOGLE_EMAIL_CLIENT_SECRET,
                refreshToken: process.env.GOOGLE_EMAIL_REFRESH_TOKEN,
                accessToken: accessToken,
            },
        })
        const options = {
            from: 'THANH KHOI <lethanhkhoi081001@gmail.com>',
            to: email,
            subject: 'Hello User 🚀',
            text: 'This email is sent from the command line',
            html: `<p>🙋🏻‍♀️ This is a <b>invitation email</b> Please click to this link to join our group <a href="https://presentation-server.onrender.com/api/emailInvited/${inviteId}?userId=${userId}">Join Group</a>.</p>`,
        }
        const result = await transport.sendMail(options)('result', result)
        return true
    } catch (error) {
        console.log('error', error)
        return false
    }
}
const sendEmailPassword = async (email, newPassword) => {
    try {
        const oAuth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_EMAIL_CLIENT_ID,
            process.env.GOOGLE_EMAIL_CLIENT_SECRET,
            process.env.GOOGLE_EMAIL_REDIRECT_URI
        )
        oAuth2Client.setCredentials({
            refresh_token: process.env.GOOGLE_EMAIL_REFRESH_TOKEN,
        })
        const accessToken = await oAuth2Client.getAccessToken()
        const transport = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                type: 'OAuth2',
                user: process.env.GOOGLE_EMAIL_USER,
                clientId: process.env.GOOGLE_EMAIL_CLIENT_ID,
                clientSecret: process.env.GOOGLE_EMAIL_CLIENT_SECRET,
                refreshToken: process.env.GOOGLE_EMAIL_REFRESH_TOKEN,
                accessToken: accessToken,
            },
        })
        const options = {
            from: 'THANH KHOI <lethanhkhoi081001@gmail.com>',
            to: email,
            subject: 'Hello User 🚀',
            text: 'This email is sent from the command line',
            html: `<p>🙋🏻‍♀️ Your new password is ${newPassword}</p>`,
        }
        const result = await transport.sendMail(options)
        return true
    } catch (error) {
        console.log('error', error)
        return false
    }
}

module.exports = {
    sendEmail,
    sendEmailInvite,
    sendEmailPassword,
}
