'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Admin extends Model {
    static associate(models) {
      Admin.belongsTo(models.User, {
        foreignKey: 'id_admin',
        targetKey: 'id_user',
        as: 'user'
      });

      Admin.hasMany(models.Message, {
        foreignKey: 'id_admin',
        as: 'messages'
      });
    }
  }
  Admin.init({
    id_admin:{
      type: DataTypes.CHAR(36),
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'Users',
        key: 'id_user'
      }
    },
    nama: {
      type: DataTypes.STRING(50),
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'Admin',
  });
  return Admin;
};