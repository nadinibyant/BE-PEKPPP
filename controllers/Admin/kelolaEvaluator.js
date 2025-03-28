const bcrypt = require('bcrypt')
const db = require('../../models')
const sequelize = require('../../config/database')
const { ValidationError, NotFoundError } = require('../../utils/error')

const tambahEvaluator = async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        const {sumberEvaluator, nama, email, password, id_opd, no_hp} = req.body;

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
                throw new ValidationError('Data OPD tidak ditemukan')
            }

            const existingUser = await db.User.findOne({
                where: { 
                    email: findOpd.user.email,
                    id_user: { [db.Sequelize.Op.ne]: findOpd.user.id_user }
                }
            });
            
            if (existingUser) {
                throw new ValidationError('Email OPD ini sudah terdaftar sebagai pengguna lain');
            }

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
                nama: findOpd.nama_opd,
                no_hp: no_hp
            }, {transaction});

        } else {
            if(!nama || !email || !password) {
                throw new ValidationError('Silahkan lengkapi data akun evaluator');
            }

            if (password.length < 8) {
                throw new ValidationError('Password minimal 8 karakter')
            }

            const existingUser = await db.User.findOne({
                where: { email }
            });
            
            if (existingUser) {
                throw new ValidationError('Email sudah digunakan, silahkan gunakan email lain');
            }

            const hashPass = await bcrypt.hash(password, 10);

            const addUser = await db.User.create({
                email,
                password: hashPass
            }, {transaction});

            await db.Evaluator.create({
                id_evaluator: addUser.id_user,
                nama,
                no_hp
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
const allEvaluator = async (req, res) => {
    try {
        const findEvaluator = await db.Evaluator.findAll({
            attributes: ['id_evaluator', 'nama', 'no_hp'],
            include: [
                {
                    model: db.User,
                    as: 'user',
                    attributes: ['email']
                }
            ],
            separate: true,
            order: [['nama', 'ASC']]
        });

        if (findEvaluator.length <= 0) {
            throw new ValidationError('Data Evaluator belum tersedia');
        }

        const totalEvaluasi = await db.sequelize.query(`
            SELECT 
                e.id_evaluator, 
                COUNT(pf02.id_pengisian_f02) as total_evaluasi
            FROM 
                Evaluators e
            LEFT JOIN 
                Evaluator_periode_penilaians epp ON e.id_evaluator = epp.id_evaluator
            LEFT JOIN 
                Pengisian_f02s pf02 ON epp.id_evaluator_periode_penilaian = pf02.id_evaluator_periode_penilaian
            GROUP BY 
                e.id_evaluator
        `, { type: db.sequelize.QueryTypes.SELECT });

        const result = findEvaluator.map(evaluator => {
            const evaluatorData = evaluator.toJSON();
            const evaluasiData = totalEvaluasi.find(item => item.id_evaluator === evaluator.id_evaluator);
            
            return {
                ...evaluatorData,
                total_evaluasi: evaluasiData ? parseInt(evaluasiData.total_evaluasi) : 0
            };
        });

        return res.status(200).json({
            success: true, 
            status: 200, 
            message: 'Data evaluator tersedia', 
            data: result
        });

    } catch (error) {
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
                    status: 404,
                    message: error.message
                });
                
            default:
                return res.status(500).json({
                    success: false,
                    status: 500,
                    message: 'Kesalahan Server'
                });
        }
    }
};

//edit evaluator
const editEvaluator = async (req, res) => {
    let transaction;
    try {
        transaction = await sequelize.transaction();
        const {id_evaluator} = req.params;
        const {nama, email, password, no_hp} = req.body;

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

        const evaluatorUpdateData = {};
        if (nama && nama !== findEvaluator.nama) {
            evaluatorUpdateData.nama = nama;
        }
        if (no_hp !== undefined) {
            evaluatorUpdateData.no_hp = no_hp;
        }

        if (Object.keys(evaluatorUpdateData).length > 0) {
            await db.Evaluator.update(evaluatorUpdateData, {
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

        const relatedPeriods = await db.Evaluator_periode_penilaian.findAll({
            where: {id_evaluator},
            transaction
        });

        for (const period of relatedPeriods) {
            const relatedF02s = await db.Pengisian_f02.findAll({
                where: { 
                    id_evaluator_periode_penilaian: period.id_evaluator_periode_penilaian 
                },
                transaction
            });

            for (const f02 of relatedF02s) {
                await db.Izin_hasil_penilaian.destroy({
                    where: { id_pengisian_f02: f02.id_pengisian_f02 },
                    transaction
                });
            }

            await db.Pengisian_f02.destroy({
                where: { 
                    id_evaluator_periode_penilaian: period.id_evaluator_periode_penilaian 
                },
                transaction
            });
        }

        await db.Evaluator_periode_penilaian.destroy({
            where: {id_evaluator},
            transaction
        });
 
        await db.Evaluator.destroy({
            where: {id_evaluator}, 
            transaction
        });
        
        await db.User.destroy({
            where: {id_user: id_evaluator}, 
            transaction
        });

        await transaction.commit();
        res.status(200).json({
            success: true, 
            status: 200, 
            message: 'Data evaluator berhasil dihapus'
        });
        
    } catch (error) {
        await transaction.rollback();
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
                    status: 404,
                    message: error.message
                });
                
            default:
                return res.status(500).json({
                    success: false,
                    status: 500,
                    message: 'Kesalahan Server'
                });
        }
    }
}

module.exports = {tambahEvaluator, totalEvalutor, allEvaluator, hapusEvaluator, editEvaluator}