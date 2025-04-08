const { sendWhatsAppMessage, whatsappClient } = require('../config/whatsaap');
const db = require('../models');
const { Op, ForeignKeyConstraintError, where } = require('sequelize');
const { ValidationError, NotFoundError } = require('../utils/error');

// notifikasi periode dibuka untuk opd
const notifPeriodToAllOpd = async (periodeData) => {
    try {
        if (!whatsappClient.info) {
            return { success: false, message: 'WhatsApp client belum siap, tunggu beberapa saat' };
        }

        const opdList = await db.Opd.findAll()
        if (opdList.length === 0) {
            throw new ValidationError('Data opd tidak ditemukan')
        }

        const createMessage = (nama_opd) => {
            const formatTanggal = (dateString) => {
                if (!dateString) return '-';
                const date = new Date(dateString);
                const options = { day: 'numeric', month: 'long', year: 'numeric' };
                return date.toLocaleDateString('id-ID', options);
            };
            
            return `*Periode ${periodeData.tahun_periode} Penilaian Evaluasi Kinerja Pelayanan Publik Telah Dibuka*\n\nDiberitahukan kepada seluruh Organisasi Perangkat Daerah (OPD) bahwa periode penilaian telah dibuka dengan detail sebagai berikut:\n• Periode: ${periodeData.tahun_periode}\n• Tanggal Mulai: ${formatTanggal(periodeData.tanggal_mulai)}\n• Tanggal Selesai: ${formatTanggal(periodeData.tanggal_selesai)}\n\nMohon disiapkan dokumentasi yang diperlukan dan *Segera mengisikan form penilaian F-01 pada sistem* dengan menggunakan akun masing-masing yang sudah diberikan.\n\nTerimakasih.`;
        }

        const notificationResults = [];
        
        for (const opd of opdList) {
            const message = createMessage(opd.nama);
            
            const result = await sendWhatsAppMessage(opd.no_hp, message);
            
            notificationResults.push({
                opdId: opd.id_opd,
                opdNama: opd.nama,
                phoneNumber: opd.no_hp,
                success: result.success,
                error: result.error || null
            });
            
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        const successCount = notificationResults.filter(r => r.success).length;
        
        return {
            success: true,
            message: `Berhasil mengirim notifikasi ke ${successCount} dari ${opdList.length} OPD`,
            details: notificationResults
        };

    } catch (error) {
        console.error('Error saat mengirim notifikasi:', error);
        return {
            success: false,
            message: error.message || 'Gagal mengirim notifikasi',
            error: error.name || 'UnknownError'
        };
    }
}

// notifikasi periode dibukat untuk evaluator
const notifPeriodToAllEvaluator = async (periodeData) => {
    try {
        if (!whatsappClient.info) {
            return { success: false, message: 'WhatsApp client belum siap, tunggu beberapa saat' };
        }

        const createMessage = (nama_opd) => {
            const formatTanggal = (dateString) => {
                if (!dateString) return '-';
                const date = new Date(dateString);
                const options = { day: 'numeric', month: 'long', year: 'numeric' };
                return date.toLocaleDateString('id-ID', options);
            };
            
            return `*Periode ${periodeData.tahun_periode} Penilaian Evaluasi Kinerja Pelayanan Publik Telah Dibuka*\n\nDiberitahukan kepada seluruh Tim Penilai bahwa periode penilaian telah dibuka dengan detail sebagai berikut:\n• Periode: ${periodeData.tahun_periode}\n• Tanggal Mulai: ${formatTanggal(periodeData.tanggal_mulai)}\n• Tanggal Selesai: ${formatTanggal(periodeData.tanggal_selesai)}\n\nMohon *Segera mengisikan form penilaian F-02 pada sistem jika sudah terdapat OPD yang dapat dinilai* dengan menggunakan akun masing-masing yang sudah diberikan.\n\nTerimakasih.`;
        }

        const notificationResults = [];
        
        for (const evaluator of periodeData.evaluators) {
            const message = createMessage(evaluator.nama);
            
            const result = await sendWhatsAppMessage(evaluator.no_hp, message);
            
            notificationResults.push({
                evaluatorId: evaluator.id_evaluator,
                evaluatorNama: evaluator.nama,
                phoneNumber: evaluator.no_hp,
                success: result.success,
                error: result.error || null
            });
            
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        const successCount = notificationResults.filter(r => r.success).length;
        
        return {
            success: true,
            message: `Berhasil mengirim notifikasi ke ${successCount} dari ${periodeData.evaluators.length} OPD`,
            details: notificationResults
        };

    } catch (error) {
        console.error('Error saat mengirim notifikasi:', error);
        return {
            success: false,
            message: error.message || 'Gagal mengirim notifikasi',
            error: error.name || 'UnknownError'
        };
    }
}

// notifikasi periode sudah ditutup
const notifPeriodeCloseOpd = async (periodeData) => {
    try {
        if (!whatsappClient.info) {
            return { success: false, message: 'WhatsApp client belum siap, tunggu beberapa saat' };
        }

        const opdList = await db.Opd.findAll()
        if (opdList.length === 0) {
            throw new ValidationError('Data opd tidak ditemukan')
        }

        const createMessage = (nama_opd) => {
            const formatTanggal = (dateString) => {
                if (!dateString) return '-';
                const date = new Date(dateString);
                const options = { day: 'numeric', month: 'long', year: 'numeric' };
                return date.toLocaleDateString('id-ID', options);
            };
            
            return `*Periode ${periodeData.tahun_periode} Penilaian Evaluasi Kinerja Pelayanan Publik Telah Ditutup*\n\nTerimakasih atas partisipasinya pada Penilaian Evaluasi Kinerja Pelayanan Publik`;
        }

        const notificationResults = [];
        
        for (const opd of opdList) {
            const message = createMessage(opd.nama);
            
            const result = await sendWhatsAppMessage(opd.no_hp, message);
            
            notificationResults.push({
                opdId: opd.id_opd,
                opdNama: opd.nama,
                phoneNumber: opd.no_hp,
                success: result.success,
                error: result.error || null
            });
            
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        const successCount = notificationResults.filter(r => r.success).length;
        
        return {
            success: true,
            message: `Berhasil mengirim notifikasi ke ${successCount} dari ${opdList.length} OPD`,
            details: notificationResults
        };

    } catch (error) {
        console.error('Error saat mengirim notifikasi:', error);
        return {
            success: false,
            message: error.message || 'Gagal mengirim notifikasi',
            error: error.name || 'UnknownError'
        };
    }
}

const notifPeriodeCloseEvaluator = async (periodeData) => {
    try {
        if (!whatsappClient.info) {
            return { success: false, message: 'WhatsApp client belum siap, tunggu beberapa saat' };
        }

        const createMessage = (nama_opd) => {
            const formatTanggal = (dateString) => {
                if (!dateString) return '-';
                const date = new Date(dateString);
                const options = { day: 'numeric', month: 'long', year: 'numeric' };
                return date.toLocaleDateString('id-ID', options);
            };
            
            return `*Periode ${periodeData.tahun_periode} Penilaian Evaluasi Kinerja Pelayanan Publik Telah Ditutup*\n\nTerimakasih atas partisipasinya pada Penilaian Evaluasi Kinerja Pelayanan Publik`;
        }

        const notificationResults = [];
        
        for (const evaluator of periodeData.evaluators) {
            const message = createMessage(evaluator.nama);
            
            const result = await sendWhatsAppMessage(evaluator.no_hp, message);
            
            notificationResults.push({
                evaluatorId: evaluator.id_evaluator,
                evaluatorNama: evaluator.nama,
                phoneNumber: evaluator.no_hp,
                success: result.success,
                error: result.error || null
            });
            
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        const successCount = notificationResults.filter(r => r.success).length;
        
        return {
            success: true,
            message: `Berhasil mengirim notifikasi ke ${successCount} dari ${periodeData.evaluators.length} OPD`,
            details: notificationResults
        };

    } catch (error) {
        console.error('Error saat mengirim notifikasi:', error);
        return {
            success: false,
            message: error.message || 'Gagal mengirim notifikasi',
            error: error.name || 'UnknownError'
        };
    }
}

// notifikasi reminder 3 hari untuk opd
const notifRemind3Opd = async (periodeData) => {
    try {
        if (!whatsappClient.info) {
            return { success: false, message: 'WhatsApp client belum siap, tunggu beberapa saat' };
        }

        const opdList = await db.Opd.findAll()
        if (opdList.length === 0) {
            throw new ValidationError('Data opd tidak ditemukan')
        }

        const createMessage = (nama_opd) => {
            const formatTanggal = (dateString) => {
                if (!dateString) return '-';
                const date = new Date(dateString);
                const options = { day: 'numeric', month: 'long', year: 'numeric' };
                return date.toLocaleDateString('id-ID', options);
            };
            
            return `*Periode ${periodeData.tahun_periode} 3 HARI LAGI AKAN SEGERA BERAKHIR!!!*\n\nDiberitahukan kepada seluruh Organisasi Perangkat Daerah (OPD) bahwa periode Penilaian Evaluasi Kinerja Pelayanan Publik akan berakhir pada tanggal ${formatTanggal(periodeData.tanggal_selesai)}\n\nMohon disiapkan dokumentasi yang diperlukan dan *Segera mengisikan form penilaian F-01 pada sistem* dengan menggunakan akun masing-masing yang sudah diberikan.\n\nTerimakasih.`;
        }

        const notificationResults = [];
        
        for (const opd of opdList) {
            const message = createMessage(opd.nama);
            
            const result = await sendWhatsAppMessage(opd.no_hp, message);
            
            notificationResults.push({
                opdId: opd.id_opd,
                opdNama: opd.nama,
                phoneNumber: opd.no_hp,
                success: result.success,
                error: result.error || null
            });
            
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        const successCount = notificationResults.filter(r => r.success).length;
        
        return {
            success: true,
            message: `Berhasil mengirim notifikasi ke ${successCount} dari ${opdList.length} OPD`,
            details: notificationResults
        };

    } catch (error) {
        console.error('Error saat mengirim notifikasi:', error);
        return {
            success: false,
            message: error.message || 'Gagal mengirim notifikasi',
            error: error.name || 'UnknownError'
        };
    }
}

// notifikasi reminder 3 hari untuk evaluator
const notifRemind3Evaluator = async (periodeData) => {
    try {
        if (!whatsappClient.info) {
            return { success: false, message: 'WhatsApp client belum siap, tunggu beberapa saat' };
        }

        const createMessage = (nama_opd) => {
            const formatTanggal = (dateString) => {
                if (!dateString) return '-';
                const date = new Date(dateString);
                const options = { day: 'numeric', month: 'long', year: 'numeric' };
                return date.toLocaleDateString('id-ID', options);
            };
            
            return `*Periode ${periodeData.tahun_periode} 3 HARI LAGI AKAN SEGERA BERAKHIR!!!*\n\nDiberitahukan kepada seluruh Tim Penilai bahwa periode Penilaian Evaluasi Kinerja Pelayanan Publik akan berakhir pada tanggal ${formatTanggal(periodeData.tanggal_selesai)}\n\nMohon disiapkan dokumentasi yang diperlukan dan *Segera mengisikan form penilaian F-02 pada sistem* dengan menggunakan akun masing-masing yang sudah diberikan.\n\nTerimakasih.`;
        }

        const notificationResults = [];
        
        for (const evaluator of periodeData.evaluators) {
            const message = createMessage(evaluator.nama);
            
            const result = await sendWhatsAppMessage(evaluator.no_hp, message);
            
            notificationResults.push({
                evaluatorId: evaluator.id_evaluator,
                evaluatorNama: evaluator.nama,
                phoneNumber: evaluator.no_hp,
                success: result.success,
                error: result.error || null
            });
            
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        const successCount = notificationResults.filter(r => r.success).length;
        
        return {
            success: true,
            message: `Berhasil mengirim notifikasi ke ${successCount} dari ${periodeData.evaluators.length} OPD`,
            details: notificationResults
        };

    } catch (error) {
        console.error('Error saat mengirim notifikasi:', error);
        return {
            success: false,
            message: error.message || 'Gagal mengirim notifikasi',
            error: error.name || 'UnknownError'
        };
    }
}

// notifikasi reminder 1 hari untuk opd
const notifRemind1Opd = async (periodeData) => {
    try {
        if (!whatsappClient.info) {
            return { success: false, message: 'WhatsApp client belum siap, tunggu beberapa saat' };
        }

        const opdList = await db.Opd.findAll()
        if (opdList.length === 0) {
            throw new ValidationError('Data opd tidak ditemukan')
        }

        const createMessage = (nama_opd) => {
            const formatTanggal = (dateString) => {
                if (!dateString) return '-';
                const date = new Date(dateString);
                const options = { day: 'numeric', month: 'long', year: 'numeric' };
                return date.toLocaleDateString('id-ID', options);
            };
            
            return `*Periode ${periodeData.tahun_periode} 1 HARI LAGI AKAN SEGERA BERAKHIR!!!*\n\nDiberitahukan kepada seluruh Organisasi Perangkat Daerah (OPD) bahwa periode Penilaian Evaluasi Kinerja Pelayanan Publik akan berakhir pada tanggal ${formatTanggal(periodeData.tanggal_selesai)}\n\nMohon disiapkan dokumentasi yang diperlukan dan *Segera mengisikan form penilaian F-01 pada sistem* dengan menggunakan akun masing-masing yang sudah diberikan.\n\nTerimakasih.`;
        }

        const notificationResults = [];
        
        for (const opd of opdList) {
            const message = createMessage(opd.nama);
            
            const result = await sendWhatsAppMessage(opd.no_hp, message);
            
            notificationResults.push({
                opdId: opd.id_opd,
                opdNama: opd.nama,
                phoneNumber: opd.no_hp,
                success: result.success,
                error: result.error || null
            });
            
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        const successCount = notificationResults.filter(r => r.success).length;
        
        return {
            success: true,
            message: `Berhasil mengirim notifikasi ke ${successCount} dari ${opdList.length} OPD`,
            details: notificationResults
        };

    } catch (error) {
        console.error('Error saat mengirim notifikasi:', error);
        return {
            success: false,
            message: error.message || 'Gagal mengirim notifikasi',
            error: error.name || 'UnknownError'
        };
    }
}

// notifikasi reminder 1 hari untuk evaluator
const notifRemind1Evaluator = async (periodeData) => {
    try {
        if (!whatsappClient.info) {
            return { success: false, message: 'WhatsApp client belum siap, tunggu beberapa saat' };
        }

        const createMessage = (nama_opd) => {
            const formatTanggal = (dateString) => {
                if (!dateString) return '-';
                const date = new Date(dateString);
                const options = { day: 'numeric', month: 'long', year: 'numeric' };
                return date.toLocaleDateString('id-ID', options);
            };
            
            return `*Periode ${periodeData.tahun_periode} 1 HARI LAGI AKAN SEGERA BERAKHIR!!!*\n\nDiberitahukan kepada seluruh Tim Penilai bahwa periode Penilaian Evaluasi Kinerja Pelayanan Publik akan berakhir pada tanggal ${formatTanggal(periodeData.tanggal_selesai)}\n\nMohon disiapkan dokumentasi yang diperlukan dan *Segera mengisikan form penilaian F-02 pada sistem* dengan menggunakan akun masing-masing yang sudah diberikan.\n\nTerimakasih.`;
        }

        const notificationResults = [];
        
        for (const evaluator of periodeData.evaluators) {
            const message = createMessage(evaluator.nama);
            
            const result = await sendWhatsAppMessage(evaluator.no_hp, message);
            
            notificationResults.push({
                evaluatorId: evaluator.id_evaluator,
                evaluatorNama: evaluator.nama,
                phoneNumber: evaluator.no_hp,
                success: result.success,
                error: result.error || null
            });
            
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        const successCount = notificationResults.filter(r => r.success).length;
        
        return {
            success: true,
            message: `Berhasil mengirim notifikasi ke ${successCount} dari ${periodeData.evaluators.length} OPD`,
            details: notificationResults
        };

    } catch (error) {
        console.error('Error saat mengirim notifikasi:', error);
        return {
            success: false,
            message: error.message || 'Gagal mengirim notifikasi',
            error: error.name || 'UnknownError'
        };
    }
}

// notifikasi opd belum submit f01
const notifRemindSubmitF01 = async (id_opd) => {
    try {
        if (!whatsappClient.info) {
            return { success: false, message: 'WhatsApp client belum siap, tunggu beberapa saat' };
        }

        const findOpd = await db.Opd.findByPk(id_opd)

        if (!findOpd) {
            throw new ValidationError('Data OPD tidak ditemukan')
        }

        const createMessage = (nama_opd) => {
            const formatTanggal = (dateString) => {
                if (!dateString) return '-';
                const date = new Date(dateString);
                const options = { day: 'numeric', month: 'long', year: 'numeric' };
                return date.toLocaleDateString('id-ID', options);
            };
            
            return `*Pengisian Formulir Penilaian (F-01)*\n\nDiberitahukan kepada Organisasi Perangkat Daerah (${nama_opd}) harap segera melakukan pengisian formulir penilaian F-01, dengan menggunakan akun masing-masing yang sudah diberikan.\n\nTerimakasih.`;
        }

        const message = await createMessage(findOpd.nama_opd)
        const result = await sendWhatsAppMessage(findOpd.no_hp, message);

        return {
            success: true,
            message: `Berhasil mengirim notifikasi ke OPD`,
            details: result
        };


    } catch (error) {
        console.error('Error saat mengirim notifikasi:', error);
        return {
            success: false,
            message: error.message || 'Gagal mengirim notifikasi',
            error: error.name || 'UnknownError'
        };
    }
}

// notifikasi evaluator belum submit f02
const notifRemindSubmitF02 = async (id_evaluator) => {
    try {
        if (!whatsappClient.info) {
            return { success: false, message: 'WhatsApp client belum siap, tunggu beberapa saat' };
        }

        const findEvaluator = await db.Evaluator.findByPk(id_evaluator)

        if (!findEvaluator) {
            throw new ValidationError('Data Evaluator tidak ditemukan')
        }

        const createMessage = () => {
            return `*Pengisian Formulir Penilaian (F-02)*\n\nDiberitahukan kepada Tim Penilai, harap segera melakukan pengisian formulir penilaian F-02 dikarenakan masih terdapat OPD yang belum dinilai, dengan menggunakan akun masing-masing yang sudah diberikan.\n\nTerimakasih.`;
        }

        const message = await createMessage(findEvaluator.nama)
        const result = await sendWhatsAppMessage(findEvaluator.no_hp, message);

        return {
            success: true,
            message: `Berhasil mengirim notifikasi ke OPD`,
            details: result
        };


    } catch (error) {
        console.error('Error saat mengirim notifikasi:', error);
        return {
            success: false,
            message: error.message || 'Gagal mengirim notifikasi',
            error: error.name || 'UnknownError'
        };
    }
}

// notifikasi verif f01 ditolak
const notifDecF01 = async (id_opd) => {
    try {
        if (!whatsappClient.info) {
            return { success: false, message: 'WhatsApp client belum siap, tunggu beberapa saat' };
        }

        const findOpd = await db.Opd.findByPk(id_opd)

        if (!findOpd) {
            throw new ValidationError('Data OPD tidak ditemukan')
        }

        const createMessage = (nama_opd) => {
            return `*Pengisian Formulir Penilaian (F-01) DITOLAK!!!*\n\nDiberitahukan kepada Organisasi Perangkat Daerah (${nama_opd}) Formulir Penilaian anda *Ditolak* harap segera melakukan pengisian ulang sebelum periode penilaian ditutup.\n\nAbaikan pesan ini, jika sudah melakukan pengisian ulang.\n\nTerimakasih.`;
        }

        const message = await createMessage(findOpd.nama_opd)
        const result = await sendWhatsAppMessage(findOpd.no_hp, message);

        return {
            success: true,
            message: `Berhasil mengirim notifikasi ke OPD`,
            details: result
        };


    } catch (error) {
        console.error('Error saat mengirim notifikasi:', error);
        return {
            success: false,
            message: error.message || 'Gagal mengirim notifikasi',
            error: error.name || 'UnknownError'
        };
    }
}

// notifikasi verif f01 disetujui
const notifAccF01 = async (id_opd) => {
    try {
        if (!whatsappClient.info) {
            return { success: false, message: 'WhatsApp client belum siap, tunggu beberapa saat' };
        }

        const findOpd = await db.Opd.findByPk(id_opd)

        if (!findOpd) {
            throw new ValidationError('Data OPD tidak ditemukan')
        }

        const createMessage = (nama_opd) => {
            return `*Pengisian Formulir Penilaian (F-01) DITERIMA!*\n\nFormulir Penilaian anda sudah *Diterima* harap menunggu hasil penilaian yang diberikan oleh Tim Penilai \n\nTerimakasih.`;
        }

        const message = await createMessage(findOpd.nama_opd)
        const result = await sendWhatsAppMessage(findOpd.no_hp, message);

        return {
            success: true,
            message: `Berhasil mengirim notifikasi ke OPD`,
            details: result
        };


    } catch (error) {
        console.error('Error saat mengirim notifikasi:', error);
        return {
            success: false,
            message: error.message || 'Gagal mengirim notifikasi',
            error: error.name || 'UnknownError'
        };
    }
}

const notifAllAccF01 = async () => {
    try {
        if (!whatsappClient.info) {
            return { success: false, message: 'WhatsApp client belum siap, tunggu beberapa saat' };
        }

        const pengisianF01List = await db.Pengisian_f01.findAll({
            where: {
                status_pengisian: 'Disetujui' 
            },
            include: [
                {
                    model: db.Opd,
                    as: 'opd',
                }
            ]
        });
        
        if (pengisianF01List.length === 0) {
            return { success: false, message: 'Tidak ada data pengisian F01 yang disetujui' };
        }

        const createMessage = () => {
            return `*Pengisian Formulir Penilaian (F-01) DITERIMA!*\n\nFormulir Penilaian anda sudah *Diterima* harap menunggu hasil penilaian yang diberikan oleh Tim Penilai \n\nTerimakasih.`;
        };

        const notificationResults = [];
        
        for (const pengisianF01 of pengisianF01List) {
            const message = createMessage();
            
            if (pengisianF01.opd && pengisianF01.opd.no_hp) {
                const result = await sendWhatsAppMessage(pengisianF01.opd.no_hp, message);
                
                notificationResults.push({
                    opdId: pengisianF01.opd.id_opd,
                    opdNama: pengisianF01.opd.nama_opd, 
                    phoneNumber: pengisianF01.opd.no_hp,
                    success: result.success,
                    error: result.error || null
                });
                
                await new Promise(resolve => setTimeout(resolve, 1000));
            } else {
                console.error(`Data OPD tidak lengkap untuk pengisian F01: ${pengisianF01.id_pengisian_f01}`);
                notificationResults.push({
                    opdId: pengisianF01.id_opd,
                    success: false,
                    error: 'Data OPD tidak lengkap'
                });
            }
        }
        
        const successCount = notificationResults.filter(r => r.success).length;
        
        return {
            success: true,
            message: `Berhasil mengirim notifikasi ke ${successCount} dari ${pengisianF01List.length} OPD`,
            details: notificationResults
        };

    } catch (error) {
        console.error('Error saat mengirim notifikasi:', error);
        return {
            success: false,
            message: error.message || 'Gagal mengirim notifikasi',
            error: error.name || 'UnknownError'
        };
    }
};

// notifikasi izin hasil penilaian ditolak
const notifIzinDecOpd = async (id_izin_hasil_penilaian) => {
    try {
        if (!whatsappClient.info) {
            return { success: false, message: 'WhatsApp client belum siap, tunggu beberapa saat' };
        }

        const findIzinPenilaian = await db.Izin_hasil_penilaian.findByPk(id_izin_hasil_penilaian, {
            include: [
                {
                    model: db.Opd,
                    as: 'opd'
                },
                {
                    model: db.Evaluator,
                    as: 'evaluator'
                }
            ]
        });

        if (!findIzinPenilaian) {
            throw new ValidationError('Data izin hasil penilaian tidak ditemukan');
        }

        let phoneNumber = null;
        let recipientType = null;
        let recipientName = null;
        
        if (findIzinPenilaian.opd && findIzinPenilaian.opd.no_hp) {
            phoneNumber = findIzinPenilaian.opd.no_hp;
            recipientType = 'OPD';
            recipientName = findIzinPenilaian.opd.nama_opd || 'OPD';
        } else if (findIzinPenilaian.evaluator && findIzinPenilaian.evaluator.no_hp) {
            phoneNumber = findIzinPenilaian.evaluator.no_hp;
            recipientType = 'Evaluator';
            recipientName = findIzinPenilaian.evaluator.nama || 'Evaluator';
        } else {
            return {
                success: false,
                message: 'Tidak ada nomor telepon yang valid untuk dikirim notifikasi',
                details: null
            };
        }

        const message = `*Izin Akses Hasil Penilaian Anda Ditolak*\n\nSilahkan lakukan pengecekan pada halaman hasil penilaian, jika ingin meminta perizinan kembali.\n\nTerimakasih.`;
        
        const result = await sendWhatsAppMessage(phoneNumber, message);

        return {
            success: result.success,
            message: `Berhasil mengirim notifikasi ke ${recipientType} ${recipientName}`,
            details: {
                recipientType,
                recipientName,
                phoneNumber,
                ...result
            }
        };
    } catch (error) {
        console.error('Error saat mengirim notifikasi:', error);
        return {
            success: false,
            message: error.message || 'Gagal mengirim notifikasi',
            error: error.name || 'UnknownError'
        };
    }
};

// notifikasi izin hasil penilaian disetujui untuk opd
const notifIzinAccOpd = async (id_izin_hasil_penilaian) => {
    try {
        if (!whatsappClient.info) {
            return { success: false, message: 'WhatsApp client belum siap, tunggu beberapa saat' };
        }

        const findIzinPenilaian = await db.Izin_hasil_penilaian.findByPk(id_izin_hasil_penilaian, {
            include: [
                {
                    model: db.Opd,
                    as: 'opd'
                },
                {
                    model: db.Evaluator,
                    as: 'evaluator'
                }
            ]
        });

        if (!findIzinPenilaian) {
            throw new ValidationError('Data izin hasil penilaian tidak ditemukan');
        }

        let phoneNumber = null;
        let recipientType = null;
        let recipientName = null;
        
        if (findIzinPenilaian.opd && findIzinPenilaian.opd.no_hp) {
            phoneNumber = findIzinPenilaian.opd.no_hp;
            recipientType = 'OPD';
            recipientName = findIzinPenilaian.opd.nama_opd || 'OPD';
        } else if (findIzinPenilaian.evaluator && findIzinPenilaian.evaluator.no_hp) {
            phoneNumber = findIzinPenilaian.evaluator.no_hp;
            recipientType = 'Evaluator';
            recipientName = findIzinPenilaian.evaluator.nama || 'Evaluator';
        } else {
            return {
                success: false,
                message: 'Tidak ada nomor telepon yang valid untuk dikirim notifikasi',
                details: null
            };
        }

        const message = `*Izin Akses Hasil Penilaian Anda Diterima*\n\nSilahkan lakukan pengecekan pada halaman hasil penilaian untuk mendapatkan hasil penilaian serta mendapatkan rapor hasil penilaian.\n\nTerimakasih.`;
        
        const result = await sendWhatsAppMessage(phoneNumber, message);

        return {
            success: result.success,
            message: `Berhasil mengirim notifikasi ke ${recipientType} ${recipientName}`,
            details: {
                recipientType,
                recipientName,
                phoneNumber,
                ...result
            }
        };
    } catch (error) {
        console.error('Error saat mengirim notifikasi:', error);
        return {
            success: false,
            message: error.message || 'Gagal mengirim notifikasi',
            error: error.name || 'UnknownError'
        };
    }
};

// notifikasi izin hasil penilaian disetujui untuk seluruh data izin penilaian
const notifIzinAllAcc = async () => {
    try {
        if (!whatsappClient.info) {
            return { success: false, message: 'WhatsApp client belum siap, tunggu beberapa saat' };
        }
        
        const findIzinPenilaian = await db.Izin_hasil_penilaian.findAll({
            include: [
                {
                    model: db.Opd,
                    as: 'opd'
                }, 
                {
                    model: db.Evaluator,
                    as: 'evaluator'
                }
            ],
            where: {
                status: 'Disetujui'
            }
        });

        if (findIzinPenilaian.length === 0) {
            return { success: false, message: 'Tidak ada data izin hasil penilaian yang disetujui' };
        }

        const createMessage = () => {
            return `*Izin Akses Hasil Penilaian Anda Diterima*\n\nSilahkan lakukan pengecekan pada halaman hasil penilaian untuk mendapatkan hasil penilaian serta mendapatkan rapor hasil penilaian. Abaikan pesan ini jika anda sudah pernah mendapatkannya.\n\nTerimakasih.`;
        };

        const message = createMessage();
        const notificationResults = [];
        
        const sentPhoneNumbers = new Set();
        
        for (const izin of findIzinPenilaian) {
            let phoneNumber = null;
            let recipientType = null;
            let recipientId = null;
            let recipientName = null;
            
            if (izin.opd && izin.opd.no_hp) {
                phoneNumber = izin.opd.no_hp;
                recipientType = 'OPD';
                recipientId = izin.opd.id_opd;
                recipientName = izin.opd.nama_opd || 'Tanpa Nama';
            } 
            else if (izin.evaluator && izin.evaluator.no_hp) {
                phoneNumber = izin.evaluator.no_hp;
                recipientType = 'Evaluator';
                recipientId = izin.evaluator.id_evaluator;
                recipientName = izin.evaluator.nama || 'Tanpa Nama';
            }
            
            if (phoneNumber && !sentPhoneNumbers.has(phoneNumber)) {
                sentPhoneNumbers.add(phoneNumber);
                
                try {
                    const result = await sendWhatsAppMessage(phoneNumber, message);
                    
                    notificationResults.push({
                        izinId: izin.id_izin_hasil_penilaian,
                        recipientType: recipientType,
                        recipientId: recipientId,
                        recipientName: recipientName,
                        phoneNumber: phoneNumber,
                        success: result.success,
                        error: result.error || null
                    });
                    
                    await new Promise(resolve => setTimeout(resolve, 1000));
                } catch (error) {
                    console.error(`Gagal mengirim ke ${recipientType} ${recipientName}:`, error);
                    notificationResults.push({
                        izinId: izin.id_izin_hasil_penilaian,
                        recipientType: recipientType,
                        recipientId: recipientId,
                        recipientName: recipientName,
                        phoneNumber: phoneNumber,
                        success: false,
                        error: error.message || 'Unknown error'
                    });
                }
            }
        }
        
        const successCount = notificationResults.filter(r => r.success).length;
        
        return {
            success: true,
            message: `Berhasil mengirim notifikasi ke ${successCount} penerima`,
            details: notificationResults
        };
    } catch (error) {
        console.error('Error saat mengirim notifikasi:', error);
        return {
            success: false,
            message: error.message || 'Gagal mengirim notifikasi',
            error: error.name || 'UnknownError'
        };
    }
};

module.exports = {
    notifPeriodToAllOpd,
    notifPeriodToAllEvaluator,
    notifPeriodeCloseEvaluator,
    notifPeriodeCloseOpd,
    notifRemind3Evaluator,
    notifRemind3Opd,
    notifRemind1Opd,
    notifRemind1Evaluator,
    notifRemindSubmitF01,
    notifRemindSubmitF02,
    notifDecF01,
    notifAccF01,
    notifAllAccF01,
    notifIzinDecOpd,
    notifIzinAccOpd,
    notifIzinAllAcc
};