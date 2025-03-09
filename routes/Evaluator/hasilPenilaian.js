const express = require('express')
const router = express.Router()
const middleware = require('../../middleware/authentication')
const controllers = require('../../controllers/Evaluator/hasilPenilaian')

router.get('/penilaian-f02-evaluator', middleware.verifyTokenUser, controllers.getPenilaian)
router.post('/req-akses', middleware.verifyTokenUser, controllers.reqAkses)


module.exports = router