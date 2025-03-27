const {ValidationError, NotFoundError} = require('../../utils/error')
const db = require('../../models')
const sequelize = require('../../config/database')
const { Op, where, Sequelize, Model } = require('sequelize');

const calculateKategoriAndZona = (nilaiTotal) => {
    let kategori = '';
    
    if (nilaiTotal >= 0 && nilaiTotal <= 0.14) {
        kategori = 'F'; 
    } else if (nilaiTotal >= 0.141 && nilaiTotal <= 0.21) {
        kategori = 'E'; 
    } else if (nilaiTotal >= 0.211 && nilaiTotal <= 0.28) {
        kategori = 'D'; 
    } else if (nilaiTotal >= 0.281 && nilaiTotal <= 0.35) {
        kategori = 'C-';  
    } else if (nilaiTotal >= 0.351 && nilaiTotal <= 0.42) {
        kategori = 'C'; 
    } else if (nilaiTotal >= 0.421 && nilaiTotal <= 0.49) {
        kategori = 'B-';  
    } else if (nilaiTotal >= 0.491 && nilaiTotal <= 0.56) {
        kategori = 'B'; 
    } else if (nilaiTotal >= 0.561 && nilaiTotal <= 0.63) {
        kategori = 'A-'; 
    } else if (nilaiTotal >= 0.631) {
        kategori = 'A'; 
    } else {
        kategori = 'UNDEFINED'; 
    }
    
    let zona = '';
    
    if (['B', 'A-', 'A'].includes(kategori)) {
        zona = 'Hijau';
    } else if (['B-', 'C', 'C-'].includes(kategori)) {
        zona = 'Kuning';
    } else if (['D', 'E', 'F'].includes(kategori)) {
        zona = 'Merah';
    } else {
        zona = 'Undefined';
    }
    
    return { kategori, zona };
};

const getPenilaian = async (req, res) => {
    try {
        const id_evaluator = req.user.id_user;
        const { id_periode_penilaian } = req.query;

        if (!id_periode_penilaian) {
            throw new ValidationError('Parameter id_periode_penilaian diperlukan');
        }

        const evaluatorPeriode = await db.Evaluator_periode_penilaian.findOne({
            where: {
                id_evaluator,
                id_periode_penilaian
            }
        });

        if (!evaluatorPeriode) {
            throw new ValidationError('Evaluator tidak terdaftar pada periode ini');
        }

        const findData = await db.Pengisian_f02.findAll({
            attributes: ['id_pengisian_f02', 'updatedAt'],
            include: [
                {
                    model: db.Opd,
                    as: 'opd',
                    attributes: ['id_opd', 'nama_opd']
                },
                {
                    model: db.Evaluator_periode_penilaian,
                    as: 'evaluator_periode_penilaian',
                    where: {
                        id_evaluator
                    },
                    include: [
                        {
                            model: db.Periode_penilaian,
                            as: 'periode_penilaian',
                            where: {
                                id_periode_penilaian
                            },
                            attributes: []
                        }
                    ],
                    attributes: []
                },
                {
                    model: db.Nilai_akhir,
                    as: 'nilai_akhir',
                    attributes: ['total_nilai']
                },
                {
                    model: db.Izin_hasil_penilaian,
                    as: 'izin_hasil_penilaians', 
                    attributes: ['id_izin_hasil_penilaian', 'id_pengisian_f02', 'id_nilai_kumulatif','status', 'tanggal_pengajuan', 'updatedAt'],
                    required: false
                }
            ]
        });

        if (findData.length === 0) {
            throw new ValidationError('Data penilaian tidak tersedia');
        }

        const transformedData = findData.map(item => {
            const result = item.toJSON();
 
            if (item.nilai_akhir && item.nilai_akhir.total_nilai) {
                const nilaiTotal = parseFloat(item.nilai_akhir.total_nilai);
                const { kategori, zona } = calculateKategoriAndZona(nilaiTotal);
                
                result.nilai_akhir = {
                    ...item.nilai_akhir.toJSON(),
                    kategori,
                    zona
                };
            }
            
            if (item.izin_hasil_penilaians && item.izin_hasil_penilaians.length > 0) {
                const latestIzin = item.izin_hasil_penilaians.sort((a, b) => 
                    new Date(b.tanggal_pengajuan) - new Date(a.tanggal_pengajuan)
                )[0];
                
                result.izin_status = {
                    status: latestIzin.status,
                    tanggal_pengajuan: latestIzin.tanggal_pengajuan
                };
            } else {
                result.izin_status = {
                    status: null,
                    message: 'Belum ada permintaan izin'
                };
            }
            
            return result;
        });

        return res.status(200).json({
            success: true, 
            status: 200, 
            message: 'Data penilaian tersedia', 
            data: transformedData
        });
    } catch (error) {
        console.error('Error in getPenilaian:', error);
        
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

// minta akses 
const reqAkses = async (req, res) => {
    let transaction;
    try {
        const id_evaluator = req.user.id_user
        const { id_pengisian_f02, id_periode_penilaian } = req.query;

        if (!id_pengisian_f02) {
            throw new ValidationError('Id pengisian f02 belum tersedia');
        }
        
        if (!id_periode_penilaian) {
            throw new ValidationError('Id periode penilaian belum tersedia');
        }

        transaction = await sequelize.transaction();

        const findIzin = await db.Izin_hasil_penilaian.findOne({
            where: {
                id_pengisian_f02,
                status: 'Menunggu Persetujuan'
            },
            transaction
        });

        if (findIzin) {
            throw new ValidationError('Perizinan penilaian tersebut sudah diajukan');
        }

        await db.Izin_hasil_penilaian.create({
            id_evaluator,
            id_periode_penilaian,
            tanggal_pengajuan: new Date(), 
            id_pengisian_f02,
            status: 'Menunggu Persetujuan' 
        }, { transaction });

        await transaction.commit();
        
        return res.status(200).json({
            success: true, 
            status: 200, 
            message: 'Perizinan penilaian berhasil diajukan'
        });
    } catch (error) {
        console.error('Error in reqAkses:', error);

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
            console.error('Internal server error:', error);
            return res.status(500).json({
                success: false,
                status: 500,
                message: 'Kesalahan Server'
            });
        }
    }
};

// detail hasi penilaian
// const detailPenilaianEval = async (req,res) => {
//     try {
//         const 
//     } catch (error) {
        
//     }
// }

// export

module.exports = {getPenilaian, reqAkses}