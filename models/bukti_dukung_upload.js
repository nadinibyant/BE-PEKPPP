'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Bukti_dukung_upload extends Model {
    static associate(models) {
      // Definisi relasi
      Bukti_dukung_upload.belongsTo(models.Indikator, {
        foreignKey: 'id_indikator',
        as: 'indikator'
      });

      Bukti_dukung_upload.belongsTo(models.Bukti_dukung, {
        foreignKey: 'id_bukti_dukung',
        as: 'bukti_dukung'
      });

      Bukti_dukung_upload.belongsTo(models.Pengisian_f01, {
        foreignKey: 'id_pengisian_f01',
        as: 'pengisian_f01'
      });
    }
  }
  Bukti_dukung_upload.init({
    id_bukti_upload: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    nama_file: {
      type: DataTypes.STRING,
      allowNull: false
    },
    id_bukti_dukung: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Bukti_dukungs',
        key: 'id_bukti_dukung'
      }
    },
    id_pengisian_f01: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Pengisian_f01s',
        key: 'id_pengisian_f01'
      }
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
    modelName: 'Bukti_dukung_upload',
  });
  return Bukti_dukung_upload;
};