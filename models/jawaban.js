'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Jawaban extends Model {
    static associate(models) {
      Jawaban.belongsTo(models.Pengisian_f01, {
        foreignKey: 'id_pengisian_f01',
        as: 'pengisian_f01'
      });

      Jawaban.belongsTo(models.Pertanyaan, {
        foreignKey: 'id_pertanyaan',
        as: 'pertanyaan'
      });

      Jawaban.belongsTo(models.Opsi_jawaban, {
        foreignKey: 'id_opsi_jawaban',
        as: 'opsi_jawaban'
      });
    }
  }
  Jawaban.init({
    id_jawaban: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    jawaban_text: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    id_pertanyaan: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Pertanyaans',
        key: 'id_pertanyaan'
      }
    },
    id_opsi_jawaban: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Opsi_jawabans',
        key: 'id_opsi_jawaban'
      }
    },
    id_pengisian_f01: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Pengisian_f01s',
        key: 'id_pengisian_f01'
      }
    }
  }, {
    sequelize,
    modelName: 'Jawaban',
  });
  return Jawaban;
};