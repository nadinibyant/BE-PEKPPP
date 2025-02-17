const bcrypt = require('bcrypt')
const db = require('../../models')
const sequelize = require('../../config/database')
const { ValidationError, NotFoundError } = require('../../utils/error')

const tambahEvaluator = async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        const {sumberEvaluator, nama, email, password, id_opd} = req.body;

        if (!sumberEvaluator) {
            throw new ValidationError('Silahkan pilih sumber tim penilai/evaluator');
        }

        if (sumberEvaluator === 'dari_opd') {
            if (!password) {
                throw new ValidationError('Password anda belum terisi')
            }
            if (password.length < 8) {
                throw new ValidationError('Password minimal 8 karakter')
            }
            if (!id_opd) {
                throw new ValidationError('Silahkan pilih OPD yang diinginkan');
            }

            const findOpd = await db.Opd.findByPk(id_opd, {
                include: [{
                    model: db.User,
                    as: 'user',
                    attributes: ['id_user','email']
                }],
                attributes: ['nama_opd']
            });

            if (!findOpd) {
                throw new NotFoundError('Data OPD Tidak Ditemukan');
            }

            const hashPass = await bcrypt.hash(password, 10);
            
            const addUser = await db.User.create({
                email: findOpd.user.dataValues.email,
                password: hashPass
            }, {transaction});

            await db.Evaluator.create({
                id_evaluator: addUser.id_user,
                nama: findOpd.nama_opd
            }, {transaction});

        } else {
            if(!nama || !email || !password) {
                throw new ValidationError('Silahkan lengkapi data akun evaluator');
            }

            if (password.length < 8) {
                throw new ValidationError('Password minimal 8 karakter')
            }

            const hashPass = await bcrypt.hash(password, 10);

            const addUser = await db.User.create({
                email,
                password: hashPass
            }, {transaction});

            await db.Evaluator.create({
                id_evaluator: addUser.id_user,
                nama
            }, {transaction});
        }

        await transaction.commit();
        return res.status(200).json({
            success: true, 
            status: 200, 
            message: 'Akun Evaluator berhasil ditambahkan'
        });

    } catch (error) {
        await transaction.rollback();
        console.error(error);
    
        switch(error.constructor) {
            case ValidationError:
                return res.status(400).json({
                    success: false,
                    status:400,
                    message: error.message
                });
                
            case NotFoundError:
                return res.status(404).json({
                    success: false,
                    status:404,
                    message: error.message
                });
                
            default:
                return res.status(500).json({
                    success: false,
                    status:500,
                    message: 'Kesalahan Server'
                });
        }
    }
};

//total evaluator
const totalEvalutor = async (req,res) => {
    try {
        const total = await db.Evaluator.count()
        return res.status(200).json({success:true, status:200, message: 'Total Ditemukan', data: total})
    } catch (error) {
        console.error(error)
        return res.status(500).json({success:false, status: 500, message: 'Kesalahan Server'})
    }
}

//all evalutor
const allEvaluator = async (req,res) => {
    try {
        const findEvaluator = await db.Evaluator.findAll({
            attributes:['id_evaluator', 'nama'],
            include: [
                {
                    model:db.User,
                    as: 'user',
                    attributes: ['email']
                }
            ]
        })

        if (findEvaluator.length <0) {
            throw new ValidationError('Data Evaluator belum tersedia')
        }

        return res.status(200).json({success:true, status:200, message: 'Data evaluator tersedia', data: findEvaluator})

    } catch (error) {
        console.error(error)
        switch(error.constructor) {
            case ValidationError:
                return res.status(400).json({
                    success: false,
                    status:400,
                    message: error.message
                });
                
            case NotFoundError:
                return res.status(404).json({
                    success: false,
                    status:404,
                    message: error.message
                });
                
            default:
                return res.status(500).json({
                    success: false,
                    status:500,
                    message: 'Kesalahan Server'
                });
        }
    }
}

//edit evaluator
const editEvaluator = async (req, res) => {
    let transaction;
    try {
        transaction = await sequelize.transaction();
        const {id_evaluator} = req.params;
        const {nama, email, password} = req.body;

        const findEvaluator = await db.Evaluator.findByPk(id_evaluator, {
            include: [{
                model: db.User,
                as: 'user',
                attributes: ['id_user', 'email']
            }],
            transaction
        });

        if (!findEvaluator) {
            throw new NotFoundError('Data evaluator tidak ditemukan');
        }

        if (email && email !== findEvaluator.user.email) {
            const existingEmail = await db.User.findOne({
                where: {
                    email,
                    id_user: { [db.Sequelize.Op.ne]: findEvaluator.user.id_user }
                },
                transaction
            });

            if (existingEmail) {
                throw new ValidationError('Email sudah digunakan');
            }
        }

        let hashedPassword;
        if (password) {
            if (password.length < 8) {
                throw new ValidationError('Password minimal 8 karakter');
            }
            hashedPassword = await bcrypt.hash(password, 10);
        }

        const userUpdateData = {};
        if (email) userUpdateData.email = email;
        if (hashedPassword) userUpdateData.password = hashedPassword;

        if (Object.keys(userUpdateData).length > 0) {
            await db.User.update(userUpdateData, {
                where: { id_user: findEvaluator.user.id_user },
                transaction
            });
        }

        if (nama && nama !== findEvaluator.nama) {
            await db.Evaluator.update({ nama }, {
                where: { id_evaluator },
                transaction
            });
        }

        await transaction.commit();
        return res.status(200).json({
            success: true,
            status: 200,
            message: 'Data evaluator berhasil diperbaharui'
        });

    } catch (error) {
        if (transaction) await transaction.rollback();
        console.error(error);

        switch(error.constructor) {
            case ValidationError:
                return res.status(400).json({
                    success: false,
                    status: 400,
                    message: error.message
                });
                
            case NotFoundError:
                return res.status(404).json({
                    success: false,
                    status:404,
                    message: error.message
                });
                
            default:
                return res.status(500).json({
                    success: false,
                    status:500,
                    message: 'Kesalahan Server'
                });
        }
    }
};


//hapus evaluator
const hapusEvaluator = async (req,res) => {
    const transaction = await sequelize.transaction()
    try {
        const {id_evaluator} = req.params
        const findEvaluator = await db.Evaluator.findByPk(id_evaluator)
        if (!findEvaluator) {
            throw new NotFoundError('Data evaluator tidak ditemukan')
        }
        await db.Evaluator.destroy({where:{id_evaluator}, transaction})
        await db.User.destroy({where:{id_user:id_evaluator}, transaction})

        await transaction.commit()
        res.status(200).json({success:true, status:200, message: 'Data evaluator berhasil dihapus'})
        
    } catch (error) {
        await transaction.rollback()
        console.error(error)

        switch(error.constructor) {
            case ValidationError:
                return res.status(400).json({
                    success: false,
                    status:400,
                    message: error.message
                });
                
            case NotFoundError:
                return res.status(404).json({
                    success: false,
                    status:404,
                    message: error.message
                });
                
            default:
                return res.status(500).json({
                    success: false,
                    status:500,
                    message: 'Kesalahan Server'
                });
        }
    }
}

module.exports = {tambahEvaluator, totalEvalutor, allEvaluator, hapusEvaluator, editEvaluator}