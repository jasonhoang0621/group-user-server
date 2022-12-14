const inviteCol = require('../dataModel/inviteCol')
const groupCol = require('../dataModel/groupCol')
const ObjectID = require('mongodb').ObjectId
const emailCol = require('../utils/email.js')
const userCol = require('../dataModel/userCol')

async function create(req, res) {
    try {
        let data = req.body
        const groupId = req.params.code
        data.id = ObjectID().toString()
        data.groupId = groupId

        const user = req.user
        for (property of inviteCol.createValidation) {
            if (data[property] === undefined) {
                return res.json({
                    errorCode: true,
                    data: `Please input ${property}`,
                })
            }
        }
        if (data.isEmail && data.memberEmail.length <= 0) {
            return res.json({
                errorCode: true,
                data: `Please input member's email`,
            })
        }
        const checkOwner = await groupCol.findOne(groupId)
        let check = false
        checkOwner.members.map((item) => {
            if (
                item.id === user.id &&
                (item.role.includes('owner') || item.role.includes('co-owner'))
            ) {
                check = true
            }
        })
        if (check === false) {
            return res.json({
                errorCode: true,
                data: `You don't have permission to invite people to this group`,
            })
        }
        data.createdBy = user.id
        data.createdAt = new Date()
        let member = null
        if (data.isEmail) {
            for (let i = 0; i < data.memberEmail.length; i++) {
                member = await userCol.findOne(data.memberEmail[i])
                await emailCol.sendEmailInvite(member.email, data.id, member.id)
            }
        } else {
            data.member = null
        }
        const invite = await inviteCol.create(data)
        if (!invite) {
            return res.json({ errorCode: true, data: 'System error' })
        }
        return res.json({ errorCode: null, data: data })
    } catch (error) {
        return res.json({ errorCode: true, data: 'system error' })
    }
}

const joinGroup = async (req, res) => {
    try {
        const user = req.user
        const data = {
            id: user.id,
            role: 'member',
        }
        const invite = await inviteCol.findOne(req.params.code)
        if (!invite) {
            return res.json({
                errorCode: true,
                data: 'Cannot find the invitation',
            })
        }
        const group = await groupCol.findOne(invite.groupId)
        if (!group) {
            return res.json({ errorCode: true, data: 'Cannot find this group' })
        }
        let check = false
        for (let i = 0; i < group.members.length; i++) {
            if (group.members[i].id === user.id) {
                check = true
            }
        }
        if (check) {
            return res.json({
                errorCode: true,
                data: 'You are already in group',
            })
        }
        let result = await groupCol.addGroup(invite.groupId, data)
        result.members.push(data)
        return res.json({
            errorCode: null,
            data: { ...result, userId: user.id },
        })
    } catch (error) {
        return res.json({ errorCode: true, data: 'system error' })
    }
}
const joinGroupByEmail = async (req, res) => {
    try {
        if (!req.query.userId) {
            return res.json({ errorCode: true, data: 'Error System' })
        }
        const userId = req.query.userId
        const data = {
            id: userId,
            role: 'member',
        }
        const invite = await inviteCol.findOne(req.params.code)
        if (!invite) {
            return res.json({
                errorCode: true,
                data: 'Cannot find the invitation',
            })
        }
        const group = await groupCol.findOne(invite.groupId)
        if (!group) {
            return res.json({
                errorCode: true,
                data: 'Cannot find this group',
            })
        } else {
            let check = false
            group.members.map((item) => {
                if (item.id === userId) {
                    check = true
                }
            })
            if (check) {
                return res.redirect(
                    `https://advance-web-presentation.netlify.app/redirect/${userId}`
                )
            }
        }
        let result = await groupCol.addGroup(invite.groupId, data)
        result.members.push(data)
        return res.redirect(
            `https://advance-web-presentation.netlify.app/redirect/${userId}`
        )
    } catch (error) {
        return res.json({ errorCode: true, data: 'system error' })
    }
}

module.exports = {
    create,
    joinGroup,
    joinGroupByEmail,
}
