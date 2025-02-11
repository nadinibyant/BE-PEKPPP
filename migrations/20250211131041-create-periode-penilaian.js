'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Periode_penilaians', {
      id_periode_penilaian: {
        type: Sequelize.CHAR(36),
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        primaryKey:true
      },
      tahun_periode: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      tanggal_mulai: {
        type: Sequelize.DATE,
        allowNull: false
      },
      tanggal_selesai: {
        type: Sequelize.DATE,
        allowNull:false
      },
      status: {
        type: Sequelize.STRING(20),
        allowNull: false
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Periode_penilaians');
  }
};