'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Messages', {
      id_message: {
        type: Sequelize.CHAR(36),
        allowNull: false,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4
      },
      id_room: {
        type: Sequelize.CHAR(36),
        allowNull: false,
        references: {
          model: 'Chat_rooms',
          key: 'id_room'
        }
      },
      content: {
        type: Sequelize.STRING,
        allowNull: false
      },
      is_read: {
        type: Sequelize.BOOLEAN,
        allowNull: false
      },
      user_type: {
        type: Sequelize.ENUM('pengirim', 'penerima'),
        allowNull: false
      },
      id_admin: {
        type: Sequelize.CHAR(36),
        allowNull:true,
        references:{
          model: 'Admins',
          key: 'id_admin'
        }
      },
      id_opd: {
        type: Sequelize.CHAR(36),
        allowNull:true,
        references: {
          model: 'Opds',
          key: 'id_opd'
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
    await queryInterface.dropTable('Messages');
  }
};