'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Bukti_dukung_uploads', {
      id_bukti_upload: {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true
      },
      nama_file: {
        type: Sequelize.STRING,
        allowNull: false
      },
      id_bukti_dukung: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Bukti_dukungs',
          key: 'id_bukti_dukung'
        }
      },
      id_pengisian_f01: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Pengisian_f01s',
          key: 'id_pengisian_f01'
        }
      },
      id_indikator: {
        type: Sequelize.INTEGER,
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
    await queryInterface.dropTable('Bukti_dukung_uploads');
  }
};