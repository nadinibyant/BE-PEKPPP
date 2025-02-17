'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Tipe_opsi_jawaban extends Model {
    static associate(models) {
      this.belongsTo(models.Tipe_pertanyaan, {
        foreignKey: 'id_tipe_pertanyaan',
        targetKey: 'id_tipe_pertanyaan'
      });
    }
  }
  Tipe_opsi_jawaban.init({
    id_tipe_opsi: {
      type: DataTypes.CHAR(36),
      allowNull: false,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
    },
    nama_tipe: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    allow_other: {
      type: DataTypes.BOOLEAN,
      allowNull: false
    },
    has_trigger: {
      type: DataTypes.BOOLEAN,
      allowNull: false
    },
    id_tipe_pertanyaan: {
      type: DataTypes.CHAR(36),
      allowNull: false,
      references: {
        model: 'Tipe_pertanyaans',
        key: 'id_tipe_pertanyaan'
      }
    }
  }, {
    sequelize,
    modelName: 'Tipe_opsi_jawaban',
  });
  return Tipe_opsi_jawaban;
};