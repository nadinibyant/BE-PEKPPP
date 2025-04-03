const {ValidationError, NotFoundError} = require('../../utils/error')
const db = require('../../models')
const sequelize = require('../../config/database')
const { Op, where, Sequelize } = require('sequelize');
const { notifIzinDecOpd, notifIzinAccOpd, notifIzinAllAcc } = require('../../services/notification');

//list semua izin
const listIzinPenilaian = async (req, res) => {
    try {
        const findData = await db.Izin_hasil_penilaian.findAll({
            attributes: ['id_izin_hasil_penilaian', 'id_opd', 'id_evaluator', 'id_pengisian_f02', 'id_nilai_kumulatif', 'tanggal_pengajuan', 'status'],
            include: [
                {
                    model: db.Opd.unscoped(),
                    as: 'opd',
                    attributes: ['id_opd', 'nama_opd']
                },
                {
                    model: db.Evaluator.unscoped(),
                    as: 'evaluator',
                    attributes: ['id_evaluator', 'nama']
                },
                {
                    model: db.Periode_penilaian,
                    as: 'periode_penilaian',
                    attributes: ['tahun_periode']
                },
                {
                    model: db.Nilai_akhir_kumulatif,
                    as: 'nilai_akhir_kumulatif',
                    attributes: ['id_opd'],
                    include: [
                        {
                            model: db.Opd,
                            as: 'opd',
                            attributes: ['nama_opd']
                        }
                    ]
                },
                {
                    model: db.Pengisian_f02,
                    as: 'pengisian_f02',
                    attributes: ['id_opd'],
                    include: [
                        {
                            model: db.Opd.unscoped(),
                            as: 'opd',
                            attributes: ['nama_opd']
                        }
                    ]
                }
            ],
            order: [['tanggal_pengajuan', 'DESC']] 
        });

        if (findData.length === 0) {
            return res.status(400).json({
                success: true, 
                status: 400, 
                message: 'Data izin hasil penilaian tidak tersedia', 
                data: []
            });
        }

        const formattedData = findData.map(item => {
            let pemohon, tipePemohon;
            
            if (item.id_opd && item.opd) {
                pemohon = item.opd.nama_opd;
                tipePemohon = 'opd';
            } else if (item.id_evaluator && item.evaluator) {
                pemohon = item.evaluator.nama;
                tipePemohon = 'evaluator';
            } else {
                pemohon = 'Tidak diketahui';
                tipePemohon = 'unknown';
            }

            let targetOpd;
            
            if (item.id_nilai_kumulatif && item.nilai_akhir_kumulatif && item.nilai_akhir_kumulatif.opd) {
                targetOpd = item.nilai_akhir_kumulatif.opd.nama_opd;
            } else if (item.id_pengisian_f02 && item.pengisian_f02 && item.pengisian_f02.opd) {
                targetOpd = item.pengisian_f02.opd.nama_opd;
            } else {
                targetOpd = 'Tidak diketahui';
            }

            const tanggal = new Date(item.tanggal_pengajuan);
            // const formattedDate = `${tanggal.getDate().toString().padStart(2, '0')}-${(tanggal.getMonth() + 1).toString().padStart(2, '0')}-${tanggal.getFullYear()}`;
            const formattedDate = `${tanggal.getFullYear()}-${(tanggal.getMonth() + 1).toString().padStart(2, '0')}-${tanggal.getDate().toString().padStart(2, '0')}`;

            return {
                id: item.id_izin_hasil_penilaian,
                pemohon: {
                    nama: pemohon,
                    tipe: tipePemohon
                },
                periode: item.periode_penilaian ? `${item.periode_penilaian.tahun_periode}` : '',
                target_penilaian: targetOpd,
                tanggal_pengajuan: formattedDate,
                status: item.status
            };
        });

        return res.status(200).json({
            success: true, 
            status: 200, 
            message: 'Data izin hasil penilaian tersedia', 
            data: formattedData
        });
    } catch (error) {
        console.error('Error di listIzinPenilaian:', error);
        
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

// acc
const accIzinPenilaian = async (req, res) => {
    let transaction;
    try {
        const { id_izin_hasil_penilaian, is_bulk_approve } = req.query;
        transaction = await sequelize.transaction();

        if (id_izin_hasil_penilaian) {
            const findIzin = await db.Izin_hasil_penilaian.findByPk(id_izin_hasil_penilaian, {
                transaction
            });
            
            if (!findIzin) {
                throw new ValidationError('Data izin hasil penilaian tidak ditemukan');
            }

            if (findIzin.status !== 'Menunggu Persetujuan') {
                throw new ValidationError(`Izin sudah dalam status "${findIzin.status}" dan tidak dapat diubah`);
            }
            
            await db.Izin_hasil_penilaian.update({
                status: 'Disetujui',
            }, {
                where: {
                    id_izin_hasil_penilaian,
                    status: 'Menunggu Persetujuan'
                },
                transaction
            });
            
            await transaction.commit();
            const notificationResults = await notifIzinAccOpd(id_izin_hasil_penilaian)
            return res.status(200).json({
                success: true, 
                status: 200, 
                message: 'Hasil penilaian berhasil disetujui',
                notifikasi: notificationResults.message
            });
        } else if (is_bulk_approve === 'true') {
            const pendingCount = await db.Izin_hasil_penilaian.count({
                where: {
                    status: 'Menunggu Persetujuan'
                },
                transaction
            });
            
            if (pendingCount === 0) {
                throw new ValidationError('Tidak ada izin yang menunggu persetujuan');
            }
            
            const updateResult = await db.Izin_hasil_penilaian.update({
                status: 'Disetujui',
            }, {
                where: {
                    status: 'Menunggu Persetujuan'
                },
                transaction
            });
            
            await transaction.commit();
            const notificationResults = await notifIzinAllAcc()
            return res.status(200).json({
                success: true, 
                status: 200, 
                message: `${updateResult[0]} hasil penilaian berhasil disetujui semuanya`,
                data: {
                    approved_count: updateResult[0]
                },
                notifikasi: notificationResults
            });
        } else {
            throw new ValidationError('Parameter tidak lengkap. Sediakan id_izin_hasil_penilaian untuk persetujuan tunggal atau is_bulk_approve=true untuk persetujuan semuanya');
        }
    } catch (error) {
        if (transaction) await transaction.rollback();
        
        console.error('error', error);
        
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
        } else if (error instanceof ForeignKeyConstraintError) {
            return res.status(400).json({
                success: false,
                status: 400,
                message: 'Referensi data tidak valid'
            });
        } else {
            return res.status(500).json({
                success: false,
                status: 500,
                message: 'Kesalahan Server Internal'
            });
        }
    }
};

// decline
const declineIzin = async (req, res) => {
    let transaction;
    try {
        const { id_izin_hasil_penilaian} = req.query;
        
        if (!id_izin_hasil_penilaian) {
            throw new ValidationError('ID izin hasil penilaian harus disediakan');
        }

        transaction = await sequelize.transaction();

        const findIzin = await db.Izin_hasil_penilaian.findByPk(id_izin_hasil_penilaian, { 
            transaction,
            lock: true 
        });
        
        if (!findIzin) {
            throw new NotFoundError('Data izin hasil penilaian tidak ditemukan');
        }
        
        if (findIzin.status !== 'Menunggu Persetujuan') {
            throw new ValidationError(`Izin sudah dalam status "${findIzin.status}" dan tidak dapat ditolak`);
        }

        const updateResult = await db.Izin_hasil_penilaian.update({
            status: 'Ditolak',
        }, {
            where: {
                id_izin_hasil_penilaian,
                status: 'Menunggu Persetujuan' 
            },
            transaction
        });

        if (updateResult[0] === 0) {
            throw new ValidationError('Gagal mengupdate status izin, mungkin sudah diproses oleh pengguna lain');
        }
        await transaction.commit();

        const notificationResults = await notifIzinDecOpd(id_izin_hasil_penilaian)
        
        return res.status(200).json({
            success: true, 
            status: 200, 
            message: 'Izin hasil penilaian berhasil ditolak',
            data: {
                id_izin_hasil_penilaian,
                status: 'Ditolak',
                tanggal_penolakan: new Date()
            },
            notifikasi: notificationResults.message
        });
    } catch (error) {
        if (transaction) await transaction.rollback();
        
        console.error('Error in declineIzin:', error);
        
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
        } else if (error instanceof ForeignKeyConstraintError) {
            return res.status(400).json({
                success: false,
                status: 400,
                message: 'Referensi data tidak valid'
            });
        } else {
            return res.status(500).json({
                success: false,
                status: 500,
                message: 'Kesalahan Server Internal'
            });
        }
    }
};

module.exports = {listIzinPenilaian, accIzinPenilaian, declineIzin}