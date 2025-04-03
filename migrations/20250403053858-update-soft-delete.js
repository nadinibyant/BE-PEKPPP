'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Tabel Indikator
    await queryInterface.addColumn('Indikators', 'is_active', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    });

    await queryInterface.addColumn('Indikators', 'deleted_at', {
      type: Sequelize.DATE,
      allowNull: true,
      defaultValue: null,
    });

    await queryInterface.addColumn('Indikators', 'deleted_by', {
      type: Sequelize.CHAR(36),
      allowNull: true,
      defaultValue: null,
      references: {
        model: 'Users',
        key: 'id_user'
      }
    });

    // 2. Tabel Aspek_penilaians
    await queryInterface.addColumn('Aspek_penilaians', 'is_active', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    });

    await queryInterface.addColumn('Aspek_penilaians', 'deleted_at', {
      type: Sequelize.DATE,
      allowNull: true,
      defaultValue: null,
    });

    await queryInterface.addColumn('Aspek_penilaians', 'deleted_by', {
      type: Sequelize.CHAR(36),
      allowNull: true,
      defaultValue: null,
      references: {
        model: 'Users',
        key: 'id_user'
      }
    });

    // 3. Tabel Bukti_dukungs
    await queryInterface.addColumn('Bukti_dukungs', 'is_active', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    });

    await queryInterface.addColumn('Bukti_dukungs', 'deleted_at', {
      type: Sequelize.DATE,
      allowNull: true,
      defaultValue: null,
    });

    await queryInterface.addColumn('Bukti_dukungs', 'deleted_by', {
      type: Sequelize.CHAR(36),
      allowNull: true,
      defaultValue: null,
      references: {
        model: 'Users',
        key: 'id_user'
      }
    });

    // 4. Tabel Pertanyaans
    await queryInterface.addColumn('Pertanyaans', 'is_active', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    });

    await queryInterface.addColumn('Pertanyaans', 'deleted_at', {
      type: Sequelize.DATE,
      allowNull: true,
      defaultValue: null,
    });

    await queryInterface.addColumn('Pertanyaans', 'deleted_by', {
      type: Sequelize.CHAR(36),
      allowNull: true,
      defaultValue: null,
      references: {
        model: 'Users',
        key: 'id_user'
      }
    });

    // 5. tabel skala indikator
    await queryInterface.addColumn('Skala_indikators', 'is_active', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    });

    await queryInterface.addColumn('Skala_indikators', 'deleted_at', {
      type: Sequelize.DATE,
      allowNull: true,
      defaultValue: null,
    });

    await queryInterface.addColumn('Skala_indikators', 'deleted_by', {
      type: Sequelize.CHAR(36),
      allowNull: true,
      defaultValue: null,
      references: {
        model: 'Users',
        key: 'id_user'
      }
    });
  },

  async down(queryInterface, Sequelize) {
    // Hapus kolom dari Pertanyaans
    await queryInterface.removeColumn('Pertanyaans', 'deleted_by');
    await queryInterface.removeColumn('Pertanyaans', 'deleted_at');
    await queryInterface.removeColumn('Pertanyaans', 'is_active');

    // Hapus kolom dari Bukti_dukungs
    await queryInterface.removeColumn('Bukti_dukungs', 'deleted_by');
    await queryInterface.removeColumn('Bukti_dukungs', 'deleted_at');
    await queryInterface.removeColumn('Bukti_dukungs', 'is_active');

    // Hapus kolom dari Aspek_penilaians
    await queryInterface.removeColumn('Aspek_penilaians', 'deleted_by');
    await queryInterface.removeColumn('Aspek_penilaians', 'deleted_at');
    await queryInterface.removeColumn('Aspek_penilaians', 'is_active');

    // Hapus kolom dari Indikators
    await queryInterface.removeColumn('Indikators', 'deleted_by');
    await queryInterface.removeColumn('Indikators', 'deleted_at');
    await queryInterface.removeColumn('Indikators', 'is_active');

    // Hapus kolom soft delete dari tabel Skala_indikators
    await queryInterface.removeColumn('Skala_indikators', 'deleted_by');
    await queryInterface.removeColumn('Skala_indikators', 'deleted_at');
    await queryInterface.removeColumn('Skala_indikators', 'is_active');
  }
};