'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.removeConstraint(
      'izin_hasil_penilaians',
      'fk_izin_penilaian_periode_cascade'
    );

    await queryInterface.addConstraint('izin_hasil_penilaians', {
      fields: ['id_periode_penilaian'],
      type: 'foreign key',
      name: 'fk_izin_penilaian_periode_cascade',
      references: {
        table: 'periode_penilaians',
        field: 'id_periode_penilaian'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });
    
    return Promise.resolve();
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeConstraint(
      'izin_hasil_penilaians',
      'fk_izin_penilaian_periode_cascade'
    );

    await queryInterface.addConstraint('izin_hasil_penilaians', {
      fields: ['id_periode_penilaian'],
      type: 'foreign key',
      name: 'fk_izin_penilaian_periode_cascade',
      references: {
        table: 'periode_penilaians',
        field: 'id_periode_penilaian'
      },
      onDelete: 'RESTRICT', 
      onUpdate: 'CASCADE'
    });
    
    return Promise.resolve();
  }
};