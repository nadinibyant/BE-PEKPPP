'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Pertanyaans', {
      id_pertanyaan: {
        type: Sequelize.CHAR(36),
        allowNull: false,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4
      },
      teks_pertanyaan: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      trigger_value: {
        type: Sequelize.STRING(256),
        allowNull: true
      },
      urutan: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      pertanyaan_id_pertanyaan: {
        type: Sequelize.CHAR(36),
        allowNull: true,
        references: {
          model: 'Pertanyaans',
          key: 'id_pertanyaan'
        }
      },
      tipe_pertanyaan_id_tipe_pertanyaan: {
        type: Sequelize.CHAR(36),
        allowNull: false,
        references: {
          model: 'Tipe_pertanyaans',
          key: 'id_tipe_pertanyaan'
        }
      },
      indikator_id_indikator: {
        type: Sequelize.CHAR(36),
        allowNull: false,
        references: {
          model: 'Indikators',
          key: 'id_indikator'
        }
      },
      keterangan_trigger: {
        type: Sequelize.TEXT,
        allowNull: true
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
    await queryInterface.dropTable('Pertanyaans');
  }
};