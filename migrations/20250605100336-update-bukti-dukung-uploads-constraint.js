'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      await queryInterface.removeConstraint('bukti_dukung_uploads', 'bukti_dukung_uploads_ibfk_3');
    } catch (error) {
      console.log('Constraint bukti_dukung_uploads_ibfk_3 might not exist:', error.message);
    }
    
    await queryInterface.addConstraint('bukti_dukung_uploads', {
      fields: ['id_indikator'],
      type: 'foreign key',
      name: 'fk_bukti_dukung_uploads_indikator_cascade',
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
      await queryInterface.removeConstraint('bukti_dukung_uploads', 'fk_bukti_dukung_uploads_indikator_cascade');
    } catch (error) {
      console.log('Constraint fk_bukti_dukung_uploads_indikator_cascade might not exist:', error.message);
    }

    await queryInterface.addConstraint('bukti_dukung_uploads', {
      fields: ['id_indikator'],
      type: 'foreign key',
      name: 'bukti_dukung_uploads_ibfk_3',
      references: {
        table: 'indikators',
        field: 'id_indikator'
      }
    });
  }
};