'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Nilai_aspek extends Model {
    static associate(models) {
      Nilai_aspek.belongsTo(models.Pengisian_f02, {
        foreignKey: 'id_pengisian_f02',
        as: 'pengisian_f02'
      });

      Nilai_aspek.belongsTo(models.Aspek_penilaian, {
        foreignKey: 'id_aspek_penilaian',
        as: 'aspek_penilaian'
      });
    }
  }
  Nilai_aspek.init({
    id_nilai_aspek: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    total_nilai_indikator: {
      type: DataTypes.DECIMAL(10,2),
      allowNull: false
    },
    id_aspek_penilaian: {
      type: DataTypes.CHAR(36),
      allowNull: false,
      references: {
        model: 'Aspek_penilaians',
        key: 'id_aspek_penilaian'
      }
    },
    id_pengisian_f02: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Pengisian_f02s',
        key: 'id_pengisian_f02'
      }
    }
  }, {
    sequelize,
    modelName: 'Nilai_aspek',
  });
  return Nilai_aspek;
};