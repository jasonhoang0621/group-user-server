const userCol = require('../dataModel/userCol')
const database = require('../utils/database')
const jwt = require('../utils/token')
const bcrypt = require('bcrypt')
const ObjectID = require('mongodb').ObjectId
const emailCol = require('../utils/email.js')
const saltRounds = 10
const recordPerPage = 100
const defaultPage = 1
async function login(req, res) {
    try {
        const user = await database
            .userModel()
            .findOne({ email: req.body.email, loginService: false })
        if (!user) {
            return res
                .status(400)
                .json({ errorCode: true, data: 'Cannot find this account' })
        }
        if (!user.email_verified) {
            return res
                .status(400)
                .json({ errorCode: true, data: 'Please verify your email' })
        }
        const checkPass = await bcrypt.compare(req.body.password, user.password)
        if (!checkPass) {
            return res
                .status(400)
                .json({ errorCode: true, data: 'Wrong email or password' })
        }
        user.token = await jwt.createSecretKey({ email: req.body.email })
        user.refreshToken = await jwt.createRefreshToken({
            email: req.body.email,
        })
        await database
            .userModel()
            .updateOne(
                { email: req.body.email },
                { $set: { refreshToken: user.refreshToken } }
            )
        delete user.password
        return res.json({ errorCode: null, data: user })
    } catch (error) {
        console.log(error)
        return res.status(400).json({ errorCode: true, data: error })
    }
}
async function register(req, res) {
    try {
        const validation = req.body
        for (property of userCol.validation) {
            if (validation[property] === null || validation[property] === '') {
                return res
                    .res(400)
                    .json({ errorCode: true, data: `Lack of ${property}` })
            }
        }
        const user = await database
            .userModel()
            .findOne({ email: req.body.email })
        if (user) {
            return res
                .status(400)
                .json({ errorCode: true, data: 'Existing email' })
        }
        if (req.body.rePassword) {
            const checkPass = req.body.password == req.body.rePassword
            if (!checkPass) {
                return res
                    .res(400)
                    .json({ errorCode: true, data: 'Wrong retype password' })
            }
        }
        const password = await bcrypt.hash(req.body.password, saltRounds)
        const data = {
            id: ObjectID().toString(),
            name: req.body.name,
            email: req.body.email,
            password: password,
            createdAt: new Date(),
            loginService: false,
            email_verified: false,
        }
        await userCol.create(data)
        delete data.password
        const resultEmail = await emailCol.sendEmail(data.email)
        if (!resultEmail) {
            return res.json({ errorCode: true, data: 'Error send email' })
        }
        return res.json({ errorCode: null, data: data })
    } catch (error) {
        return res.status(400).json({ errorCode: true, data: 'System error' })
    }
}

async function profile(req, res) {
    try {
        const user = await database
            .userModel()
            .findOne({ email: req.user.email })
        if (!user) {
            return res.status(401).json({ errorCode: true, data: 'No User' })
        }
        user.token = await jwt.createSecretKey({ email: req.user.email })
        delete user.password
        return res.json({ errorCode: null, data: user })
    } catch (error) {
        return res.status(400).json({ errorCode: true, data: error })
    }
}

async function refreshToken(req, res) {
    try {
        const user = await database.userModel().findOne({
            refreshToken: req.body.refreshToken,
        })
        if (!user) {
            return res.status(401).json({ errorCode: true, data: 'No User' })
        }
        user.token = await jwt.createSecretKey({ email: user.email })
        user.refreshToken = await jwt.createRefreshToken({
            email: user.email,
        })
        delete user.password
        await database
            .userModel()
            .updateOne(
                { email: user.email },
                { $set: { refreshToken: user.refreshToken } }
            )
        return res.json({ errorCode: null, data: user })
    } catch (error) {
        console.log(error)
        return res.status(400).json({ errorCode: true, data: error })
    }
}

async function userAuthentication(req, res, next) {
    try {
        let token = req.headers['authorization']
        if (!token) {
            return res.status(401).json({
                errorCode: true,
                data: 'No token provided',
            })
        }

        let verify = false
        try {
            verify = await jwt.verifyToken(token)
        } catch (e) {
            res.status(401)
            return res.json({
                errorCode: true,
                data: 'Invalid token',
            })
        }
        if (!verify) {
            return res.status(403).json({
                errorCode: true,
                data: 'Expired token',
            })
        }

        let user = []
        user = await database
            .userModel()
            .find({ email: verify?.email })
            .toArray()

        if (user.length == 0 || user.length > 1) {
            return res.status(401).json({
                errorCode: true,
                data: 'No user found',
            })
        }

        req.user = (({ id, email }) => ({
            id,
            email,
        }))(user[0])

        return next()
    } catch (error) {
        return res.json({ errorCode: true, data: 'system error' })
    }
}
const googleOauth = async (req, res) => {
    const rootUrl = 'https://accounts.google.com/o/oauth2/v2/auth'
    const options = {
        redirect_uri: process.env.GOOGLE_REDIRECT,
        client_id: process.env.GOOGLE_CLIENT_ID,
        access_type: 'offline',
        response_type: 'code',
        prompt: 'consent',
        scope: [
            'https://www.googleapis.com/auth/userinfo.email',
            'https://www.googleapis.com/auth/userinfo.profile',
        ].join(' '),
    }
    const qs = new URLSearchParams(options)
    return res.json({
        errorCode: null,
        data: `${rootUrl}?${qs.toString()}`,
    })
}
const verifyGoogle = async (req, res) => {
    try {
        const code = req.body.code
        const data = await userCol.getGoogleToken(code)
        const googleUser = await jwt.decodeToken(data.id_token)
        let user = await userCol.findOne(googleUser.email)
        if (!user) {
            let data = {
                id: ObjectID().toString(),
                name: googleUser.name,
                email: googleUser.email,
                password: null,
                createdAt: new Date(),
                loginService: true,
                email_verified: true,
            }
            await userCol.create(data)
            data.token = await jwt.createSecretKey({ email: googleUser.email })
            data.refreshToken = await jwt.createRefreshToken({
                email: googleUser.email,
            })
            delete data.password
            await database
                .userModel()
                .updateOne(
                    { email: googleUser.email },
                    { $set: { refreshToken: data.refreshToken } }
                )
            return res.json({ errorCode: null, data: data })
        }
        user.token = await jwt.createSecretKey({ email: googleUser.email })
        user.refreshToken = await jwt.createRefreshToken({
            email: googleUser.email,
        })
        delete user.password
        await database
            .userModel()
            .updateOne(
                { email: googleUser.email },
                { $set: { refreshToken: user.refreshToken } }
            )
        return res.json({ errorCode: null, data: user })
    } catch (error) {
        return res.redirect(
            'https://advance-web-presentation.netlify.app/login'
        )
    }
}
const verifyEmail = async (req, res) => {
    const email = req.params.code
    const user = await userCol.updateStatus(email)
    return res.redirect('https://advance-web-presentation.netlify.app/login')
}
const changePass = async (req, res) => {
    try {
        const user = req.user
        let body = req.body
        const data = await userCol.getDetailByEmail(user.email)
        if (!data) {
            return res.json({ errorCode: true, data: 'No User' })
        }
        const checkPass = await bcrypt.compare(body.password, data.password)
        if (!checkPass) {
            return res.json({ errorCode: true, data: 'Wrong password' })
        }
        if (body.newPassword !== body.rePassword) {
            return res.json({
                errorCode: true,
                data: 'Confirm password not match',
            })
        }
        delete body.rePassword
        const password = await bcrypt.hash(body.newPassword, saltRounds)
        body.password = password
        delete body.newPassword
        const update = await userCol.update(user.email, body)
        if (!update) {
            return res.json({ errorCode: true, data: 'Update fail' })
        }
        for (property of userCol.userProperties) {
            if (req.body[property]) {
                update[property] = req.body[property]
            }
        }
        delete update.password
        return res.json({ errorCode: null, data: update })
    } catch (error) {
        return res.json({ errorCode: true, data: 'system error' })
    }
}

const update = async (req, res) => {
    const user = req.user
    const data = await userCol.getDetailByEmail(user.email)
    if (!data) {
        return res.json({ errorCode: true, data: 'No User' })
    }
    const update = await userCol.update(user.email, req.body)
    if (!update) {
        return res.json({ errorCode: true, data: 'Update fail' })
    }
    for (property of userCol.userProperties) {
        if (req.body[property]) {
            update[property] = req.body[property]
        }
    }
    return res.json({ errorCode: null, data: update })
}
const getAll = async (req, res) => {
    try {
        const sortBy = {
            createdAt: -1,
        }
        const page = req.query.page ?? defaultPage
        const limit = req.query.limit ?? recordPerPage
        let match = {}
        match['deletedAt'] = null
        const data = await userCol.getAll(page, limit, sortBy, match)
        if (!data) {
            return res.json({
                errorCode: true,
                data: 'System error',
                metadata: {
                    recordTotal: 0,
                    pageCurrent: page,
                    recordPerPage: limit,
                },
            })
        }
        return res.json({
            errorCode: null,
            metadata: data[0].metadata[0],
            data: data[0].data,
        })
    } catch (error) {
        return res.json({ errorCode: true, data: 'system error' })
    }
}
const forgotPass = async (req, res) => {
    try {
        const email = req.body.email
        const account = await userCol.getDetailByEmail(email)
        if (!account) {
            return res.json({ errorCode: true, data: "Account doesn't exist" })
        }
        let newPass = (Math.random() + 1).toString(36).substring(2)
        account.password = await bcrypt.hash(newPass, saltRounds)
        const updated = await userCol.update(email, account)
        emailCol.sendEmailPassword(email, newPass)
        return res.json({
            errorCode: null,
            data: 'Your new password has been sent to your email',
        })
    } catch (error) {
        return res.json({ errorCode: true, data: 'system error' })
    }
}
module.exports = {
    login,
    register,
    profile,
    refreshToken,
    userAuthentication,
    googleOauth,
    verifyGoogle,
    verifyEmail,
    changePass,
    update,
    getAll,
    forgotPass,
}
