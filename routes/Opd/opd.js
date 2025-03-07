const express = require('express')
const router = express.Router()
const middleware = require('../../middleware/authentication')
const controllers = require('../../controllers/Opd/opd')

router.post('/login-opd', controllers.loginOpd)
router.delete('/logout-opd', middleware.verifyTokenUser, controllers.logoutOpd)

module.exports = router