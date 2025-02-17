'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Tipe_opsi_jawabans', {
      id_tipe_opsi: {
        type: Sequelize.CHAR(36),
        allowNull: false,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4
      },
      nama_tipe: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      allow_other: {
        type: Sequelize.BOOLEAN,
        allowNull: false
      },
      has_trigger: {
        type: Sequelize.BOOLEAN,
        allowNull: false
      },
      id_tipe_pertanyaan: {
        type: Sequelize.CHAR(36),
        allowNull:false,
        references: {
          model: 'Tipe_pertanyaans',
          key: 'id_tipe_pertanyaan'
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
    await queryInterface.dropTable('Tipe_opsi_jawabans');
  }
};