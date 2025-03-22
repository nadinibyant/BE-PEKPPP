'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      await queryInterface.removeConstraint('aspek_penilaians', 'aspek_penilaians_ibfk_1');
    } catch (error) {
      console.log('Constraint aspek_penilaians_ibfk_1 mungkin tidak ada:', error.message);
    }

    await queryInterface.addConstraint('aspek_penilaians', {
      fields: ['parent_id_aspek_penilaian'],
      type: 'foreign key',
      name: 'fk_aspek_penilaian_self_reference_cascade_new',
      references: {
        table: 'aspek_penilaians',
        field: 'id_aspek_penilaian'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });
  },

  async down(queryInterface, Sequelize) {
    try {
      await queryInterface.removeConstraint('aspek_penilaians', 'fk_aspek_penilaian_self_reference_cascade_new');
    } catch (error) {
      console.log('Constraint fk_aspek_penilaian_self_reference_cascade_new mungkin tidak ada:', error.message);
    }

    await queryInterface.addConstraint('aspek_penilaians', {
      fields: ['parent_id_aspek_penilaian'],
      type: 'foreign key',
      name: 'aspek_penilaians_ibfk_1',
      references: {
        table: 'aspek_penilaians',
        field: 'id_aspek_penilaian'
      }
    });
  }
};