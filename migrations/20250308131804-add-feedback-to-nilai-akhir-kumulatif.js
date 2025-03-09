'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Nilai_akhir_kumulatifs', 'feedback', {
      type: Sequelize.TEXT,
      allowNull: true, 
      after: 'kategori' 
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Nilai_akhir_kumulatifs', 'feedback');
  }
};