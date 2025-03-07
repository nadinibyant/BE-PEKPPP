const express = require('express')
const router = express.Router()
const middleware = require('../../middleware/authentication')
const controllers = require('../../controllers/Opd/penilaianf01')
const { uploadBuktiDukung } = require('../../middleware/fileUpload')

router.get('/periode-opd', middleware.verifyTokenUser, controllers.getPeriode)
router.post('/penilaian-f01/:id_periode_penilaian/submit', middleware.verifyTokenUser, uploadBuktiDukung, controllers.submitPenilaianf01)

module.exports = router