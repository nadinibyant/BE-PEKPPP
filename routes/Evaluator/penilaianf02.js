const expresss = require('express')
const router = expresss.Router()
const middleware = require('../../middleware/authentication')
const controllers = require('../../controllers/Evaluator/penilaianf02')

router.get('/list-opd-f02', middleware.verifyTokenUser, controllers.listOpdf02)
router.get('/question-f02', middleware.verifyTokenUser, controllers.getQuestF02)
router.get('/detail-f01-opd/:id_indikator', middleware.verifyTokenUser, controllers.findf01Opd)
router.get('/detail-f01-opd/:id_indikator/:id_opd', middleware.verifyTokenUser, controllers.findf01OpdV2)
router.post('/submit-f02/:id_opd', middleware.verifyTokenUser, controllers.submitF02)

module.exports = router