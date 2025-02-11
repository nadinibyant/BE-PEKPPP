'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Chat_room extends Model {
    static associate(models) {
      Chat_room.hasMany(models.Message, {
        foreignKey: 'id_room',
        as: 'messages'
      });
    }
  }
  Chat_room.init({
    id_room: {
      type: DataTypes.CHAR(36),
      allowNull: false,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'Chat_room',
  });
  return Chat_room;
};