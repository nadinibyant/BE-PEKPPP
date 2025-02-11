'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Nilai_akhir_kumulatifs', {
      id_nilai_kumulatif: {
        type: Sequelize.INTEGER,
        allowNull:false,
        primaryKey: true,
        autoIncrement:true
      },
      total_kumulatif: {
        type: Sequelize.DECIMAL(10,2),
        allowNull: false
      },
      kategori: {
        type: Sequelize.STRING(3),
        allowNull:false
      },
      id_opd: {
        type: Sequelize.CHAR(36),
        allowNull:false,
        references: {
          model: 'Opds',
          key: 'id_opd'
        }
      },
      id_periode_penilaian: {
        type: Sequelize.CHAR(36),
        allowNull: false,
        references: {
          model: 'Periode_penilaians',
          key: 'id_periode_penilaian'
        }
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
    await queryInterface.dropTable('Nilai_akhir_kumulatifs');
  }
};