const express = require('express')
const router = express.Router()
const middleware = require('../middleware/authentication')
const controllers = require('../controllers/profile')

router.put('/update-profile', middleware.verifyTokenUser, controllers.updateProfile)
router.put('/update-password', middleware.verifyTokenUser, controllers.updatePassword)

module.exports = router
