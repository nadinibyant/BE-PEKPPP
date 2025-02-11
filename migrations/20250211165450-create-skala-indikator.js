'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Skala_indikators', {
      id_skala: {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement:true,
        primaryKey: true
      },
      nilai_skala: {
        type: Sequelize.INTEGER(2),
        allowNull: false,
      },
      deskripsi_skala: {
        type: Sequelize.TEXT,
        allowNull:false
      },
      id_indikator: {
        type: Sequelize.INTEGER,
        allowNull:false,
        references: {
          model: 'Indikators',
          key:'id_indikator'
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
    await queryInterface.dropTable('Skala_indikators');
  }
};