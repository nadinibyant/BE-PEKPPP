'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  // tabel opd
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('Opds', 'is_active', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    });

    await queryInterface.addColumn('Opds', 'deleted_at', {
      type: Sequelize.DATE,
      allowNull: true,
      defaultValue: null,
    });

    await queryInterface.addColumn('Opds', 'deleted_by', {
      type: Sequelize.CHAR(36),
      allowNull: true,
      defaultValue: null,
      references: {
        model: 'Users',
        key: 'id_user'
      }
    });

    // tabel evaluator
    await queryInterface.addColumn('Evaluators', 'is_active', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    });

    await queryInterface.addColumn('Evaluators', 'deleted_at', {
      type: Sequelize.DATE,
      allowNull: true,
      defaultValue: null,
    });

    await queryInterface.addColumn('Evaluators', 'deleted_by', {
      type: Sequelize.CHAR(36),
      allowNull: true,
      defaultValue: null,
      references: {
        model: 'Users',
        key: 'id_user'
      }
    });

    // tabel periode penilaian
    await queryInterface.addColumn('Periode_penilaians', 'is_active', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    });

    await queryInterface.addColumn('Periode_penilaians', 'deleted_at', {
      type: Sequelize.DATE,
      allowNull: true,
      defaultValue: null,
    });

    await queryInterface.addColumn('Periode_penilaians', 'deleted_by', {
      type: Sequelize.CHAR(36),
      allowNull: true,
      defaultValue: null,
      references: {
        model: 'Users',
        key: 'id_user'
      }
    });
  },

  async down (queryInterface, Sequelize) {
   // Hapus kolom dari opd
   await queryInterface.removeColumn('Opds', 'deleted_by');
   await queryInterface.removeColumn('Opds', 'deleted_at');
   await queryInterface.removeColumn('Opds', 'is_active');

    // Hapus kolom dari evaluator
    await queryInterface.removeColumn('Evaluators', 'deleted_by');
    await queryInterface.removeColumn('Evaluators', 'deleted_at');
    await queryInterface.removeColumn('Evaluators', 'is_active');

    // Hapus kolom dari periode penilaian
    await queryInterface.removeColumn('Periode_penilaians', 'deleted_by');
    await queryInterface.removeColumn('Periode_penilaians', 'deleted_at');
    await queryInterface.removeColumn('Periode_penilaians', 'is_active');
  }
};
