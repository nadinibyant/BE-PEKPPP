'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Bukti_dukung extends Model {
    static associate(models) {
      this.belongsTo(models.Indikator, {
        foreignKey: 'id_indikator',
        targetKey: 'id_indikator',
        as: 'Indikator'
      });

      Bukti_dukung.hasMany(models.Bukti_dukung_upload, {
        foreignKey: 'id_bukti_dukung',
        as: 'bukti_dukung_uploads'
      });
    }
  }
  Bukti_dukung.init({
    id_bukti_dukung: {
      type: DataTypes.CHAR(36),
      allowNull: false,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
    },
    nama_bukti_dukung: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    urutan: {
      type: DataTypes.INTEGER(3),
      allowNull: false
    },
    id_indikator: {
      type: DataTypes.CHAR(36),
      allowNull: false,
      references: {
        model: 'Indikators',
        key: 'id_indikator'
      }
    }
  }, {
    sequelize,
    modelName: 'Bukti_dukung',
  });
  return Bukti_dukung;
};