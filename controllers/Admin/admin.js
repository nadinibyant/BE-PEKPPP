const bcrypt = require('bcrypt');
const sequelize = require('../../config/database')
const db = require('../../models')
const jwt = require('jsonwebtoken')

// regis admin
const regisAdmin = async (req,res) => {
    const transaction = await sequelize.transaction();
    try {
        const {email, password, nama} = req.body
        if (!email || !password || !nama) {
            return res.status(400).json({
                success: false,
                status: 400,
                message: 'Silahkan lengkapi data akun admin'
            })
        }

        if (password.length < 8) {
            return res.status(400).json({
                success: false,
                status: 400,
                message: 'Password minimal 8 karakter'
            })
        }

        const findAdmin = await db.User.findOne({
            where:{email},
            transaction
        })
        if (findAdmin) {
            return res.status(400).json({
                success: false,
                status:400,
                message: 'Email sudah digunakan'
            })
        }

        const hashPass = await bcrypt.hash(password, 10)
        const addUser = await db.User.create({
            email,
            password: hashPass
        }, {transaction})

        await transaction.commit()

        await db.Admin.create({
            id_admin: addUser.id_user,
            nama
        })

        return res.status(200).json({
            success: true, 
            status: 200, 
            message: 'Akun admin berhasil ditambahkan'
        })


    } catch (error) {
        await transaction.rollback()

        console.error(error)
        return res.status(500).json({
            status: 500,
            success: false, 
            message: error || 'Kesalahan Server'
        })
    }
}

// login admin
const loginAdmin = async (req,res) => {
    try {
        const {email, password} = req.body
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                status: 400,
                message: 'Silahkan lengkapi data akun anda'
            })
        }

        const findUser = await db.User.findOne({
            where:{email},
            include: [
                {
                    model: db.Admin,
                    as: 'admin'
                }
            ]
        })

        if (!findUser) {
            return res.status(400).json({
                success: false,
                status: 400,
                message: 'Email tidak ditemukan'
            })
        }

        if (!findUser.admin) {
            return res.status(400).json({
                success: false, status: 400, message: 'Admin tidak ditemukan'
            })
        }
    
        const isPassValid = await bcrypt.compare(password, findUser.password)
        if (!isPassValid) {
            return res.status(400).json({success: false, status: 400, message: 'Password anda salah'})
        }

        const token = jwt.sign(
            {id_admin: findUser.id_user, email: findUser.email, nama:findUser.admin.nama},
            process.env.ACCESS_TOKEN_SECRET,
            {expiresIn: '1w'}
        )
        
        await db.Token_user.create({
            token,
            id_user: findUser.id_user,
            expired_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        })

        return res.status(200).json({
            success: true, 
            status: 200,
            message: 'Login berhasil',
            data: {
                token,
                user: {
                    id_admin: findUser.id_user,
                    email: findUser.email,
                    nama: findUser.admin.nama
                }
            }
        })

    } catch (error) {
        console.error(error)
        return res.status(500).json({
            success: false,
            status: 500,
            message: error || 'Kesalahan Server'
        })
    }
}

// logout
const logoutAdmin = async (req,res) => {
    try {
        const id_user = req.user.id_user
        const authHeader = req.get('Authorization')
        const authToken = authHeader.split(' ')[1]
        const isAdmin = await db.Admin.findOne({
            where: { id_admin: id_user }
        })
        
        if (!isAdmin) {
            return res.status(403).json({
                success: false, 
                status: 403, 
                message: 'Tidak memiliki akses'
            })
        }
        const result = await db.Token_user.destroy({
            where: {
                id_user,
                token: authToken
            }
        })

        if (result === 0) {
            return res.status(400).json({
                success: false, 
                status: 400, 
                message: 'Token tidak ditemukan'
            })
        }

        return res.status(200).json({
            success: true, 
            status: 200, 
            message: 'Logout berhasil'
        })
    } catch (error) {
        console.error(error)
        return res.status(500).json({success: false, status: 500, message: 'Kesalahan Server'})
    }
}

module.exports = {regisAdmin, loginAdmin, logoutAdmin}