const express = require('express')
const router = express.Router()
const middleware = require('../../middleware/authentication')
const controllers = require('../../controllers/Admin/verifikasif01')

router.get('/verifikasi-f01', middleware.verifyTokenUser, controllers.getDataVerifikasi)
router.get('/verifikasi-f01/:id_pengisian_f01', middleware.verifyTokenUser, controllers.detailVerifikasi)
router.get('/acc-verify', middleware.verifyTokenUser, controllers.accVerify)
router.get('/dec-verify', middleware.verifyTokenUser, controllers.decVerify)

module.exports = router