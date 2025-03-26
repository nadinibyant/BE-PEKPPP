const {ValidationError, NotFoundError} = require('../../utils/error')
const db = require('../../models')
const sequelize = require('../../config/database')
const { Op, where, Sequelize } = require('sequelize');

const getDataVerifikasi = async (req, res) => {
    try {
        const year = req.query.year || new Date().getFullYear().toString();
        const limit = parseInt(req.query.limit || 10);
        const offset = parseInt(req.query.offset || 0);

        const findAll = await db.Pengisian_f01.findAll({
            include: [
                {
                    model: db.Opd,
                    as: 'opd',
                    attributes: ['id_opd', 'nama_opd']
                },
                {
                    model: db.Periode_penilaian,
                    as: 'periode_penilaian',
                    where: {
                        tahun_periode: year
                    },
                    attributes: []
                }
            ],
            attributes: ['id_pengisian_f01', 'status_pengisian', 'updatedAt'],
            // pagination
            order: [['updatedAt', 'DESC']],
            limit: limit,
            offset: offset
        });

        if (findAll.length > 0) {
            return res.status(200).json({
                success: true, 
                status: 200, 
                message: 'Data penilaian f-01 ditemukan', 
                data: findAll
            });
        }

        throw new NotFoundError('Data penilaian f-01 belum tersedia');
        
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
};

//tampil detail data verifikasi 
const detailVerifikasi = async (req, res) => {
    try {
        const { id_pengisian_f01 } = req.params;
        
        // Fetch raw data with the same includes as before
        const findPengisian = await db.Pengisian_f01.findByPk(id_pengisian_f01, {
            include: [
                {
                    model: db.Opd,
                    as: 'opd',
                    attributes: ['nama_opd']
                },
                {
                    model: db.Jawaban,
                    as: 'jawabans',
                    attributes: ['id_jawaban', 'id_pertanyaan', 'jawaban_text', 'id_opsi_jawaban'],
                    include: [
                        {
                            model: db.Pertanyaan,
                            as: 'pertanyaan',
                            seperate: true,
                            order: [['urutan', 'ASC']],
                            attributes: ['id_pertanyaan', 'pertanyaan_id_pertanyaan', 'indikator_id_indikator', 'teks_pertanyaan', 'urutan', 'trigger_value', 'keterangan_trigger'],
                            include: [
                                {
                                    model: db.Indikator,
                                    as: 'Indikator',
                                    attributes: ['id_indikator', 'nama_indikator', 'kode_indikator', 'urutan'],
                                    seperate: true,
                                    order: [['urutan', 'ASC']] // Add explicit ordering by urutan
                                },
                                // Add TipePertanyaan to determine multiple choice
                                {
                                    model: db.Tipe_pertanyaan,
                                    foreignKey: 'tipe_pertanyaan_id_tipe_pertanyaan', 
                                    as: 'TipePertanyaan',
                                    attributes: ['id_tipe_pertanyaan', 'nama_jenis', 'kode_jenis'],
                                    include: [{
                                        model: db.Tipe_opsi_jawaban,
                                        attributes: ['id_tipe_opsi', 'nama_tipe']
                                    }]
                                }
                            ]
                        },
                        {
                            model: db.Opsi_jawaban,
                            as: 'opsi_jawaban',
                            attributes: ['id_opsi_jawaban', 'teks_opsi', 'memiliki_isian_lainnya', 'urutan']
                        }
                    ]
                },
                {
                    model: db.Bukti_dukung_upload,
                    as: 'bukti_dukung_uploads',
                    attributes: ['id_bukti_upload', 'id_bukti_dukung', 'nama_file', 'id_indikator'],
                    include: [
                        {
                            model: db.Bukti_dukung,
                            as: 'bukti_dukung',
                            attributes: ['id_bukti_dukung', 'nama_bukti_dukung', 'urutan']
                        },
                        {
                            model: db.Indikator,
                            as: 'indikator',
                            attributes: ['id_indikator', 'nama_indikator', 'kode_indikator', 'urutan'],
                            order: [['urutan', 'ASC']] // Add explicit ordering
                        }
                    ]
                }
            ],
            attributes: ['id_pengisian_f01', 'status_pengisian']
        });

        if (!findPengisian) {
            throw new NotFoundError('Data pengisian f01 tidak ditemukan');
        }

        // Group jawaban by pertanyaan
        const jawabanByPertanyaan = new Map();
        findPengisian.jawabans.forEach(jawaban => {
            const pertanyaanId = jawaban.id_pertanyaan;
            if (!jawabanByPertanyaan.has(pertanyaanId)) {
                jawabanByPertanyaan.set(pertanyaanId, []);
            }
            jawabanByPertanyaan.get(pertanyaanId).push(jawaban);
        });

        const indikatorMap = new Map();
   
        // Process each pertanyaan and its jawaban
        findPengisian.jawabans.forEach(jawaban => {
            if (jawaban.pertanyaan && jawaban.pertanyaan.Indikator) {
                const indikator = jawaban.pertanyaan.Indikator;
                const indikatorId = indikator.id_indikator;
                
                if (!indikatorMap.has(indikatorId)) {
                    indikatorMap.set(indikatorId, {
                        id_indikator: indikatorId,
                        nama_indikator: indikator.nama_indikator,
                        kode_indikator: indikator.kode_indikator,
                        urutan: indikator.urutan, // Store urutan for sorting
                        pertanyaan: {},
                        bukti_dukung: []
                    });
                }
            }
        });
        
        // Process bukti_dukung
        findPengisian.bukti_dukung_uploads.forEach(bukti => {
            if (bukti.indikator) {
                const indikatorId = bukti.indikator.id_indikator;
                
                if (!indikatorMap.has(indikatorId)) {
                    indikatorMap.set(indikatorId, {
                        id_indikator: indikatorId,
                        nama_indikator: bukti.indikator.nama_indikator,
                        kode_indikator: bukti.indikator.kode_indikator,
                        urutan: bukti.indikator.urutan, // Store urutan for sorting
                        pertanyaan: {},
                        bukti_dukung: []
                    });
                }
                
                indikatorMap.get(indikatorId).bukti_dukung.push({
                    id_bukti_dukung: bukti.bukti_dukung.id_bukti_dukung,
                    nama_bukti_dukung: bukti.bukti_dukung.nama_bukti_dukung,
                    urutan: bukti.bukti_dukung.urutan,
                    bukti_dukung_upload: {
                        id_bukti_upload: bukti.id_bukti_upload,
                        nama_file: bukti.nama_file
                    }
                });
            }
        });
        
        // Process pertanyaan and determine multiple choice
        const pertanyaanMap = new Map();
        findPengisian.jawabans.forEach(jawaban => {
            if (jawaban.pertanyaan) {
                const pertanyaan = jawaban.pertanyaan;
                
                if (!pertanyaanMap.has(pertanyaan.id_pertanyaan)) {
                    // Check if pertanyaan is multiple choice
                    let isMultipleChoice = false;
                    
                    if (pertanyaan.TipePertanyaan) {
                        const tipePertanyaan = pertanyaan.TipePertanyaan;
                        
                        // Check based on kode_jenis
                        isMultipleChoice = 
                            tipePertanyaan.kode_jenis === 'multiple_choice' || 
                            tipePertanyaan.kode_jenis === 'multi_choice_other';
                        
                        // If not detected yet, check from Tipe_opsi_jawaban
                        if (!isMultipleChoice && tipePertanyaan.Tipe_opsi_jawaban) {
                            isMultipleChoice = tipePertanyaan.Tipe_opsi_jawaban.nama_tipe === 'multi_select';
                        }
                    }
                    
                    pertanyaanMap.set(pertanyaan.id_pertanyaan, {
                        id_pertanyaan: pertanyaan.id_pertanyaan,
                        pertanyaan_id_pertanyaan: pertanyaan.pertanyaan_id_pertanyaan,
                        indikator_id: pertanyaan.Indikator ? pertanyaan.Indikator.id_indikator : null,
                        teks_pertanyaan: pertanyaan.teks_pertanyaan,
                        urutan: pertanyaan.urutan,
                        trigger_value: pertanyaan.trigger_value,
                        keterangan_trigger: pertanyaan.keterangan_trigger,
                        isMultipleChoice: isMultipleChoice,
                        jawaban: isMultipleChoice ? [] : null,
                        child_pertanyaan: []
                    });
                }
            }
        });
    
        // Process jawaban based on whether pertanyaan is multiple choice or not
        findPengisian.jawabans.forEach(jawaban => {
            if (jawaban.pertanyaan) {
                const pertanyaanId = jawaban.pertanyaan.id_pertanyaan;
                
                if (pertanyaanMap.has(pertanyaanId)) {
                    const pertanyaanData = pertanyaanMap.get(pertanyaanId);
                    
                    const jawabanObj = {
                        id_jawaban: jawaban.id_jawaban,
                        jawaban_text: jawaban.jawaban_text,
                        opsi_jawaban: jawaban.opsi_jawaban ? {
                            id_opsi_jawaban: jawaban.opsi_jawaban.id_opsi_jawaban,
                            teks_opsi: jawaban.opsi_jawaban.teks_opsi,
                            memiliki_isian_lainnya: jawaban.opsi_jawaban.memiliki_isian_lainnya
                        } : null
                    };
                    
                    if (pertanyaanData.isMultipleChoice) {
                        // For multiple choice, add to array
                        pertanyaanData.jawaban.push(jawabanObj);
                    } else {
                        // For single choice, set directly
                        pertanyaanData.jawaban = jawabanObj;
                    }
                }
            }
        });

        // Connect pertanyaan to indikator
        pertanyaanMap.forEach((pertanyaan, id) => {
            if (pertanyaan.indikator_id && indikatorMap.has(pertanyaan.indikator_id)) {
                const indikatorObj = indikatorMap.get(pertanyaan.indikator_id);
                if (!indikatorObj.pertanyaan[id]) {
                    indikatorObj.pertanyaan[id] = pertanyaan;
                }
            }
        });
    
        // Handle child pertanyaan
        pertanyaanMap.forEach((pertanyaan) => {
            if (pertanyaan.pertanyaan_id_pertanyaan) {
                const parentId = pertanyaan.pertanyaan_id_pertanyaan;
                if (pertanyaanMap.has(parentId)) {
                    pertanyaanMap.get(parentId).child_pertanyaan.push(pertanyaan);
                    // Remove from the main pertanyaan list (optional)
                    // Consider if you want to keep the child in both places
                }
            }
        });
        
        // Sort everything
        indikatorMap.forEach(indikator => {
            // Sort child pertanyaan by urutan
            Object.values(indikator.pertanyaan).forEach(pertanyaan => {
                pertanyaan.child_pertanyaan.sort((a, b) => a.urutan - b.urutan);
            });
            
            // Convert pertanyaan object to array and sort
            indikator.pertanyaan = Object.values(indikator.pertanyaan)
                .sort((a, b) => a.urutan - b.urutan);
            
            // Sort bukti_dukung
            indikator.bukti_dukung.sort((a, b) => a.urutan - b.urutan);
        });
        
        // Convert to array and sort by indikator urutan
        const indikatorData = Array.from(indikatorMap.values())
            .sort((a, b) => a.urutan - b.urutan);

        const responseData = {
            id_pengisian_f01: findPengisian.id_pengisian_f01,
            status_pengisian: findPengisian.status_pengisian,
            opd: findPengisian.opd,
            indikator: indikatorData
        };

        return res.status(200).json({
            success: true, 
            status: 200, 
            message: 'Data pengisian f01 ditemukan', 
            data: responseData
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
};

//setuju
const accVerify = async (req, res) => {
    let transaction;
    try {
        transaction = await sequelize.transaction();

        const {id_pengisian_f01} = req.query;

        if (!id_pengisian_f01) {
            await db.Pengisian_f01.update(
                { status_pengisian: 'Disetujui' },
                { 
                    where: {}, 
                    transaction 
                }
            );
            
            await transaction.commit();
            return res.status(200).json({
                success: true,
                status: 200,
                message: 'Semua data pengisian F01 berhasil disetujui'
            });
        } else {
            const existingData = await db.Pengisian_f01.findByPk(id_pengisian_f01, { transaction });
            if (!existingData) {
                await transaction.rollback();
                return res.status(404).json({
                    success: false, 
                    status: 404, 
                    message: 'Data pengisian F01 dengan ID tersebut tidak ditemukan'
                });
            }

            await db.Pengisian_f01.update(
                { status_pengisian: 'Disetujui' },
                {
                    where: { id_pengisian_f01 },
                    transaction
                }
            );
            
            await transaction.commit();
            return res.status(200).json({
                success: true, 
                status: 200, 
                message: 'Data pengisian F01 berhasil disetujui'
            });
        }
        
    } catch (error) {
        if (transaction) await transaction.rollback();
        console.error('Error in accVerify:', error);
        
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


//tolak
const decVerify = async (req, res) => {
    let transaction;
    try {
        transaction = await sequelize.transaction();

        const {id_pengisian_f01} = req.query;

        if (!id_pengisian_f01) {
            await db.Pengisian_f01.update(
                { status_pengisian: 'Ditolak' },
                { 
                    where: {}, 
                    transaction 
                }
            );
            
            await transaction.commit();
            return res.status(200).json({
                success: true,
                status: 200,
                message: 'Semua data pengisian F01 berhasil ditolak'
            });
        } else {
            const existingData = await db.Pengisian_f01.findByPk(id_pengisian_f01, { transaction });
            if (!existingData) {
                await transaction.rollback();
                return res.status(404).json({
                    success: false, 
                    status: 404, 
                    message: 'Data pengisian F01 dengan ID tersebut tidak ditemukan'
                });
            }

            await db.Pengisian_f01.update(
                { status_pengisian: 'Ditolak' },
                {
                    where: { id_pengisian_f01 },
                    transaction
                }
            );
            
            await transaction.commit();
            return res.status(200).json({
                success: true, 
                status: 200, 
                message: 'Data pengisian F01 berhasil ditolak'
            });
        }
        
    } catch (error) {
        if (transaction) await transaction.rollback();
        console.error('Error in accVerify:', error);
        
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

module.exports = {getDataVerifikasi, detailVerifikasi, accVerify, decVerify}