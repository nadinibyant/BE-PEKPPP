'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Message extends Model {
    static associate(models) {
      Message.belongsTo(models.Chat_room, {
        foreignKey: 'id_room',
        as: 'chat_room'
      });
      
      Message.belongsTo(models.Admin, {
        foreignKey: 'id_admin',
        as: 'admin'
      });
      
      Message.belongsTo(models.Opd, {
        foreignKey: 'id_opd',
        as: 'opd'
      });
    }
  }
  
  Message.init({
    id_message: {
      type: DataTypes.CHAR(36),
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
    },
    id_room: {
      type: DataTypes.CHAR(36),
      allowNull: false,
      references: {
        model: 'Chat_rooms',
        key: 'id_room'
      }
    },
    content: {
      type: DataTypes.STRING,
      allowNull: false
    },
    is_read: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    user_type: {
      type: DataTypes.ENUM('admin', 'opd'),
      allowNull: false,
      comment: 'Menandakan pesan dikirim/diterima oleh admin atau opd'
    },
    id_admin: {
      type: DataTypes.CHAR(36),
      allowNull: false,
      references: {
        model: 'Admins',
        key: 'id_admin'
      }
    },
    id_opd: {
      type: DataTypes.CHAR(36),
      allowNull: false,
      references: {
        model: 'Opds',
        key: 'id_opd'
      }
    }
  }, {
    sequelize,
    modelName: 'Message',
    tableName: 'Messages'
  });

  return Message;
};