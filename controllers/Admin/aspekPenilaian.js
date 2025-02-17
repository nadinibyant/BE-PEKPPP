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

        const findAspek = await db.Aspek_penilaian.findOne({where:{nama_aspek}, transaction})
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
const tambahSkalaIndikator = async (req,res) => {
    let transaction
    try {
        transaction = await db.sequelize.transaction();
        const {skala_0, skala_1, skala_2, skala_3, skala_4, skala_5, id_indikator} = req.body

        const findIndikator = await db.Indikator.findByPk(id_indikator)
        if (!findIndikator) {
            throw new ValidationError('Data indikator tidak ditemukan')
        }

        const skalaValues = [skala_0, skala_1, skala_2, skala_3, skala_4, skala_5];
        if (skalaValues.some(skala => !skala)) {
            throw new ValidationError('Lengkapi seluruh data skala indikator');
        }

        const skalaData = skalaValues.map((deskripsi_skala, index) => ({
            id_indikator,
            nilai_skala: index,
            deskripsi_skala
        }))

        await db.Skala_indikator.bulkCreate(skalaData, {transaction})
        await transaction.commit()
        return res.status(200).json({success:true, status:200, message: 'Data skala indikator berhasil ditambahkan'})
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

// all tipe pertanyaan
const tipePertanyaan = async (req,res) => {
    let transaction
    try {
        transaction = await sequelize.transaction()
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

// tambah pertanyaan by indikator
const tambahPertanyaan = async (req,res) => {
    let transaction
    try {
        transaction = await sequelize.transaction()

        const {teks_pertanyaan, id_tipe_pertanyaan, id_indikator, opsi_jawaban, trigger_jawaban, keterangan_trigger} = req.body

        if (!teks_pertanyaan || !id_tipe_pertanyaan || !id_indikator) {
            throw new ValidationError('Pertanyaan, tipe pertanyaan, dan indikator')
        }

        const findIndikator = await db.Indikator.findByPk(id_indikator, {transaction})
        if (!findIndikator) {
            throw new ValidationError('Data indikator tidak ditemukan')
        }

        const tipePertanyaan = await db.Tipe_pertanyaan.findByPk(id_tipe_pertanyaan, {
            include: [
                {
                    model: db.Tipe_opsi_jawaban
                }
            ],
            transaction
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
            transaction
        });

        const nextUrutan = lastUrutan ? lastUrutan.urutan + 1 : 1

        const addPertanyaanUtama = await db.Pertanyaan.create({
            teks_pertanyaan, 
            tipe_pertanyaan_id_tipe_pertanyaan: id_tipe_pertanyaan,
            indikator_id_indikator: id_indikator,
            urutan: nextUrutan
        }, {transaction})

        //ini untuk atur berdasar tipe opsi jawabannya
        const { nama_tipe, allow_other, has_trigger } = tipePertanyaan.Tipe_opsi_jawaban;

        // jika tipe pertanyaan nya tu butuh opsi jawaban pilihan tunggal atau jamak
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

            //jika allow other = true
            if (allow_other) {
                opsiJawabanData.push({
                    teks_opsi: "Lainnya",
                    memiliki_isian_lainnya: true,
                    urutan: opsiJawabanData.length + 1,
                    id_pertanyaan: addPertanyaanUtama.id_pertanyaan
                })
            }

            await db.Opsi_jawaban.bulkCreate(opsiJawabanData, {transaction})

            //jika ada trigger
            if (has_trigger && trigger_jawaban) {

                const {trigger_value, sub_pertanyaan} = trigger_jawaban

                if (sub_pertanyaan) {
                    const lastSubUrutan = await db.Pertanyaan.findOne({
                        where: { 
                            indikator_id_indikator: id_indikator,
                            pertanyaan_id_pertanyaan: addPertanyaanUtama.id_pertanyaan
                        },
                        order: [['urutan', 'DESC']],
                        transaction
                    });

                    const nextSubUrutan = lastSubUrutan ? lastSubUrutan.urutan + 1 : 1;

                    const newSubPertanyaan = await db.Pertanyaan.create({
                        teks_pertanyaan: sub_pertanyaan.teks_pertanyaan,
                        tipe_pertanyaan_id_tipe_pertanyaan: sub_pertanyaan.id_tipe_pertanyaan,
                        indikator_id_indikator: id_indikator,
                        pertanyaan_id_pertanyaan: addPertanyaanUtama.id_pertanyaan, 
                        trigger_value: trigger_value,
                        urutan: nextSubUrutan,
                        keterangan_trigger
                    }, {transaction})

                    if (sub_pertanyaan.opsi_jawaban) {
                        const subOpsiJawaban = sub_pertanyaan.opsi_jawaban.map((opsi,index) => ({
                            teks_opsi: opsi.teks_opsi,
                            memiliki_isian_lainnya: false,
                            urutan: index + 1,
                            id_pertanyaan: newSubPertanyaan.id_pertanyaan
                        }))

                        await db.Opsi_jawaban.bulkCreate(subOpsiJawaban, {transaction})
                    }

                }
            }
        }

        await transaction.commit()
        const createdPertanyaan = await db.Pertanyaan.findOne({
            where: { id_pertanyaan: addPertanyaanUtama.id_pertanyaan },
            attributes: ['id_pertanyaan', 'teks_pertanyaan', 'trigger_value', 'urutan', 'keterangan_trigger'],
            include: [
                {
                    model: db.Opsi_jawaban,
                    as: 'OpsiJawabans',
                    attributes: ['id_opsi_jawaban', 'teks_opsi', 'memiliki_isian_lainnya', 'urutan']
                },
                {
                    model: db.Pertanyaan,
                    as: 'ChildPertanyaans',
                    attributes: ['id_pertanyaan', 'teks_pertanyaan', 'trigger_value', 'urutan', 'keterangan_trigger'],
                    include: [
                        {
                            model: db.Opsi_jawaban,
                            as: 'OpsiJawabans',
                            attributes: ['id_opsi_jawaban', 'teks_opsi', 'memiliki_isian_lainnya', 'urutan']
                        }
                    ]
                }
            ]
        });

        return res.status(200).json({
            success: true,
            status: 200,
            message: 'Pertanyaan berhasil ditambahkan',
            data: createdPertanyaan
        });

    } catch (error) {
        console.error(error)
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


// all aspek 
const allAspek = async (req,res) => {
    let transaction
    try {
        transaction = await sequelize.transaction()

        const findAll = await db.Aspek_penilaian.findAll({
            attributes: ['id_aspek_penilaian', 'nama_aspek', 'bobot_aspek', 'urutan'],
            order: [['urutan', 'ASC']],
            where:{
                parent_id_aspek_penilaian: null
            },
        }, {transaction})

        await transaction.commit()
        if (findAll.length < 0) {
            throw new ValidationError('Data aspek penilaian belum tersedia')
        }

        return res.status(200).json({success:true, status:200, message: 'Data aspek penilaian tersedia', data: findAll})

    } catch (error) {
        console.error(error)
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

//detail aspek penilaian
const detailAspek = async (req,res) => {
    let transaction
    try {
        transaction = await sequelize.transaction()

        const {id_aspek_penilaian} = req.params
        const findAspek = await db.Aspek_penilaian.findByPk(id_aspek_penilaian, {
            attributes: ['id_aspek_penilaian', 'nama_aspek', 'bobot_aspek', 'urutan'],
            include: [
                {
                    model: db.Aspek_penilaian,
                    as: 'ChildAspeks',
                    attributes: ['id_aspek_penilaian', 'nama_aspek', 'urutan'],
                    order: [['urutan', 'ASC']],
                    include: [
                        {
                            model: db.Indikator,
                            as: 'Indikators',
                            attributes: ['id_indikator', 'kode_indikator', 'nama_indikator', 'bobot_indikator', 'penjelasan', 'urutan'],
                            order: [['urutan', 'ASC']],
                            include: [
                                {
                                    model: db.Bukti_dukung,
                                    as: 'BuktiDukungs',
                                    attributes: ['id_bukti_dukung', 'nama_bukti_dukung', 'urutan'],
                                    order: [['urutan', 'ASC']]
                                },
                                {
                                    model: db.Skala_indikator,
                                    as: "skala_indikators",
                                    attributes:['id_skala', 'deskripsi_skala', 'nilai_skala'],
                                    order: [['nilai_skala', 'ASC']]
                                },
                                {
                                    model: db.Pertanyaan,
                                    as: 'Pertanyaans',
                                    attributes: ['id_pertanyaan', 'teks-Pertanyaan', 'trigger_value', 'urutan'],
                                    where: {
                                        pertanyaan_id_pertanyaan: null
                                    },
                                    // include: [
                                    //     {
                                    //         model:
                                    //     }
                                    // ]
                                },
                                // {
                                //     model:
                                // }
                            ]
                        }
                    ]
                },
                {
                    model: db.Indikator,
                    as: 'Indikators',
                    attributes: ['id_indikator', 'kode_indikator', 'nama_indikator', 'bobot_indikator', 'penjelasan'],
                    order: [['urutan', 'ASC']]
                }
            ]
        })
        
        if (!findAspek) {
            throw new ValidationError('Data aspek penilaian tidak ditemukan')
        }

        return res.status(200).json({success:true, status: 200, message: 'Data aspek penilaian ditemukan', data: findAspek})

    } catch (error) {
        console.error(error)
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

module.exports = {tambahAspek, tambahIndikator, tambahBuktiDukung, tambahSkalaIndikator, tipePertanyaan, tambahPertanyaan, allAspek, detailAspek}