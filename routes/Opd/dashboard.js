const express = require('express')
const router = express.Router()
const middleware = require('../../middleware/authentication')
const controllers = require('../../controllers/Opd/dashboard')

router.get('/hasil-evaluasi-opd', middleware.verifyTokenUser, controllers.hasilEvaluasiOpd)
router.get('/status-formulir', middleware.verifyTokenUser, controllers.statusFormulir)
router.get('/bukti-dukung-opd', middleware.verifyTokenUser, controllers.getBuktiDukung)
router.get('/komponen-nilaif02-opd', middleware.verifyTokenUser, controllers.getNilaiKomponenF02)

module.exports = router