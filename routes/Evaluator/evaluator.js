const express = require('express')
const router = express.Router()
const middleware = require('../../middleware/authentication')
const controllers = require('../../controllers/Evaluator/evaluator')

router.post('/login-evaluator', controllers.loginEvaluator)
router.delete('/logout-evaluator', middleware.verifyTokenUser, controllers.logoutEvaluator)

module.exports = router