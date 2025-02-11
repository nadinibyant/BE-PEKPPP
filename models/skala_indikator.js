'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Skala_indikator extends Model {
    static associate(models) {
      Skala_indikator.belongsTo(models.Indikator, {
        foreignKey: 'id_indikator',
        as: 'indikator'
      });

      Skala_indikator.hasMany(models.nilai_indikator, {
        foreignKey: 'id_skala',
        as: 'nilai_indikators'
      });
    }
  }
  Skala_indikator.init({
    id_skala: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    nilai_skala: {
      type: DataTypes.INTEGER(2),
      allowNull: false
    },
    deskripsi_skala: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    id_indikator: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Indikators',
        key: 'id_indikator'
      }
    }
  }, {
    sequelize,
    modelName: 'Skala_indikator',
  });
  return Skala_indikator;
};