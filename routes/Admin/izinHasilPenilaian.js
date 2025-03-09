const express = require('express')
const router = express.Router()
const middleware = require('../../middleware/authentication')
const controllers = require('../../controllers/Admin/izinHasilPenilaian')

router.get('/list-izin-penilaian', middleware.verifyTokenUser, controllers.listIzinPenilaian)
router.put('/acc-izin-hasil', middleware.verifyTokenUser, controllers.accIzinPenilaian)
router.put('/dec-izin-hasil', middleware.verifyTokenUser, controllers.declineIzin)

module.exports = router