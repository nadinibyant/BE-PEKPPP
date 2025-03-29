const {ValidationError, NotFoundError} = require('../../utils/error')
const db = require('../../models')
const sequelize = require('../../config/database')
const { Op, where, Sequelize } = require('sequelize');
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

//login 
const loginEvaluator = async(req, res) => {
    let transaction;
    try {
        transaction = await sequelize.transaction();

        const {email, password} = req.body;
        if (!email || !password) {
            throw new ValidationError('Silahkan lengkapi data akun anda');
        }

        const findUser = await db.User.findOne({
            where: { email },
            include: [
                {
                    model: db.Evaluator,
                    as: 'evaluator',
                    required: true 
                }
            ]
        });

        if (!findUser) {
            throw new ValidationError('Akun evaluator dengan email ini tidak ditemukan');
        }

        const isPassValid = await bcrypt.compare(password, findUser.password);
        if (!isPassValid) {
            throw new ValidationError('Password anda salah');
        }

        const token = jwt.sign(
            {id_user: findUser.id_user, role: 'evaluator'},
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
                    id_evaluator: findUser.id_user,
                    email: findUser.email,
                    nama: findUser.evaluator.nama,
                    role: 'evaluator'
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

//logout 
const logoutEvaluator = async (req,res) => {
    try {
        const id_user = req.user.id_user
        const authHeader = req.get('Authorization')
        const authToken = authHeader.split(' ')[1]
        const isEvaluator = await db.Evaluator.findOne({
            where: { id_evaluator: id_user }
        })
        
        if (!isEvaluator) {
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

module.exports = {loginEvaluator, logoutEvaluator}