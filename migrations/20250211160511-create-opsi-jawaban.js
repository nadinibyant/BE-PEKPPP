'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Opsi_jawabans', {
      id_opsi_jawaban: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement:true
      },
      teks_opsi: {
        type: Sequelize.STRING,
        allowNull: false
      },
      memiliki_isian_lainnya: {
        type: Sequelize.BOOLEAN,
        allowNull:true
      },
      urutan: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      id_pertanyaan: {
        type: Sequelize.INTEGER,
        allowNull:false,
        references: {
          model: 'Pertanyaans',
          key: 'id_pertanyaan'
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
    await queryInterface.dropTable('Opsi_jawabans');
  }
};