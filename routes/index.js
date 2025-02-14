const user = require('./user')
const admin = require('./Admin/admin')
const adminKelolaOpd = require('./Admin/kelolaOpd')
const server = {}

server.user = user
server.admin = admin
server.adminKelolaOpd = adminKelolaOpd

module.exports = server