const cron = require('node-cron');
const { Op } = require('sequelize');
const {  
    notifPeriodeCloseOpd, 
    notifPeriodeCloseEvaluator, 
    notifRemind3Opd,
    notifRemind3Evaluator,
    notifRemind1Opd,
    notifRemind1Evaluator
} = require('../services/notification');

module.exports = (db) => {
    console.log('Inisialisasi cron job pengecekan periode dan pengiriman reminder...');
    
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
    
    updateStatusTask.start()
    reminderH3Task.start()
    reminderH1Task.start()
    
    console.log('Cron job reminder dan update status berhasil dimulai');
    
    return {
        updateStatusTask,
        reminderH3Task,
        reminderH1Task
    };
};