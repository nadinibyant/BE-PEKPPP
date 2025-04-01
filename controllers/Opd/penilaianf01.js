const {ValidationError, NotFoundError} = require('../../utils/error')
const db = require('../../models')
const sequelize = require('../../config/database')
const { Op, where, Sequelize } = require('sequelize');

//tampil periode berdasar tahun device
const getPeriode = async (req, res) => {
    try {
        const date = new Date();
        const year = date.getFullYear();
        const id_opd = req.user.id_user;
        
        const findPeriode = await db.Periode_penilaian.findOne({
            where: { 
                tahun_periode: year,
                status: 'aktif'
            },
            attributes: ['id_periode_penilaian', 'tahun_periode', 'tanggal_selesai', 'status']
        });
        
        if (!findPeriode) {
            throw new NotFoundError('Data periode pada tahun sekarang belum tersedia');
        }

        const checkPengisianF01 = await db.Pengisian_f01.findOne({
            where: {
                id_opd,
                id_periode_penilaian: findPeriode.id_periode_penilaian
            }
        });

        const periodeWithF01 = await db.Periode_penilaian.findOne({
            where: { 
                id_periode_penilaian: findPeriode.id_periode_penilaian
            },
            attributes: ['id_periode_penilaian', 'tahun_periode', 'tanggal_selesai', 'status'],
            include: [
                {
                    model: db.Pengisian_f01,
                    as: 'pengisian_f01s',
                    where: {
                        id_opd
                    },
                    required: false,
                    attributes: ['id_pengisian_f01', 'status_pengisian']
                }
            ]
        });
        
        const result = {
            ...periodeWithF01.get({ plain: true }),
            status_submit: checkPengisianF01 ? "submit" : "belum submit"
        };
        
        return res.status(200).json({
            success: true, 
            status: 200, 
            message: 'Data periode penilaian ditemukan', 
            data: result
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

//submit penilaian f01
const submitPenilaianf01 = async (req, res) => {
    let transaction;
    try {
        transaction = await sequelize.transaction();
        const id_opd = req.user.id_user;
        const { id_periode_penilaian } = req.params;

        if (!id_periode_penilaian) {
            throw new ValidationError('ID periode penilaian diperlukan');
        }

        const periodeExists = await db.Periode_penilaian.findOne({
            where: { 
                id_periode_penilaian,
                status: 'aktif'
            },
            transaction
        });
        
        if (!periodeExists) {
            throw new NotFoundError('Periode penilaian tidak ditemukan atau tidak aktif');
        }

        let pengisianF01 = await db.Pengisian_f01.findOne({
            where: {
                id_opd,
                id_periode_penilaian
            },
            transaction
        });
    
        if (!pengisianF01) {
            pengisianF01 = await db.Pengisian_f01.create({
                id_opd,
                id_periode_penilaian,
                status_pengisian: 'Menunggu Verifikasi' 
            }, { transaction });
        } else {
            await pengisianF01.update({
                status_pengisian: 'Menunggu Verifikasi',
                updatedAt: new Date()
            }, { transaction });

            console.log(`Menghapus semua jawaban lama untuk pengisian ${pengisianF01.id_pengisian_f01}`);
            await db.Jawaban.destroy({
                where: {
                    id_pengisian_f01: pengisianF01.id_pengisian_f01
                },
                transaction
            });
        }
        
        const jawaban = req.body.jawaban;
        
        let jawabanData;
        if (typeof jawaban === 'string') {
            try {
                jawabanData = JSON.parse(jawaban);
            } catch (error) {
                throw new ValidationError('Format jawaban tidak valid (JSON tidak valid)');
            }
        } else if (Array.isArray(jawaban)) {
            jawabanData = jawaban;
        } else {
            throw new ValidationError('Format jawaban tidak valid');
        }
        
        if (!jawabanData || !Array.isArray(jawabanData)) {
            throw new ValidationError('Format jawaban tidak valid');
        }
        const processedMultipleChoiceQuestions = new Set();

        for (const item of jawabanData) {
            const { id_pertanyaan, id_opsi_jawaban, jawaban_text, jawaban_lainnya } = item;
            
            if (!id_pertanyaan) {
                throw new ValidationError('ID pertanyaan diperlukan untuk setiap jawaban');
            }
            
            const pertanyaan = await db.Pertanyaan.findOne({
                where: { id_pertanyaan },
                include: [{
                    model: db.Tipe_pertanyaan,
                    foreignKey: 'tipe_pertanyaan_id_tipe_pertanyaan',
                    as: 'TipePertanyaan',
                    include: [{
                        model: db.Tipe_opsi_jawaban,
                        foreignKey: 'id_tipe_pertanyaan'
                    }]
                }],
                transaction
            });
            
            let isMultipleChoice = false;
            
            if (pertanyaan && pertanyaan.TipePertanyaan) {
                isMultipleChoice = 
                    pertanyaan.TipePertanyaan.kode_jenis === 'multiple_choice' || 
                    pertanyaan.TipePertanyaan.kode_jenis === 'multi_choice_other';
                if (!isMultipleChoice && pertanyaan.TipePertanyaan.Tipe_opsi_jawaban) {
                    isMultipleChoice = pertanyaan.TipePertanyaan.Tipe_opsi_jawaban.nama_tipe === 'multi_select';
                }
            }
            
            console.log(`Pertanyaan ${id_pertanyaan} isMultipleChoice:`, isMultipleChoice);
            if (isMultipleChoice && id_opsi_jawaban) {
                if (!processedMultipleChoiceQuestions.has(id_pertanyaan)) {
                    processedMultipleChoiceQuestions.add(id_pertanyaan);
                }
                
                // Buat jawaban baru untuk opsi ini
                console.log(`Membuat jawaban baru untuk pertanyaan ${id_pertanyaan}, opsi ${id_opsi_jawaban}`);
                await db.Jawaban.create({
                    id_pertanyaan,
                    id_pengisian_f01: pengisianF01.id_pengisian_f01,
                    id_opsi_jawaban,
                    jawaban_text: jawaban_lainnya || null
                }, { transaction });
                
                continue; 
            }
            console.log(`Buat jawaban baru untuk pertanyaan ${id_pertanyaan}`);
            await db.Jawaban.create({
                id_pertanyaan,
                id_pengisian_f01: pengisianF01.id_pengisian_f01,
                id_opsi_jawaban: id_opsi_jawaban || null,
                jawaban_text: jawaban_text || null
            }, { transaction });
        }
        if (req.files && Array.isArray(req.files) && req.files.length > 0) {
            console.log(`Uploaded ${req.files.length} files`);
            
            let buktiDukungData = [];
            
            if (req.body.bukti_dukung) {
                try {
                    if (typeof req.body.bukti_dukung === 'string') {
                        buktiDukungData = JSON.parse(req.body.bukti_dukung);
                    } else if (Array.isArray(req.body.bukti_dukung)) {
                        buktiDukungData = req.body.bukti_dukung;
                    }
                } catch (error) {
                    console.error('Error parsing bukti_dukung:', error);
                }
            }
            
            if (!Array.isArray(buktiDukungData)) {
                buktiDukungData = [];
            }
            let existingFiles = [];
            if (req.body.existing_files) {
                try {
                    if (typeof req.body.existing_files === 'string') {
                        existingFiles = JSON.parse(req.body.existing_files);
                    } else if (Array.isArray(req.body.existing_files)) {
                        existingFiles = req.body.existing_files;
                    }
                } catch (error) {
                    console.error('Error parsing existing_files:', error);
                }
            }
            
            console.log('Existing files to preserve:', existingFiles);
            
            const keepFileNames = existingFiles.map(file => file.nama_file);
            const keepBuktiIds = new Set([
                ...existingFiles.map(file => file.id_bukti_dukung),
                ...buktiDukungData.map(bukti => bukti.id_bukti_dukung)
            ]);
            
            if (keepBuktiIds.size > 0) {
                await db.Bukti_dukung_upload.destroy({
                    where: {
                        id_pengisian_f01: pengisianF01.id_pengisian_f01,
                        [Sequelize.Op.and]: [
                            {
                                [Sequelize.Op.or]: [
                                    {
                                        id_bukti_dukung: {
                                            [Sequelize.Op.notIn]: Array.from(keepBuktiIds)
                                        }
                                    },
                                    {
                                        nama_file: {
                                            [Sequelize.Op.notIn]: keepFileNames
                                        }
                                    }
                                ]
                            }
                        ]
                    },
                    transaction
                });
            }
            
            // Log for debugging
            buktiDukungData.forEach((item, idx) => {
                console.log(`Bukti dukung ${idx}:`, item);
            });
            for (let i = 0; i < req.files.length; i++) {
                const file = req.files[i];
                console.log(`Processing file ${i}:`, file.originalname);
                const fieldIndex = file.fieldname ? parseInt(file.fieldname.replace('bukti_file_', ''), 10) : null;
                let buktiData = null;
                
                if (!isNaN(fieldIndex) && fieldIndex < buktiDukungData.length) {
                    buktiData = buktiDukungData[fieldIndex];
                } else if (i < buktiDukungData.length) {
                    buktiData = buktiDukungData[i];
                }
                
                if (!buktiData || !buktiData.id_bukti_dukung) {
                    console.warn(`Skipping file ${i} - no associated bukti_dukung data`);
                    continue;
                }
                
                if (!file.filename) {
                    console.error(`File ${i} doesn't have a filename property`);
                    console.log('File object:', file);
                    throw new Error(`File ${i} missing filename property`);
                }
                
                const relativePath = `../public/doc/bukti_dukung/${file.filename}`;
                
                await db.Bukti_dukung_upload.destroy({
                    where: {
                        id_bukti_dukung: buktiData.id_bukti_dukung,
                        id_pengisian_f01: pengisianF01.id_pengisian_f01
                    },
                    transaction
                });
                
                try {
                    await db.Bukti_dukung_upload.create({
                        id_bukti_dukung: buktiData.id_bukti_dukung,
                        nama_file: file.filename,  
                        file_path: relativePath,
                        id_pengisian_f01: pengisianF01.id_pengisian_f01,
                        id_indikator: buktiData.id_indikator || null
                    }, { transaction });
                    
                    console.log(`Successfully saved bukti dukung ${i}`);
                } catch (error) {
                    console.error(`Error saving bukti dukung ${i}:`, error);
                    throw error; 
                }
            }
        } else {
            console.log('No new files uploaded');
            let existingFiles = [];
            if (req.body.existing_files) {
                try {
                    if (typeof req.body.existing_files === 'string') {
                        existingFiles = JSON.parse(req.body.existing_files);
                    } else if (Array.isArray(req.body.existing_files)) {
                        existingFiles = req.body.existing_files;
                    }
                } catch (error) {
                    console.error('Error parsing existing_files:', error);
                }
            }
            
            if (existingFiles.length > 0) {
                console.log(`Preserving ${existingFiles.length} existing files`);
                const allBuktiDukungIds = new Set();
                const keepFileNames = existingFiles.map(file => file.nama_file);
                await db.Bukti_dukung_upload.destroy({
                    where: {
                        id_pengisian_f01: pengisianF01.id_pengisian_f01,
                        nama_file: {
                            [Sequelize.Op.notIn]: keepFileNames
                        }
                    },
                    transaction
                });
            } else {
                console.log('No existing files specified to preserve');
            }
        }
        
        await transaction.commit();
        
        return res.status(200).json({
            success: true,
            status: 200,
            message: 'Data penilaian F01 berhasil disimpan',
            data: {
                id_pengisian_f01: pengisianF01.id_pengisian_f01,
                status_pengisian: pengisianF01.status_pengisian
            }
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
module.exports = {getPeriode, submitPenilaianf01}