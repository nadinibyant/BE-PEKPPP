const jwt = require('jsonwebtoken')
const db = require('../models')

const verifyTokenUser = (req, res, next) => {    
    try {
        const authHeader = req.get('Authorization');
    
        if (!authHeader) {
            return res.status(404).json({
                success: false,
                message: 'Masukkan token terlebih dahulu'
            })
        }

        const token = authHeader.split(' ')[1];
    
        jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, async (err, user) => {
            if (err) {
                console.error(err);
                return res.status(401).json({ success: false, message: err });
            }

            const adaToken = await db.Token_user.findOne({where: {token}})
            if (!adaToken) {
                return res.status(401).json({ success: false, message: "Tidak ada token atau sudah logout sebelumnya" });
            }

            const date = new Date()
            if (date > new Date(adaToken.expired_at)) {
                return res.status(400).json({success: false, message: 'Token Sudah Kadaluarsa'})
            } else {
                req.user = user;
                req.token = token
                next();
            }
        });
        
    } catch (error) {
        console.error(error)
        res.status(404).json({
            success: false,
            message: 'Session Token Has Expired'
        })
    }
};

module.exports = {verifyTokenUser}