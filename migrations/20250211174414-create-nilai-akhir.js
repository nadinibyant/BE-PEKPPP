'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Nilai_akhirs', {
      id_nilai_akhir: {
        type: Sequelize.CHAR(36),
        allowNull: false,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4
      },
      total_nilai: {
        type: Sequelize.DECIMAL(10,2),
        allowNull: false
      },
      id_pengisian_f02: {
        type: Sequelize.CHAR(36),
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
    await queryInterface.dropTable('Nilai_akhirs');
  }
};