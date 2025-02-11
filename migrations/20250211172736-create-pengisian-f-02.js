'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Pengisian_f02s', {
      id_pengisian_f02: {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true
      },
      id_opd: {
        type: Sequelize.CHAR(36),
        allowNull: false,
        references: {
          model: 'Opds',
          key: 'id_opd'
        }
      },
      id_evaluator_periode_penilaian: {
        type: Sequelize.CHAR(36),
        allowNull: false,
        references: {
          model: 'Evaluator_periode_penilaians',
          key:'id_evaluator_periode_penilaian'
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
    await queryInterface.dropTable('Pengisian_f02s');
  }
};