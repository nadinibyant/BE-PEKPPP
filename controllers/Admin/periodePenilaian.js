const {ValidationError, NotFoundError} = require('../../utils/error')
const db = require('../../models')
const sequelize = require('../../config/database')
const { Op, where, Sequelize } = require('sequelize');
const { notifPeriodToAllOpd, notifPeriodToAllEvaluator, notifPeriodeCloseOpd, notifPeriodeCloseEvaluator } = require('../../services/notification');

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

        const overlappingPeriode = await db.Periode_penilaian.findOne({
            where: {
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
                    },
                    include: [
                        {
                            model: db.User,
                            as: 'user',
                            attributes: ['email']
                        }
                    ]
                }
            ],
            separate: true,
            order: [['tahun_periode', 'DESC']]
        })
        return res.status(200).json({success:true, status:200, message: 'Data periode ditemukan', data: findPeriode})

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
    let transaction;
    let notificationOPDResult = null;
    let notificationEvaluatorResults = null
    
    try {
        const {id_periode_penilaian} = req.params;
        transaction = await sequelize.transaction();
        
        const findPeriode = await db.Periode_penilaian.findByPk(id_periode_penilaian, {
            include: [
                {
                    model: db.Evaluator,
                    as: 'evaluators'
                }
            ],
            transaction
        });
        
        if (!findPeriode) {
            throw new NotFoundError('Data periode tidak ditemukan');
        }

        const newStatus = findPeriode.status === 'nonaktif' ? 'aktif' : 'nonaktif';
        
        await db.Periode_penilaian.update(
            { status: newStatus },
            { where: { id_periode_penilaian }, transaction }
        );
        
        // nilai jadi 0 ketika non aktif
        if (newStatus === 'nonaktif') {
            try {
                notificationOPDResult = await notifPeriodeCloseOpd(findPeriode);
                notificationEvaluatorResults = await notifPeriodeCloseEvaluator(findPeriode);

            } catch (notifError) {
                console.error('Gagal mengirim notifikasi:', notifError);
                notificationOPDResult = { 
                    success: false, 
                    message: 'Periode berhasil diaktifkan tetapi gagal mengirim notifikasi',
                    error: notifError.message 
                };
                notificationEvaluatorResults = { 
                    success: false, 
                    message: 'Periode berhasil diaktifkan tetapi gagal mengirim notifikasi',
                    error: notifError.message 
                };
            }

            console.log(`Periode penilaian ID: ${id_periode_penilaian} dinonaktifkan, mulai proses auto-zero...`);
            
            //semua OPD
            const allOpds = await db.Opd.findAll({transaction});
            
            //OPD yang belum mengisi F01
            const submittedF01Opds = await db.Pengisian_f01.findAll({
                where: {
                    id_periode_penilaian
                },
                attributes: ['id_opd'],
                transaction
            });
            
            const submittedOpdIds = submittedF01Opds.map(item => item.id_opd);
            const nonSubmittedOpds = allOpds.filter(opd => !submittedOpdIds.includes(opd.id_opd));
            
            console.log(`Ditemukan ${nonSubmittedOpds.length} OPD yang belum mengisi F01 dan akan diberikan nilai 0 otomatis`);
            
            // OPD yang sudah mengisi F01 tetapi belum dinilai oleh evaluator 
            const submittedF02Opds = await db.Pengisian_f02.findAll({
                include: [{
                    model: db.Evaluator_periode_penilaian,
                    as: 'evaluator_periode_penilaian',
                    where: {
                        id_periode_penilaian
                    },
                    required: true
                }],
                attributes: ['id_opd'],
                transaction
            });
            
            const evaluatedOpdIds = submittedF02Opds.map(item => item.id_opd);
            const submittedButNotEvaluatedOpds = allOpds.filter(opd => 
                submittedOpdIds.includes(opd.id_opd) && !evaluatedOpdIds.includes(opd.id_opd)
            );
            
            console.log(`Ditemukan ${submittedButNotEvaluatedOpds.length} OPD yang sudah mengisi F01 tetapi belum dinilai evaluator dan akan diberikan nilai 0 otomatis`);
            
            const opdsToSetZero = [...nonSubmittedOpds, ...submittedButNotEvaluatedOpds];
            
            if (opdsToSetZero.length > 0) {
                const evaluatorPeriodes = await db.Evaluator_periode_penilaian.findAll({
                    where: {
                        id_periode_penilaian
                    },
                    transaction
                });
                
                const zeroSkala = await db.Skala_indikator.findOne({
                    where: {
                        nilai_skala: 0
                    },
                    transaction
                });
                
                if (!zeroSkala) {
                    throw new ValidationError('Skala indikator dengan nilai 0 tidak ditemukan');
                }
                
                const allIndikators = await db.Indikator.findAll({transaction});
                const allAspeks = await db.Aspek_penilaian.findAll({transaction});
                
                for (const opd of opdsToSetZero) {
                    const isNotSubmitted = !submittedOpdIds.includes(opd.id_opd);
                    const feedbackMessage = isNotSubmitted 
                        ? 'OPD tidak mengisi formulir F01 sebelum periode penilaian berakhir'
                        : 'OPD sudah mengisi formulir F01 tetapi belum dinilai oleh evaluator';
                    
                    console.log(`Memproses OPD: ${opd.nama_opd} - ${feedbackMessage}`);
                    
                    const existingKumulatif = await db.Nilai_akhir_kumulatif.findOne({
                        where: {
                            id_opd: opd.id_opd,
                            id_periode_penilaian
                        },
                        transaction
                    });
                    
                    if (!existingKumulatif) {
                        console.log(`Membuat nilai kumulatif baru untuk OPD: ${opd.nama_opd}`);
                        
                        await db.Nilai_akhir_kumulatif.create({
                            total_kumulatif: 0,
                            kategori: 'E',
                            feedback: feedbackMessage,
                            id_opd: opd.id_opd,
                            id_periode_penilaian
                        }, {transaction});
                        
                        if (evaluatorPeriodes.length > 0) {
                            const evaluatorPeriode = evaluatorPeriodes[0];
                            
                            // Cek apakah sudah ada pengisian F02 untuk OPD 
                            const existingF02 = await db.Pengisian_f02.findOne({
                                where: {
                                    id_opd: opd.id_opd,
                                    id_evaluator_periode_penilaian: evaluatorPeriode.id_evaluator_periode_penilaian
                                },
                                transaction
                            });
                            
                            if (!existingF02) {
                                const pengisianF02 = await db.Pengisian_f02.create({
                                    id_opd: opd.id_opd,
                                    id_evaluator_periode_penilaian: evaluatorPeriode.id_evaluator_periode_penilaian
                                }, {transaction});
                                
                                console.log(`Berhasil membuat pengisian F02 baru dengan ID: ${pengisianF02.id_pengisian_f02}`);
                                
                                const nilaiIndikatorBatch = allIndikators.map(indikator => ({
                                    nilai_diperolah: 0,
                                    id_skala: zeroSkala.id_skala,
                                    id_pengisian_f02: pengisianF02.id_pengisian_f02,
                                    id_indikator: indikator.id_indikator
                                }));
                                
                                await db.nilai_indikator.bulkCreate(nilaiIndikatorBatch, {transaction});
                                
                                const nilaiAspekBatch = allAspeks.map(aspek => ({
                                    total_nilai_indikator: 0,
                                    id_aspek_penilaian: aspek.id_aspek_penilaian,
                                    id_pengisian_f02: pengisianF02.id_pengisian_f02
                                }));
                                
                                await db.Nilai_aspek.bulkCreate(nilaiAspekBatch, {transaction});
                                
                                await db.Nilai_akhir.create({
                                    total_nilai: 0,
                                    id_pengisian_f02: pengisianF02.id_pengisian_f02
                                }, {transaction});
                            } else {
                                console.log(`Pengisian F02 sudah ada untuk OPD: ${opd.nama_opd}, tidak perlu membuat ulang`);
                            }
                        }
                    } else {
                        console.log(`Nilai kumulatif sudah ada untuk OPD: ${opd.nama_opd}, tidak perlu membuat ulang`);
                    }
                }
                
                console.log(`Berhasil menyelesaikan pengisian otomatis nilai 0 untuk ${opdsToSetZero.length} OPD`);
            }
        }
        
        await transaction.commit();
        transaction = null;
        
        if (newStatus === 'aktif') {
            try {
                notificationOPDResult = await notifPeriodToAllOpd(findPeriode);
                notificationEvaluatorResults = await notifPeriodToAllEvaluator(findPeriode);

            } catch (notifError) {
                console.error('Gagal mengirim notifikasi:', notifError);
                notificationOPDResult = { 
                    success: false, 
                    message: 'Periode berhasil diaktifkan tetapi gagal mengirim notifikasi',
                    error: notifError.message 
                };
                notificationEvaluatorResults = { 
                    success: false, 
                    message: 'Periode berhasil diaktifkan tetapi gagal mengirim notifikasi',
                    error: notifError.message 
                };
            }
        }

        return res.status(200).json({
            success: true, 
            status: 200, 
            message: `Status periode penilaian berhasil diubah menjadi ${newStatus}`,
            notificationOpd: notificationOPDResult,
            notificationEval: notificationEvaluatorResults
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

module.exports ={tambahPeriode, tampilPeriode, editPeriode, hapusPeriode, updateStatus}