const {ValidationError, NotFoundError} = require('../../utils/error')
const db = require('../../models')
const sequelize = require('../../config/database')
const { Op, where, Sequelize } = require('sequelize');

//tambah periode 
const tambahPeriode = async (req, res) => {
    let transaction;
    try {
        const { tahun_periode, tanggal_mulai, tanggal_selesai } = req.body;
        if (!tahun_periode || !tanggal_mulai || !tanggal_selesai) {
            return res.status(400).json({
                success: false,
                status: 400,
                message: 'Lengkapi data periode penilaian'
            });
        }

        const dateStart = new Date(tanggal_mulai);
        const dateEnd = new Date(tanggal_selesai);
        
        if (dateEnd < dateStart) {
            return res.status(400).json({
                success: false,
                status: 400,
                message: 'Tanggal selesai tidak boleh lebih awal dari tanggal mulai'
            });
        }

        transaction = await sequelize.transaction();

        const [totalEvaluator, totalOpd, findTanggal] = await Promise.all([
            db.Evaluator.count({ transaction }),
            db.Opd.count({ transaction }),
            db.Periode_penilaian.findOne({
                where: { tahun_periode },
                transaction
            })
        ]);

        if (totalEvaluator < 4) {
            throw new ValidationError('Tim penilai atau evaluator masih kurang dari 4, silahkan tambahkan tim penilai terlebih dahulu');
        }

        if (totalOpd === 0) {
            throw new ValidationError('OPD belum tersedia, silahkan tambahkan OPD terlebih dahulu');
        }

        if (findTanggal) {
            throw new ValidationError('Periode tahun tersebut sudah tersedia');
        }
        const [newPeriode, randomEvaluator] = await Promise.all([
            db.Periode_penilaian.create({
                tahun_periode,
                tanggal_mulai,
                tanggal_selesai,
                status: 'nonaktif'
            }, { transaction }),
            db.Evaluator.findAll({
                order: Sequelize.literal('RAND()'),
                limit: 4,
                transaction
            })
        ]);
        
        const evaluatorPeriodeEntries = randomEvaluator.map(evaluator => ({
            id_evaluator: evaluator.id_evaluator,
            id_periode_penilaian: newPeriode.id_periode_penilaian
        }));
        
        await db.Evaluator_periode_penilaian.bulkCreate(evaluatorPeriodeEntries, { transaction });
        
        await transaction.commit();

        return res.status(200).json({
            success: true, 
            status: 200, 
            message: 'Periode penilaian berhasil ditambahkan'
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

//tampil periode 
const tampilPeriode = async (req,res) => {
    let transaction 
    try {
        const findPeriode = await db.Periode_penilaian.findAll({
            attributes: ['id_periode_penilaian', 'tahun_periode', 'tanggal_mulai', 'tanggal_selesai', 'status'],
            include: [
                {
                    model: db.Evaluator,
                    as: 'evaluators',
                    attributes: ['id_evaluator', 'nama'],
                    through: {
                        attributes: []
                    }
                }
            ],
            order: ['tahun_periode']
        })
        return res.status(200).json({success:true, status:200, message: 'Data periode ditemukan', data: findPeriode})

    } catch (error) {
        console.error(error);
        if (transaction) await transaction.rollback();
        
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

//edit periode
const editPeriode = async (req, res) => {
    let transaction;
    try {
        transaction = await sequelize.transaction();
        
        const { id_periode_penilaian } = req.params;
        const { tahun_periode, tanggal_mulai, tanggal_selesai } = req.body;

        const findPeriode = await db.Periode_penilaian.findByPk(id_periode_penilaian, { transaction });
        if (!findPeriode) {
            throw new NotFoundError('Data periode penilaian tidak ditemukan');
        }

        if (tahun_periode && tahun_periode !== findPeriode.tahun_periode) {
            const existingPeriode = await db.Periode_penilaian.findOne({
                where: {
                    tahun_periode,
                    id_periode_penilaian: { [db.Sequelize.Op.ne]: id_periode_penilaian }
                },
                transaction
            });
            
            if (existingPeriode) {
                throw new ValidationError(`Periode penilaian dengan tahun ${tahun_periode} sudah ada`);
            }
        }
        
        let dateStart = findPeriode.tanggal_mulai;
        let dateEnd = findPeriode.tanggal_selesai;
        
        if (tanggal_mulai) {
            dateStart = new Date(tanggal_mulai);
            if (isNaN(dateStart.getTime())) {
                throw new ValidationError('Format tanggal mulai tidak valid');
            }
        }
        
        if (tanggal_selesai) {
            dateEnd = new Date(tanggal_selesai);
            if (isNaN(dateEnd.getTime())) {
                throw new ValidationError('Format tanggal selesai tidak valid');
            }
        }
        
        if (dateEnd < dateStart) {
            throw new ValidationError('Tanggal selesai tidak boleh lebih awal dari tanggal mulai');
        }

        if (tanggal_mulai || tanggal_selesai) {
            const overlappingPeriode = await db.Periode_penilaian.findOne({
                where: {
                    id_periode_penilaian: { [db.Sequelize.Op.ne]: id_periode_penilaian },
                    [db.Sequelize.Op.or]: [
                        {
                            tanggal_mulai: { [db.Sequelize.Op.lte]: dateStart },
                            tanggal_selesai: { [db.Sequelize.Op.gte]: dateStart }
                        },
                        {
                            tanggal_mulai: { [db.Sequelize.Op.lte]: dateEnd },
                            tanggal_selesai: { [db.Sequelize.Op.gte]: dateEnd }
                        },
                        {
                            tanggal_mulai: { [db.Sequelize.Op.gte]: dateStart },
                            tanggal_selesai: { [db.Sequelize.Op.lte]: dateEnd }
                        }
                    ]
                },
                transaction
            });
            
            if (overlappingPeriode) {
                throw new ValidationError('Periode dengan tanggal tersebut sudah ada');
            }
        }
        
        await db.Periode_penilaian.update({
            tahun_periode: tahun_periode || findPeriode.tahun_periode,
            tanggal_mulai: dateStart,
            tanggal_selesai: dateEnd
        }, { 
            where: { id_periode_penilaian }, 
            transaction 
        });
 
        const updatedPeriode = await db.Periode_penilaian.findByPk(id_periode_penilaian, {
            attributes: ['id_periode_penilaian', 'tahun_periode', 'tanggal_mulai', 'tanggal_selesai', 'status'],
            include: [
                {
                    model: db.Evaluator,
                    as: 'evaluators', 
                    attributes: ['id_evaluator', 'nama'],
                    through: {
                        attributes: []
                    }
                }
            ],
            transaction
        });
        
        await transaction.commit();
        
        return res.status(200).json({
            success: true, 
            status: 200, 
            message: 'Data periode penilaian berhasil diperbaharui', 
            data: updatedPeriode
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

//hapus periode
const hapusPeriode = async (req, res) => {
    let transaction;
    try {
        transaction = await sequelize.transaction();
        
        const { id_periode_penilaian } = req.params;
        
        const [findPeriode, relatedData] = await Promise.all([
            db.Periode_penilaian.findByPk(id_periode_penilaian, { transaction }),

            Promise.all([
                db.Pengisian_f01.count({ where: { id_periode_penilaian }, transaction }),
                db.Nilai_akhir_kumulatif.count({ where: { id_periode_penilaian }, transaction }),
                db.Izin_hasil_penilaian.count({ where: { id_periode_penilaian }, transaction })
            ])
        ]);
        
        if (!findPeriode) {
            throw new NotFoundError('Data periode penilaian tidak ditemukan');
        }

        const [pengisianCount, nilaiCount, izinCount] = relatedData;
        
        if (pengisianCount > 0) {
            throw new ValidationError('Periode ini tidak dapat dihapus karena sudah digunakan dalam pengisian formulir');
        }
        
        if (nilaiCount > 0) {
            throw new ValidationError('Periode ini tidak dapat dihapus karena sudah memiliki nilai kumulatif');
        }
        
        if (izinCount > 0) {
            throw new ValidationError('Periode ini tidak dapat dihapus karena terkait dengan izin hasil penilaian');
        }

        await Promise.all([
            db.Evaluator_periode_penilaian.destroy({
                where: { id_periode_penilaian },
                transaction
            }),
            db.Periode_penilaian.destroy({
                where: { id_periode_penilaian },
                transaction
            })
        ]);
        
        await transaction.commit();
        return res.status(200).json({
            success: true,
            status: 200,
            message: 'Data periode berhasil dihapus'
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

//aktif/non aktif periode
const updateStatus = async (req,res) => {
    let transaction
    try {
        const {id_periode_penilaian} = req.params
        transaction = await sequelize.transaction();
        
        const findPeriode = await db.Periode_penilaian.findByPk(id_periode_penilaian, { transaction });
        
        if (!findPeriode) {
            throw new NotFoundError('Data periode tidak ditemukan');
        }

        const newStatus = findPeriode.status === 'nonaktif' ? 'aktif' : 'nonaktif';
        
        await db.Periode_penilaian.update(
            { status: newStatus },
            { where: { id_periode_penilaian }, transaction }
        );
        await transaction.commit();

        return res.status(200).json({
            success: true, 
            status: 200, 
            message: `Status periode penilaian berhasil diubah menjadi ${newStatus}`
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

module.exports ={tambahPeriode, tampilPeriode, editPeriode, hapusPeriode, updateStatus}