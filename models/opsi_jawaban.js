'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Opsi_jawaban extends Model {
    static associate(models) {
      this.belongsTo(models.Pertanyaan, {
        foreignKey: 'id_pertanyaan',
        targetKey: 'id_pertanyaan',
        as: 'Pertanyaan'
      });
      Opsi_jawaban.hasMany(models.Jawaban, {
        foreignKey: 'id_opsi_jawaban',
        as: 'jawabans'
      });
    }
  }
  Opsi_jawaban.init({
    id_opsi_jawaban: {
      type: DataTypes.CHAR(36),
      allowNull: false,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
    },
    teks_opsi: {
      type: DataTypes.STRING,
      allowNull: false
    },
    memiliki_isian_lainnya: {
      type: DataTypes.BOOLEAN,
      allowNull: true
    },
    urutan: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    id_pertanyaan: {
      type: DataTypes.CHAR(36),
      allowNull: false,
      references: {
        model: 'Pertanyaans',
        key: 'id_pertanyaan'
      }
    }
  }, {
    sequelize,
    modelName: 'Opsi_jawaban',
  });
  return Opsi_jawaban;
};