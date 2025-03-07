const {ValidationError, NotFoundError} = require('../../utils/error')
const db = require('../../models')
const sequelize = require('../../config/database')
const { Op, where, Sequelize } = require('sequelize');

//tampil periode berdasar tahun device
const getPeriode = async (req, res) => {
    let transaction;
    try {
        transaction = await sequelize.transaction();
        const date = new Date();
        const year = date.getFullYear();
        const id_opd = req.user.id_user;
        
        const findPeriode = await db.Periode_penilaian.findOne({
            where: { 
                tahun_periode: year,
                status: 'aktif'
            },
            attributes: ['id_periode_penilaian', 'tahun_periode', 'tanggal_selesai', 'status'],
            transaction
        });
        
        if (!findPeriode) {
            throw new NotFoundError('Data periode pada tahun sekarang belum tersedia');
        }

        const checkPengisianF01 = await db.Pengisian_f01.findOne({
            where: {
                id_opd,
                id_periode_penilaian: findPeriode.id_periode_penilaian
            },
            transaction
        });
        
        const result = {
            ...findPeriode.get({ plain: true }),
            status_submit: checkPengisianF01 ? "submit" : "belum submit"
        };
        
        await transaction.commit();
        
        return res.status(200).json({
            success: true, 
            status: 200, 
            message: 'Data periode penilaian ditemukan', 
            data: result
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
        }
        
        // Proses jawaban
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

        for (const item of jawabanData) {
            const { id_pertanyaan, id_opsi_jawaban, jawaban_text } = item;
            
            if (!id_pertanyaan) {
                throw new ValidationError('ID pertanyaan diperlukan untuk setiap jawaban');
            }
            
            const existingJawaban = await db.Jawaban.findOne({
                where: {
                    id_pertanyaan,
                    id_pengisian_f01: pengisianF01.id_pengisian_f01
                },
                transaction
            });
            
            if (existingJawaban) {
                await existingJawaban.update({
                    id_opsi_jawaban: id_opsi_jawaban || null,
                    jawaban_text: jawaban_text || null,
                    updatedAt: new Date()
                }, { transaction });
            } else {
                await db.Jawaban.create({
                    id_pertanyaan,
                    id_pengisian_f01: pengisianF01.id_pengisian_f01,
                    id_opsi_jawaban: id_opsi_jawaban || null,
                    jawaban_text: jawaban_text || null
                }, { transaction });
            }
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
            
            buktiDukungData.forEach((item, idx) => {
                console.log(`Bukti dukung ${idx}:`, item);
            });
            
            // Proses file yang diupload
            for (let i = 0; i < req.files.length; i++) {
                const file = req.files[i];
                console.log(`Processing file ${i}:`, file.originalname);
                

                const buktiData = i < buktiDukungData.length ? buktiDukungData[i] : null;
                
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
            console.log('No files uploaded');
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