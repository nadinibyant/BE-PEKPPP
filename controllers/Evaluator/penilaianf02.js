const {ValidationError, NotFoundError} = require('../../utils/error')
const db = require('../../models')
const sequelize = require('../../config/database')
const { Op, where, Sequelize } = require('sequelize');

//tampil list opd
const listOpdf02 = async (req, res) => {
    try {
        const findOpdAcc = await db.Opd.findAll({
            attributes: ['id_opd', 'nama_opd'],
            include: [
                {
                    model: db.Pengisian_f01,
                    as: 'pengisian_f01',
                    where: {
                        status_pengisian: 'Disetujui'
                    },
                    attributes: []
                }
            ]
        });

        if (findOpdAcc.length <= 0) {
            throw new ValidationError('Belum ada OPD yang sudah disetujui pengisian F01-nya');
        }

        const opdIds = findOpdAcc.map(opd => opd.id_opd);

        const findf02 = await db.Pengisian_f02.findAll({
            where: {
                id_opd: {
                    [Op.in]: opdIds
                }
            },
            attributes: ['id_opd']
        });

        const f02OpdIds = findf02.map(f02 => f02.id_opd);

        const opdWithF02Status = findOpdAcc.map(opd => {
            const hasF02 = f02OpdIds.includes(opd.id_opd);
            return {
                id_opd: opd.id_opd,
                nama_opd: opd.nama_opd,
                status_f02: hasF02 ? 'Submit' : 'Belum Submit'
            };
        });

        return res.status(200).json({
            success: true, 
            status: 200, 
            message: 'Data OPD tersedia', 
            data: opdWithF02Status
        });
    } catch (error) {
        console.error('Error in listOpdf02:', error);
        
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

//tampil pertanyaan
const getQuestF02 = async (req, res) => {
    try {
      const aspekPenilaian = await db.Aspek_penilaian.findAll({
        attributes: ['id_aspek_penilaian', 'nama_aspek', 'bobot_aspek', 'urutan'],
        where: {
          parent_id_aspek_penilaian: null
        },
        order: [
          ['urutan', 'ASC'] 
        ],
        include: [
          {
            model: db.Aspek_penilaian,
            as: 'ChildAspeks',
            attributes: ['id_aspek_penilaian', 'nama_aspek', 'urutan'],
            order: [
              ['urutan', 'ASC']
            ],
            include: [
              {
                model: db.Indikator,
                as: 'Indikators',
                attributes: ['id_indikator', 'kode_indikator', 'nama_indikator', 'bobot_indikator', 'penjelasan', 'urutan'],
                order: [
                  ['urutan', 'ASC']
                ],
                include: [
                  {
                    model: db.Skala_indikator,
                    as: 'skala_indikators',
                    attributes: ['id_skala', 'deskripsi_skala', 'nilai_skala'],
                    order: [
                      ['nilai_skala', 'ASC']
                    ]
                  }
                ]
              }
            ]
          },
          {
            model: db.Indikator,
            as: 'Indikators',
            attributes: ['id_indikator', 'kode_indikator', 'nama_indikator', 'bobot_indikator', 'penjelasan', 'urutan'],
            order: [
              ['urutan', 'ASC']
            ],
            include: [
              {
                model: db.Skala_indikator,
                as: 'skala_indikators',
                attributes: ['id_skala', 'deskripsi_skala', 'nilai_skala'],
                order: [
                  ['nilai_skala', 'ASC'] 
                ],
                separate: true 
              }
            ],
            separate: true 
          }
        ]
      });
  
      if (aspekPenilaian.length === 0) {
        return res.status(404).json({
          success: false,
          status: 404,
          message: 'Data aspek penilaian tidak ditemukan'
        });
      }
      const formattedData = aspekPenilaian.map(aspek => {
        const aspekData = aspek.toJSON();
        return aspekData;
      });
  
      return res.status(200).json({
        success: true,
        status: 200,
        message: 'Data aspek penilaian berhasil diambil',
        data: formattedData
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

// detail f-01 per opd dan per indikator
const findf01Opd = async (req, res) => {
    try {
        const id_opd = req.user.id_user;
        const { id_indikator } = req.params;

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


//submit f02
const submitF02 = async (req, res) => {
    let transaction;
    try {
        transaction = await sequelize.transaction();
        const id_evaluator = req.user.id_user;
        const { id_opd } = req.params;
        const date = new Date();
        const year = date.getFullYear();

        // Validasi evaluator dan periode
        const findEvaluatorPeriode = await db.Evaluator_periode_penilaian.findOne({
            where: {
                id_evaluator: id_evaluator
            },
            include: [
                {
                    model: db.Periode_penilaian,
                    as: 'periode_penilaian',
                    where: {
                        tahun_periode: year
                    }
                }
            ]
        });
        
        if (!findEvaluatorPeriode) {
            throw new ValidationError('Data evaluator tidak ditemukan pada periode saat ini');
        }

        const findOpd = await db.Opd.findByPk(id_opd);
        if (!findOpd) {
            throw new ValidationError('Data OPD tidak ditemukan');
        }
        const existingF02 = await db.Pengisian_f02.findOne({
            where: {
                id_opd: id_opd,
                id_evaluator_periode_penilaian: findEvaluatorPeriode.id_evaluator_periode_penilaian
            }
        });

        let pengisianF02;
        
        if (existingF02) {
            pengisianF02 = existingF02;
        } else {
            pengisianF02 = await db.Pengisian_f02.create({
                id_opd: id_opd,
                id_evaluator_periode_penilaian: findEvaluatorPeriode.id_evaluator_periode_penilaian,
                status_pengisian: 'Draft',
                createdAt: new Date(),
                updatedAt: new Date()
            }, { transaction });
        }

        const { indicator_values } = req.body;
   
        if (!indicator_values || !Array.isArray(indicator_values)) {
            throw new ValidationError('Format data indikator tidak valid');
        }

        console.log('Data yang diterima:', JSON.stringify(req.body));
        console.log(`Jumlah indikator yang akan diproses: ${indicator_values.length}`);

        const aspekValues = {};

        for (const item of indicator_values) {
            const { id_indikator, id_skala } = item;

            console.log(`Memproses indikator: ${id_indikator} dengan skala: ${id_skala}`);
   
            if (!id_indikator || !id_skala) {
                throw new ValidationError('ID indikator dan ID skala harus diisi');
            }

            const indikator = await db.Indikator.findByPk(id_indikator, {
                include: [{
                    model: db.Aspek_penilaian,
                    as: 'AspekPenilaian'
                }]
            });
            
            if (!indikator) {
                throw new ValidationError(`Indikator dengan ID ${id_indikator} tidak ditemukan`);
            }
      
            const skalaIndikator = await db.Skala_indikator.findByPk(id_skala);
            if (!skalaIndikator) {
                throw new ValidationError(`Skala dengan ID ${id_skala} tidak ditemukan`);
            }
      
            console.log('Bobot indikator:', indikator.bobot_indikator);
            console.log('Nilai skala:', skalaIndikator.nilai_skala);
    
            const bobotDecimal = parseFloat(indikator.bobot_indikator || 0) / 100;
            const nilai_diperoleh = parseFloat(bobotDecimal * (skalaIndikator.nilai_skala || 0));

            if (nilai_diperoleh === null || nilai_diperoleh === undefined) {
                throw new ValidationError('Perhitungan nilai menghasilkan nilai null');
            }
            
            console.log('Nilai akhir yang dihitung:', nilai_diperoleh);

            const existingNilai = await db.nilai_indikator.findOne({
                where: {
                    id_pengisian_f02: pengisianF02.id_pengisian_f02,
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
                    id_pengisian_f02: pengisianF02.id_pengisian_f02,
                    id_indikator: id_indikator,
                    id_skala: id_skala,
                    nilai_diperolah: nilai_diperoleh,
                    createdAt: new Date(),
                    updatedAt: new Date()
                }, { transaction });
            }
            const id_aspek_penilaian = indikator.AspekPenilaian?.id_aspek_penilaian;
            
            if (id_aspek_penilaian) {
                if (!aspekValues[id_aspek_penilaian]) {
                    aspekValues[id_aspek_penilaian] = {
                        total: 0,
                        count: 0,
                        aspek: indikator.AspekPenilaian
                    };
                }
                
                aspekValues[id_aspek_penilaian].total += nilai_diperoleh;
                aspekValues[id_aspek_penilaian].count += 1;
            }
        }

        const allAspek = await db.Aspek_penilaian.findAll();
        const parentAspekMap = {};
       
        allAspek.forEach(aspek => {
            if (aspek.parent_id_aspek_penilaian) {
                if (!parentAspekMap[aspek.parent_id_aspek_penilaian]) {
                    parentAspekMap[aspek.parent_id_aspek_penilaian] = [];
                }
                parentAspekMap[aspek.parent_id_aspek_penilaian].push(aspek.id_aspek_penilaian);
            }
        });
        
        console.log('Pemetaan parent aspek:', JSON.stringify(parentAspekMap));
  
        const nilaiAspekUntukDisimpan = {};
   
        const konsolidasiSubAspek = {};
    
        const subAspekByParent = {};
        for (const aspek of allAspek) {
            if (aspek.parent_id_aspek_penilaian) {
                if (!subAspekByParent[aspek.parent_id_aspek_penilaian]) {
                    subAspekByParent[aspek.parent_id_aspek_penilaian] = [];
                }
                subAspekByParent[aspek.parent_id_aspek_penilaian].push(aspek.id_aspek_penilaian);
            }
        }
        
        console.log('Sub aspek berdasarkan parent:', JSON.stringify(subAspekByParent));
   
        for (const [id_aspek, data] of Object.entries(aspekValues)) {
            nilaiAspekUntukDisimpan[id_aspek] = {
                total: data.total,
                count: data.count
            };
        }

        for (const [parentId, subAspekList] of Object.entries(subAspekByParent)) {
            konsolidasiSubAspek[parentId] = {
                total: 0,
                count: 0,
                subAspek: []
            };

            for (const subAspekId of subAspekList) {
                if (aspekValues[subAspekId]) {
                    konsolidasiSubAspek[parentId].total += aspekValues[subAspekId].total;
                    konsolidasiSubAspek[parentId].count += aspekValues[subAspekId].count;
                    konsolidasiSubAspek[parentId].subAspek.push({
                        id: subAspekId,
                        nilai: aspekValues[subAspekId].total
                    });
                }
            }
            
            console.log(`Induk aspek ${parentId}: total nilai dari sub aspek = ${konsolidasiSubAspek[parentId].total} (dari ${konsolidasiSubAspek[parentId].subAspek.length} sub aspek)`);
        }
        
        console.log('Konsolidasi sub aspek:', JSON.stringify(konsolidasiSubAspek));
     
        console.log('Menyimpan nilai untuk setiap aspek...');
        
        const indukAspek = allAspek.filter(aspek => !aspek.parent_id_aspek_penilaian);
        console.log(`Jumlah induk aspek: ${indukAspek.length}`);

        for (const aspek of indukAspek) {
            const id_aspek_penilaian = aspek.id_aspek_penilaian;
            let total_nilai_indikator = 0;
            
            if (konsolidasiSubAspek[id_aspek_penilaian]) {
                total_nilai_indikator = konsolidasiSubAspek[id_aspek_penilaian].total;
            } else if (aspekValues[id_aspek_penilaian]) {
                total_nilai_indikator = aspekValues[id_aspek_penilaian].total;
            } else {
                console.log(`Aspek ${id_aspek_penilaian} tidak memiliki nilai, dilewati`);
                continue;
            }
            
            const existingNilaiAspek = await db.Nilai_aspek.findOne({
                where: {
                    id_pengisian_f02: pengisianF02.id_pengisian_f02,
                    id_aspek_penilaian: id_aspek_penilaian
                }
            });
            
            if (existingNilaiAspek) {
                await db.Nilai_aspek.update({
                    total_nilai_indikator: total_nilai_indikator,
                    updatedAt: new Date()
                }, {
                    where: {
                        id_nilai_aspek: existingNilaiAspek.id_nilai_aspek
                    },
                    transaction
                });
                console.log(`Nilai aspek utama ${id_aspek_penilaian} berhasil diupdate: ${total_nilai_indikator}`);
            } else {
                await db.Nilai_aspek.create({
                    id_pengisian_f02: pengisianF02.id_pengisian_f02,
                    id_aspek_penilaian: id_aspek_penilaian,
                    total_nilai_indikator: total_nilai_indikator,
                    createdAt: new Date(),
                    updatedAt: new Date()
                }, { transaction });
                console.log(`Nilai aspek utama ${id_aspek_penilaian} berhasil dibuat: ${total_nilai_indikator}`);
            }
        }

        for (const aspek of allAspek) {
            if (!aspek.parent_id_aspek_penilaian) continue;
            
            const id_aspek_penilaian = aspek.id_aspek_penilaian;
   
            if (!aspekValues[id_aspek_penilaian]) {
                console.log(`Sub aspek ${id_aspek_penilaian} tidak memiliki nilai, dilewati`);
                continue;
            }
            
            const total_nilai_indikator = aspekValues[id_aspek_penilaian].total;
            
            const existingNilaiAspek = await db.Nilai_aspek.findOne({
                where: {
                    id_pengisian_f02: pengisianF02.id_pengisian_f02,
                    id_aspek_penilaian: id_aspek_penilaian
                }
            });
            
            if (existingNilaiAspek) {
                await db.Nilai_aspek.update({
                    total_nilai_indikator: total_nilai_indikator,
                    updatedAt: new Date()
                }, {
                    where: {
                        id_nilai_aspek: existingNilaiAspek.id_nilai_aspek
                    },
                    transaction
                });
                console.log(`Nilai sub aspek ${id_aspek_penilaian} berhasil diupdate: ${total_nilai_indikator}`);
            } else {
                // Buat nilai aspek baru
                await db.Nilai_aspek.create({
                    id_pengisian_f02: pengisianF02.id_pengisian_f02,
                    id_aspek_penilaian: id_aspek_penilaian,
                    total_nilai_indikator: total_nilai_indikator,
                    createdAt: new Date(),
                    updatedAt: new Date()
                }, { transaction });
                console.log(`Nilai sub aspek ${id_aspek_penilaian} berhasil dibuat: ${total_nilai_indikator}`);
            }
        }
   
        let totalNilaiAkhir = 0;
        
        // Perhitungan nilai akhir dari induk aspek
        for (const aspek of indukAspek) {
            const id_aspek_penilaian = aspek.id_aspek_penilaian;
            let total_nilai_indikator = 0;
            
            if (konsolidasiSubAspek[id_aspek_penilaian]) {

                total_nilai_indikator = konsolidasiSubAspek[id_aspek_penilaian].total;
                console.log(`Aspek induk ${id_aspek_penilaian} menggunakan nilai terkonsolidasi dari sub aspek: ${total_nilai_indikator}`);
            } else if (aspekValues[id_aspek_penilaian]) {
                total_nilai_indikator = aspekValues[id_aspek_penilaian].total;
                console.log(`Aspek induk ${id_aspek_penilaian} menggunakan nilai langsung: ${total_nilai_indikator}`);
            } else {
                console.log(`Aspek ${id_aspek_penilaian} tidak memiliki nilai, dilewati`);
                continue;
            }

            const bobot_aspek = parseFloat(aspek.bobot_aspek || 0);
            console.log(`Bobot aspek dari database untuk aspek ${id_aspek_penilaian}:`, bobot_aspek);

            const bobotAspekDecimal = bobot_aspek / 100;
            const nilaiAspekTertimbang = parseFloat(total_nilai_indikator) * bobotAspekDecimal;
            
            console.log(`Aspek ${id_aspek_penilaian}: Nilai ${total_nilai_indikator} * Bobot ${bobotAspekDecimal} (dari ${bobot_aspek}%) = ${nilaiAspekTertimbang}`);
            console.log('Tipe data nilai:', typeof total_nilai_indikator);
            console.log('Tipe data bobot:', typeof bobotAspekDecimal);
            console.log('Tipe data hasil:', typeof nilaiAspekTertimbang);

            totalNilaiAkhir += nilaiAspekTertimbang;
        }

        console.log('Total nilai akhir sebelum konversi:', totalNilaiAkhir);

        totalNilaiAkhir = parseFloat(totalNilaiAkhir.toFixed(2));
        console.log('Total nilai akhir setelah konversi:', totalNilaiAkhir);
        
        if (totalNilaiAkhir === 0) {
            console.log('PERINGATAN: Total nilai akhir adalah 0. Ini mungkin menunjukkan masalah dalam perhitungan.');
            console.log('Jumlah aspek yang dihitung:', Object.keys(aspekValues).length);
        }

        const existingNilaiAkhir = await db.Nilai_akhir.findOne({
            where: {
                id_pengisian_f02: pengisianF02.id_pengisian_f02
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
                id_pengisian_f02: pengisianF02.id_pengisian_f02,
                total_nilai: totalNilaiAkhir,
                createdAt: new Date(),
                updatedAt: new Date()
            }, { transaction });
        }
 
        try {
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
                                    tahun_periode: year
                                }
                            }
                        ]
                    }
                ],
                transaction
            });
            
            console.log(`Jumlah pengisian F02 untuk OPD ${id_opd} pada tahun ${year}: ${allPengisianF02ForOpd.length}`);

            let totalKumulatif = 0;
            let jumlahEvaluator = 0;
            
            for (const pengisian of allPengisianF02ForOpd) {
                if (pengisian.nilai_akhir && pengisian.nilai_akhir.total_nilai) {
                    totalKumulatif += parseFloat(pengisian.nilai_akhir.total_nilai);
                    jumlahEvaluator += 1;
                    console.log(`Nilai dari pengisian ${pengisian.id_pengisian_f02}: ${pengisian.nilai_akhir.total_nilai}`);
                }
            }

            const nilaiRataRata = jumlahEvaluator > 0 ? totalKumulatif / jumlahEvaluator : 0;
            const nilaiKumulatif = parseFloat(nilaiRataRata.toFixed(2));
            
            console.log(`Total nilai kumulatif: ${totalKumulatif}, Jumlah evaluator: ${jumlahEvaluator}`);
            console.log(`Nilai rata-rata: ${nilaiRataRata}, Nilai kumulatif: ${nilaiKumulatif}`);
            
            let kategori = '';
            
            if (nilaiKumulatif >= 0 && nilaiKumulatif <= 1.00) {
                kategori = 'F'; // Gagal
            } else if (nilaiKumulatif >= 1.01 && nilaiKumulatif <= 1.50) {
                kategori = 'E'; // Sangat Buruk
            } else if (nilaiKumulatif >= 1.51 && nilaiKumulatif <= 2.00) {
                kategori = 'D'; // Buruk
            } else if (nilaiKumulatif >= 2.01 && nilaiKumulatif <= 2.50) {
                kategori = 'C-'; // Cukup 
            } else if (nilaiKumulatif >= 2.51 && nilaiKumulatif <= 3.00) {
                kategori = 'C'; // Cukup
            } else if (nilaiKumulatif >= 3.01 && nilaiKumulatif <= 3.50) {
                kategori = 'B-'; // Baik 
            } else if (nilaiKumulatif >= 3.51 && nilaiKumulatif <= 4.00) {
                kategori = 'B'; // Baik
            } else if (nilaiKumulatif >= 4.01 && nilaiKumulatif <= 4.50) {
                kategori = 'A-'; // Sangat Baik
            } else if (nilaiKumulatif >= 4.51 && nilaiKumulatif <= 5.00) {
                kategori = 'A'; // Pelayanan Prima
            } else {
                kategori = 'UNDEFINED'; 
            }
            
            console.log(`Kategori untuk nilai ${nilaiKumulatif}: ${kategori}`);
            
            const existingNilaiKumulatif = await db.Nilai_akhir_kumulatif.findOne({
                where: {
                    id_opd: id_opd,
                    id_periode_penilaian: findEvaluatorPeriode.periode_penilaian.id_periode_penilaian
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
                    id_periode_penilaian: findEvaluatorPeriode.periode_penilaian.id_periode_penilaian,
                    total_kumulatif: nilaiKumulatif,
                    kategori: kategori,
                    createdAt: new Date(),
                    updatedAt: new Date()
                }, { transaction });
            }
            
            console.log(`Nilai kumulatif untuk OPD ${id_opd} pada periode ${findEvaluatorPeriode.periode_penilaian.id_periode_penilaian} berhasil disimpan`);
            
        } catch (error) {
            console.error('Kesalahan saat menghitung nilai kumulatif:', error);
        }

        await transaction.commit();

        return res.status(200).json({
            success: true,
            status: 200,
            message: 'Data penilaian F02 berhasil disimpan',
            data: {
                id_pengisian_f02: pengisianF02.id_pengisian_f02,
                total_nilai_akhir: totalNilaiAkhir
            }
        });
        
    } catch (error) {
        if (transaction) await transaction.rollback();
        
        console.error('Error in submitF02:', error);
        
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

module.exports = {listOpdf02, getQuestF02, findf01Opd, submitF02}