const express = require('express')
const router = express.Router()
const middleware = require('../../middleware/authentication')
const controllers = require('../../controllers/Admin/aspekPenilaian')

router.post('/aspek-penilaian', middleware.verifyTokenUser, controllers.tambahAspek)
router.post('/indikator', middleware.verifyTokenUser, controllers.tambahIndikator)
router.post('/bukti-dukung', middleware.verifyTokenUser, controllers.tambahBuktiDukung)
router.post('/skala-indikator', middleware.verifyTokenUser, controllers.tambahSkalaIndikator)
router.get('/tipe-pertanyaan', middleware.verifyTokenUser, controllers.tipePertanyaan)
router.post('/pertanyaan', middleware.verifyTokenUser, controllers.tambahPertanyaan)

router.get('/aspek-penilaian', middleware.verifyTokenUser, controllers.allAspek)
router.get('/aspek-penilaian/:id_aspek_penilaian', middleware.verifyTokenUser, controllers.detailAspek)

module.exports = router