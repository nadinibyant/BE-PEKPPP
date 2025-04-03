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
      User.hasMany(models.Indikator, {
        foreignKey: 'deleted_by',
        as: 'DeletedIndikators'
      });
      
      User.hasMany(models.Aspek_penilaian, {
        foreignKey: 'deleted_by',
        as: 'DeletedAspeks'
      });
      
      User.hasMany(models.Bukti_dukung, {
        foreignKey: 'deleted_by',
        as: 'DeletedBuktiDukungs'
      });
      
      User.hasMany(models.Pertanyaan, {
        foreignKey: 'deleted_by',
        as: 'DeletedPertanyaans'
      });
      
      User.hasMany(models.Skala_indikator, {
        foreignKey: 'deleted_by',
        as: 'DeletedSkalaIndikators'
      });

      User.hasMany(models.Opd, {
        foreignKey: 'deleted_by',
        as: 'DeletedOpds'
      });

      User.hasMany(models.Evaluator, {
        foreignKey: 'deleted_by',
        as: 'DeletedEvaluators'
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
    email:{
      type: DataTypes.STRING(50),
      allowNull: false
    },
    password: {
      type: DataTypes.STRING(256),
      allowNull: false
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
  }, {
    sequelize,
    modelName: 'User',
  });
  return User;
};