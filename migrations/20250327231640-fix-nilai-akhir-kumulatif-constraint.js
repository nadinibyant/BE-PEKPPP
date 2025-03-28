'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.removeConstraint(
      'izin_hasil_penilaians',
      'izin_hasil_penilaians_id_nilai_kumulatif_foreign_idx'
    );

    await queryInterface.addConstraint('izin_hasil_penilaians', {
      fields: ['id_nilai_kumulatif'],
      type: 'foreign key',
      name: 'fk_izin_penilaian_nilai_kumulatif_cascade',
      references: {
        table: 'nilai_akhir_kumulatifs',
        field: 'id_nilai_kumulatif'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });
    
    return Promise.resolve();
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeConstraint(
      'izin_hasil_penilaians',
      'izin_hasil_penilaians_id_nilai_kumulatif_foreign_idx'
    );

    await queryInterface.addConstraint('izin_hasil_penilaians', {
      fields: ['id_nilai_kumulatif'],
      type: 'foreign key',
      name: 'izin_hasil_penilaians_id_nilai_kumulatif_foreign_idx',
      references: {
        table: 'nilai_akhir_kumulatifs',
        field: 'id_nilai_kumulatif'
      },
      onDelete: 'RESTRICT', 
      onUpdate: 'CASCADE'
    });
    
    return Promise.resolve();
  }
};