'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Indikators', {
      id_indikator: {
        type: Sequelize.INTEGER,
        autoIncrement:true,
        primaryKey: true,
        allowNull: false
      },
      nama_indikator: {
        type: Sequelize.TEXT,
        allowNull:false
      },
      bobot_indikator: {
        type: Sequelize.DECIMAL(10,2),
        allowNull: false
      },
      penjelasan: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      urutan: {
        type: Sequelize.INTEGER(3),
        allowNull: false
      },
      kode_indikator: {
        type: Sequelize.STRING(10),
        allowNull: false
      },
      id_aspek_penilaian: {
        type: Sequelize.CHAR(36),
        allowNull: false,
        references: {
          model: 'Aspek_penilaians',
          key: 'id_aspek_penilaian'
        }
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
    await queryInterface.dropTable('Indikators');
  }
};