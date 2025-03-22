const express = require('express')
const router = express.Router()
const middleware = require('../../middleware/authentication')
const controllers = require('../../controllers/Admin/aspekPenilaian')

router.post('/aspek-penilaian', middleware.verifyTokenUser, controllers.tambahAspek)
router.post('/indikator', middleware.verifyTokenUser, controllers.tambahIndikator)
router.post('/bukti-dukung', middleware.verifyTokenUser, controllers.tambahBuktiDukung)
router.post('/skala-indikator', middleware.verifyTokenUser, controllers.tambahSkalaIndikator)
router.get('/tipe-pertanyaan', controllers.tipePertanyaan)
router.post('/pertanyaan', controllers.tambahPertanyaan)

router.get('/aspek-penilaian', controllers.allAspek)
router.get('/aspek-penilaian/:id_aspek_penilaian', controllers.detailAspek)
router.put('/aspek-penilaian/:id_aspek_penilaian', middleware.verifyTokenUser, controllers.editAspekPenilaian)

router.put('/indikator/:id_indikator', middleware.verifyTokenUser, controllers.editIndikator)
router.put('/bukti-dukung/:id_bukti_dukung', middleware.verifyTokenUser, controllers.editBuktiDukung)
router.put('/skala-indikator/:id_skala', middleware.verifyTokenUser, controllers.editSkalaIndikator)
router.put('/pertanyaan/:id_pertanyaan', middleware.verifyTokenUser, controllers.editPertanyaan)

router.delete('/aspek-penilaian/:id_aspek_penilaian', middleware.verifyTokenUser, controllers.hapusAspekPenilaian)
router.delete('/indikator/:id_indikator', middleware.verifyTokenUser, controllers.hapusIndikator)
router.delete('/bukti-dukung/:id_bukti_dukung', middleware.verifyTokenUser, controllers.hapusBuktiDukung)
router.delete('/skala-indikator/:id_skala', middleware.verifyTokenUser, controllers.hapusSkalaIndikator)
router.delete('/pertanyaan/:id_pertanyaan', middleware.verifyTokenUser, controllers.hapusPertanyaan)

module.exports = router