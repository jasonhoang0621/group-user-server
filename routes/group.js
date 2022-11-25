commands = [
    {
        name: 'create',
        controller: 'group',
        method: 'post',
        api: '/api/group',
        middleware: ['Authorization'],
    },
    {
        name: 'getAll',
        controller: 'group',
        method: 'get',
        api: '/api/groups',
        middleware: ['Authorization'],
    },
    {
        name: 'addMember',
        controller: 'group',
        method: 'post',
        api: '/api/group/:code',
        middleware: ['Authorization'],
    },
    {
        name: 'getOne',
        controller: 'group',
        method: 'get',
        api: '/api/group/:code',
        middleware: ['Authorization'],
    },
]
module.exports = commands