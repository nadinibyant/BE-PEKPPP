'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Pengisian_f02 extends Model {
    static associate(models) {
      Pengisian_f02.belongsTo(models.Opd, {
        foreignKey: 'id_opd',
        as: 'opd',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      });

      Pengisian_f02.belongsTo(models.Evaluator_periode_penilaian, {
        foreignKey: 'id_evaluator_periode_penilaian',
        as: 'evaluator_periode_penilaian',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      });

      Pengisian_f02.hasMany(models.nilai_indikator, {
        foreignKey: 'id_pengisian_f02',
        as: 'nilai_indikators',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      });

      Pengisian_f02.hasMany(models.Nilai_aspek, {
        foreignKey: 'id_pengisian_f02',
        as: 'nilai_aspeks',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      });

      Pengisian_f02.hasOne(models.Nilai_akhir, {
        foreignKey: 'id_pengisian_f02',
        as: 'nilai_akhir',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      });

      Pengisian_f02.hasMany(models.Izin_hasil_penilaian, {
        foreignKey: 'id_pengisian_f02',
        as: 'izin_hasil_penilaians',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      });
    }
  }
  Pengisian_f02.init({
    id_pengisian_f02: {
      type: DataTypes.CHAR(36),
      allowNull: false,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
    },
    id_opd: {
      type: DataTypes.CHAR(36),
      allowNull: false,
      references: {
        model: 'Opds',
        key: 'id_opd'
      }
    },
    id_evaluator_periode_penilaian: {
      type: DataTypes.CHAR(36),
      allowNull: false,
      references: {
        model: 'Evaluator_periode_penilaians',
        key: 'id_evaluator_periode_penilaian'
      }
    }
  }, {
    sequelize,
    modelName: 'Pengisian_f02',
  });
  return Pengisian_f02;
};