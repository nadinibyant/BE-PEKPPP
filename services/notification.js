const { sendWhatsAppMessage, whatsappClient } = require('../config/whatsaap');
const db = require('../models');
const { Op, ForeignKeyConstraintError } = require('sequelize');
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

// notifikasi setelah submit f01 untuk evaluator
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
//notifikasi evaluator belum submit f02
// notifikasi verif f01 ditolak
// notifikasi verif f01 disetujui
// notifikasi izin hasil penilaian ditolak untuk opd
// notifikasi izin hasil penilaian disetujui untuk opd
// notifikasi izin hasil penilaian ditolak untuk evaluator
// notifikasi izin hasil penilaian ditolak untuk opd

module.exports = {
    notifPeriodToAllOpd,
    notifPeriodToAllEvaluator,
    notifPeriodeCloseEvaluator,
    notifPeriodeCloseOpd,
    notifRemind3Evaluator,
    notifRemind3Opd,
    notifRemind1Opd,
    notifRemind1Evaluator
};