'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Nilai_akhir_kumulatif extends Model {
    static associate(models) {
      Nilai_akhir_kumulatif.belongsTo(models.Opd, {
        foreignKey: 'id_opd',
        as: 'opd'
      });

      Nilai_akhir_kumulatif.belongsTo(models.Periode_penilaian, {
        foreignKey: 'id_periode_penilaian',
        as: 'periode_penilaian'
      });

      Nilai_akhir_kumulatif.hasOne(models.Izin_hasil_penilaian, {
        foreignKey: 'id_nilai_kumulatif',
        as: 'izin_hasil_penilaians'
      });
    }
  }
  Nilai_akhir_kumulatif.init({
    id_nilai_kumulatif: {
      type: DataTypes.CHAR(36),
      allowNull: false,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
    },
    total_kumulatif: {
      type: DataTypes.DECIMAL(10,2),
      allowNull: false
    },
    kategori: {
      type: DataTypes.STRING(3),
      allowNull: false
    },
    feedback:{
      type: DataTypes.TEXT,
      allowNull: true
    },
    id_opd: {
      type: DataTypes.CHAR(36),
      allowNull: false,
      references: {
        model: 'Opds',
        key: 'id_opd'
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
    modelName: 'Nilai_akhir_kumulatif',
  });
  return Nilai_akhir_kumulatif;
};