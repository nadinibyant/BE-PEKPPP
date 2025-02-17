'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Izin_hasil_penilaian extends Model {
    static associate(models) {
      Izin_hasil_penilaian.belongsTo(models.Opd, {
        foreignKey: 'id_opd',
        as: 'opd'
      });

      Izin_hasil_penilaian.belongsTo(models.Evaluator, {
        foreignKey: 'id_evaluator', 
        as: 'evaluator'
      });

      Izin_hasil_penilaian.belongsTo(models.Periode_penilaian, {
        foreignKey: 'id_periode_penilaian',
        as: 'periode_penilaian'
      });
    }
  }
  Izin_hasil_penilaian.init({
    id_izin_hasil_penilaian: {
      type: DataTypes.CHAR(36),
      allowNull: false,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
    },
    id_opd: {
      type: DataTypes.CHAR(36),
      allowNull: true,
      references: {
        model: 'Opds',
        key: 'id_opd'
      }
    },
    id_evaluator: {
      type: DataTypes.CHAR(36),
      allowNull: true,
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
    },
    tanggal_pengajuan: {
      type: DataTypes.DATE,
      allowNull: false
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'Izin_hasil_penilaian',
  });
  return Izin_hasil_penilaian;
};