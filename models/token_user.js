'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Token_user extends Model {
    static associate(models) {
      Token_user.belongsTo(models.User, {
        foreignKey: 'id_user',
        as: 'user'
      });
    }
  }
  Token_user.init({
    id_token: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    token: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    id_user: {
      type: DataTypes.CHAR(36),
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id_user'
      }
    },
    expired_at: {
      type: DataTypes.DATE,
      allowNull: false,
    }
  }, {
    sequelize,
    modelName: 'Token_user',
  });
  return Token_user;
};