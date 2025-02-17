'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('nilai_indikators', {
      id_nilai_indikator: {
        type: Sequelize.CHAR(36),
        allowNull: false,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4
      },
      nilai_diperolah: {
        type: Sequelize.DECIMAL(10,2),
        allowNull: false,
      },
      id_skala: {
        type: Sequelize.CHAR(36),
        allowNull: false,
        references: {
          model: 'Skala_indikators',
          key: 'id_skala'
        }
      },
      id_pengisian_f02: {
        type: Sequelize.CHAR(36),
        allowNull: false,
        references: {
          model: 'Pengisian_f02s',
          key: 'id_pengisian_f02'
        }
      },
      id_indikator: {
        type: Sequelize.CHAR(36),
        allowNull: false,
        references: {
          model: 'Indikators',
          key: 'id_indikator'
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
    await queryInterface.dropTable('nilai_indikators');
  }
};