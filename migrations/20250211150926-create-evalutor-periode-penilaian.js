'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Evaluator_periode_penilaians', {
      id_evaluator_periode_penilaian: {
        type: Sequelize.CHAR(36),
        allowNull: false,
        primaryKey:true,
        defaultValue: Sequelize.UUIDV4
      },
      id_evaluator: {
        type: Sequelize.CHAR(36),
        allowNull: false,
        references: {
          model: 'Evaluators',
          key: 'id_evaluator'
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
    await queryInterface.dropTable('Evalutor_periode_penilaians');
  }
};