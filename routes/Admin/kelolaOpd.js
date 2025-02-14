const express = require('express')
const router = express.Router()
const controllers = require('../../controllers/Admin/kelolaOpd')
const middleware = require('../../middleware/authentication')

router.post('/opd', middleware.verifyTokenUser, controllers.tambahOpd)
router.get('/opd', middleware.verifyTokenUser, controllers.listOpd)
router.put('/opd/:id_user', middleware.verifyTokenUser, controllers.editOpd)
router.delete('/opd/:id_user', middleware.verifyTokenUser, controllers.hapusOpd)

module.exports = router