'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      await queryInterface.removeConstraint('bukti_dukungs', 'bukti_dukungs_ibfk_1');
    } catch (error) {
      console.log('Constraint bukti_dukungs_ibfk_1 mungkin tidak ada:', error.message);
    }
    await queryInterface.addConstraint('bukti_dukungs', {
      fields: ['id_indikator'],
      type: 'foreign key',
      name: 'fk_bukti_dukung_indikator_cascade_new',
      references: {
        table: 'indikators',
        field: 'id_indikator'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });
  },

  async down(queryInterface, Sequelize) {
    try {
      await queryInterface.removeConstraint('bukti_dukungs', 'fk_bukti_dukung_indikator_cascade_new');
    } catch (error) {
      console.log('Constraint fk_bukti_dukung_indikator_cascade_new mungkin tidak ada:', error.message);
    }

    await queryInterface.addConstraint('bukti_dukungs', {
      fields: ['id_indikator'],
      type: 'foreign key',
      name: 'bukti_dukungs_ibfk_1',
      references: {
        table: 'indikators',
        field: 'id_indikator'
      }
    });
  }
};