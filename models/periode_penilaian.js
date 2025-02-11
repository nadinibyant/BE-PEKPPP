'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Periode_penilaian extends Model {
    static associate(models) {
      Periode_penilaian.belongsToMany(models.Evaluator, {
        through: models.Evaluator_periode_penilaian,
        foreignKey: 'id_periode_penilaian',
        otherKey: 'id_evaluator',
        as: 'evaluators'
      });

      Periode_penilaian.hasMany(models.Pengisian_f01, {
        foreignKey: 'id_periode_penilaian',
        as: 'pengisian_f01s'
      });

      Periode_penilaian.hasMany(models.Nilai_akhir_kumulatif, {
        foreignKey: 'id_periode_penilaian',
        as: 'nilai_kumulatifs'
      });

      Periode_penilaian.hasMany(models.Izin_hasil_penilaian, {
        foreignKey: 'id_periode_penilaian',
        as: 'izin_hasil_penilaians'
      });
    }
  }
  Periode_penilaian.init({
    id_periode_penilaian: {
      type: DataTypes.CHAR(36),
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      primaryKey: true
    },
    tahun_periode: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1900,
        max: 9999
      }
    },
    tanggal_mulai: {
      type: DataTypes.DATE,
      allowNull: false
    },
    tanggal_selesai: {
      type: DataTypes.DATE,
      allowNull: false
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'Periode_penilaian',
  });
  return Periode_penilaian;
};