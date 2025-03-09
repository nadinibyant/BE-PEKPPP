'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('izin_hasil_penilaians', 'id_pengisian_f02', {
      type: Sequelize.STRING(36),
      allowNull: true,
      references: {
        model: 'Pengisian_f02s',
        key: 'id_pengisian_f02'
      }
    });

    await queryInterface.addColumn('izin_hasil_penilaians', 'id_nilai_kumulatif', {
      type: Sequelize.STRING(36),
      allowNull: true,
      references: {
        model: 'Nilai_akhir_kumulatifs',
        key: 'id_nilai_kumulatif'
      }
    });

    await queryInterface.addIndex('izin_hasil_penilaians', ['id_pengisian_f02']);
    await queryInterface.addIndex('izin_hasil_penilaians', ['id_nilai_kumulatif']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeIndex('izin_hasil_penilaians', ['id_pengisian_f02']);
    await queryInterface.removeIndex('izin_hasil_penilaians', ['id_nilai_kumulatif']);
    

    await queryInterface.removeColumn('izin_hasil_penilaians', 'id_pengisian_f02');
    await queryInterface.removeColumn('izin_hasil_penilaians', 'id_nilai_kumulatif');
  }
};