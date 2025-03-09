const {ValidationError, NotFoundError} = require('../../utils/error')
const db = require('../../models')
const sequelize = require('../../config/database')
const { Op, where, Sequelize } = require('sequelize');

//lsit penilaian opd masing" bgperiode atau all periode
const getPenilaianOpdPeriode = async (req,res) => {
    try {
        let findData = []
        const id_opd = req.user.id_user
        const {tahun_periode} = req.query
        if (tahun_periode) {
            findData = await db.Nilai_akhir_kumulatif.findAll({
                include: [
                    {
                        model: db.Opd,
                        as: 'opd',
                        where:{
                            id_opd
                        },
                        attributes:['id_opd', 'nama_opd']
                    },
                    {
                        model: db.Periode_penilaian,
                        as: 'periode_penilaian',
                        where:{
                            tahun_periode
                        },
                        attributes: ['id_periode_penilaian','tahun_periode']
                    }
                ],
                attributes: ['id_nilai_kumulatif', 'total_kumulatif', 'kategori'],
                order: [['total_kumulatif', 'DESC']] 
            });
        } else {
            findData = await db.Nilai_akhir_kumulatif.findAll({
                include: [
                    {
                        model: db.Opd,
                        as: 'opd',
                        where: {
                            id_opd
                        },
                        attributes:['id_opd', 'nama_opd']
                    },
                    {
                        model: db.Periode_penilaian,
                        as: 'periode_penilaian',
                        attributes: ['id_periode_penilaian','tahun_periode']
                    }
                ],
                attributes: ['id_nilai_kumulatif', 'total_kumulatif', 'kategori'],
                order: [['total_kumulatif', 'DESC']] 
            });
        }

        if (findData.length <= 0) {
            throw new ValidationError('Data penilaian belum tersedia')
        }

        const totalOpd = findData.length; 


        findData = findData.map((item, index) => {
            if (item.total_kumulatif) {
                let kategori = item.kategori;
                
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
                
                return {
                    ...item.toJSON(),
                    zona,
                    peringkat: index + 1,
                    dari_total: totalOpd
                };
            }
            
            return item;
        });

        
        return res.status(200).json({
            success: true, 
            status: 200, 
            message: 'Data hasil penilaian ditemukan', 
            data: findData
        });
        
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


//request akses
const reqAksesOpd = async (req, res) => {
    let transaction;
    try {
        const id_opd = req.user.id_user
        const {id_nilai_kumulatif, id_periode_penilaian} = req.query;

        if (!id_nilai_kumulatif) {
            throw new ValidationError('Id nilai kumulatif belum tersedia');
        }
        
        if (!id_periode_penilaian) {
            throw new ValidationError('Id periode penilaian belum tersedia');
        }

        transaction = await sequelize.transaction();

        const findIzin = await db.Izin_hasil_penilaian.findOne({
            where: {
                id_nilai_kumulatif,
                status: 'Menunggu Persetujuan'
            },
            transaction
        });

        if (findIzin) {
            throw new ValidationError('Perizinan penilaian tersebut sudah diajukan');
        }

        await db.Izin_hasil_penilaian.create({
            id_opd,
            id_periode_penilaian,
            tanggal_pengajuan: new Date(), 
            id_nilai_kumulatif,
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

//export

module.exports = {getPenilaianOpdPeriode, reqAksesOpd}