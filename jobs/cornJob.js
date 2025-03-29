const cron = require('node-cron');
const { Op, where } = require('sequelize');
const {  
    notifPeriodeCloseOpd, 
    notifPeriodeCloseEvaluator, 
    notifRemind3Opd,
    notifRemind3Evaluator,
    notifRemind1Opd,
    notifRemind1Evaluator,
    notifRemindSubmitF01,
    notifRemindSubmitF02
} = require('../services/notification');
const { ValidationError } = require('../utils/error');

module.exports = (db) => {
    console.log('Inisialisasi cron job...');
    
    // Task tiap 30 detik
    const updateStatusTask = cron.schedule('*/30 * * * * *', async () => {
        console.log('Menjalankan tugas update status periode...', new Date());
        
        try {
            const periodesToUpdate = await db.Periode_penilaian.findAll({
                where: {
                    tanggal_selesai: {
                        [Op.lt]: new Date()
                    },
                    status: 'aktif'
                },
                include: [{
                    model: db.Evaluator,
                    as: 'evaluators',
                    attributes: ['id_evaluator', 'nama', 'no_hp']
                }]
            });
            
            console.log(`Ditemukan ${periodesToUpdate.length} periode yang perlu diupdate status menjadi nonaktif`);
            
            if (periodesToUpdate.length > 0) {
                const result = await db.Periode_penilaian.update(
                    { status: 'nonaktif' },
                    {
                        where: {
                            tanggal_selesai: {
                                [Op.lt]: new Date()
                            },
                            status: 'aktif'
                        }
                    }
                );
                
                console.log(`Berhasil update ${result[0]} periode menjadi nonaktif`);
                
                for (const periode of periodesToUpdate) {
                    try {
                        console.log(`Mengirim notifikasi penutupan untuk periode ID: ${periode.id_periode_penilaian}, Tahun: ${periode.tahun_periode}`);
                        
                        const notificationOPDResult = await notifPeriodeCloseOpd(periode);
                        console.log('Hasil notifikasi OPD:', notificationOPDResult.message);
                        
                        const notificationEvaluatorResults = await notifPeriodeCloseEvaluator(periode);
                        console.log('Hasil notifikasi Evaluator:', notificationEvaluatorResults.message);
                    } catch (notifError) {
                        console.error(`Gagal mengirim notifikasi penutupan untuk periode ID ${periode.id_periode_penilaian}:`, notifError);
                    }
                }
            }
        } catch (error) {
            console.error('Error saat menjalankan update status periode:', error);
        }
    });


    // Task cek reminder H-3 (berjalan setiap hari pukul 09:00)
    const reminderH3Task = cron.schedule('0 9 * * *', async () => {
        console.log('Menjalankan pengecekan untuk reminder H-3...', new Date());
        
        try {
            const today = new Date();
            const threeDaysFromNow = new Date(today);
            threeDaysFromNow.setDate(today.getDate() + 3);
            
            threeDaysFromNow.setHours(0, 0, 0, 0);
            
            const periodesForReminder = await db.Periode_penilaian.findAll({
                where: {
                    tanggal_selesai: {
                        [Op.gte]: threeDaysFromNow, 
                        [Op.lt]: new Date(threeDaysFromNow.getTime() + 24 * 60 * 60 * 1000)
                    },
                    status: 'aktif'
                },
                include: [{
                    model: db.Evaluator,
                    as: 'evaluators',
                    attributes: ['id_evaluator', 'nama', 'no_hp']
                }]
            });
            
            console.log(`Ditemukan ${periodesForReminder.length} periode yang akan berakhir dalam 3 hari`);
            
            if (periodesForReminder.length > 0) {
                for (const periode of periodesForReminder) {
                    try {
                        console.log(`Mengirim reminder H-3 untuk periode ID: ${periode.id_periode_penilaian}, Tahun: ${periode.tahun_periode}`);
                        
                        const reminderOPDResult = await notifRemind3Opd(periode);
                        console.log('Hasil reminder H-3 OPD:', reminderOPDResult.message);
                        
                        const reminderEvaluatorResults = await notifRemind3Evaluator(periode);
                        console.log('Hasil reminder H-3 Evaluator:', reminderEvaluatorResults.message);
                      
                    } catch (error) {
                        console.error(`Gagal mengirim reminder H-3 untuk periode ID ${periode.id_periode_penilaian}:`, error);
                    }
                }
            }
        } catch (error) {
            console.error('Error saat menjalankan pengecekan reminder H-3:', error);
        }
    });

     // Task cek reminder H-3 (berjalan setiap hari pukul 09:00)
    const reminderH1Task = cron.schedule('0 9 * * *', async () => {
      console.log('Menjalankan pengecekan untuk reminder H-1...', new Date());
      
      try {
          const today = new Date();
          const threeDaysFromNow = new Date(today);
          threeDaysFromNow.setDate(today.getDate() + 1);
          
          threeDaysFromNow.setHours(0, 0, 0, 0);
          
          const periodesForReminder = await db.Periode_penilaian.findAll({
              where: {
                  tanggal_selesai: {
                      [Op.gte]: threeDaysFromNow, 
                      [Op.lt]: new Date(threeDaysFromNow.getTime() + 24 * 60 * 60 * 1000)
                  },
                  status: 'aktif'
              },
              include: [{
                  model: db.Evaluator,
                  as: 'evaluators',
                  attributes: ['id_evaluator', 'nama', 'no_hp']
              }]
          });
          
          console.log(`Ditemukan ${periodesForReminder.length} periode yang akan berakhir dalam 3 hari`);
          
          if (periodesForReminder.length > 0) {
              for (const periode of periodesForReminder) {
                  try {
                      console.log(`Mengirim reminder H-1 untuk periode ID: ${periode.id_periode_penilaian}, Tahun: ${periode.tahun_periode}`);
                      
                      const reminderOPDResult = await notifRemind1Opd(periode);
                      console.log('Hasil reminder H-1 OPD:', reminderOPDResult.message);
                      
                      const reminderEvaluatorResults = await notifRemind1Evaluator(periode);
                      console.log('Hasil reminder H-1 Evaluator:', reminderEvaluatorResults.message);
                    
                  } catch (error) {
                      console.error(`Gagal mengirim reminder H-1 untuk periode ID ${periode.id_periode_penilaian}:`, error);
                  }
              }
          }
      } catch (error) {
          console.error('Error saat menjalankan pengecekan reminder H-1:', error);
      }
    });

    // remind subtmi f01 (berjalan setiap hari pukul 09:00)
    const remindSubmitF01 = cron.schedule('0 9 * * *', async () => {
      console.log('Menjalankan pengecekan untuk OPD yang belum submit F01...', new Date());
      try {
        const tahun = new Date().getFullYear();
        const findPeriode = await db.Periode_penilaian.findOne({
          where: {
            tahun_periode: tahun,
            status: 'aktif'
          }
        });
    
        if (!findPeriode) {
          throw new ValidationError('Data periode tidak ditemukan');
        }
   
        const allOpds = await db.Opd.findAll();
        
        const submittedOpds = await db.Pengisian_f01.findAll({
          where: {
            id_periode_penilaian: findPeriode.id_periode_penilaian
          },
          attributes: ['id_opd']
        });
        
        const submittedOpdIds = submittedOpds.map(item => item.id_opd);
        
        const nonSubmittedOpds = allOpds.filter(opd => !submittedOpdIds.includes(opd.id_opd));
        
        console.log(`Ditemukan ${nonSubmittedOpds.length} OPD yang belum submit F01`);
        
        if (nonSubmittedOpds.length > 0) {
          const notificationResults = [];
          
          for (const opd of nonSubmittedOpds) {
            try {
              console.log(`Mengirim reminder submit F01 ke OPD: ${opd.nama_opd}`);
              
              const reminderResult = await notifRemindSubmitF01(opd.id_opd);
              console.log('Hasil reminder submit F01:', reminderResult.message);
              
              notificationResults.push({
                opdId: opd.id_opd,
                opdNama: opd.nama_opd,
                success: reminderResult.success,
                error: reminderResult.error || null
              });
              
              await new Promise(resolve => setTimeout(resolve, 1000));
            } catch (error) {
              console.error(`Gagal mengirim reminder submit F01 untuk OPD ${opd.nama_opd}:`, error);
              notificationResults.push({
                opdId: opd.id_opd,
                opdNama: opd.nama_opd,
                success: false,
                error: error.message || 'Unknown error'
              });
            }
          }
          
          const successCount = notificationResults.filter(r => r.success).length;
          console.log(`Berhasil mengirim reminder ke ${successCount} dari ${nonSubmittedOpds.length} OPD yang belum submit F01`);
        }
      } catch (error) {
        console.error('Gagal reminder submit f01:', error);
      }
    });

    // remind subtmi f02 (berjalan setiap hari pukul 09:00)
    const remindSubmitF02 = cron.schedule('0 9 * * *', async () => {
      console.log('Menjalankan pengecekan untuk Evaluator yang belum menilai OPD...', new Date());
      try {
        const tahun = new Date().getFullYear();
        const activePeriode = await db.Periode_penilaian.findOne({
          where: {
            tahun_periode: tahun,
            status: 'aktif'
          },
          include: [{
            model: db.Evaluator,
            as: 'evaluators',
            attributes: ['id_evaluator', 'nama', 'no_hp']
          }]
        });
    
        if (!activePeriode) {
          throw new ValidationError('Data periode aktif tidak ditemukan');
        }
    
        const allOpds = await db.Opd.findAll();
        
        const submittedF01s = await db.Pengisian_f01.findAll({
          where: {
            id_periode_penilaian: activePeriode.id_periode_penilaian
          },
          attributes: ['id_opd']
        });
        
        if (submittedF01s.length === 0) {
          console.log('Tidak ada OPD yang sudah submit F01, tidak perlu mengirim reminder F02');
          return;
        }
        
        const submittedOpdIds = submittedF01s.map(item => item.id_opd);
        const opdsToEvaluate = allOpds.filter(opd => submittedOpdIds.includes(opd.id_opd));
        
        for (const evaluator of activePeriode.evaluators) {
          console.log(`Memeriksa evaluator: ${evaluator.nama}`);
          
          const evaluatorPeriode = await db.Evaluator_periode_penilaian.findOne({
            where: {
              id_evaluator: evaluator.id_evaluator,
              id_periode_penilaian: activePeriode.id_periode_penilaian
            }
          });
          
          if (!evaluatorPeriode) {
            console.log(`Evaluator ${evaluator.nama} tidak terdaftar dalam periode ini`);
            continue;
          }
          
          const evaluatedOpds = await db.Pengisian_f02.findAll({
            where: {
              id_evaluator_periode_penilaian: evaluatorPeriode.id_evaluator_periode_penilaian
            },
            attributes: ['id_opd']
          });
          
          const evaluatedOpdIds = evaluatedOpds.map(item => item.id_opd);
          
          const opdsNotEvaluated = opdsToEvaluate.filter(opd => !evaluatedOpdIds.includes(opd.id_opd));
          
          if (opdsNotEvaluated.length > 0) {
            console.log(`Evaluator ${evaluator.nama} belum menilai ${opdsNotEvaluated.length} OPD`);
            
            try {
              const reminderResult = await notifRemindSubmitF02(evaluator.id_evaluator);
              console.log(`Hasil reminder F02 untuk evaluator ${evaluator.nama}:`, reminderResult.message);
              
              await new Promise(resolve => setTimeout(resolve, 1000));
            } catch (error) {
              console.error(`Gagal mengirim reminder F02 untuk evaluator ${evaluator.nama}:`, error);
            }
          } else {
            console.log(`Evaluator ${evaluator.nama} sudah menilai semua OPD yang submit F01`);
          }
        }
        
      } catch (error) {
        console.error('Error saat menjalankan reminder F02:', error);
      }
    });
    
    updateStatusTask.start()
    reminderH3Task.start()
    reminderH1Task.start()
    remindSubmitF01.start()
    remindSubmitF02.start()
    
    console.log('Cron job berhasil dimulai');
    
    return {
        updateStatusTask,
        reminderH3Task,
        reminderH1Task,
        remindSubmitF01,
        remindSubmitF02
    };
};