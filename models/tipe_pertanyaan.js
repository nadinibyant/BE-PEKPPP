'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Tipe_pertanyaan extends Model {
    static associate(models) {
      this.hasOne(models.Tipe_opsi_jawaban, {
        foreignKey: 'id_tipe_pertanyaan',
        sourceKey: 'id_tipe_pertanyaan'
      });

      this.hasMany(models.Pertanyaan, {
        foreignKey: 'tipe_pertanyaan_id_tipe_pertanyaan',
        sourceKey: 'id_tipe_pertanyaan',
        as: 'Pertanyaans'
      });
    }
  }
  Tipe_pertanyaan.init({
    id_tipe_pertanyaan: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    nama_jenis: {
      type: DataTypes.STRING,
      allowNull: false
    },
    kode_jenis: {
      type: DataTypes.STRING(100),
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'Tipe_pertanyaan',
  });
  return Tipe_pertanyaan;
};