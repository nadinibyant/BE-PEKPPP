'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Users relations
    await queryInterface.addConstraint('Admins', {
      fields: ['id_admin'],
      type: 'foreign key',
      name: 'fk_admin_user_cascade',
      references: {
        table: 'Users',
        field: 'id_user'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });

    await queryInterface.addConstraint('Opds', {
      fields: ['id_opd'],
      type: 'foreign key',
      name: 'fk_opd_user_cascade',
      references: {
        table: 'Users',
        field: 'id_user'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });

    await queryInterface.addConstraint('Evaluators', {
      fields: ['id_evaluator'],
      type: 'foreign key',
      name: 'fk_evaluator_user_cascade',
      references: {
        table: 'Users',
        field: 'id_user'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });

    await queryInterface.addConstraint('Token_users', {
      fields: ['id_user'],
      type: 'foreign key',
      name: 'fk_token_user_cascade',
      references: {
        table: 'Users',
        field: 'id_user'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });

    // Messages table modifications
    // Update column definitions to match model requirements
    await queryInterface.changeColumn('Messages', 'id_admin', {
      type: Sequelize.CHAR(36),
      allowNull: false
    });

    await queryInterface.changeColumn('Messages', 'id_opd', {
      type: Sequelize.CHAR(36),
      allowNull: false
    });

    await queryInterface.changeColumn('Messages', 'user_type', {
      type: Sequelize.ENUM('admin', 'opd'),
      allowNull: false
    });

    // Admin relations
    await queryInterface.addConstraint('Messages', {
      fields: ['id_admin'],
      type: 'foreign key',
      name: 'fk_messages_admin_cascade',
      references: {
        table: 'Admins',
        field: 'id_admin'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });

    // Opds relations
    await queryInterface.addConstraint('Messages', {
      fields: ['id_opd'],
      type: 'foreign key',
      name: 'fk_messages_opd_cascade',
      references: {
        table: 'Opds',
        field: 'id_opd'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });

    await queryInterface.addConstraint('Pengisian_f01s', {
      fields: ['id_opd'],
      type: 'foreign key',
      name: 'fk_pengisian_f01_opd_cascade',
      references: {
        table: 'Opds',
        field: 'id_opd'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });

    await queryInterface.addConstraint('Pengisian_f02s', {
      fields: ['id_opd'],
      type: 'foreign key',
      name: 'fk_pengisian_f02_opd_cascade',
      references: {
        table: 'Opds',
        field: 'id_opd'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });

    await queryInterface.addConstraint('Nilai_akhir_kumulatifs', {
      fields: ['id_opd'],
      type: 'foreign key',
      name: 'fk_nilai_kumulatif_opd_cascade',
      references: {
        table: 'Opds',
        field: 'id_opd'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });

    await queryInterface.addConstraint('Izin_hasil_penilaians', {
      fields: ['id_opd'],
      type: 'foreign key',
      name: 'fk_izin_penilaian_opd_cascade',
      references: {
        table: 'Opds',
        field: 'id_opd'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });

    // Chat_room relations
    await queryInterface.addConstraint('Messages', {
      fields: ['id_room'],
      type: 'foreign key',
      name: 'fk_messages_chatroom_cascade',
      references: {
        table: 'Chat_rooms',
        field: 'id_room'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });

    // Evaluator relations
    await queryInterface.addConstraint('Evaluator_periode_penilaians', {
      fields: ['id_evaluator'],
      type: 'foreign key',
      name: 'fk_evaluator_periode_cascade',
      references: {
        table: 'Evaluators',
        field: 'id_evaluator'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });

    await queryInterface.addConstraint('Izin_hasil_penilaians', {
      fields: ['id_evaluator'],
      type: 'foreign key',
      name: 'fk_izin_penilaian_evaluator_cascade',
      references: {
        table: 'Evaluators',
        field: 'id_evaluator'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });

    // Token_user relations
    // Note: The only relationship is belongsTo and already handled in table creation:
    // - belongsTo User (id_user)

    // Izin_hasil_penilaian relations
    // Note: All relationships are belongsTo and already handled in table creation:
    // - belongsTo Opd (id_opd)
    // - belongsTo Evaluator (id_evaluator)
    // - belongsTo Periode_penilaian (id_periode_penilaian)

    // Nilai_akhir_kumulatif relations
    // Note: All relationships are belongsTo and already handled in table creation:
    // - belongsTo Opd (id_opd)
    // - belongsTo Periode_penilaian (id_periode_penilaian)

    // Nilai_akhir relations
    // Note: The only relationship is belongsTo and already handled in table creation:
    // - belongsTo Pengisian_f02 (id_pengisian_f02)
    
    // Nilai_aspek relations
    // Note: All relationships are belongsTo and already handled in table creation:
    // - belongsTo Pengisian_f02 (id_pengisian_f02)
    // - belongsTo Aspek_penilaian (id_aspek_penilaian)

    // nilai_indikator relations
    // Note: All relationships are belongsTo and already handled in table creation:
    // - belongsTo Pengisian_f02 (id_pengisian_f02)
    // - belongsTo Skala_indikator (id_skala)
    // - belongsTo Indikator (id_indikator)

    // Pengisian_f02 relations
    await queryInterface.addConstraint('nilai_indikators', {
      fields: ['id_pengisian_f02'],
      type: 'foreign key',
      name: 'fk_nilai_indikator_pengisian_f02_cascade',
      references: {
        table: 'Pengisian_f02s',
        field: 'id_pengisian_f02'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });

    await queryInterface.addConstraint('Nilai_aspeks', {
      fields: ['id_pengisian_f02'],
      type: 'foreign key',
      name: 'fk_nilai_aspek_pengisian_f02_cascade',
      references: {
        table: 'Pengisian_f02s',
        field: 'id_pengisian_f02'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });

    await queryInterface.addConstraint('Nilai_akhirs', {
      fields: ['id_pengisian_f02'],
      type: 'foreign key',
      name: 'fk_nilai_akhir_pengisian_f02_cascade',
      references: {
        table: 'Pengisian_f02s',
        field: 'id_pengisian_f02'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });

    // Bukti_dukung_upload relations
    // Note: All relationships are belongsTo and already handled in table creation:
    // - belongsTo Indikator (id_indikator)
    // - belongsTo Bukti_dukung (id_bukti_dukung)
    // - belongsTo Pengisian_f01 (id_pengisian_f01)

    // Jawaban relations
    // Note: All relationships are belongsTo and already handled in table creation:
    // - belongsTo Pengisian_f01 (id_pengisian_f01)
    // - belongsTo Pertanyaan (id_pertanyaan)
    // - belongsTo Opsi_jawaban (id_opsi_jawaban)

    // Pengisian_f01 relations
    await queryInterface.addConstraint('Jawabans', {
      fields: ['id_pengisian_f01'],
      type: 'foreign key',
      name: 'fk_jawaban_pengisian_f01_cascade',
      references: {
        table: 'Pengisian_f01s',
        field: 'id_pengisian_f01'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });

    await queryInterface.addConstraint('Bukti_dukung_uploads', {
      fields: ['id_pengisian_f01'],
      type: 'foreign key',
      name: 'fk_bukti_dukung_upload_pengisian_f01_cascade',
      references: {
        table: 'Pengisian_f01s',
        field: 'id_pengisian_f01'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });

    // Skala_indikator relations
    await queryInterface.addConstraint('nilai_indikators', {
      fields: ['id_skala'],
      type: 'foreign key',
      name: 'fk_nilai_indikator_skala_cascade',
      references: {
        table: 'Skala_indikators',
        field: 'id_skala'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });

    // Bukti_dukung relations
    await queryInterface.addConstraint('Bukti_dukung_uploads', {
      fields: ['id_bukti_dukung'],
      type: 'foreign key',
      name: 'fk_bukti_dukung_upload_bukti_dukung_cascade',
      references: {
        table: 'Bukti_dukungs',
        field: 'id_bukti_dukung'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });

    // Opsi_jawaban relations
    await queryInterface.addConstraint('Jawabans', {
      fields: ['id_opsi_jawaban'],
      type: 'foreign key',
      name: 'fk_jawaban_opsi_jawaban_cascade',
      references: {
        table: 'Opsi_jawabans',
        field: 'id_opsi_jawaban'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });

    // Pertanyaan relations
    await queryInterface.addConstraint('Pertanyaans', {
      fields: ['pertanyaan_id_pertanyaan'],
      type: 'foreign key',
      name: 'fk_pertanyaan_self_reference_cascade',
      references: {
        table: 'Pertanyaans',
        field: 'id_pertanyaan'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });

    await queryInterface.addConstraint('Opsi_jawabans', {
      fields: ['id_pertanyaan'],
      type: 'foreign key',
      name: 'fk_opsi_jawaban_pertanyaan_cascade',
      references: {
        table: 'Pertanyaans',
        field: 'id_pertanyaan'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });

    await queryInterface.addConstraint('Jawabans', {
      fields: ['id_pertanyaan'],
      type: 'foreign key',
      name: 'fk_jawaban_pertanyaan_cascade',
      references: {
        table: 'Pertanyaans',
        field: 'id_pertanyaan'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });

    // Tipe_opsi_jawaban relations
    // Note: The relationship with Tipe_pertanyaan is already handled in the table creation
    // through the references definition in the id_tipe_pertanyaan column

    // Evaluator_periode_penilaian relations
    await queryInterface.addConstraint('Pengisian_f02s', {
      fields: ['id_evaluator_periode_penilaian'],
      type: 'foreign key',
      name: 'fk_pengisian_f02_evaluator_periode_cascade',
      references: {
        table: 'Evaluator_periode_penilaians',
        field: 'id_evaluator_periode_penilaian'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });

    // Tipe_pertanyaan relations
    await queryInterface.addConstraint('Tipe_opsi_jawabans', {
      fields: ['id_tipe_pertanyaan'],
      type: 'foreign key',
      name: 'fk_tipe_opsi_jawaban_tipe_pertanyaan_cascade',
      references: {
        table: 'Tipe_pertanyaans',
        field: 'id_tipe_pertanyaan'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });

    await queryInterface.addConstraint('Pertanyaans', {
      fields: ['tipe_pertanyaan_id_tipe_pertanyaan'],
      type: 'foreign key',
      name: 'fk_pertanyaan_tipe_pertanyaan_cascade',
      references: {
        table: 'Tipe_pertanyaans',
        field: 'id_tipe_pertanyaan'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });

    // Indikator relations
    await queryInterface.addConstraint('Pertanyaans', {
      fields: ['indikator_id_indikator'],
      type: 'foreign key',
      name: 'fk_pertanyaan_indikator_cascade',
      references: {
        table: 'Indikators',
        field: 'id_indikator'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });

    await queryInterface.addConstraint('Bukti_dukungs', {
      fields: ['id_indikator'],
      type: 'foreign key',
      name: 'fk_bukti_dukung_indikator_cascade',
      references: {
        table: 'Indikators',
        field: 'id_indikator'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });

    await queryInterface.addConstraint('Skala_indikators', {
      fields: ['id_indikator'],
      type: 'foreign key',
      name: 'fk_skala_indikator_cascade',
      references: {
        table: 'Indikators',
        field: 'id_indikator'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });

    await queryInterface.addConstraint('Bukti_dukung_uploads', {
      fields: ['id_indikator'],
      type: 'foreign key',
      name: 'fk_bukti_dukung_upload_indikator_cascade',
      references: {
        table: 'Indikators',
        field: 'id_indikator'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });

    await queryInterface.addConstraint('nilai_indikators', {
      fields: ['id_indikator'],
      type: 'foreign key',
      name: 'fk_nilai_indikator_cascade',
      references: {
        table: 'Indikators',
        field: 'id_indikator'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });

    // Aspek_penilaian relations
    await queryInterface.addConstraint('Aspek_penilaians', {
      fields: ['parent_id_aspek_penilaian'],
      type: 'foreign key',
      name: 'fk_aspek_self_reference_cascade',
      references: {
        table: 'Aspek_penilaians',
        field: 'id_aspek_penilaian'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });

    await queryInterface.addConstraint('Indikators', {
      fields: ['id_aspek_penilaian'],
      type: 'foreign key',
      name: 'fk_indikator_aspek_cascade',
      references: {
        table: 'Aspek_penilaians',
        field: 'id_aspek_penilaian'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });

    await queryInterface.addConstraint('Nilai_aspeks', {
      fields: ['id_aspek_penilaian'],
      type: 'foreign key',
      name: 'fk_nilai_aspek_aspek_cascade',
      references: {
        table: 'Aspek_penilaians',
        field: 'id_aspek_penilaian'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });

    // Periode_penilaian relations
    await queryInterface.addConstraint('Pengisian_f01s', {
      fields: ['id_periode_penilaian'],
      type: 'foreign key',
      name: 'fk_pengisian_f01_periode_cascade',
      references: {
        table: 'Periode_penilaians',
        field: 'id_periode_penilaian'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });

    await queryInterface.addConstraint('Nilai_akhir_kumulatifs', {
      fields: ['id_periode_penilaian'],
      type: 'foreign key',
      name: 'fk_nilai_kumulatif_periode_cascade',
      references: {
        table: 'Periode_penilaians',
        field: 'id_periode_penilaian'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });

    await queryInterface.addConstraint('Izin_hasil_penilaians', {
      fields: ['id_periode_penilaian'],
      type: 'foreign key',
      name: 'fk_izin_penilaian_periode_cascade',
      references: {
        table: 'Periode_penilaians',
        field: 'id_periode_penilaian'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });

    await queryInterface.addConstraint('Evaluator_periode_penilaians', {
      fields: ['id_periode_penilaian'],
      type: 'foreign key',
      name: 'fk_evaluator_periode_penilaian_cascade',
      references: {
        table: 'Periode_penilaians',
        field: 'id_periode_penilaian'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });
  },

  async down(queryInterface, Sequelize) {
    // Revert Messages table modifications
    await queryInterface.changeColumn('Messages', 'id_admin', {
      type: Sequelize.CHAR(36),
      allowNull: true
    });

    await queryInterface.changeColumn('Messages', 'id_opd', {
      type: Sequelize.CHAR(36),
      allowNull: true
    });

    await queryInterface.changeColumn('Messages', 'user_type', {
      type: Sequelize.ENUM('pengirim', 'penerima'),
      allowNull: false
    });

    // Remove Users relations constraints
    await queryInterface.removeConstraint('Admins', 'fk_admin_user_cascade');
    await queryInterface.removeConstraint('Opds', 'fk_opd_user_cascade');
    await queryInterface.removeConstraint('Evaluators', 'fk_evaluator_user_cascade');
    await queryInterface.removeConstraint('Token_users', 'fk_token_user_cascade');

    // Remove Admin relations constraints
    await queryInterface.removeConstraint('Messages', 'fk_messages_admin_cascade');

    // Remove Opds relations constraints
    await queryInterface.removeConstraint('Messages', 'fk_messages_opd_cascade');
    await queryInterface.removeConstraint('Pengisian_f01s', 'fk_pengisian_f01_opd_cascade');
    await queryInterface.removeConstraint('Pengisian_f02s', 'fk_pengisian_f02_opd_cascade');
    await queryInterface.removeConstraint('Nilai_akhir_kumulatifs', 'fk_nilai_kumulatif_opd_cascade');
    await queryInterface.removeConstraint('Izin_hasil_penilaians', 'fk_izin_penilaian_opd_cascade');

    // Remove Chat_room relations constraints
    await queryInterface.removeConstraint('Messages', 'fk_messages_chatroom_cascade');

    // Remove Evaluator relations constraints
    await queryInterface.removeConstraint('Evaluator_periode_penilaians', 'fk_evaluator_periode_cascade');
    await queryInterface.removeConstraint('Izin_hasil_penilaians', 'fk_izin_penilaian_evaluator_cascade');

    // Remove Evaluator_periode_penilaian relations constraints
    await queryInterface.removeConstraint('Pengisian_f02s', 'fk_pengisian_f02_evaluator_periode_cascade');

    // Remove Tipe_pertanyaan relations constraints
    await queryInterface.removeConstraint('Tipe_opsi_jawabans', 'fk_tipe_opsi_jawaban_tipe_pertanyaan_cascade');
    await queryInterface.removeConstraint('Pertanyaans', 'fk_pertanyaan_tipe_pertanyaan_cascade');

    // Remove Indikator relations constraints
    await queryInterface.removeConstraint('Pertanyaans', 'fk_pertanyaan_indikator_cascade');
    await queryInterface.removeConstraint('Bukti_dukungs', 'fk_bukti_dukung_indikator_cascade');
    await queryInterface.removeConstraint('Skala_indikators', 'fk_skala_indikator_cascade');
    await queryInterface.removeConstraint('Bukti_dukung_uploads', 'fk_bukti_dukung_upload_indikator_cascade');
    await queryInterface.removeConstraint('nilai_indikators', 'fk_nilai_indikator_cascade');

    // Remove Aspek_penilaian relations constraints
    await queryInterface.removeConstraint('Aspek_penilaians', 'fk_aspek_self_reference_cascade');
    await queryInterface.removeConstraint('Indikators', 'fk_indikator_aspek_cascade');
    await queryInterface.removeConstraint('Nilai_aspeks', 'fk_nilai_aspek_aspek_cascade');

    // Remove Periode_penilaian relations constraints
    await queryInterface.removeConstraint('Pengisian_f01s', 'fk_pengisian_f01_periode_cascade');
    await queryInterface.removeConstraint('Nilai_akhir_kumulatifs', 'fk_nilai_kumulatif_periode_cascade');
    await queryInterface.removeConstraint('Izin_hasil_penilaians', 'fk_izin_penilaian_periode_cascade');
    await queryInterface.removeConstraint('Evaluator_periode_penilaians', 'fk_evaluator_periode_penilaian_cascade');
  }
};