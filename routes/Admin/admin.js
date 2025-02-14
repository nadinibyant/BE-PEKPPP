const express = require('express')
const router = express.Router()
const controllers = require('../../controllers/Admin/admin')
const middleware = require('../../middleware/authentication')

router.post('/admin', controllers.regisAdmin)
router.post('/loginAdmin', controllers.loginAdmin)
router.delete('/logoutAdmin', middleware.verifyTokenUser, controllers.logoutAdmin)


module.exports =router