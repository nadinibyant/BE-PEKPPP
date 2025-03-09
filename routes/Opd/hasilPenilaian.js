const express = require('express')
const router = express.Router()
const middleware = require('../../middleware/authentication')
const controllers = require('../../controllers/Opd/hasilPenilaian')

router.get('/list-penilaian-opd', middleware.verifyTokenUser, controllers.getPenilaianOpdPeriode)
router.get('/req-akses-opd', middleware.verifyTokenUser, controllers.reqAksesOpd)

module.exports = router