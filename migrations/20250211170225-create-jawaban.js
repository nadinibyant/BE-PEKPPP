'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Jawabans', {
      id_jawaban: {
        type: Sequelize.CHAR(36),
        allowNull: false,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4
      },
      jawaban_text: {
        type: Sequelize.TEXT,
        allowNull:true
      },
      id_pertanyaan: {
        type: Sequelize.CHAR(36),
        allowNull:false,
        references: {
          model: 'Pertanyaans',
          key: 'id_pertanyaan'
        }
      },
      id_opsi_jawaban: {
        type: Sequelize.CHAR(36),
        allowNull: true,
        references: {
          model: 'Opsi_jawabans',
          key: 'id_opsi_jawaban'
        }
      },
      id_pengisian_f01: {
        type: Sequelize.CHAR(36),
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