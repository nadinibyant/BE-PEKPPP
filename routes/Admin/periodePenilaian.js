const express = require('express')
const router = express.Router()
const controllers = require('../../controllers/Admin/periodePenilaian')
const middleware = require ('../../middleware/authentication')

router.post('/periode', middleware.verifyTokenUser, controllers.tambahPeriode)
router.get('/periode', middleware.verifyTokenUser, controllers.tampilPeriode)
router.put('/periode/:id_periode_penilaian', middleware.verifyTokenUser, controllers.editPeriode)
router.put('/periode-status/:id_periode_penilaian', middleware.verifyTokenUser, controllers.updateStatus)
router.delete('/periode/:id_periode_penilaian', middleware.verifyTokenUser, controllers.hapusPeriode)

module.exports = router