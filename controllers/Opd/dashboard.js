const {ValidationError, NotFoundError} = require('../../utils/error')
const db = require('../../models')
const sequelize = require('../../config/database')
const { Op, where, Sequelize } = require('sequelize');
const { removeTicks } = require('sequelize/lib/utils');

// hasil evaluasi periode skrg 
const hasilEvaluasiOpd = async (req,res) => {
    try {
        const id_opd = req.user.id_user
        const date = new Date()
        const year = date.getFullYear()

        const beforeYear = parseInt(year) - 1

        const findHasil = await db.Nilai_akhir_kumulatif.findOne({
            attributes: ['id_nilai_kumulatif', 'total_kumulatif', 'kategori'],
            include: [
                {
                    model: db.Periode_penilaian,
                    as: 'periode_penilaian',
                    attributes: ['tahun_periode', 'tanggal_mulai', 'tanggal_selesai'],
                    where: {
                        tahun_periode: year
                    }
                }
            ],
            where: {
                id_opd
            }

        })

        const findHasilBefore = await db.Nilai_akhir_kumulatif.findByPk(id_opd, {
            include: [
                {
                    model: db.Periode_penilaian,
                    as: 'periode_penilaian',
                    where: {
                        tahun_periode: beforeYear
                    }
                }
            ],
            attributes: ['id_nilai_kumulatif', 'total_kumulatif', 'kategori'],
            where: {
                id_opd
            }
        })

        const allNilaiKumulatif = await db.Nilai_akhir_kumulatif.findAll({
            attributes: ['id_opd', 'total_kumulatif'],
            order: [['total_kumulatif', 'DESC']],
            include: [
                {
                    model: db.Periode_penilaian,
                    as: 'periode_penilaian',
                    where: {
                        tahun_periode: year
                    }
                }
            ]
        })

        let peringkat = 0
        if (findHasil) {
            peringkat = allNilaiKumulatif.findIndex(item => item.id_opd === id_opd) + 1
        }

        let perbandingan = null
        let persentasePerubahan = null
        let tandaPerubahan = ''
        
        if (findHasil) {
            const nilaiSekarang = findHasil.total_kumulatif
            
            if (findHasilBefore) {
                const nilaiSebelumnya = findHasilBefore.total_kumulatif
                
                perbandingan = {
                    sekarang: nilaiSekarang,
                    sebelumnya: nilaiSebelumnya
                }
                
                const selisih = nilaiSekarang - nilaiSebelumnya
                persentasePerubahan = ((selisih / nilaiSebelumnya) * 100).toFixed(1)
                tandaPerubahan = selisih >= 0 ? '+' : ''
            } else {
                perbandingan = {
                    sekarang: nilaiSekarang,
                    sebelumnya: null
                }
                persentasePerubahan = null
                tandaPerubahan = ''
            }
        }

        const totalOpd = await db.Opd.count()
        const formattedData = {
            hasilSekarang: findHasil,
            hasilSebelum: (perbandingan && perbandingan.sebelumnya) || 0,
            persentase: persentasePerubahan,
            tandaPerubahan: tandaPerubahan,
            peringkat: peringkat,
            totalOpd: parseInt(totalOpd),
        }

        return res.status(200).json({success: true, status: 200, message: 'Data hasil evaluasi tersedia', data: formattedData})

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

// status formulir
const statusFormulir = async (req, res) => {
    try {
        const id_opd = req.user.id_user
        const date = new Date()
        const year = date.getFullYear()
        
        let f01Status = 'Belum Submit'
        let f01CreatedAt = null
        
        const findF01 = await db.Pengisian_f01.findOne({
            where: {
                id_opd,
            },
            include: [
                {
                    model: db.Periode_penilaian,
                    as: 'periode_penilaian',
                    where: {
                        tahun_periode: year
                    },
                    attributes: ['tahun_periode']
                }
            ],
            attributes: ['status_pengisian', 'createdAt']
        })

        if (findF01) {
            f01Status = findF01.status_pengisian
            f01CreatedAt = findF01.createdAt
        }

        const findPeriode = await db.Periode_penilaian.findOne({
            where: {
                tahun_periode: year
            },
            include: [
                {
                    model: db.Evaluator_periode_penilaian,
                    as: 'evaluator_periode_penilaians'
                }
            ]
        })

        let statusF02 = {
            status: 'Belum Dinilai',
            createdAt: null
        }
        
        if (findPeriode) {
            const totalEvaluator = findPeriode.evaluator_periode_penilaians.length

            const findF02 = await db.Pengisian_f02.findAll({
                where: {
                    id_opd
                },
                include: [
                    {
                        model: db.Evaluator_periode_penilaian,
                        as: 'evaluator_periode_penilaian',
                        include: [
                            {
                                model: db.Periode_penilaian,
                                as: 'periode_penilaian',
                                where: {
                                    tahun_periode: year
                                }
                            }
                        ]
                    }
                ],
                separate: true,
                order: [['createdAt', 'DESC']]
            })

            if (findF02 && findF02.length > 0) {
                if (findF02.length !== totalEvaluator) {
                    statusF02 = {
                        status: 'inProgress',
                        createdAt: findF02[0].createdAt
                    }
                } else {
                    statusF02 = {
                        status: 'Evaluated',
                        createdAt: findF02[0].createdAt
                    }
                }
            }
        }
        const formattedData = {
            f01Status: f01Status, 
            f02Status: statusF02.status,
            f01Submit: f01CreatedAt,
            f02Submit: statusF02.createdAt
        }

        return res.status(200).json({
            success: true, 
            status: 200, 
            message: 'Data status formulir tersedia', 
            data: formattedData
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

// dokumen bukti dukung
const getBuktiDukung = async(req,res) => {
    try {
        const id_opd = req.user.id_user
        const year = new Date().getFullYear()
        const findBuktiDukung = await db.Bukti_dukung_upload.findAll({
            include: [
                {
                    model: db.Pengisian_f01,
                    as: 'pengisian_f01',
                    where: {
                        id_opd
                    },
                    include: [
                        {
                            model: db.Periode_penilaian,
                            as: 'periode_penilaian',
                            where: {
                                tahun_periode: year
                            },
                            attributes: ['tahun_periode']
                        }
                    ],
                    attributes: ['id_opd']
                },
                {
                    model: db.Bukti_dukung,
                    as:'bukti_dukung',
                    attributes: ['nama_bukti_dukung']
                }
            ],
            attributes: ['id_bukti_upload', 'nama_file', 'createdAt']
        })
        if (findBuktiDukung.length === 0) {
            throw new ValidationError('Data bukti dukung belum tersedia')
        }
        return res.status(200).json({success: true, status:200, message: 'Data bukti dukung tersedia', data: findBuktiDukung})
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

const getCumulativeAssessmentData = async (id_opd, id_periode_penilaian) => {
    const nilaiKumulatif = await db.Nilai_akhir_kumulatif.findOne({
        where: {
            id_opd,
            id_periode_penilaian
        },
        attributes: ['id_nilai_kumulatif', 'total_kumulatif', 'kategori', 'feedback']
    });

    if (!nilaiKumulatif) {
        return null;
    }

    const allNilaiKumulatif = await db.Nilai_akhir_kumulatif.findAll({
        where: {
            id_periode_penilaian
        },
        attributes: ['id_opd', 'total_kumulatif'],
        order: [['total_kumulatif', 'DESC']]
    });

    const peringkat = allNilaiKumulatif.findIndex(item => item.id_opd === id_opd) + 1;
    const totalOpd = allNilaiKumulatif.length;

    const evaluatorPeriodeList = await db.Evaluator_periode_penilaian.findAll({
        where: {
            id_periode_penilaian
        },
        attributes: ['id_evaluator_periode_penilaian']
    });
    
    if (!evaluatorPeriodeList || evaluatorPeriodeList.length === 0) {
        return null;
    }

    const evaluatorPeriodeIds = evaluatorPeriodeList.map(item => item.id_evaluator_periode_penilaian);

    const pengisianF02List = await db.Pengisian_f02.findAll({
        where: {
            id_opd,
            id_evaluator_periode_penilaian: {
                [Op.in]: evaluatorPeriodeIds
            }
        },
        attributes: ['id_pengisian_f02']
    });
    
    if (!pengisianF02List || pengisianF02List.length === 0) {
        return null;
    }

    const pengisianF02Ids = pengisianF02List.map(item => item.id_pengisian_f02);

    const nilaiAspekList = await db.Nilai_aspek.findAll({
        where: {
            id_pengisian_f02: {
                [Op.in]: pengisianF02Ids
            }
        },
        include: [
            {
                model: db.Aspek_penilaian,
                as: 'aspek_penilaian',
                attributes: [
                    'id_aspek_penilaian', 
                    'nama_aspek', 
                    'bobot_aspek',
                    'parent_id_aspek_penilaian',
                    'urutan'
                ]
            }
        ],
        attributes: ['id_nilai_aspek', 'id_aspek_penilaian', 'total_nilai_indikator']
    });

    const opdData = await db.Opd.findByPk(id_opd, {
        attributes: ['id_opd', 'nama_opd']
    });
    
    const periodeData = await db.Periode_penilaian.findByPk(id_periode_penilaian, {
        attributes: ['id_periode_penilaian', 'tahun_periode']
    });

    const kumulatifAspekMap = {};

    nilaiAspekList.forEach(nilaiAspek => {
        const idAspek = nilaiAspek.id_aspek_penilaian;
        
        if (!kumulatifAspekMap[idAspek]) {
            kumulatifAspekMap[idAspek] = {
                id_aspek_penilaian: idAspek,
                nama_aspek: nilaiAspek.aspek_penilaian.nama_aspek,
                bobot_aspek: nilaiAspek.aspek_penilaian.bobot_aspek,
                parent_id_aspek_penilaian: nilaiAspek.aspek_penilaian.parent_id_aspek_penilaian,
                urutan: nilaiAspek.aspek_penilaian.urutan,
                total_nilai: [],
                rata_nilai: 0,
                indikators: []
            };
        }
        
        kumulatifAspekMap[idAspek].total_nilai.push(parseFloat(nilaiAspek.total_nilai_indikator));
    });
    
    Object.values(kumulatifAspekMap).forEach(aspek => {
        if (aspek.total_nilai.length > 0) {
            const sum = aspek.total_nilai.reduce((a, b) => a + b, 0);
            aspek.rata_nilai = (sum / aspek.total_nilai.length).toFixed(2);
        }
        delete aspek.total_nilai; 
    });
    const result = {
        id_opd,
        id_periode_penilaian,
        nilai_aspeks: restructureAspekKumulatif(Object.values(kumulatifAspekMap))
    };

    if (opdData) {
        result.opd = {
            id_opd: opdData.id_opd,
            nama_opd: opdData.nama_opd
        };
    }
    
    if (periodeData) {
        result.periode = {
            id_periode_penilaian: periodeData.id_periode_penilaian,
            tahun_periode: periodeData.tahun_periode
        };
    }
    
    return result;
};

const restructureAspekKumulatif = (aspekList) => {
    const aspekMap = {};
    aspekList.forEach(aspek => {
        aspekMap[aspek.id_aspek_penilaian] = {
            ...aspek,
            sub_aspek: []
        };
    });

    const rootAspeks = [];
    
    Object.values(aspekMap).forEach(aspek => {
        if (aspek.parent_id_aspek_penilaian && aspekMap[aspek.parent_id_aspek_penilaian]) {
            aspekMap[aspek.parent_id_aspek_penilaian].sub_aspek.push(aspek);
        } else {
            rootAspeks.push(aspek);
        }
    });

    const sortByUrutan = (a, b) => {
        if (a.urutan !== undefined && b.urutan !== undefined) {
            return a.urutan - b.urutan;
        }
        return 0;
    };
    
    rootAspeks.sort(sortByUrutan);
    rootAspeks.forEach(aspek => {
        if (aspek.sub_aspek && aspek.sub_aspek.length > 0) {
            aspek.sub_aspek.sort(sortByUrutan);
        }
    });
    
    return rootAspeks;
};

// nilai f02 periode skrg per aspek penilaian
const getNilaiKomponenF02 = async (req,res) => {
    try {
        const id_opd = req.user.id_user
        const year = new Date().getFullYear()
        const findPeriode = await db.Periode_penilaian.findOne({
            where:{
                tahun_periode: year
            }
        })

        if (!findPeriode) {
            throw new ValidationError('Data periode belum tersedia')
        }

        let data = await getCumulativeAssessmentData(id_opd, findPeriode.id_periode_penilaian)
        return res.status(200).json({success: true, status:200, message: 'Data aspek penilaian f02 tersedia', data: data})
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



module.exports = {hasilEvaluasiOpd, statusFormulir, getBuktiDukung, getNilaiKomponenF02}