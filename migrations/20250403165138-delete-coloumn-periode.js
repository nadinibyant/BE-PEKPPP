'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Hapus kolom soft delete dari tabel Periode_penilaians
    await queryInterface.removeColumn('Periode_penilaians', 'deleted_by');
    await queryInterface.removeColumn('Periode_penilaians', 'deleted_at');
    await queryInterface.removeColumn('Periode_penilaians', 'is_active');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.addColumn('Periode_penilaians', 'is_active', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    });

    await queryInterface.addColumn('Periode_penilaians', 'deleted_at', {
      type: Sequelize.DATE,
      allowNull: true,
      defaultValue: null,
    });

    await queryInterface.addColumn('Periode_penilaians', 'deleted_by', {
      type: Sequelize.CHAR(36),
      allowNull: true,
      defaultValue: null,
      references: {
        model: 'Users',
        key: 'id_user'
      }
    });
  }
};