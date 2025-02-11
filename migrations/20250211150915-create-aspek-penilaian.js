'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Aspek_penilaians', {
      id_aspek_penilaian: {
        type: Sequelize.CHAR(36),
        allowNull: false,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4
      },
      nama_aspek: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      bobot_aspek: {
        type: Sequelize.INTEGER(3),
        allowNull:true
      },
      parent_id_aspek_penilaian: {
        type: Sequelize.CHAR(36),
        allowNull: true,
        references: {
          model: 'Aspek_penilaians',
          key: 'id_aspek_penilaian'
        }
      },
      urutan: {
        type: Sequelize.INTEGER,
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
    await queryInterface.dropTable('Aspek_penilaians');
  }
};