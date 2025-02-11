'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Nilai_aspeks', {
      id_nilai_aspek: {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true
      },
      total_nilai_indikator: {
        type: Sequelize.DECIMAL(10,2),
        allowNull: false
      },
      id_aspek_penilaian: {
        type: Sequelize.CHAR(36),
        allowNull: false,
        references: {
          model: 'Aspek_penilaians',
          key: 'id_aspek_penilaian'
        }
      },
      id_pengisian_f02: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Pengisian_f02s',
          key: 'id_pengisian_f02'
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
    await queryInterface.dropTable('Nilai_aspeks');
  }
};