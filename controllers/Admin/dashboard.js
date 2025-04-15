const {ValidationError, NotFoundError} = require('../../utils/error')
const db = require('../../models')
const sequelize = require('../../config/database')
const { Op, where, Sequelize } = require('sequelize');
const message = require('../../models/message');

//statistik data per semester
const statsData = async (req,res) => {
    try {
        const date = new Date()
        const month = date.getMonth()
        const year = date.getFullYear()

        const getCurrentSemester = month < 6 ? 1 : 2

        const startMonth = (getCurrentSemester - 1) * 6  
        const endMonth = getCurrentSemester * 6 - 1    

        const startDate = new Date(year, startMonth, 1)
        const endDate = new Date(year, endMonth + 1, 0) 

        let semester = null

        if (getCurrentSemester == 1) {
            semester = `Semester 1 ${year}`
        } else {
            semester = `Semester 2 ${year}`
        }


        const getTotalOpd = await db.Opd.count({
            where: {
              is_active: true
            }
        })


        const getTotalEvaluator = await db.Evaluator.count({
        where: {
            is_active: true
        }
        })

        const totalPengguna = parseInt(getTotalOpd + getTotalEvaluator)

        const getIzinAkses = await db.Izin_hasil_penilaian.count({
            where: {
                createdAt: {
                    [db.Sequelize.Op.between] : [startDate, endDate]
                }
            }
        })

        const formattedData = [
            {
                name: 'opd',
                value: getTotalOpd
            },
            {
                nama: 'users',
                value: totalPengguna
            },
            {
                name: 'quarter',
                value: semester
            },
            {
                name: 'izin_akses',
                value: getIzinAkses
            }
        ]
        return res.status(200).json({success: true, status:200, message: 'Data berhasil ditemukan', data:formattedData})

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

// daftar nilai f02 opd
const getNilaiF02 = async (req,res) => {
    try {
        const date = new Date()
        const month = date.getMonth()
        const year = date.getFullYear()

        const getCurrentSemester = month < 6 ? 1 : 2

        const startMonth = (getCurrentSemester - 1) * 6  
        const endMonth = getCurrentSemester * 6 - 1    

        const startDate = new Date(year, startMonth, 1)
        const endDate = new Date(year, endMonth + 1, 0) 

        const findNilai = await db.Nilai_akhir_kumulatif.findAll({
            attributes: ['id_nilai_kumulatif','id_opd', 'total_kumulatif', 'kategori', 'feedback'],
            where: {
                createdAt: {
                    [db.Sequelize.Op.between]: [startDate, endDate]
                }
            },
            include: [
                {
                    model: db.Opd,
                    as: 'opd',
                    attributes: ['nama_opd']
                }
            ]
        })

        if (findNilai.length == 0) {
            throw new ValidationError('Data penilaian akhir OPD belum tersedia')
        }

        return res.status(200).json({success: true, status: 200, message: 'Data penilaian akhir OPD tersedia', data: findNilai})
        
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

// data submit f01 opd
const dataSumbitF01 = async (req, res) => {
    try {
        const date = new Date()
        const month = date.getMonth()
        const year = date.getFullYear()

        const getCurrentSemester = month < 6 ? 1 : 2

        const startMonth = (getCurrentSemester - 1) * 6  
        const endMonth = getCurrentSemester * 6 - 1    

        const startDate = new Date(year, startMonth, 1)
        const endDate = new Date(year, endMonth + 1, 0) 

        const totalOpd = await db.Opd.count()

        const periodePenilaian = await db.Periode_penilaian.findOne({
            where: {
                tahun_periode: year,
                tanggal_mulai: {
                    [db.Sequelize.Op.lte]: endDate
                },
                tanggal_selesai: {
                    [db.Sequelize.Op.gte]: startDate
                },
                status: 'aktif'
            },
            order: [['createdAt', 'DESC']] 
        })

        let idPeriodePenilaian = null
        if (periodePenilaian) {
            idPeriodePenilaian = periodePenilaian.id_periode_penilaian
        } else {
            throw new ValidationError('Tidak ada periode penilaian aktif untuk quarter saat ini')
        }

        // Jumlah OPD yang sudah submit F01
        const opdSudahSubmitF01 = await db.Pengisian_f01.count({
            where: {
                id_periode_penilaian: idPeriodePenilaian,
            },
            distinct: true,
            col: 'id_opd'
        })

        const opdBelumSubmitF01 = totalOpd - opdSudahSubmitF01

        const persentaseSudahSubmit = parseFloat(((opdSudahSubmitF01 / totalOpd) * 100).toFixed(2)) || 0
        const persentaseBelumSubmit = parseFloat(((opdBelumSubmitF01 / totalOpd) * 100).toFixed(2)) || 0

        return res.status(200).json({
            success: true,
            status: 200,
            message: 'Data persentase pengisian F01 berhasil diambil',
            data: {
                quarter: getCurrentSemester,
                tahun: year,
                totalOpd,
                opdSudahSubmitF01,
                opdBelumSubmitF01,
                persentaseSudahSubmit,
                persentaseBelumSubmit,
            }
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

// top 10 nilai opd
const top10Opd = async (req,res) => {
    try {
        const date = new Date()
        const year = date.getFullYear()
        
        const findPeriode = await db.Periode_penilaian.findOne({
            where: {
                tahun_periode: year
            }
        })


        const findNilaiOpd = await db.Nilai_akhir_kumulatif.findAll({
            where: {
                id_periode_penilaian: findPeriode.id_periode_penilaian
            },
            separate: true,
            order: [['total_kumulatif', 'DESC']],
            limit: 10,
            attributes: ['id_nilai_kumulatif', 'total_kumulatif'],
            include: [
                {
                    model: db.Opd,
                    as: 'opd',
                    attributes: ['id_opd', 'nama_opd']
                }
            ]
        })

        if (findNilaiOpd.length === 0) {
            throw new ValidationError('Data penilaian OPD belum tersedia')
        }
        return res.status(200).json({success: true, message: 'Data penilaian OPD tersedia', data: findNilaiOpd})
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

module.exports = {statsData, getNilaiF02, dataSumbitF01, top10Opd}