'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      User.hasOne(models.Admin, {
        foreignKey: 'id_admin',
        sourceKey: 'id_user',
        as: 'admin'
      });
      User.hasOne(models.Opd, {
        foreignKey: 'id_opd',
        sourceKey: 'id_user',
        as: 'opd'
      });
      User.hasOne(models.Evaluator, {
        foreignKey: 'id_evaluator',
        sourceKey: 'id_user',
        as: 'evaluator'
      });
      User.hasMany(models.Token_user, {
        foreignKey: 'id_user',
        as: 'tokens'
      });
    }
  }
  User.init({
    id_user:{
      type: DataTypes.CHAR(36),
      allowNull: false,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
    },
    emai:{
      type: DataTypes.STRING(50),
      allowNull: false
    },
    password: {
      type: DataTypes.STRING(256),
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'User',
  });
  return User;
};