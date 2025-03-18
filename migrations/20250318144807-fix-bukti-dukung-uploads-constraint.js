'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      await queryInterface.removeConstraint('bukti_dukung_uploads', 'bukti_dukung_uploads_ibfk_2');
    } catch (error) {
      console.log('Constraint bukti_dukung_uploads_ibfk_2 mungkin tidak ada:', error.message);
    }

    await queryInterface.addConstraint('bukti_dukung_uploads', {
      fields: ['id_pengisian_f01'],
      type: 'foreign key',
      name: 'fk_bukti_dukung_uploads_pengisian_f01_cascade_new', 
      references: {
        table: 'pengisian_f01s',
        field: 'id_pengisian_f01'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });
  },

  async down(queryInterface, Sequelize) {
    try {
      await queryInterface.removeConstraint('bukti_dukung_uploads', 'fk_bukti_dukung_uploads_pengisian_f01_cascade_new');
    } catch (error) {
      console.log('Constraint fk_bukti_dukung_uploads_pengisian_f01_cascade_new mungkin tidak ada:', error.message);
    }

    await queryInterface.addConstraint('bukti_dukung_uploads', {
      fields: ['id_pengisian_f01'],
      type: 'foreign key',
      name: 'bukti_dukung_uploads_ibfk_2',
      references: {
        table: 'pengisian_f01s',
        field: 'id_pengisian_f01'
      }
    });
  }
};