const express = require('express')
const router = express.Router()
const middleware = require('../../middleware/authentication')
const controllers = require('../../controllers/Admin/kelolaEvaluator')

router.post('/evaluator', middleware.verifyTokenUser, controllers.tambahEvaluator)
router.get('/total-evaluator', middleware.verifyTokenUser, controllers.totalEvalutor)
router.get('/evaluator', middleware.verifyTokenUser, controllers.allEvaluator)
router.delete('/evaluator/:id_evaluator', middleware.verifyTokenUser, controllers.hapusEvaluator)
router.put('/evaluator/:id_evaluator', middleware.verifyTokenUser, controllers.editEvaluator)

module.exports = router