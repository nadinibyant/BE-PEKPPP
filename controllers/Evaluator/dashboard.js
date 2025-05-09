const {ValidationError, NotFoundError} = require('../../utils/error')
const db = require('../../models')
const sequelize = require('../../config/database')
const { Op, where, Sequelize } = require('sequelize');

//opd list
const getPenilaianOpdList = async (req, res) => {
    try {
        const id_evaluator = req.user.id_user
        const date = new Date()
        const year = date.getFullYear()

        const findEvaluatorPeriode = await db.Evaluator_periode_penilaian.findOne({
            include: [
                {
                    model: db.Evaluator,
                    as: 'evaluator',
                    where: {
                        id_evaluator
                    }
                },
                {
                    model: db.Periode_penilaian,
                    as: 'periode_penilaian',
                    where: {
                        tahun_periode: year
                    },
                    attributes: ['tahun_periode']
                }
            ]
        })

        if (!findEvaluatorPeriode) {
            throw new NotFoundError('Evaluator tidak terdaftar pada periode saat ini')
        }

        const approvedOpdIds = await db.Pengisian_f01.findAll({
            where: {
                status_pengisian: 'Disetujui'
            },
            include: [
                {
                    model: db.Periode_penilaian,
                    as: 'periode_penilaian',
                    where: {
                        tahun_periode: year
                    }
                }
            ],
            attributes: ['id_opd']
        });

        if (approvedOpdIds.length === 0) {
            return res.status(200).json({
                success: true,
                status: 200,
                message: 'Tidak ada OPD yang formulir F01-nya telah disetujui',
                data: []
            });
        }

        const opdIds = approvedOpdIds.map(item => item.id_opd);

        const findAllOpd = await db.Opd.findAll({
            where: {
                id_opd: {
                    [Op.in]: opdIds
                }
            },
            attributes: ['id_opd', 'nama_opd']
        });
        
        if (!findAllOpd || findAllOpd.length === 0) {
            throw new ValidationError('Data OPD dengan formulir F01 yang disetujui tidak ditemukan')
        }

        const findPengisianF02 = await db.Pengisian_f02.findAll({
            where: {
                id_evaluator_periode_penilaian: findEvaluatorPeriode.id_evaluator_periode_penilaian,
                id_opd: {
                    [Op.in]: opdIds
                }
            },
            include: [
                {
                    model: db.Opd,
                    as: 'opd',
                    attributes: ['id_opd', 'nama_opd']
                },
                {
                    model: db.Nilai_akhir,
                    as: 'nilai_akhir',
                    attributes: ['total_nilai']
                }
            ]
        });

        const evaluatedOpdMap = {}
        findPengisianF02.forEach(pengisian => {
            evaluatedOpdMap[pengisian.opd.id_opd] = {
                id_pengisian_f02: pengisian.id_pengisian_f02,
                skor: pengisian.nilai_akhir ? pengisian.nilai_akhir.total_nilai : 0,
                status: 'Sudah Dievaluasi'
            }
        });

        const getKategoriDanZona = (nilaiTotal) => {
            let kategori = 'UNDEFINED'
            
            if (nilaiTotal >= 0 && nilaiTotal <= 0.14) {
                kategori = 'F'
            } else if (nilaiTotal >= 0.141 && nilaiTotal <= 0.21) {
                kategori = 'E'
            } else if (nilaiTotal >= 0.211 && nilaiTotal <= 0.28) {
                kategori = 'D'
            } else if (nilaiTotal >= 0.281 && nilaiTotal <= 0.35) {
                kategori = 'C-'
            } else if (nilaiTotal >= 0.351 && nilaiTotal <= 0.42) {
                kategori = 'C'
            } else if (nilaiTotal >= 0.421 && nilaiTotal <= 0.49) {
                kategori = 'B-'
            } else if (nilaiTotal >= 0.491 && nilaiTotal <= 0.56) {
                kategori = 'B'
            } else if (nilaiTotal >= 0.561 && nilaiTotal <= 0.63) {
                kategori = 'A-'
            } else if (nilaiTotal >= 0.631) {
                kategori = 'A'
            }
            
            let zona = 'Undefined'
            
            if (['B', 'A-', 'A'].includes(kategori)) {
                zona = 'tinggi'
            } else if (['B-', 'C', 'C-'].includes(kategori)) {
                zona = 'sedang'
            } else if (['D', 'E', 'F'].includes(kategori)) {
                zona = 'rendah'
            }
            
            return { kategori, zona }
        }

        const formattedResult = findAllOpd.map((opd) => {
            const evaluatedData = evaluatedOpdMap[opd.id_opd] || { 
                id_pengisian_f02: null,
                skor: 0, 
                status: 'Belum Dievaluasi' 
            }
            const nilaiTotal = evaluatedData.skor
            const { zona } = getKategoriDanZona(nilaiTotal)
            
            return {
                id: evaluatedData.id_pengisian_f02,
                nama: opd.nama_opd,
                status: evaluatedData.status,
                skor: evaluatedData.status === 'Sudah Dievaluasi' ? parseFloat(nilaiTotal): 0,
                periode: year.toString(),
                indicator: evaluatedData.status === 'Belum Dievaluasi' ? 'belum' : zona
            }
        });

        return res.status(200).json({
            success: true,
            status: 200,
            message: 'Data OPD berhasil ditemukan',
            data: formattedResult
        })
    } catch (error) {
        console.error(error);
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

module.exports = {getPenilaianOpdList}