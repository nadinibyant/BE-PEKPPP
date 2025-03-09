const express = require('express')
const router = express.Router()
const middleware = require('../../middleware/authentication')
const controllers = require('../../controllers/Admin/hasilPenilaian')

router.get('/evaluator-by-periode', middleware.verifyTokenUser, controllers.EvaluatorByPeriode)
router.get('/hasil-penilaian', middleware.verifyTokenUser, controllers.getHasilPenilaian)
router.get('/detail-hasil-penilaian', middleware.verifyTokenUser, controllers.detailHasilPenilaian)
router.post('/feedback', middleware.verifyTokenUser, controllers.addFeedback)
router.get('/detail-f02', middleware.verifyTokenUser, controllers.detailf02)
router.get('/detail-f01', middleware.verifyTokenUser, controllers.findf01)
router.post('/edit-f02', middleware.verifyTokenUser, controllers.editF02)

module.exports = router