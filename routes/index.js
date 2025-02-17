const user = require('./user')
const admin = require('./Admin/admin')
const adminKelolaOpd = require('./Admin/kelolaOpd')
const adminKelolaEvaluator = require('./Admin/kelolaEvaluator')
const adminAspekPenilaian = require('./Admin/aspekPenilaian')
const server = {}

server.user = user
server.admin = admin
server.adminKelolaOpd = adminKelolaOpd
server.adminKelolaEvaluator = adminKelolaEvaluator
server.adminAspekPenilaian = adminAspekPenilaian

module.exports = server