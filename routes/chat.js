const express = require('express')
const router = express.Router()
const controllers = require('../controllers/chat')
const middleware = require('../middleware/authentication')

router.post('/room', middleware.verifyTokenUser, controllers.createChatRoom)
router.get('/history/:id_room', middleware.verifyTokenUser, controllers.getChatHistory)
router.get('/rooms', middleware.verifyTokenUser, controllers.getAllChatRooms)

module.exports = router