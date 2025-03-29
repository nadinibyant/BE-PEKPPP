const {ValidationError, NotFoundError} = require('../../utils/error')
const db = require('../../models')
const sequelize = require('../../config/database')
const { Op, where, Sequelize } = require('sequelize');
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

//login opd
const loginOpd = async(req, res) => {
    let transaction;
    try {
        transaction = await sequelize.transaction();

        const {email, password} = req.body;
        if (!email || !password) {
            throw new ValidationError('Silahkan lengkapi data akun anda');
        }

        const findUser = await db.User.findOne({
            where: {email},
            include: [
                {
                    model: db.Opd,
                    as: 'opd',
                    required: true 
                }
            ],
            transaction
        });

        if (!findUser) {
            throw new ValidationError('Email tidak ditemukan atau bukan akun OPD');
        }

        const isPassValid = await bcrypt.compare(password, findUser.password);
        if (!isPassValid) {
            throw new ValidationError('Password anda salah');
        }

        const token = jwt.sign(
            {id_user: findUser.id_user, role: 'opd'},
            process.env.ACCESS_TOKEN_SECRET,
            {expiresIn: '1w'}
        );
        
        await db.Token_user.create({
            token,
            id_user: findUser.id_user,
            expired_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        }, { transaction });

        await transaction.commit();

        return res.status(200).json({
            success: true, 
            status: 200,
            message: 'Login berhasil',
            data: {
                token,
                user: {
                    id_opd: findUser.id_user,
                    email: findUser.email,
                    nama: findUser.opd.nama_opd
                }
            }
        });
        
    } catch (error) {
        console.error(error);
        if (transaction) await transaction.rollback();
        
        if (error instanceof ValidationError) {
            return res.status(400).json({
                success: false,
                status: 400,
                message: error.message
            });
        } else if (error instanceof NotFoundError) {
            return res.status(404).json({
                success: false,
                status: 404,
                message: error.message
            });
        } else {
            return res.status(500).json({
                success: false,
                status: 500,
                message: 'Kesalahan Server'
            });
        }
    }
};

//logout opd
const logoutOpd = async (req,res) => {
    try {
        const id_user = req.user.id_user
        const authHeader = req.get('Authorization')
        const authToken = authHeader.split(' ')[1]
        const isOpd = await db.Opd.findOne({
            where: { id_opd: id_user }
        })
        
        if (!isOpd) {
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
            throw new ValidationError('Token Tidak Ditemukan')
        }

        return res.status(200).json({
            success: true, 
            status: 200, 
            message: 'Logout berhasil'
        })
    } catch (error) {
        console.error(error);
        if (transaction) await transaction.rollback();
        
        if (error instanceof ValidationError) {
            return res.status(400).json({
                success: false,
                status: 400,
                message: error.message
            });
        } else if (error instanceof NotFoundError) {
            return res.status(404).json({
                success: false,
                status: 404,
                message: error.message
            });
        } else {
            return res.status(500).json({
                success: false,
                status: 500,
                message: 'Kesalahan Server'
            });
        }
    }
}

module.exports = {loginOpd, logoutOpd}