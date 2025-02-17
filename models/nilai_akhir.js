'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Nilai_akhir extends Model {
    static associate(models) {
      Nilai_akhir.belongsTo(models.Pengisian_f02, {
        foreignKey: 'id_pengisian_f02',
        as: 'pengisian_f02'
      });
    }
  }
  Nilai_akhir.init({
    id_nilai_akhir: {
      type: DataTypes.CHAR(36),
      allowNull: false,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
    },
    total_nilai: {
      type: DataTypes.DECIMAL(10,2),
      allowNull: false
    },
    id_pengisian_f02: {
      type: DataTypes.CHAR(36),
      allowNull: false,
      unique: true,
      references: {
        model: 'Pengisian_f02s',
        key: 'id_pengisian_f02'
      }
    }
  }, {
    sequelize,
    modelName: 'Nilai_akhir',
  });
  return Nilai_akhir;
};