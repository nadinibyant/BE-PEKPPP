const express = require('express')
const router = express.Router()
const middleware = require('../../middleware/authentication')
const controllres = require('../../controllers/Evaluator/dashboard')

router.get('/opd-list-dash', middleware.verifyTokenUser, controllres.getPenilaianOpdList)

module.exports = router