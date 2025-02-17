'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Izin_hasil_penilaians', {
      id_izin_hasil_penilaian: {
        type: Sequelize.CHAR(36),
        allowNull: false,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4
      },
      id_opd: {
        type: Sequelize.CHAR(36),
        allowNull:true,
        references: {
          model: 'Opds',
          key: 'id_opd'
        }
      },
      id_evaluator: {
        type: Sequelize.CHAR(36),
        allowNull: true,
        references:{
          model: 'Evaluators',
          key: 'id_evaluator'
        }
      },
      id_periode_penilaian: {
        type: Sequelize.CHAR(36),
        allowNull: false,
        references:{
          model: 'Periode_penilaians',
          key: 'id_periode_penilaian'
        }
      },
      tanggal_pengajuan: {
        type: Sequelize.DATE,
        allowNull: false
      },
      status: {
        type: Sequelize.STRING(20),
        allowNull: false
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Izin_hasil_penilaians');
  }
};