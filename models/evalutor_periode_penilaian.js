'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Evaluator_periode_penilaian extends Model {
    static associate(models) {
      Evaluator_periode_penilaian.belongsTo(models.Evaluator, {
        foreignKey: 'id_evaluator',
        as: 'evaluator'
      });

      Evaluator_periode_penilaian.belongsTo(models.Periode_penilaian, {
        foreignKey: 'id_periode_penilaian',
        as: 'periode_penilaian'
      });

      Evaluator_periode_penilaian.hasMany(models.Pengisian_f02, {
        foreignKey: 'id_evaluator_periode_penilaian',
        as: 'pengisian_f02s'
      });
    }
  }
  Evaluator_periode_penilaian.init({
    id_evaluator_periode_penilaian: {
      type: DataTypes.CHAR(36),
      allowNull: false,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
    },
    id_evaluator: {
      type: DataTypes.CHAR(36),
      allowNull: false,
      references: {
        model: 'Evaluators',
        key: 'id_evaluator'
      }
    },
    id_periode_penilaian: {
      type: DataTypes.CHAR(36),
      allowNull: false,
      references: {
        model: 'Periode_penilaians',
        key: 'id_periode_penilaian'
      }
    }
  }, {
    sequelize,
    modelName: 'Evaluator_periode_penilaian',
  });
  return Evaluator_periode_penilaian;
};