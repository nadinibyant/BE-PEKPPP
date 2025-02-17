'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Pengisian_f01s', {
      id_pengisian_f01: {
        type: Sequelize.CHAR(36),
        allowNull: false,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4
      },
      status_pengisian: {
        type: Sequelize.STRING(20),
        allowNull: false
      },
      id_opd: {
        type: Sequelize.CHAR(36),
        allowNull: false,
        references:{
          model: 'Opds',
          key: 'id_opd'
        }
      },
      id_periode_penilaian: {
        type: Sequelize.CHAR(36),
        allowNull:false,
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
    await queryInterface.dropTable('Pengisian_f01s');
  }
};