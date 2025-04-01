const express = require('express')
const router = express.Router()
const middleware = require('../../middleware/authentication')
const controllers = require('../../controllers/Admin/dashboard')

router.get('/stats-data-admin', middleware.verifyTokenUser, controllers.statsData)
router.get('/dashboard-nilai-f02', middleware.verifyTokenUser, controllers.getNilaiF02)
router.get('/dashboard-submit-f01', middleware.verifyTokenUser, controllers.dataSumbitF01)
router.get('/top-10-opd', middleware.verifyTokenUser, controllers.top10Opd)

module.exports = router