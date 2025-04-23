const {ValidationError, NotFoundError} = require('../../utils/error')
const db = require('../../models')
const sequelize = require('../../config/database')
const { Op, where, Sequelize } = require('sequelize');

//evaluator berdasar periode
const EvaluatorByPeriode = async (req,res) => {
    try {
        const {tahun_periode} = req.query
        if (!tahun_periode) {
            throw new ValidationError('Data tahun periode belum tersedia')
        }
        const findPeriode = await db.Periode_penilaian.findOne({where:{tahun_periode}})
        if (!findPeriode) {
            throw new ValidationError('Data periode tidak ditemukan')
        }
        const findEvaluator = await db.Evaluator_periode_penilaian.findAll({
            attributes: ['id_evaluator_periode_penilaian', 'id_evaluator'],
            include: [
                {
                    model: db.Periode_penilaian,
                    as: 'periode_penilaian',
                    where:{
                        tahun_periode
                    },
                    attributes: []
                },
                {
                    model: db.Evaluator,
                    as: 'evaluator',    
                    attributes: ['nama']
                }
            ]
        })

        if (findEvaluator <= 0) {
            throw new ValidationError('Data Evaluator pada periode tersebut tidak ditemukan')
        }
        return res.status(200).json({success:true, status:200, message: 'Data ditemukan', data: findEvaluator})
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


//tampil hasil penilaian by evaluator atau gabungan
const getHasilPenilaian = async (req, res) => {
    try {
        let findData = []
        const {id_evaluator_periode_penilaian, tahun_periode} = req.query
        if (id_evaluator_periode_penilaian) {
            findData = await db.Pengisian_f02.findAll({
                attributes: ['id_pengisian_f02'],
                where: {
                    id_evaluator_periode_penilaian
                },
                include: [
                    {
                        model: db.Opd,
                        as: 'opd',
                        attributes: ['id_opd','nama_opd']
                    },
                    {
                        model: db.Nilai_akhir,
                        as: 'nilai_akhir',
                        attributes: ['total_nilai']
                    },
                    {
                        model:db.Evaluator_periode_penilaian,
                        as: 'evaluator_periode_penilaian',
                        include: [
                            {
                                model: db.Evaluator,
                                as: 'evaluator',
                                attributes: ['nama']
                            },
                            {
                                model: db.Periode_penilaian,
                                as: 'periode_penilaian',
                                attributes: ['id_periode_penilaian']
                            }
                        ],
                        attributes: ['id_evaluator_periode_penilaian']
                    }
                ]
            })
            
            findData = findData.map(item => {
                if (item.nilai_akhir && item.nilai_akhir.total_nilai) {
                    const nilaiTotal = parseFloat(item.nilai_akhir.total_nilai);
                    

                    let kategori = '';
                    
                    if (nilaiTotal >= 0 && nilaiTotal <= 1) {
                        kategori = 'F'; 
                    } else if (nilaiTotal >= 1.01 && nilaiTotal <= 1.5) {
                        kategori = 'E'; 
                    } else if (nilaiTotal >= 1.51 && nilaiTotal <= 2) {
                        kategori = 'D'; 
                    } else if (nilaiTotal >= 2.01 && nilaiTotal <= 2.5) {
                        kategori = 'C-';  
                    } else if (nilaiTotal >= 2.51 && nilaiTotal <= 3) {
                        kategori = 'C'; 
                    } else if (nilaiTotal >= 3.01 && nilaiTotal <= 3.5) {
                        kategori = 'B-';  
                    } else if (nilaiTotal >= 3.51 && nilaiTotal <= 4) {
                        kategori = 'B'; 
                    } else if (nilaiTotal >= 4.01 && nilaiTotal <= 4.5) {
                        kategori = 'A-'; 
                    } else if (nilaiTotal >= 4.51 && nilaiTotal <= 5) {
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
                    
                    return {
                        ...item.toJSON(),
                        nilai_akhir: {
                            ...item.nilai_akhir.toJSON(),
                            kategori,
                            zona
                        }
                    };
                }
                
                return item;
            });
        } else if (tahun_periode){
            if (!tahun_periode) {
                throw new ValidationError('Data tahun periode tidak ditemukan')
            }

            findData = await db.Nilai_akhir_kumulatif.findAll({
                include: [
                    {
                        model: db.Opd,
                        as: 'opd',
                        attributes:['id_opd', 'nama_opd']
                    },
                    {
                        model: db.Periode_penilaian,
                        as: 'periode_penilaian',
                        where:{
                            tahun_periode
                        },
                        attributes: ['id_periode_penilaian','tahun_periode'],
                        include: [
                            {
                                model: db.Evaluator,
                                as: 'evaluators',
                                attributes: ['nama']
                            }
                        ]
                    }
                ],
                attributes: ['id_nilai_kumulatif', 'total_kumulatif', 'kategori'],
                order: [['total_kumulatif', 'DESC']] 
            });

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
        } else {
            findData = await db.Nilai_akhir_kumulatif.findAll({
                include: [
                    {
                        model: db.Opd,
                        as: 'opd',
                        attributes:['id_opd', 'nama_opd']
                    },
                    {
                        model: db.Periode_penilaian,
                        as: 'periode_penilaian',
                        attributes: ['id_periode_penilaian','tahun_periode'],
                        include: [
                            {
                                model: db.Evaluator,
                                as: 'evaluators',
                                attributes: ['nama']
                            }
                        ]
                    }
                ],
                attributes: ['id_nilai_kumulatif', 'total_kumulatif', 'kategori'],
                order: [['total_kumulatif', 'DESC']] 
            });

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
        }
        
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


//detail hasil penilaian
const getKategoriAndZona = (totalNilai) => {
    const nilaiTotal = parseFloat(totalNilai);
    
    let kategori = '';
    
    if (nilaiTotal >= 0 && nilaiTotal <= 1) {
        kategori = 'F'; 
    } else if (nilaiTotal >= 1.01 && nilaiTotal <= 1.5) {
        kategori = 'E'; 
    } else if (nilaiTotal >= 1.51 && nilaiTotal <= 2) {
        kategori = 'D'; 
    } else if (nilaiTotal >= 2.01 && nilaiTotal <= 2.5) {
        kategori = 'C-';  
    } else if (nilaiTotal >= 2.51 && nilaiTotal <= 3) {
        kategori = 'C'; 
    } else if (nilaiTotal >= 3.01 && nilaiTotal <= 3.5) {
        kategori = 'B-';  
    } else if (nilaiTotal >= 3.51 && nilaiTotal <= 4) {
        kategori = 'B'; 
    } else if (nilaiTotal >= 4.01 && nilaiTotal <= 4.5) {
        kategori = 'A-'; 
    } else if (nilaiTotal >= 4.51 && nilaiTotal <= 5) {
        kategori = 'A'; 
    } else {
        kategori = 'UNDEFINED'; 
    }
    
    return { 
        kategori, 
        zona: getZonaFromKategori(kategori) 
    };
};

const getZonaFromKategori = (kategori) => {
    if (['B', 'A-', 'A'].includes(kategori)) {
        return 'Hijau';
    } else if (['B-', 'C', 'C-'].includes(kategori)) {
        return 'Kuning';
    } else if (['D', 'E', 'F'].includes(kategori)) {
        return 'Merah';
    } else {
        return 'Undefined';
    }
};

const getIndividualAssessmentData = async (id_pengisian_f02) => {
    const rawData = await db.Pengisian_f02.findByPk(id_pengisian_f02, {
        include: [
            {
                model: db.Nilai_akhir,
                as: 'nilai_akhir',
                attributes: ['total_nilai']
            },
            {
                model: db.Nilai_aspek,
                as: 'nilai_aspeks',
                attributes: ['id_nilai_aspek', 'id_aspek_penilaian', 'total_nilai_indikator'],
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
                        ],
                        include: [
                            {
                                model: db.Indikator.scope('allRecords'),
                                as: 'Indikators',
                                attributes: ['id_indikator', 'nama_indikator', 'is_active'],
                                required: false,
                                include: [
                                    {
                                        model: db.nilai_indikator,
                                        as: 'nilai_indikators',
                                        attributes: ['nilai_diperolah'],
                                        where: {
                                            id_pengisian_f02
                                        },
                                        required: true
                                    }
                                ]
                            }
                        ]
                    }
                ]
            },
            {
                model: db.Evaluator_periode_penilaian,
                as: 'evaluator_periode_penilaian',
                attributes: ['id_evaluator_periode_penilaian'],
                include: [
                    {
                        model: db.Evaluator,
                        as: 'evaluator',
                        attributes: ['id_evaluator', 'nama']
                    },
                    {
                        model: db.Periode_penilaian,
                        as: 'periode_penilaian',
                        attributes: ['id_periode_penilaian', 'tahun_periode']
                    }
                ]
            },
            {
                model: db.Opd,
                as: 'opd',
                attributes: ['id_opd', 'nama_opd']
            }
        ],
        attributes: ['id_pengisian_f02', 'id_opd', 'id_evaluator_periode_penilaian']
    });

    if (!rawData) {
        return null;
    }

    const dataJson = rawData.toJSON();
    
    if (dataJson.nilai_akhir && dataJson.nilai_akhir.total_nilai) {
        const kategoriZona = getKategoriAndZona(dataJson.nilai_akhir.total_nilai);
        dataJson.nilai_akhir.kategori = kategoriZona.kategori;
        dataJson.nilai_akhir.zona = kategoriZona.zona;
    }

    const result = restructureAspekData(dataJson);

    if (dataJson.evaluator_periode && dataJson.evaluator_periode.evaluator) {
        result.evaluator = {
            id_evaluator: dataJson.evaluator_periode.evaluator.id_evaluator,
            nama: dataJson.evaluator_periode.evaluator.nama
        };
    }
    
    if (dataJson.evaluator_periode && dataJson.evaluator_periode.periode) {
        result.periode = {
            id_periode_penilaian: dataJson.evaluator_periode.periode.id_periode_penilaian,
            tahun_periode: dataJson.evaluator_periode.periode.tahun_periode
        };
    }
    
    if (dataJson.opd) {
        result.opd = {
            id_opd: dataJson.opd.id_opd,
            nama_opd: dataJson.opd.nama_opd
        };
    }
    
    return result;
};

const restructureAspekData = (data) => {
    const result = {
        id_pengisian_f02: data.id_pengisian_f02,
        nilai_akhir: data.nilai_akhir,
        nilai_aspeks: []
    };

    if (!data.nilai_aspeks || !Array.isArray(data.nilai_aspeks)) {
        return result;
    }

    const aspectMap = {};
    data.nilai_aspeks.forEach(nilai_aspek => {
        if (nilai_aspek.aspek_penilaian) {
            const aspectId = nilai_aspek.aspek_penilaian.id_aspek_penilaian;

            aspectMap[aspectId] = {
                id_aspek_penilaian: aspectId,
                nama_aspek: nilai_aspek.aspek_penilaian.nama_aspek,
                bobot_aspek: nilai_aspek.aspek_penilaian.bobot_aspek,
                urutan: nilai_aspek.aspek_penilaian.urutan,
                total_nilai_indikator: nilai_aspek.total_nilai_indikator,
                parent_id_aspek_penilaian: nilai_aspek.aspek_penilaian.parent_id_aspek_penilaian,
                Indikators: nilai_aspek.aspek_penilaian.Indikators || [],
                sub_aspek: [] 
            };
        }
    });

    const rootAspects = [];
    

    Object.values(aspectMap).forEach(aspek => {
        if (aspek.parent_id_aspek_penilaian && aspectMap[aspek.parent_id_aspek_penilaian]) {
            aspectMap[aspek.parent_id_aspek_penilaian].sub_aspek.push(aspek);
        } else {
            rootAspects.push(aspek);
        }
    });
    const sortByUrutan = (a, b) => {
        if (a.urutan !== undefined && b.urutan !== undefined) {
            return a.urutan - b.urutan;
        }
        return 0;
    };

    rootAspects.sort(sortByUrutan);
    rootAspects.forEach(aspect => {
        if (aspect.sub_aspek && aspect.sub_aspek.length > 0) {
            aspect.sub_aspek.sort(sortByUrutan);
        }
    });

    result.nilai_aspeks = rootAspects;
    return result;
};


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

    const nilaiIndikatorList = await db.nilai_indikator.findAll({
        where: {
            id_pengisian_f02: {
                [Op.in]: pengisianF02Ids
            }
        },
        include: [
            {
                model: db.Indikator.scope('allRecords'),
                as: 'indikator',
                required: false,
                attributes: ['id_indikator', 'nama_indikator', 'id_aspek_penilaian']
            }
        ],
        attributes: ['id_nilai_indikator', 'nilai_diperolah', 'id_indikator']
    });

    const opdData = await db.Opd.findByPk(id_opd, {
        attributes: ['id_opd', 'nama_opd']
    });
    
    const periodeData = await db.Periode_penilaian.findByPk(id_periode_penilaian, {
        attributes: ['id_periode_penilaian', 'tahun_periode']
    });

    const kumulatifAspekMap = {};
    const kumulatifIndikatorMap = {};

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

    nilaiIndikatorList.forEach(nilaiIndikator => {
        const idIndikator = nilaiIndikator.id_indikator;
        
        if (!kumulatifIndikatorMap[idIndikator]) {
            kumulatifIndikatorMap[idIndikator] = {
                id_indikator: idIndikator,
                nama_indikator: nilaiIndikator.indikator.nama_indikator,
                id_aspek_penilaian: nilaiIndikator.indikator.id_aspek_penilaian,
                nilai_list: [],
                rata_nilai: 0
            };
        }
        
        kumulatifIndikatorMap[idIndikator].nilai_list.push(parseFloat(nilaiIndikator.nilai_diperolah));
    });
    
    Object.values(kumulatifAspekMap).forEach(aspek => {
        if (aspek.total_nilai.length > 0) {
            const sum = aspek.total_nilai.reduce((a, b) => a + b, 0);
            aspek.rata_nilai = (sum / aspek.total_nilai.length).toFixed(2);
        }
        delete aspek.total_nilai; 
    });
    
    Object.values(kumulatifIndikatorMap).forEach(indikator => {
        if (indikator.nilai_list.length > 0) {
            const sum = indikator.nilai_list.reduce((a, b) => a + b, 0);
            indikator.rata_nilai = (sum / indikator.nilai_list.length).toFixed(2);
        }
        delete indikator.nilai_list; 

        if (kumulatifAspekMap[indikator.id_aspek_penilaian]) {
            kumulatifAspekMap[indikator.id_aspek_penilaian].indikators.push(indikator);
        }
    });

    const zona = getZonaFromKategori(nilaiKumulatif.kategori);
    const result = {
        id_opd,
        id_periode_penilaian,
        nilai_kumulatif: {
            id_nilai_kumulatif: nilaiKumulatif.id_nilai_kumulatif,
            total_nilai: nilaiKumulatif.total_kumulatif,
            kategori: nilaiKumulatif.kategori,
            feedback: nilaiKumulatif.feedback,
            zona,
            peringkat, 
            dari_total: totalOpd 
        },
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

const detailHasilPenilaian = async (req, res) => {
    try {
        const { id_pengisian_f02, id_opd, id_periode_penilaian } = req.query;
        
        let data = {};
        
        //by evaluator
        if (id_pengisian_f02) {
            data = await getIndividualAssessmentData(id_pengisian_f02);
        } else if (id_opd && id_periode_penilaian) {
            data = await getCumulativeAssessmentData(id_opd, id_periode_penilaian);
        } else {
            throw new ValidationError('Parameter id_pengisian_f02 atau (id_opd dan id_periode_penilaian) diperlukan')
        }
        
        if (!data) {
            throw new ValidationError('Data penilaian tidak ditemukan')
        }

        return res.status(200).json({
            success: true, 
            status: 200, 
            message: 'Data hasil penilaian ditemukan', 
            data: data
        });
    } catch (error) {
        console.error('Error in detailHasilPenilaian:', error);
        
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


//feedback (only untuk gabungan)
const addFeedback = async (req,res) => {
    let transaction
    try {
        transaction = await sequelize.transaction()

        const {id_opd, id_periode_penilaian} = req.query
        const {feedback} = req.body
        if (!id_opd || !id_periode_penilaian) {
            throw new ValidationError('id opd dan periode penilaian tidak ditemukan')
        }

        await db.Nilai_akhir_kumulatif.update({
            feedback
        }, {
            where: {id_opd, id_periode_penilaian}
        })

        await transaction.commit()

        return res.status(200).json({success:true, status:200, message: 'Feedback berhasil diperbaharui'})

    } catch (error) {
        console.error('Error in detailHasilPenilaian:', error);
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
}

//detail f02  per indikator
const detailf02 = async (req,res) => {
    try {
        const {id_pengisian_f02} = req.query
        if (!id_pengisian_f02) {
            throw new ValidationError('Data pengisian f02 tidak tersedia')
        }

        const findF02 = await db.Pengisian_f02.findByPk(id_pengisian_f02, {
            attributes: ['id_pengisian_f02'],
            include: [
                {
                    model: db.nilai_indikator,
                    as: 'nilai_indikators',
                    attributes: ['id_nilai_indikator', 'id_skala', 'id_indikator'],
                    include: [
                        {
                            model: db.Skala_indikator,
                            as: 'skala_indikator',
                            attributes: ['deskripsi_skala', 'nilai_skala']
                        },
                        {
                            model: db.Indikator,
                            as: 'indikator',
                            attributes: ['nama_indikator', 'bobot_indikator', 'kode_indikator']
                        }
                    ]
                }
            ]
        })
        if (!findF02) {
            throw new ValidationError('Data pengisian f02 tidak ditemukan')
        }

        return res.status(200).json({success: true, message: 'Data pengisian f02 ditemukan', data: findF02})
    } catch (error) {
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

//detail f01 per indikator
const findf01 = async (req, res) => {
    try {
        const {id_indikator, id_opd} = req.query

        const findIndikator = await db.Indikator.findByPk(id_indikator);
        if (!findIndikator) {
            throw new ValidationError('Data indikator tidak ditemukan');
        }

        const currentYear = new Date().getFullYear();
        const findPeriode = await db.Periode_penilaian.findOne({
            where: {
                tahun_periode: currentYear
            }
        });
        if (!findPeriode) {
            throw new ValidationError('Data periode penilaian tidak ditemukan');
        }

        const findF01 = await db.Pengisian_f01.findOne({
            where: {
                id_opd: id_opd,
                id_periode_penilaian: findPeriode.id_periode_penilaian,
            },
            attributes: ['id_pengisian_f01']
        });

        if (!findF01) {
            throw new ValidationError('Data penilaian F-01 tidak ditemukan');
        }

        const pertanyaanList = await db.Pertanyaan.findAll({
            where: {
                indikator_id_indikator: id_indikator
            },
            attributes: ['id_pertanyaan', 'teks_pertanyaan', 'trigger_value', 'urutan', 'keterangan_trigger'],
            order: [['urutan', 'ASC']],
            include: [
                {
                    model: db.Opsi_jawaban,
                    as: 'OpsiJawabans',
                    attributes: ['id_opsi_jawaban', 'teks_opsi', 'urutan', 'memiliki_isian_lainnya'],
                    order: [['urutan', 'ASC']]
                }
            ]
        });

        const jawabanList = await db.Jawaban.findAll({
            where: {
                id_pengisian_f01: findF01.id_pengisian_f01,
                '$pertanyaan.indikator_id_indikator$': id_indikator
            },
            attributes: ['id_jawaban', 'id_pertanyaan', 'jawaban_text', 'id_opsi_jawaban'],
            include: [
                {
                    model: db.Pertanyaan,
                    as: 'pertanyaan',
                    attributes: ['id_pertanyaan'],
                    where: {
                        indikator_id_indikator: id_indikator
                    }
                },
                {
                    model: db.Opsi_jawaban,
                    as: 'opsi_jawaban',
                    attributes: ['id_opsi_jawaban', 'teks_opsi']
                }
            ]
        });

        const buktiDukungList = await db.Bukti_dukung_upload.findAll({
            where: {
                id_pengisian_f01: findF01.id_pengisian_f01,
                id_indikator: id_indikator
            },
            include: [
                {
                    model: db.Bukti_dukung,
                    as: 'bukti_dukung',
                    attributes: ['nama_bukti_dukung']
                }
            ],
            attributes: ['id_bukti_dukung', 'nama_file']
        });

        const formattedBuktiDukung = buktiDukungList.map(bukti => {
            const buktiObj = bukti.toJSON();
            return {
                id_bukti_dukung: buktiObj.id_bukti_dukung,
                nama_file: buktiObj.nama_file,
                nama_bukti_dukung: buktiObj.bukti_dukung ? buktiObj.bukti_dukung.nama_bukti_dukung : null,
            };
        });

        const formattedData = pertanyaanList.map(pertanyaan => {
            const pertanyaanObj = pertanyaan.toJSON();
            
            const jawabanForPertanyaan = jawabanList.find(
                jawaban => jawaban.id_pertanyaan === pertanyaan.id_pertanyaan
            );

            pertanyaanObj.jawaban = jawabanForPertanyaan ? {
                id_jawaban: jawabanForPertanyaan.id_jawaban,
                jawaban_text: jawabanForPertanyaan.jawaban_text,
                opsi_jawaban: jawabanForPertanyaan.opsi_jawaban ? {
                    id_opsi_jawaban: jawabanForPertanyaan.opsi_jawaban.id_opsi_jawaban,
                    teks_opsi: jawabanForPertanyaan.opsi_jawaban.teks_opsi
                } : null
            } : null;
            
            return pertanyaanObj;
        });

        return res.status(200).json({
            success: true, 
            status: 200, 
            message: 'Data berhasil ditemukan', 
            data: {
                id_pengisian_f01: findF01.id_pengisian_f01,
                pertanyaan: formattedData,
                bukti_dukung: formattedBuktiDukung
            }
        });
    } catch (error) {
        console.error('Error in findf01Opd:', error);
        
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
                message: 'Kesalahan Server Internal'
            });
        }
    }
};

//edit penilaian f02 per opd + evaluator
const editF02 = async (req, res) => {
    let transaction;
    try {
        transaction = await sequelize.transaction();
        
        const { id_indikator, id_skala, id_pengisian_f02 } = req.body;
        
        if (!id_indikator || !id_skala || !id_pengisian_f02) {
            throw new ValidationError('ID indikator, ID skala, dan ID pengisian F02 harus diisi');
        }
        
        const pengisianF02 = await db.Pengisian_f02.findByPk(id_pengisian_f02, {
            include: [
                {
                    model: db.Evaluator_periode_penilaian,
                    as: 'evaluator_periode_penilaian',
                    include: [
                        {
                            model: db.Periode_penilaian,
                            as: 'periode_penilaian'
                        }
                    ]
                }
            ]
        });
        
        if (!pengisianF02) {
            throw new NotFoundError('Data pengisian F02 tidak ditemukan');
        }
        
        const indikator = await db.Indikator.findByPk(id_indikator, {
            include: [{
                model: db.Aspek_penilaian,
                as: 'AspekPenilaian'
            }]
        });
        
        if (!indikator) {
            throw new NotFoundError(`Indikator dengan ID ${id_indikator} tidak ditemukan`);
        }
   
        const skalaIndikator = await db.Skala_indikator.findByPk(id_skala);
        if (!skalaIndikator) {
            throw new NotFoundError(`Skala dengan ID ${id_skala} tidak ditemukan`);
        }
     
        const nilai_diperoleh = parseInt(skalaIndikator.nilai_skala);
        
        if (nilai_diperoleh === null || nilai_diperoleh === undefined) {
            throw new ValidationError('Nilai skala tidak valid');
        }
 
        const existingNilai = await db.nilai_indikator.findOne({
            where: {
                id_pengisian_f02: id_pengisian_f02,
                id_indikator: id_indikator
            }
        });
        
        if (existingNilai) {
            await db.nilai_indikator.update({
                id_skala: id_skala,
                nilai_diperolah: nilai_diperoleh,
                updatedAt: new Date()
            }, {
                where: {
                    id_nilai_indikator: existingNilai.id_nilai_indikator
                },
                transaction
            });
        } else {
            await db.nilai_indikator.create({
                id_pengisian_f02: id_pengisian_f02,
                id_indikator: id_indikator,
                id_skala: id_skala,
                nilai_diperolah: nilai_diperoleh,
                createdAt: new Date(),
                updatedAt: new Date()
            }, { transaction });
        }

        const id_aspek_penilaian = indikator.AspekPenilaian?.id_aspek_penilaian;
        
        if (!id_aspek_penilaian) {
            throw new ValidationError('Indikator tidak memiliki aspek penilaian yang terkait');
        }
        
        const aspekValues = {};
        
        const nilaiIndikatorList = await db.nilai_indikator.findAll({
            where: {
                id_pengisian_f02: id_pengisian_f02
            },
            include: [
                {
                    model: db.Indikator,
                    as: 'indikator',
                    include: [
                        {
                            model: db.Aspek_penilaian,
                            as: 'AspekPenilaian'
                        }
                    ],
                    required: true
                }
            ],
            transaction
        });
        
        for (const nilai of nilaiIndikatorList) {
            const aspekId = nilai.indikator.AspekPenilaian?.id_aspek_penilaian;
            if (aspekId) {
                if (!aspekValues[aspekId]) {
                    aspekValues[aspekId] = {
                        total: 0,
                        count: 0,
                        aspek: nilai.indikator.AspekPenilaian
                    };
                }
                aspekValues[aspekId].total += parseFloat(nilai.nilai_diperolah || 0);
                aspekValues[aspekId].count += 1;
            }
        }
        
        const allAspek = await db.Aspek_penilaian.findAll({
            transaction
        });
        
        const subAspekByParent = {};
        for (const aspek of allAspek) {
            if (aspek.parent_id_aspek_penilaian) {
                if (!subAspekByParent[aspek.parent_id_aspek_penilaian]) {
                    subAspekByParent[aspek.parent_id_aspek_penilaian] = [];
                }
                subAspekByParent[aspek.parent_id_aspek_penilaian].push(aspek.id_aspek_penilaian);
            }
        }
        
        for (const [id_aspek, data] of Object.entries(aspekValues)) {
            const nilai_rata_rata = data.count > 0 ? data.total / data.count : 0;
            
            const existingNilaiAspek = await db.Nilai_aspek.findOne({
                where: {
                    id_pengisian_f02: id_pengisian_f02,
                    id_aspek_penilaian: id_aspek
                }
            });
            
            if (existingNilaiAspek) {
                await db.Nilai_aspek.update({
                    total_nilai_indikator: nilai_rata_rata, 
                    updatedAt: new Date()
                }, {
                    where: {
                        id_nilai_aspek: existingNilaiAspek.id_nilai_aspek
                    },
                    transaction
                });
            } else {
                await db.Nilai_aspek.create({
                    id_pengisian_f02: id_pengisian_f02,
                    id_aspek_penilaian: id_aspek,
                    total_nilai_indikator: nilai_rata_rata, 
                    createdAt: new Date(),
                    updatedAt: new Date()
                }, { transaction });
            }
        }
        
        const konsolidasiSubAspek = {};
        for (const [parentId, subAspekList] of Object.entries(subAspekByParent)) {
            konsolidasiSubAspek[parentId] = {
                total: 0,
                count: 0,
                totalIndicators: 0, 
                subAspek: []
            };

            for (const subAspekId of subAspekList) {
                if (aspekValues[subAspekId]) {
                    konsolidasiSubAspek[parentId].total += aspekValues[subAspekId].total;
                    konsolidasiSubAspek[parentId].totalIndicators += aspekValues[subAspekId].count;
                    konsolidasiSubAspek[parentId].count += 1; 
                    konsolidasiSubAspek[parentId].subAspek.push({
                        id: subAspekId,
                        nilai: aspekValues[subAspekId].count > 0 ? aspekValues[subAspekId].total / aspekValues[subAspekId].count : 0 
                    });
                }
            }
            
            if (konsolidasiSubAspek[parentId].totalIndicators > 0) {
                konsolidasiSubAspek[parentId].total = konsolidasiSubAspek[parentId].total / konsolidasiSubAspek[parentId].totalIndicators;
            }
        }
        
        const indukAspek = allAspek.filter(aspek => !aspek.parent_id_aspek_penilaian);
        
        for (const aspek of indukAspek) {
            const id_aspek_penilaian = aspek.id_aspek_penilaian;
            let nilai_rata_rata = 0;
            
            if (konsolidasiSubAspek[id_aspek_penilaian]) {
                nilai_rata_rata = konsolidasiSubAspek[id_aspek_penilaian].total;
            } else if (aspekValues[id_aspek_penilaian]) {
                nilai_rata_rata = aspekValues[id_aspek_penilaian].count > 0 ? 
                    aspekValues[id_aspek_penilaian].total / aspekValues[id_aspek_penilaian].count : 0;
            } else {
                continue;
            }
            
            const existingNilaiAspek = await db.Nilai_aspek.findOne({
                where: {
                    id_pengisian_f02: id_pengisian_f02,
                    id_aspek_penilaian: id_aspek_penilaian
                }
            });
            
            if (existingNilaiAspek) {
                await db.Nilai_aspek.update({
                    total_nilai_indikator: nilai_rata_rata,
                    updatedAt: new Date()
                }, {
                    where: {
                        id_nilai_aspek: existingNilaiAspek.id_nilai_aspek
                    },
                    transaction
                });
            } else {
                await db.Nilai_aspek.create({
                    id_pengisian_f02: id_pengisian_f02,
                    id_aspek_penilaian: id_aspek_penilaian,
                    total_nilai_indikator: nilai_rata_rata, 
                    createdAt: new Date(),
                    updatedAt: new Date()
                }, { transaction });
            }
        }
        
        let totalNilaiAkhir = 0;
        let totalIndukAspek = 0;
        
        for (const aspek of indukAspek) {
            const id_aspek_penilaian = aspek.id_aspek_penilaian;
            let nilai_aspek = 0;
            
            if (konsolidasiSubAspek[id_aspek_penilaian]) {
                nilai_aspek = konsolidasiSubAspek[id_aspek_penilaian].total;
            } else if (aspekValues[id_aspek_penilaian]) {
                nilai_aspek = aspekValues[id_aspek_penilaian].count > 0 ? 
                    aspekValues[id_aspek_penilaian].total / aspekValues[id_aspek_penilaian].count : 0;
            } else {
                continue;
            }

            totalNilaiAkhir += nilai_aspek;
            totalIndukAspek += 1;
        }
        
        totalNilaiAkhir = totalIndukAspek > 0 ? totalNilaiAkhir / totalIndukAspek : 0;
        totalNilaiAkhir = parseFloat(totalNilaiAkhir.toFixed(4));

        const existingNilaiAkhir = await db.Nilai_akhir.findOne({
            where: {
                id_pengisian_f02: id_pengisian_f02
            }
        });
        
        if (existingNilaiAkhir) {
            await db.Nilai_akhir.update({
                total_nilai: totalNilaiAkhir,
                updatedAt: new Date()
            }, {
                where: {
                    id_nilai_akhir: existingNilaiAkhir.id_nilai_akhir
                },
                transaction
            });
        } else {
            await db.Nilai_akhir.create({
                id_pengisian_f02: id_pengisian_f02,
                total_nilai: totalNilaiAkhir,
                createdAt: new Date(),
                updatedAt: new Date()
            }, { transaction });
        }
        
        const id_opd = pengisianF02.id_opd;
        const id_periode_penilaian = pengisianF02.evaluator_periode_penilaian.periode_penilaian.id_periode_penilaian;
        
        const allPengisianF02ForOpd = await db.Pengisian_f02.findAll({
            where: {
                id_opd: id_opd
            },
            include: [
                {
                    model: db.Nilai_akhir,
                    as: 'nilai_akhir'
                },
                {
                    model: db.Evaluator_periode_penilaian,
                    as: 'evaluator_periode_penilaian',
                    include: [
                        {
                            model: db.Periode_penilaian,
                            as: 'periode_penilaian',
                            where: {
                                id_periode_penilaian: id_periode_penilaian
                            }
                        }
                    ]
                }
            ],
            transaction
        });
        
        let totalKumulatif = 0;
        let jumlahEvaluator = 0;
        
        for (const pengisian of allPengisianF02ForOpd) {
            if (pengisian.nilai_akhir && pengisian.nilai_akhir.total_nilai) {
                totalKumulatif += parseFloat(pengisian.nilai_akhir.total_nilai);
                jumlahEvaluator += 1;
            }
        }
        
        const nilaiKumulatif = parseFloat(totalKumulatif.toFixed(4));
        
        function determineCategory(nilai) {
            if (nilai >= 0 && nilai <= 1) return 'F';
            if (nilai > 1 && nilai <= 1.5) return 'E';
            if (nilai > 1.5 && nilai <= 2) return 'D';
            if (nilai > 2 && nilai <= 2.5) return 'C-';
            if (nilai > 2.5 && nilai <= 3) return 'C';
            if (nilai > 3 && nilai <= 3.5) return 'B-';
            if (nilai > 3.5 && nilai <= 4) return 'B';
            if (nilai > 4 && nilai <= 4.5) return 'A-';
            if (nilai > 4.5 && nilai <= 5) return 'A';
            return 'UNDEFINED';
        }
    
        let kategori = determineCategory(nilaiKumulatif);

        const existingNilaiKumulatif = await db.Nilai_akhir_kumulatif.findOne({
            where: {
                id_opd: id_opd,
                id_periode_penilaian: id_periode_penilaian
            }
        });
        
        if (existingNilaiKumulatif) {
            await db.Nilai_akhir_kumulatif.update({
                total_kumulatif: nilaiKumulatif,
                kategori: kategori,
                updatedAt: new Date()
            }, {
                where: {
                    id_nilai_kumulatif: existingNilaiKumulatif.id_nilai_kumulatif
                },
                transaction
            });
        } else {
            await db.Nilai_akhir_kumulatif.create({
                id_opd: id_opd,
                id_periode_penilaian: id_periode_penilaian,
                total_kumulatif: nilaiKumulatif,
                kategori: kategori,
                createdAt: new Date(),
                updatedAt: new Date()
            }, { transaction });
        }
        
        await transaction.commit();
        
        return res.status(200).json({
            success: true,
            status: 200,
            message: 'Nilai indikator berhasil diperbarui',
            data: {
                id_indikator,
                nilai_diperoleh,
                total_nilai_akhir: totalNilaiAkhir,
                nilai_kumulatif: nilaiKumulatif,
                kategori
            }
        });
        
    } catch (error) {
        if (transaction) await transaction.rollback();
        
        console.error('Error in editF02:', error);
        
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

const getGabunganHasil = async (req,res) => {
    try {
        const {id_periode_penilaian} = req.query
        const findData = await db.Nilai_akhir_kumulatif.findAll({
            attributes: ['id_Opd', 'total_kumulatif', 'kategori', 'feedback', 'id_periode_penilaian'],
            include: [
                {
                    model: db.Periode_penilaian,
                    as: 'periode_penilaian',
                    attributes: ['tahun_periode']
                },
                {
                    model: db.Opd,
                    as: 'opd',
                    attributes: ['nama_opd']
                }
            ],
            where: {
                id_periode_penilaian: id_periode_penilaian
            },
            separate: true,
            order: [['total_kumulatif', 'DESC']]
        })

        if (findData.lenght == 0) {
            throw new ValidationError('Data penilaian belum tersedia')
        }

        return res.status(200).json({success:true, status:200, message: 'Data penilaian tersedia', data: findData})
    } catch (error) {
        console.error('Error in editF02:', error);
        
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
}

module.exports = {EvaluatorByPeriode, getHasilPenilaian, detailHasilPenilaian, addFeedback, detailf02, findf01, editF02, getGabunganHasil}