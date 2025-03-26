'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      await queryInterface.removeConstraint('evaluator_periode_penilaians', 'evaluator_periode_penilaians_ibfk_2');
    } catch (error) {
      console.log('Constraint evaluator_periode_penilaians_ibfk_2 mungkin tidak ada:', error.message);
    }

    await queryInterface.addConstraint('evaluator_periode_penilaians', {
      fields: ['id_periode_penilaian'],
      type: 'foreign key',
      name: 'fk_evaluator_periode_penilaian_cascade_new',
      references: {
        table: 'periode_penilaians',
        field: 'id_periode_penilaian'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });
  },

  async down(queryInterface, Sequelize) {
    try {
      await queryInterface.removeConstraint('evaluator_periode_penilaians', 'fk_evaluator_periode_penilaian_cascade_new');
    } catch (error) {
      console.log('Constraint fk_evaluator_periode_penilaian_cascade_new mungkin tidak ada:', error.message);
    }

    await queryInterface.addConstraint('evaluator_periode_penilaians', {
      fields: ['id_periode_penilaian'],
      type: 'foreign key',
      name: 'evaluator_periode_penilaians_ibfk_2',
      references: {
        table: 'periode_penilaians',
        field: 'id_periode_penilaian'
      }
    });
  }
};