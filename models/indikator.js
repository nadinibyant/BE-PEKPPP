'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Indikator extends Model {
    static associate(models) {
      this.belongsTo(models.Aspek_penilaian, {
        foreignKey: 'id_aspek_penilaian',
        targetKey: 'id_aspek_penilaian',
        as: 'AspekPenilaian'
      });

      this.hasMany(models.Pertanyaan, {
        foreignKey: 'indikator_id_indikator',
        sourceKey: 'id_indikator',
        as: 'Pertanyaans'
      });

      this.hasMany(models.Bukti_dukung, {
        foreignKey: 'id_indikator',
        sourceKey: 'id_indikator',
        as: 'BuktiDukungs'
      });

      Indikator.hasMany(models.Skala_indikator, {
        foreignKey: 'id_indikator',
        as: 'skala_indikators'
      });

      Indikator.hasMany(models.Bukti_dukung_upload, {
        foreignKey: 'id_indikator',
        as: 'bukti_dukung_uploads'
      });

      Indikator.hasMany(models.nilai_indikator, {
        foreignKey: 'id_indikator',
        as: 'nilai_indikators'
      });
    }
  }
  Indikator.init({
    id_indikator: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    nama_indikator: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    bobot_indikator: {
      type: DataTypes.DECIMAL(10,2),
      allowNull: false
    },
    penjelasan: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    urutan: {
      type: DataTypes.INTEGER(3),
      allowNull: false
    },
    kode_indikator: {
      type: DataTypes.STRING(10),
      allowNull: false
    },
    id_aspek_penilaian: {
      type: DataTypes.CHAR(36),
      allowNull: false,
      references: {
        model: 'Aspek_penilaians',
        key: 'id_aspek_penilaian'
      }
    }
  }, {
    sequelize,
    modelName: 'Indikator',
  });
  return Indikator;
};