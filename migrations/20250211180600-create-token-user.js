'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Token_users', {
      id_token: {
        type: Sequelize.CHAR(36),
        allowNull: false,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4
      },
      token: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      id_user: {
        type: Sequelize.CHAR(36),
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id_user'
        }
      },
      expired_at: {
        type: Sequelize.DATE,
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
    await queryInterface.dropTable('Token_users');
  }
};