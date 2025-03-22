const {ValidationError, NotFoundError} = require('../../utils/error')
const db = require('../../models')
const sequelize = require('../../config/database')
const { Op, where } = require('sequelize');


// tambah aspek
const tambahAspek = async (req,res) => {
    let transaction;
    try {
        transaction = await sequelize.transaction();
        const {nama_aspek, bobot_aspek, sub_aspek, daftar_sub_aspek} = req.body

        if (!nama_aspek || !bobot_aspek || !sub_aspek) {
            throw new ValidationError('Silahkan lengkapi data aspek')
        }

        const findAspek = await db.Aspek_penilaian.findOne({
            where: sequelize.literal(`LOWER(nama_aspek) = LOWER('${nama_aspek.replace(/'/g, "''")}')`),
            transaction
        })
        if (findAspek) {
            throw new ValidationError('Nama aspek penilaian sudah digunakan')
        }

        const getUrutan = await db.Aspek_penilaian.findOne({
            where:{parent_id_aspek_penilaian: null},
            order: [['urutan', 'DESC']],
            transaction
        })

        const nextUrutan = getUrutan ? getUrutan.urutan + 1 : 1

        if (sub_aspek == true) {
            if (!Array.isArray(daftar_sub_aspek) || daftar_sub_aspek.length === 0) {
                throw new ValidationError('Daftar sub aspek harus dalam bentuk array')
            }

            const addAspek = await db.Aspek_penilaian.create({nama_aspek, bobot_aspek, urutan: nextUrutan}, {transaction})

            await Promise.all(daftar_sub_aspek.map((nama_sub_aspek, index) => 
                db.Aspek_penilaian.create({
                    nama_aspek: nama_sub_aspek,
                    parent_id_aspek_penilaian: addAspek.id_aspek_penilaian,
                    urutan: index + 1
                }, {transaction})
            ))
            await transaction.commit()
            return res.status(200).json({success:true, status:200, message: 'Data aspek dan sub aspek penilaian berhasil ditambahkan'})
        } else {
            await db.Aspek_penilaian.create({nama_aspek, bobot_aspek, urutan: nextUrutan}, {transaction})
            await transaction.commit()
            return res.status(200).json({success:true, status:200, message: 'Data aspek penilaian berhasil ditambahkan'})
        }
    } catch (error) {
        if (transaction) await transaction.rollback();
        console.error(error)
        switch(error.constructor) {
            case ValidationError:
                return res.status(400).json({
                    success: false,
                    status:400,
                    message: error.message
                });
                
            case NotFoundError:
                return res.status(404).json({
                    success: false,
                    status:404,
                    message: error.message
                });
                
            default:
                return res.status(500).json({
                    success: false,
                    status:500,
                    message: 'Kesalahan Server'
                });
        }
    }
}

// tambah indikator by id aspek // id sub aspek
const tambahIndikator = async (req, res) => {
    let transaction;
    try {
        transaction = await sequelize.transaction();

        const {
            id_sub_aspek_penilaian, 
            kode_indikator, 
            nama_indikator, 
            penjelasan, 
            id_aspek_penilaian
        } = req.body;

        if (!kode_indikator || !nama_indikator) {
            throw new ValidationError('Silahkan lengkapi kode dan nama indikator');
        }

        const findIndikator = await db.Indikator.findOne({
            where:{
                kode_indikator,
            }
        })

        if (findIndikator) {
            throw new ValidationError('Data indikator dengan kode tersebut sudah tersedia')
        }

        // Jika tidak ada sub aspek
        if (!id_sub_aspek_penilaian) {
            if (!id_aspek_penilaian) {
                throw new ValidationError('ID aspek penilaian diperlukan');
            }

            const findAspek = await db.Aspek_penilaian.findOne({
                where: {
                    id_aspek_penilaian,
                    parent_id_aspek_penilaian: null
                },
                transaction
            });

            if (!findAspek) {
                throw new ValidationError('Data aspek penilaian tidak ditemukan');
            }

            // aspek ini memiliki sub aspek?
            const hasSubAspek = await db.Aspek_penilaian.findOne({
                where: { parent_id_aspek_penilaian: id_aspek_penilaian },
                transaction
            });

            if (hasSubAspek) {
                throw new ValidationError('Aspek ini memiliki sub aspek, silahkan pilih sub aspek untuk menambahkan indikator');
            }

            const findAllIndikator = await db.Indikator.findAll({
                where: { id_aspek_penilaian },
                transaction
            });
            
            const totalIndikator = findAllIndikator.length + 1;
            const bobot_indikator = findAspek.bobot_aspek / totalIndikator;

            // update bobot lama indikator lain
            await Promise.all(findAllIndikator.map(indikator => 
                db.Indikator.update(
                    { bobot_indikator},
                    { 
                        where: { id_indikator: indikator.id_indikator },
                        transaction 
                    }
                )
            ));

            const findLastUrutan = await db.Indikator.findOne({
                where: { id_aspek_penilaian },
                order: [['urutan', 'DESC']],
                transaction
            });

            const nextUrutan = findLastUrutan ? findLastUrutan.urutan + 1 : 1;

            await db.Indikator.create({
                nama_indikator,
                kode_indikator,
                bobot_indikator,
                penjelasan,
                id_aspek_penilaian,
                urutan: nextUrutan
            }, { transaction });

        } else {
            // Jika ada sub aspek
            const findSubAspek = await db.Aspek_penilaian.findOne({
                where: { id_aspek_penilaian: id_sub_aspek_penilaian },
                include: [{
                    model: db.Aspek_penilaian,
                    as: 'ParentAspek',
                    required: true
                }],
                transaction
            });

            if (!findSubAspek) {
                throw new ValidationError('Data sub aspek penilaian tidak ditemukan');
            }

            const findAllIndikator = await db.Indikator.findAll({
                where: { id_aspek_penilaian: id_sub_aspek_penilaian },
                transaction
            });

            const totalIndikator = findAllIndikator.length + 1;
            const bobot_indikator = findSubAspek.ParentAspek.bobot_aspek / totalIndikator;

            await Promise.all(findAllIndikator.map(indikator => 
                db.Indikator.update(
                    { bobot_indikator},
                    { 
                        where: { id_indikator: indikator.id_indikator },
                        transaction 
                    }
                )
            ));

            const findLastUrutan = await db.Indikator.findOne({
                where: { id_aspek_penilaian: id_sub_aspek_penilaian },
                order: [['urutan', 'DESC']],
                transaction
            });

            const nextUrutan = findLastUrutan ? findLastUrutan.urutan + 1 : 1;

            await db.Indikator.create({
                kode_indikator,
                nama_indikator,
                penjelasan,
                id_aspek_penilaian: id_sub_aspek_penilaian,
                bobot_indikator,
                urutan: nextUrutan
            }, { transaction });
        }

        await transaction.commit();
        return res.status(200).json({
            success: true,
            status: 200,
            message: 'Data indikator berhasil ditambahkan'
        });

    } catch (error) {
        if (transaction) await transaction.rollback();
        
        console.error('Error in tambahIndikator:', error);

        switch(error.constructor) {
            case ValidationError:
                return res.status(400).json({
                    success: false,
                    status:400,
                    message: error.message
                });
                
            case NotFoundError:
                return res.status(404).json({
                    success: false,
                    status:404,
                    message: error.message
                });
                
            default:
                return res.status(500).json({
                    success: false,
                    status:500,
                    message: 'Kesalahan Server'
                });
        }
    }
};

// tambah bukti dukung by id indikator
const tambahBuktiDukung = async (req,res) => {
    let transaction
    try {
        transaction = await sequelize.transaction();
        const {id_indikator, nama_bukti_dukung} = req.body

        if (!id_indikator || !nama_bukti_dukung) {
            throw new ValidationError('Silahkan lengkapi data bukti dukung')
        }

        if (!Array.isArray(nama_bukti_dukung) || nama_bukti_dukung.length === 0) {
            throw new ValidationError('Nama Bukti dukung harus dalam bentuk array')
        }

        const findIndikator = await db.Indikator.findByPk(id_indikator, {transaction})
        if (!findIndikator) {
            throw new ValidationError('Data indikator tidak ditemukan')
        }


        const findNamaBukti = await db.Bukti_dukung.findAll({
            where: {
                id_indikator,
                nama_bukti_dukung: {
                    [Op.in]: nama_bukti_dukung
                }
            },
            transaction
        });

        if (findNamaBukti.length > 0) {
            throw new ValidationError(`Nama bukti dukung berikut sudah digunakan`);
        }

        const findUrutan = await db.Bukti_dukung.findOne({
            where:{id_indikator},
            order: [['urutan', 'DESC']],
            transaction
        },)

        let lastUrutan = findUrutan ? findUrutan.urutan : 0;

        await Promise.all(nama_bukti_dukung.map(async (nama) => {
            lastUrutan += 1;
            return await db.Bukti_dukung.create({
                nama_bukti_dukung: nama,
                urutan: lastUrutan,
                id_indikator
            }, {transaction});
        }));

        await transaction.commit()

        return res.status(200).json({success:true, status: 200, message: 'Data bukti dukung berhasil ditambahkan'})


    } catch (error) {
        if (transaction) await transaction.rollback();
        console.error(error)
        switch(error.constructor) {
            case ValidationError:
                return res.status(400).json({
                    success: false,
                    status:400,
                    message: error.message
                });
                
            case NotFoundError:
                return res.status(404).json({
                    success: false,
                    status:404,
                    message: error.message
                });
                
            default:
                return res.status(500).json({
                    success: false,
                    status:500,
                    message: 'Kesalahan Server'
                });
        }
    }
}

// tambah skala indikator by id indikator
const tambahSkalaIndikator = async (req, res) => {
    let transaction
    try {
        transaction = await db.sequelize.transaction();
        const { id_indikator, ...skalaFields } = req.body;

        const findIndikator = await db.Indikator.findByPk(id_indikator);
        if (!findIndikator) {
            throw new ValidationError('Data indikator tidak ditemukan');
        }

        const existingScales = await db.Skala_indikator.findAll({
            where: { id_indikator }
        });

        const existingScaleValues = existingScales.map(scale => scale.nilai_skala);

        if (Object.keys(skalaFields).length === 0) {
            throw new ValidationError('Tidak ada data skala yang dikirimkan');
        }

        const skalaData = [];
        
        Object.keys(skalaFields).forEach(key => {
            if (key.startsWith('skala_')) {
                const nilai = parseInt(key.split('_')[1]);
                if (!existingScaleValues.includes(nilai) && skalaFields[key]) {
                    skalaData.push({
                        id_indikator,
                        nilai_skala: nilai,
                        deskripsi_skala: skalaFields[key]
                    });
                }
            }
        });

        if (skalaData.length === 0) {
            throw new ValidationError('Tidak ada data skala baru yang valid untuk ditambahkan');
        }

        const createdScales = await db.Skala_indikator.bulkCreate(skalaData, { transaction });
        
        await transaction.commit();
        
        return res.status(200).json({
            success: true, 
            status: 200, 
            message: 'Data skala indikator berhasil ditambahkan',
            data: createdScales
        });
    } catch (error) {
        if (transaction) await transaction.rollback();
        console.error(error);
        
        switch(error.constructor) {
            case ValidationError:
                return res.status(400).json({
                    success: false,
                    status: 400,
                    message: error.message
                });
                
            case NotFoundError:
                return res.status(404).json({
                    success: false,
                    status: 404,
                    message: error.message
                });
                
            default:
                return res.status(500).json({
                    success: false,
                    status: 500,
                    message: 'Kesalahan Server'
                });
        }
    }
}

// all tipe pertanyaan
const tipePertanyaan = async (req,res) => {
    try {
        const getAll = await db.Tipe_pertanyaan.findAll({
            attributes: ['id_tipe_pertanyaan', 'nama_jenis', 'kode_jenis'],
            include: [
                {
                    model:db.Tipe_opsi_jawaban,
                    attributes: ['id_tipe_opsi', 'nama_tipe', 'allow_other', 'has_trigger']
                }
            ]
        })
        if (getAll.length < 0) {
            throw new ValidationError('Data tipe pertanyaan belum tersedia')
        }
        return res.status(200).json({success:true, status:200, message: 'Data tipe pertanyaan tersedia', data: getAll})
    } catch (error) {
        console.error(error)
        switch(error.constructor) {
            case ValidationError:
                return res.status(400).json({
                    success: false,
                    status:400,
                    message: error.message
                });
                
            case NotFoundError:
                return res.status(404).json({
                    success: false,
                    status:404,
                    message: error.message
                });
                
            default:
                return res.status(500).json({
                    success: false,
                    status:500,
                    message: 'Kesalahan Server'
                });
        }
    }
}

// tambah pertanyaan by indikator
// const tambahPertanyaan = async (req, res) => {
//     try {
//         const {teks_pertanyaan, id_tipe_pertanyaan, id_indikator, opsi_jawaban, trigger_jawaban, keterangan_trigger} = req.body

//         if (!teks_pertanyaan || !id_tipe_pertanyaan || !id_indikator) {
//             throw new ValidationError('Pertanyaan, tipe pertanyaan, dan indikator')
//         }

//         const findIndikator = await db.Indikator.findByPk(id_indikator)
//         if (!findIndikator) {
//             throw new ValidationError('Data indikator tidak ditemukan')
//         }

//         const tipePertanyaan = await db.Tipe_pertanyaan.findByPk(id_tipe_pertanyaan, {
//             include: [
//                 {
//                     model: db.Tipe_opsi_jawaban
//                 }
//             ]
//         })

//         if (!tipePertanyaan) {
//             throw new ValidationError('Tipe pertanyaan tidak ditemukan')
//         }

//         const lastUrutan = await db.Pertanyaan.findOne({
//             where: { 
//                 indikator_id_indikator: id_indikator,
//                 pertanyaan_id_pertanyaan: null
//             },
//             order: [['urutan', 'DESC']],
//         });

//         const nextUrutan = lastUrutan ? lastUrutan.urutan + 1 : 1

//         const addPertanyaanUtama = await db.Pertanyaan.create({
//             teks_pertanyaan, 
//             tipe_pertanyaan_id_tipe_pertanyaan: id_tipe_pertanyaan,
//             indikator_id_indikator: id_indikator,
//             urutan: nextUrutan
//         })

//         const { nama_tipe, allow_other, has_trigger } = tipePertanyaan.Tipe_opsi_jawaban;

//         if (nama_tipe !== 'text') {
//             if (!opsi_jawaban || opsi_jawaban.length === 0) {
//                 throw new ValidationError('Opsi jawaban harus diisi')
//             }

//             const opsiJawabanData = opsi_jawaban.map((opsi, index) => ({
//                 teks_opsi: opsi.teks_opsi,
//                 memiliki_isian_lainnya: false,
//                 urutan: index + 1,
//                 id_pertanyaan: addPertanyaanUtama.id_pertanyaan
//             }))

//             if (allow_other) {
//                 opsiJawabanData.push({
//                     teks_opsi: "Lainnya",
//                     memiliki_isian_lainnya: true,
//                     urutan: opsiJawabanData.length + 1,
//                     id_pertanyaan: addPertanyaanUtama.id_pertanyaan
//                 })
//             }

//             await db.Opsi_jawaban.bulkCreate(opsiJawabanData)

//             if (has_trigger && trigger_jawaban) {
//                 await processSubPertanyaan(
//                     trigger_jawaban, 
//                     id_indikator, 
//                     addPertanyaanUtama.id_pertanyaan, 
//                     keterangan_trigger
//                 )
//             }
//         }

//         const createdPertanyaan = await db.Pertanyaan.findOne({
//             where: { id_pertanyaan: addPertanyaanUtama.id_pertanyaan },
//             attributes: ['id_pertanyaan', 'teks_pertanyaan', 'trigger_value', 'urutan', 'keterangan_trigger'],
//             include: getRecursiveInclude()
//         });

//         return res.status(200).json({
//             success: true,
//             status: 200,
//             message: 'Pertanyaan berhasil ditambahkan',
//             data: createdPertanyaan
//         });

//     } catch (error) {
//         console.error(error)
//         switch(error.constructor) {
//             case ValidationError:
//                 return res.status(400).json({
//                     success: false,
//                     status:400,
//                     message: error.message
//                 });
                
//             case NotFoundError:
//                 return res.status(404).json({
//                     success: false,
//                     status:404,
//                     message: error.message
//                 });
                
//             default:
//                 return res.status(500).json({
//                     success: false,
//                     status:500,
//                     message: 'Kesalahan Server'
//                 });
//         }
//     }
// }


const processSubPertanyaan = async (
    trigger_jawaban, 
    id_indikator, 
    parent_id_pertanyaan, 
    keterangan_trigger
) => {
    const { trigger_value, sub_pertanyaan } = trigger_jawaban;

    if (Array.isArray(sub_pertanyaan) && sub_pertanyaan.length > 0) {
        for (let i = 0; i < sub_pertanyaan.length; i++) {
            const subQuestion = sub_pertanyaan[i];
            
            const lastSubUrutan = await db.Pertanyaan.findOne({
                where: { 
                    indikator_id_indikator: id_indikator,
                    pertanyaan_id_pertanyaan: parent_id_pertanyaan
                },
                order: [['urutan', 'DESC']]
            });

            const nextSubUrutan = lastSubUrutan ? lastSubUrutan.urutan + 1 : 1;

            const newSubPertanyaan = await db.Pertanyaan.create({
                teks_pertanyaan: subQuestion.teks_pertanyaan,
                tipe_pertanyaan_id_tipe_pertanyaan: subQuestion.id_tipe_pertanyaan,
                indikator_id_indikator: id_indikator,
                pertanyaan_id_pertanyaan: parent_id_pertanyaan, 
                trigger_value: trigger_value,
                urutan: nextSubUrutan,
                keterangan_trigger: subQuestion.keterangan_trigger || keterangan_trigger
            });

            if (subQuestion.opsi_jawaban && subQuestion.opsi_jawaban.length > 0) {
                const subTipePertanyaan = await db.Tipe_pertanyaan.findByPk(subQuestion.id_tipe_pertanyaan, {
                    include: [{ model: db.Tipe_opsi_jawaban }]
                });

                if (subTipePertanyaan) {
                    const { nama_tipe, allow_other, has_trigger } = subTipePertanyaan.Tipe_opsi_jawaban;

                    const subOpsiJawaban = subQuestion.opsi_jawaban.map((opsi, index) => ({
                        teks_opsi: opsi.teks_opsi,
                        memiliki_isian_lainnya: false,
                        urutan: index + 1,
                        id_pertanyaan: newSubPertanyaan.id_pertanyaan
                    }));

                    if (allow_other) {
                        subOpsiJawaban.push({
                            teks_opsi: "Lainnya",
                            memiliki_isian_lainnya: true,
                            urutan: subOpsiJawaban.length + 1,
                            id_pertanyaan: newSubPertanyaan.id_pertanyaan
                        });
                    }

                    await db.Opsi_jawaban.bulkCreate(subOpsiJawaban);

                    if (has_trigger && subQuestion.trigger_jawaban) {
                        await processSubPertanyaan(
                            subQuestion.trigger_jawaban,
                            id_indikator,
                            newSubPertanyaan.id_pertanyaan,
                            subQuestion.keterangan_trigger || keterangan_trigger
                        );
                    }
                }
            }
        }
    }
};


const tambahPertanyaan = async (req, res) => {
    try {
        const {
            teks_pertanyaan, 
            id_tipe_pertanyaan, 
            id_indikator, 
            opsi_jawaban, 
            trigger_jawaban, 
            trigger_jawabans, // Tambahkan parameter baru untuk multi-trigger
            keterangan_trigger
        } = req.body

        if (!teks_pertanyaan || !id_tipe_pertanyaan || !id_indikator) {
            throw new ValidationError('Pertanyaan, tipe pertanyaan, dan indikator')
        }

        const findIndikator = await db.Indikator.findByPk(id_indikator)
        if (!findIndikator) {
            throw new ValidationError('Data indikator tidak ditemukan')
        }

        const tipePertanyaan = await db.Tipe_pertanyaan.findByPk(id_tipe_pertanyaan, {
            include: [
                {
                    model: db.Tipe_opsi_jawaban
                }
            ]
        })

        if (!tipePertanyaan) {
            throw new ValidationError('Tipe pertanyaan tidak ditemukan')
        }

        const lastUrutan = await db.Pertanyaan.findOne({
            where: { 
                indikator_id_indikator: id_indikator,
                pertanyaan_id_pertanyaan: null
            },
            order: [['urutan', 'DESC']],
        });

        const nextUrutan = lastUrutan ? lastUrutan.urutan + 1 : 1

        const addPertanyaanUtama = await db.Pertanyaan.create({
            teks_pertanyaan, 
            tipe_pertanyaan_id_tipe_pertanyaan: id_tipe_pertanyaan,
            indikator_id_indikator: id_indikator,
            urutan: nextUrutan
        })

        const { nama_tipe, allow_other, has_trigger } = tipePertanyaan.Tipe_opsi_jawaban;

        if (nama_tipe !== 'text') {
            if (!opsi_jawaban || opsi_jawaban.length === 0) {
                throw new ValidationError('Opsi jawaban harus diisi')
            }

            const opsiJawabanData = opsi_jawaban.map((opsi, index) => ({
                teks_opsi: opsi.teks_opsi,
                memiliki_isian_lainnya: false,
                urutan: index + 1,
                id_pertanyaan: addPertanyaanUtama.id_pertanyaan
            }))

            if (allow_other) {
                opsiJawabanData.push({
                    teks_opsi: "Lainnya",
                    memiliki_isian_lainnya: true,
                    urutan: opsiJawabanData.length + 1,
                    id_pertanyaan: addPertanyaanUtama.id_pertanyaan
                })
            }

            await db.Opsi_jawaban.bulkCreate(opsiJawabanData)

            if (has_trigger) {
                // Cek apakah menggunakan multi-trigger atau single-trigger
                if (trigger_jawabans && Array.isArray(trigger_jawabans) && trigger_jawabans.length > 0) {
                    // Mode multi-trigger
                    for (const triggerItem of trigger_jawabans) {
                        await processSubPertanyaan(
                            triggerItem,
                            id_indikator,
                            addPertanyaanUtama.id_pertanyaan,
                            keterangan_trigger
                        );
                    }
                } else if (trigger_jawaban) {
                    // Mode single-trigger (kompatibilitas dengan kode lama)
                    await processSubPertanyaan(
                        trigger_jawaban,
                        id_indikator,
                        addPertanyaanUtama.id_pertanyaan,
                        keterangan_trigger
                    );
                }
            }
        }

        const createdPertanyaan = await getFullPertanyaanData(addPertanyaanUtama.id_pertanyaan);

        return res.status(200).json({
            success: true,
            status: 200,
            message: 'Pertanyaan berhasil ditambahkan',
            data: createdPertanyaan
        });

    } catch (error) {
        console.error(error)
        switch(error.constructor) {
            case ValidationError:
                return res.status(400).json({
                    success: false,
                    status:400,
                    message: error.message
                });
                
            case NotFoundError:
                return res.status(404).json({
                    success: false,
                    status:404,
                    message: error.message
                });
                
            default:
                return res.status(500).json({
                    success: false,
                    status:500,
                    message: 'Kesalahan Server'
                });
        }
    }
}

const getFullPertanyaanData = async (id_pertanyaan) => {
    const mainQuestion = await db.Pertanyaan.findByPk(id_pertanyaan, {
        attributes: ['id_pertanyaan', 'teks_pertanyaan', 'trigger_value', 'urutan', 'keterangan_trigger'],
        include: [{
            model: db.Opsi_jawaban,
            as: 'OpsiJawabans',
            attributes: ['id_opsi_jawaban', 'teks_opsi', 'memiliki_isian_lainnya', 'urutan']
        }]
    });

    if (!mainQuestion) return null;
    const result = mainQuestion.toJSON();
    
    result.ChildPertanyaans = await getSubQuestions(id_pertanyaan);
    
    return result;
};

async function getSubQuestions(parentId, level = 1) {
    if (level > 5) return []; 
    
    const questions = await db.Pertanyaan.findAll({
        where: { 
            pertanyaan_id_pertanyaan: parentId 
        },
        attributes: ['id_pertanyaan', 'teks_pertanyaan', 'trigger_value', 'urutan', 'keterangan_trigger'],
        include: [{
            model: db.Opsi_jawaban,
            as: 'OpsiJawabans',
            attributes: ['id_opsi_jawaban', 'teks_opsi', 'memiliki_isian_lainnya', 'urutan']
        }],
        order: [['urutan', 'ASC']]
    });
    
    if (questions.length === 0) return [];
    
    return await Promise.all(questions.map(async (question) => {
        const questionJson = question.toJSON();
        questionJson.ChildPertanyaans = await getSubQuestions(question.id_pertanyaan, level + 1);
        return questionJson;
    }));
};
// all aspek 
const allAspek = async (req, res) => {
    try {
        const findAll = await db.Aspek_penilaian.findAll({
            attributes: ['id_aspek_penilaian', 'nama_aspek', 'bobot_aspek', 'urutan'],
            order: [['urutan', 'ASC']],
            where: {
                parent_id_aspek_penilaian: null
            },
            include: [
                {
                    model: db.Aspek_penilaian,
                    as: 'ChildAspeks',
                    attributes: ['id_aspek_penilaian', 'nama_aspek', 'urutan'],
                    order: [['urutan', 'ASC']]
                }
            ]
        });

        if (findAll.length === 0) {
            throw new ValidationError('Data aspek penilaian belum tersedia');
        }

        return res.status(200).json({
            success: true, 
            status: 200, 
            message: 'Data aspek penilaian tersedia', 
            data: findAll
        });

    } catch (error) {
        console.error(error);
        
        switch(error.constructor) {
            case ValidationError:
                return res.status(400).json({
                    success: false,
                    status: 400,
                    message: error.message
                });
                
            case NotFoundError:
                return res.status(404).json({
                    success: false,
                    status: 404,
                    message: error.message
                });
                
            default:
                return res.status(500).json({
                    success: false,
                    status: 500,
                    message: 'Kesalahan Server'
                });
        }
    }
};

//detail aspek penilaian
const detailAspek = async (req, res) => {
    try {
        const { id_aspek_penilaian } = req.params;

        const findAspek = await db.Aspek_penilaian.findByPk(id_aspek_penilaian, {
            attributes: ['id_aspek_penilaian', 'nama_aspek', 'bobot_aspek', 'urutan'],
            include: [
                {
                    model: db.Aspek_penilaian,
                    as: 'ChildAspeks',
                    required: false,
                    attributes: ['id_aspek_penilaian', 'nama_aspek', 'urutan'],
                    separate: true,
                    order: [['urutan', 'ASC']],
                    include: [
                        {
                            model: db.Indikator,
                            as: 'Indikators',
                            required: false,
                            separate: true,
                            attributes: ['id_indikator', 'kode_indikator', 'nama_indikator', 'bobot_indikator', 'penjelasan', 'urutan'],
                            order: [['urutan', 'ASC']],
                            include: [
                                {
                                    model: db.Bukti_dukung,
                                    as: 'BuktiDukungs',
                                    separate: true,
                                    order: [['urutan', 'ASC']],
                                    required: false,
                                    attributes: ['id_bukti_dukung', 'nama_bukti_dukung', 'urutan'],
                                },
                                {
                                    model: db.Skala_indikator,
                                    as: "skala_indikators",
                                    separate: true,
                                    required: false,
                                    attributes:['id_skala', 'deskripsi_skala', 'nilai_skala'],
                                    order: [['nilai_skala', 'ASC']]
                                }
                            ]
                        }
                    ]
                },
                {
                    model: db.Indikator,
                    as: 'Indikators',
                    separate: true,
                    required: false,
                    attributes: ['id_indikator', 'kode_indikator', 'nama_indikator', 'bobot_indikator', 'penjelasan', 'urutan'],
                    order: [['urutan', 'ASC']],
                    include: [
                        {
                            model: db.Bukti_dukung,
                            as: 'BuktiDukungs',
                            required: false,
                            separate: true,
                            attributes: ['id_bukti_dukung', 'nama_bukti_dukung', 'urutan'],
                            order: [['urutan', 'ASC']]
                        },
                        {
                            model: db.Skala_indikator,
                            as: "skala_indikators",
                            separate: true,
                            required: false,
                            attributes:['id_skala', 'deskripsi_skala', 'nilai_skala'],
                            order: [['nilai_skala', 'ASC']]
                        }
                    ]
                }
            ]
        });
        
        if (!findAspek) {
            throw new ValidationError('Data aspek penilaian tidak ditemukan');
        }

        const result = findAspek.toJSON();

        // Proses indikator di aspek utama
        if (result.Indikators && result.Indikators.length > 0) {
            for (let i = 0; i < result.Indikators.length; i++) {
                const indikator = result.Indikators[i];
            
                const mainQuestions = await db.Pertanyaan.findAll({
                    where: {
                        indikator_id_indikator: indikator.id_indikator,
                        pertanyaan_id_pertanyaan: null
                    },
                    attributes: ['id_pertanyaan', 'teks_pertanyaan', 'trigger_value', 'urutan', 'keterangan_trigger'],
                    order: [['urutan', 'ASC']],
                    include: [
                        {
                            model: db.Tipe_pertanyaan,
                            as: 'TipePertanyaan',
                            required: false,
                            attributes: ['id_tipe_pertanyaan', 'kode_jenis', 'nama_jenis']
                        },
                        {
                            model: db.Opsi_jawaban,
                            as: 'OpsiJawabans',
                            required: false,
                            attributes: ['id_opsi_jawaban', 'teks_opsi', 'memiliki_isian_lainnya', 'urutan'],
                            order: [['urutan', 'ASC']]
                        }
                    ]
                });
  
                result.Indikators[i].Pertanyaans = await Promise.all(
                    mainQuestions.map(async (question) => {
                        const questionJson = question.toJSON();
                   
                        const level1Questions = await getSubQuestions(question.id_pertanyaan);
                        questionJson.ChildPertanyaans = level1Questions;
                        
                        return questionJson;
                    })
                );
            }
        }

        if (result.ChildAspeks && result.ChildAspeks.length > 0) {
            for (let i = 0; i < result.ChildAspeks.length; i++) {
                const childAspek = result.ChildAspeks[i];
                
                if (childAspek.Indikators && childAspek.Indikators.length > 0) {
                    for (let j = 0; j < childAspek.Indikators.length; j++) {
                        const indikator = childAspek.Indikators[j];
                        
                        const mainQuestions = await db.Pertanyaan.findAll({
                            where: {
                                indikator_id_indikator: indikator.id_indikator,
                                pertanyaan_id_pertanyaan: null
                            },
                            attributes: ['id_pertanyaan', 'teks_pertanyaan', 'trigger_value', 'urutan', 'keterangan_trigger'],
                            order: [['urutan', 'ASC']],
                            include: [
                                {
                                    model: db.Tipe_pertanyaan,
                                    as: 'TipePertanyaan',
                                    required: false,
                                    attributes: ['id_tipe_pertanyaan', 'kode_jenis', 'nama_jenis']
                                },
                                {
                                    model: db.Opsi_jawaban,
                                    as: 'OpsiJawabans',
                                    required: false,
                                    attributes: ['id_opsi_jawaban', 'teks_opsi', 'memiliki_isian_lainnya', 'urutan'],
                                    order: [['urutan', 'ASC']]
                                }
                            ]
                        });
                        
                        result.ChildAspeks[i].Indikators[j].Pertanyaans = await Promise.all(
                            mainQuestions.map(async (question) => {
                                const questionJson = question.toJSON();
                
                                const level1Questions = await getSubQuestions(question.id_pertanyaan);
                                questionJson.ChildPertanyaans = level1Questions;
                                
                                return questionJson;
                            })
                        );
                    }
                }
            }
        }

        return res.status(200).json({
            success: true, 
            status: 200, 
            message: 'Data aspek penilaian ditemukan', 
            data: result
        });
    } catch (error) {
        console.error(error);
        switch(error.constructor) {
            case ValidationError:
                return res.status(400).json({
                    success: false,
                    status: 400,
                    message: error.message
                });
                
            case NotFoundError:
                return res.status(404).json({
                    success: false,
                    status: 404,
                    message: error.message
                });
                
            default:
                return res.status(500).json({
                    success: false,
                    status: 500,
                    message: 'Kesalahan Server'
                });
        }
    }
};

// Fungsi rekursif untuk mendapatkan sub pertanyaan
async function getSubQuestions(parentId, level = 1) {
    if (level > 5) return []; // maks level
    
    const questions = await db.Pertanyaan.findAll({
        where: { pertanyaan_id_pertanyaan: parentId },
        attributes: ['id_pertanyaan', 'teks_pertanyaan', 'trigger_value', 'urutan', 'keterangan_trigger'],
        order: [['urutan', 'ASC']],
        include: [
            {
                model: db.Tipe_pertanyaan,
                as: 'TipePertanyaan',
                required: false,
                attributes: ['id_tipe_pertanyaan', 'kode_jenis', 'nama_jenis']
            },
            {
                model: db.Opsi_jawaban,
                as: 'OpsiJawabans',
                required: false,
                attributes: ['id_opsi_jawaban', 'teks_opsi', 'memiliki_isian_lainnya', 'urutan'],
                order: [['urutan', 'ASC']]
            }
        ]
    });
    
    if (!questions || questions.length === 0) {
        return [];
    }

    return await Promise.all(
        questions.map(async (question) => {
            const questionJson = question.toJSON();
 
            questionJson.ChildPertanyaans = await getSubQuestions(
                question.id_pertanyaan, 
                level + 1
            );
            
            return questionJson;
        })
    );
}

//edit aspek penilaian
const editAspekPenilaian = async (req,res) => {
    let transaction
    try {
        transaction = await sequelize.transaction()
        const {id_aspek_penilaian} = req.params
        const {nama_aspek, bobot_aspek, hasSubAspek, sub_aspek} = req.body

        const findAspek = await db.Aspek_penilaian.findByPk(id_aspek_penilaian, {
            include: [
                {
                    model: db.Aspek_penilaian,
                    as: 'ChildAspeks',
                    attributes: ['id_aspek_penilaian', 'nama_aspek']
                }
            ],
            attributes: ['id_aspek_penilaian', 'nama_aspek', 'bobot_aspek']
        })

        if (!findAspek) {
            throw new ValidationError('Data aspek penilaian tidak ditemukan')
        }

        await findAspek.update({
            nama_aspek,
            bobot_aspek
        }, {transaction})

        if (hasSubAspek) {
            await db.Aspek_penilaian.destroy({
                where:{parent_id_aspek_penilaian: id_aspek_penilaian},
                transaction
            })

            if (Array.isArray(sub_aspek) && sub_aspek.length > 0) {
                const sub_aspek_data = sub_aspek.map((subAspek, index) => {
                    if (!subAspek.nama_aspek) {
                        throw new ValidationError(`Nama sub aspek ke-${index + 1} harus diisi`)
                    }
                    
                    return {
                        nama_aspek: subAspek.nama_aspek,
                        bobot_aspek: subAspek.bobot_aspek || null,
                        parent_id_aspek_penilaian: id_aspek_penilaian,
                        urutan: index + 1
                    }
                })

                await db.Aspek_penilaian.bulkCreate(sub_aspek_data, {
                    transaction,
                    validate: true 
                })
            }
        } else {
            await db.Aspek_penilaian.destroy({
                where: {
                    parent_id_aspek_penilaian: id_aspek_penilaian
                },
                transaction
            });
        }

        await transaction.commit()

        const updatedAspek = await db.Aspek_penilaian.findByPk(id_aspek_penilaian, {
            include: [
                {
                    model: db.Aspek_penilaian,
                    as: 'ChildAspeks',
                    attributes: ['id_aspek_penilaian', 'nama_aspek', 'bobot_aspek', 'urutan']
                }
            ]
        });
        return res.status(200).json({success: true, message: 'Data aspek penilaian berhasil di perbaharui', data: updatedAspek})

    } catch (error) {
        if (transaction) await transaction.rollback();
        console.error(error)
        switch(error.constructor) {
            case ValidationError:
                return res.status(400).json({
                    success: false,
                    status:400,
                    message: error.message
                });
                
            case NotFoundError:
                return res.status(404).json({
                    success: false,
                    status:404,
                    message: error.message
                });
                
            default:
                return res.status(500).json({
                    success: false,
                    status:500,
                    message: 'Kesalahan Server'
                });
        }
    }
}

//edit indikator
const editIndikator = async (req,res) => {
    let transaction
    try {
        transaction = await sequelize.transaction()
        const {id_indikator} = req.params
        const {id_aspek_penilaian, kode_indikator, nama_indikator, penjelasan} = req.body
        const findIndikator = await db.Indikator.findByPk(id_indikator, {
            include: [
                {
                    model: db.Aspek_penilaian,
                    as: 'AspekPenilaian',
                    required: false,
                    attributes: ['id_aspek_penilaian', 'nama_aspek', 'bobot_aspek'],
                }
            ],
            attributes: ['id_indikator', 'kode_indikator', 'nama_indikator', 'bobot_indikator', 'penjelasan', 'urutan']
        })
        if (!findIndikator) {
            throw new ValidationError('Data indikator tidak ditemukan')
        }

        await db.Indikator.update({
            id_aspek_penilaian: id_aspek_penilaian || findIndikator.AspekPenilaian.id_aspek_penilaian,
            kode_indikator: kode_indikator || findIndikator.kode_indikator,
            nama_indikator: nama_indikator || findIndikator.nama_indikator,
            penjelasan: penjelasan || findIndikator.penjelasan
        }, {
            where:{
                id_indikator
            },
            transaction
        })

        await transaction.commit()

        const updatedData = await db.Indikator.findByPk(id_indikator, {
            include: [{
                model: db.Aspek_penilaian,
                as: 'AspekPenilaian',
                attributes: ['id_aspek_penilaian', 'nama_aspek', 'bobot_aspek']
            }],
            attributes: ['nama_indikator', 'kode_indikator', 'penjelasan', 'urutan']
        })
        return res.status(200).json({
            success: true,
            message: 'Data indikator berhasil diperbaharui',
            data: updatedData
        })

    } catch (error) {
        if (transaction) await transaction.rollback();
        console.error(error)
        switch(error.constructor) {
            case ValidationError:
                return res.status(400).json({
                    success: false,
                    status:400,
                    message: error.message
                });
                
            case NotFoundError:
                return res.status(404).json({
                    success: false,
                    status:404,
                    message: error.message
                });
                
            default:
                return res.status(500).json({
                    success: false,
                    status:500,
                    message: 'Kesalahan Server'
                });
        }
    }
}

//edit bukti dukung
const editBuktiDukung = async (req,res) => {
    let transaction
    try {
        transaction = await sequelize.transaction()
        const {id_bukti_dukung} = req.params
        const {nama_bukti_dukung} = req.body
        const findBuktiDukung = await db.Bukti_dukung.findByPk(id_bukti_dukung, {transaction})
        if (!findBuktiDukung) {
            throw new ValidationError('Data bukti dukung tidak ditemukan')
        }

        await db.Bukti_dukung.update({
            nama_bukti_dukung: nama_bukti_dukung || findBuktiDukung.nama_bukti_dukung
        }, {
            where:{id_bukti_dukung},
            transaction
        })

        const updateData = await db.Bukti_dukung.findByPk(id_bukti_dukung, {
            attributes: ['id_bukti_dukung', 'nama_bukti_dukung', 'urutan']
        })

        await transaction.commit()
        
    
        return res.status(200).json({success:true, status: 200, message: 'Data bukti dukung berhasil diperbaharu', data: updateData})

    } catch (error) {
        if (transaction) await transaction.rollback();
        console.error(error)
        switch(error.constructor) {
            case ValidationError:
                return res.status(400).json({
                    success: false,
                    status:400,
                    message: error.message
                });
                
            case NotFoundError:
                return res.status(404).json({
                    success: false,
                    status:404,
                    message: error.message
                });
                
            default:
                return res.status(500).json({
                    success: false,
                    status:500,
                    message: 'Kesalahan Server'
                });
        }
    }
}

//edit skala indikator
const editSkalaIndikator = async (req,res) => {
    let transaction 
    try {
        transaction = await sequelize.transaction()
        const {id_skala} = req.params
        const {deskripsi_skala} = req.body
        const findSkala = await db.Skala_indikator.findByPk(id_skala, {transaction})
        if (!findSkala) {
            throw new ValidationError('Data skala indikator tidak ditemukan')
        }

        await db.Skala_indikator.update({
            deskripsi_skala: deskripsi_skala || findSkala.deskripsi_skala
        }, {
            where: {id_skala},
            transaction
        })

        const updateData = await db.Skala_indikator.findByPk(id_skala,{
            attributes: ['id_skala', 'nilai_skala','deskripsi_skala']
        })
        await transaction.commit()

        return res.status(200).json({success:true, status:200, message: 'Data skala indikator berhasil diperbaharui', data: updateData})
    } catch (error) {
        if (transaction) await transaction.rollback();
        console.error(error)
        switch(error.constructor) {
            case ValidationError:
                return res.status(400).json({
                    success: false,
                    status:400,
                    message: error.message
                });
                
            case NotFoundError:
                return res.status(404).json({
                    success: false,
                    status:404,
                    message: error.message
                });
                
            default:
                return res.status(500).json({
                    success: false,
                    status:500,
                    message: 'Kesalahan Server'
                });
        }
    }
}


//edit pertanyaan
const editPertanyaan = async (req, res) => {
    let transaction;
    try {
        transaction = await sequelize.transaction();

        const { id_pertanyaan } = req.params;
        const { 
            teks_pertanyaan, 
            id_tipe_pertanyaan, 
            id_indikator, 
            opsi_jawaban, 
            trigger_jawaban,
            trigger_jawabans, 
            keterangan_trigger 
        } = req.body;

        const existingPertanyaan = await db.Pertanyaan.findByPk(id_pertanyaan, { transaction });

        if (!existingPertanyaan) {
            throw new NotFoundError('Pertanyaan tidak ditemukan');
        }

        if (!teks_pertanyaan || !id_tipe_pertanyaan || !id_indikator) {
            throw new ValidationError('Pertanyaan, tipe pertanyaan, dan indikator harus diisi');
        }

        const findIndikator = await db.Indikator.findByPk(id_indikator, {transaction});
        if (!findIndikator) {
            throw new ValidationError('Data indikator tidak ditemukan');
        }

        const tipePertanyaan = await db.Tipe_pertanyaan.findByPk(id_tipe_pertanyaan, {
            include: [{ model: db.Tipe_opsi_jawaban }],
            transaction
        });

        if (!tipePertanyaan) {
            throw new ValidationError('Tipe pertanyaan tidak ditemukan');
        }

        await existingPertanyaan.update({
            teks_pertanyaan,
            tipe_pertanyaan_id_tipe_pertanyaan: id_tipe_pertanyaan,
            indikator_id_indikator: id_indikator,
            keterangan_trigger
        }, { transaction });

        const { nama_tipe, allow_other, has_trigger } = tipePertanyaan.Tipe_opsi_jawaban;

        if (nama_tipe !== 'text') {
            if (!opsi_jawaban || opsi_jawaban.length === 0) {
                throw new ValidationError('Opsi jawaban harus diisi');
            }
            await db.Opsi_jawaban.destroy({
                where: { id_pertanyaan: id_pertanyaan },
                transaction
            });
            const opsiJawabanData = opsi_jawaban.map((opsi, index) => ({
                teks_opsi: opsi.teks_opsi,
                memiliki_isian_lainnya: false,
                urutan: index + 1,
                id_pertanyaan: id_pertanyaan
            }));

            if (allow_other) {
                opsiJawabanData.push({
                    teks_opsi: "Lainnya",
                    memiliki_isian_lainnya: true,
                    urutan: opsiJawabanData.length + 1,
                    id_pertanyaan: id_pertanyaan
                });
            }

            await db.Opsi_jawaban.bulkCreate(opsiJawabanData, { transaction });

            // Hapus semua sub-pertanyaan yang ada secara rekursif
            await deleteSubQuestionsRecursively(id_pertanyaan, transaction);

            if (has_trigger) {
                if (trigger_jawabans && Array.isArray(trigger_jawabans) && trigger_jawabans.length > 0) {
                    // Mode multi-trigger
                    for (const triggerItem of trigger_jawabans) {
                        await processEditSubPertanyaan(
                            triggerItem,
                            id_indikator,
                            id_pertanyaan,
                            keterangan_trigger,
                            transaction
                        );
                    }
                } else if (trigger_jawaban) {
                    await processEditSubPertanyaan(
                        trigger_jawaban,
                        id_indikator,
                        id_pertanyaan,
                        keterangan_trigger,
                        transaction
                    );
                }
            }
        }

        await transaction.commit();

        const updatedPertanyaan = await getFullPertanyaanData(id_pertanyaan);

        return res.status(200).json({
            success: true,
            status: 200,
            message: 'Pertanyaan berhasil diperbarui',
            data: updatedPertanyaan
        });

    } catch (error) {
        console.error(error);
        if (transaction) await transaction.rollback();
        
        switch(error.constructor) {
            case ValidationError:
                return res.status(400).json({
                    success: false,
                    status: 400,
                    message: error.message
                });
                
            case NotFoundError:
                return res.status(404).json({
                    success: false,
                    status: 404,
                    message: error.message
                });
                
            default:
                return res.status(500).json({
                    success: false,
                    status: 500,
                    message: 'Kesalahan Server'
                });
        }
    }
};


// Fungsi untuk menghapus sub-pertanyaan secara rekursif
const deleteSubQuestionsRecursively = async (parentId, transaction) => {
    const subQuestions = await db.Pertanyaan.findAll({
        where: { pertanyaan_id_pertanyaan: parentId },
        transaction
    });
    
    for (const subQuestion of subQuestions) {
        await deleteSubQuestionsRecursively(subQuestion.id_pertanyaan, transaction);
        
        await db.Opsi_jawaban.destroy({
            where: { id_pertanyaan: subQuestion.id_pertanyaan },
            transaction
        });
    }
    
    await db.Pertanyaan.destroy({
        where: { pertanyaan_id_pertanyaan: parentId },
        transaction
    });
};

const processEditSubPertanyaan = async (
    trigger_jawaban,
    id_indikator,
    parent_id_pertanyaan,
    keterangan_trigger,
    transaction,
    level = 1
) => {
    if (level > 5) return; 
    
    const { trigger_value, sub_pertanyaan } = trigger_jawaban;

    if (Array.isArray(sub_pertanyaan) && sub_pertanyaan.length > 0) {
        for (let i = 0; i < sub_pertanyaan.length; i++) {
            const subQuestion = sub_pertanyaan[i];
            
            const lastSubUrutan = await db.Pertanyaan.findOne({
                where: { 
                    indikator_id_indikator: id_indikator,
                    pertanyaan_id_pertanyaan: parent_id_pertanyaan
                },
                order: [['urutan', 'DESC']],
                transaction
            });

            const nextSubUrutan = lastSubUrutan ? lastSubUrutan.urutan + 1 : 1;

            const newSubPertanyaan = await db.Pertanyaan.create({
                teks_pertanyaan: subQuestion.teks_pertanyaan,
                tipe_pertanyaan_id_tipe_pertanyaan: subQuestion.id_tipe_pertanyaan,
                indikator_id_indikator: id_indikator,
                pertanyaan_id_pertanyaan: parent_id_pertanyaan,
                trigger_value: trigger_value,
                urutan: nextSubUrutan,
                keterangan_trigger: subQuestion.keterangan_trigger || keterangan_trigger
            }, { transaction });

            if (subQuestion.opsi_jawaban && subQuestion.opsi_jawaban.length > 0) {
                const subTipePertanyaan = await db.Tipe_pertanyaan.findByPk(subQuestion.id_tipe_pertanyaan, {
                    include: [{ model: db.Tipe_opsi_jawaban }],
                    transaction
                });

                if (subTipePertanyaan) {
                    const { allow_other, has_trigger } = subTipePertanyaan.Tipe_opsi_jawaban;

                    const subOpsiJawaban = subQuestion.opsi_jawaban.map((opsi, index) => ({
                        teks_opsi: opsi.teks_opsi,
                        memiliki_isian_lainnya: false,
                        urutan: index + 1,
                        id_pertanyaan: newSubPertanyaan.id_pertanyaan
                    }));

                    if (allow_other) {
                        subOpsiJawaban.push({
                            teks_opsi: "Lainnya",
                            memiliki_isian_lainnya: true,
                            urutan: subOpsiJawaban.length + 1,
                            id_pertanyaan: newSubPertanyaan.id_pertanyaan
                        });
                    }

                    await db.Opsi_jawaban.bulkCreate(subOpsiJawaban, { transaction });

                    if (has_trigger && subQuestion.trigger_jawaban) {
                        await processEditSubPertanyaan(
                            subQuestion.trigger_jawaban,
                            id_indikator,
                            newSubPertanyaan.id_pertanyaan,
                            subQuestion.keterangan_trigger || keterangan_trigger,
                            transaction,
                            level + 1
                        );
                    }
                }
            }
        }
    }
};

// hapus aspek penilaian
const hapusAspekPenilaian = async (req,res) => {
    let transaction
    try {
        transaction = await sequelize.transaction()
        const {id_aspek_penilaian} = req.params
        const findAspek = await db.Aspek_penilaian.findByPk(id_aspek_penilaian)
        if (!findAspek) {
            throw new ValidationError('Data aspek penilaian tidak ditemukan')
        }

        await db.Aspek_penilaian.destroy({where:{id_aspek_penilaian}})
        return res.status(200).json({success:true, status:200, message: 'Data aspek penilaian berhasil dihapus'})
    } catch (error) {
        console.error(error);
        if (transaction) await transaction.rollback();
        
        switch(error.constructor) {
            case ValidationError:
                return res.status(400).json({
                    success: false,
                    status: 400,
                    message: error.message
                });
                
            case NotFoundError:
                return res.status(404).json({
                    success: false,
                    status: 404,
                    message: error.message
                });
                
            default:
                return res.status(500).json({
                    success: false,
                    status: 500,
                    message: 'Kesalahan Server'
                });
        }
    }
}

// hapus indikator
const hapusIndikator = async (req,res) => {
    let transaction 
    try {
        transaction = await sequelize.transaction()
        const {id_indikator} = req.params
        const findIndikator = await db.Indikator.findByPk(id_indikator)
        if (!findIndikator) {
            throw new ValidationError('Data indikator tidak ditemukan')
        }

        await db.Indikator.destroy({where:{id_indikator}})
        return res.status(200).json({success:true, status:200, message: 'Data indikator berhasil dihapus'})
    } catch (error) {
        console.error(error);
        if (transaction) await transaction.rollback();
        
        switch(error.constructor) {
            case ValidationError:
                return res.status(400).json({
                    success: false,
                    status: 400,
                    message: error.message
                });
                
            case NotFoundError:
                return res.status(404).json({
                    success: false,
                    status: 404,
                    message: error.message
                });
                
            default:
                return res.status(500).json({
                    success: false,
                    status: 500,
                    message: 'Kesalahan Server'
                });
        }
    }
}

// hapus bukti dukung
const hapusBuktiDukung = async (req,res) => {
    let transaction 
    try {
        transaction = await sequelize.transaction()
        const {id_bukti_dukung} = req.params
        const findBukti = await db.Bukti_dukung.findByPk(id_bukti_dukung)
        if (!findBukti) {
            throw new ValidationError('Data bukti dukung tidak ditemukan')
        }

        await db.Bukti_dukung.destroy({where:{id_bukti_dukung}})
        return res.status(200).json({success:true, status: 200, message: 'Data bukti dukung berhasil dihapus'})
    } catch (error) {
        console.error(error);
        if (transaction) await transaction.rollback();
        
        switch(error.constructor) {
            case ValidationError:
                return res.status(400).json({
                    success: false,
                    status: 400,
                    message: error.message
                });
                
            case NotFoundError:
                return res.status(404).json({
                    success: false,
                    status: 404,
                    message: error.message
                });
                
            default:
                return res.status(500).json({
                    success: false,
                    status: 500,
                    message: 'Kesalahan Server'
                });
        }
    }
}

// hapus skala indikator
const hapusSkalaIndikator = async (req,res) => {
    let transaction 
    try {
        transaction = await sequelize.transaction()
        const {id_skala} = req.params
        const findSkala = await db.Skala_indikator.findByPk(id_skala)
        if (!findSkala) {
            throw new ValidationError('Data skala indikator tidak ditemukan')
        }

        await db.Skala_indikator.destroy({where:{id_skala}})
        return res.status(200).json({success:true, status: 200, message: 'Data skala indikator berhasil dihapus'})
    } catch (error) {
        console.error(error);
        if (transaction) await transaction.rollback();
        
        switch(error.constructor) {
            case ValidationError:
                return res.status(400).json({
                    success: false,
                    status: 400,
                    message: error.message
                });
                
            case NotFoundError:
                return res.status(404).json({
                    success: false,
                    status: 404,
                    message: error.message
                });
                
            default:
                return res.status(500).json({
                    success: false,
                    status: 500,
                    message: 'Kesalahan Server'
                });
        }
    }
}

// hapus pertanyaan
const hapusPertanyaan = async (req,res) => {
    let transaction 
    try {
        transaction = await sequelize.transaction()
        const {id_pertanyaan} = req.params
        const findPertanyaan = await db.Pertanyaan.findByPk(id_pertanyaan)
        if (!findPertanyaan) {
            throw new ValidationError('Data pertanyaan tidak ditemukan')
        }

        await db.Pertanyaan.destroy({where:{id_pertanyaan}})
        return res.status(200).json({success:true, status: 200, message: 'Data pertanyaan berhasil dihapus'})
    } catch (error) {
        console.error(error);
        if (transaction) await transaction.rollback();
        
        switch(error.constructor) {
            case ValidationError:
                return res.status(400).json({
                    success: false,
                    status: 400,
                    message: error.message
                });
                
            case NotFoundError:
                return res.status(404).json({
                    success: false,
                    status: 404,
                    message: error.message
                });
                
            default:
                return res.status(500).json({
                    success: false,
                    status: 500,
                    message: 'Kesalahan Server'
                });
        }
    }
}

module.exports = {tambahAspek, tambahIndikator, tambahBuktiDukung, tambahSkalaIndikator, tipePertanyaan, tambahPertanyaan, allAspek, detailAspek, editAspekPenilaian, editIndikator, editBuktiDukung, editSkalaIndikator, editPertanyaan, hapusAspekPenilaian, hapusIndikator, hapusBuktiDukung, hapusSkalaIndikator, hapusPertanyaan}