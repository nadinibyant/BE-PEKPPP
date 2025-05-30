'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Bukti_dukungs', {
      id_bukti_dukung: {
        type: Sequelize.CHAR(36),
        allowNull: false,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4
      },
      nama_bukti_dukung: {
        type: Sequelize.TEXT,
        allowNull:false
      },
      urutan: {
        type: Sequelize.INTEGER(3),
        allowNull:false
      },
      id_indikator: {
        type: Sequelize.CHAR(36),
        allowNull: false,
        references: {
          model: 'Indikators',
          key: 'id_indikator'
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
    await queryInterface.dropTable('Bukti_dukungs');
  }
};