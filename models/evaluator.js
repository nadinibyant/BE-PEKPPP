'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Evaluator extends Model {
    static associate(models) {
      Evaluator.belongsTo(models.User, {
        foreignKey: 'id_evaluator',
        targetKey: 'id_user',
        as: 'user'
      });

      Evaluator.belongsToMany(models.Periode_penilaian, {
        through: models.Evaluator_periode_penilaian,
        foreignKey: 'id_evaluator',
        otherKey: 'id_periode_penilaian',
        as: 'periode_penilaians'
      });

      Evaluator.hasMany(models.Izin_hasil_penilaian, {
        foreignKey: 'id_evalutor',
        as: 'izin_hasil_penilaians'
      });
    }
  }
  Evaluator.init({
    id_evaluator: {
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
    modelName: 'Evaluator',
  });
  return Evaluator;
};