'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Jawabans', {
      id_jawaban: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      jawaban_text: {
        type: Sequelize.TEXT,
        allowNull:true
      },
      id_pertanyaan: {
        type: Sequelize.INTEGER,
        allowNull:false,
        references: {
          model: 'Pertanyaans',
          key: 'id_pertanyaan'
        }
      },
      id_opsi_jawaban: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'Opsi_jawabans',
          key: 'id_opsi_jawaban'
        }
      },
      id_pengisian_f01: {
        type: Sequelize.INTEGER,
        allowNull:false,
        references: {
          model: 'Pengisian_f01s',
          key: 'id_pengisian_f01'
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
    await queryInterface.dropTable('Jawabans');
  }
};