'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class nilai_indikator extends Model {
    static associate(models) {
      nilai_indikator.belongsTo(models.Pengisian_f02, {
        foreignKey: 'id_pengisian_f02',
        as: 'pengisian_f02'
      });

      nilai_indikator.belongsTo(models.Skala_indikator, {
        foreignKey: 'id_skala',
        as: 'skala_indikator'
      });

      nilai_indikator.belongsTo(models.Indikator, {
        foreignKey: 'id_indikator',
        as: 'indikator'
      });
    }
  }
  nilai_indikator.init({
    id_nilai_indikator: {
      type: DataTypes.CHAR(36),
      allowNull: false,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
    },
    nilai_diperolah: {
      type: DataTypes.DECIMAL(10,2),
      allowNull: false,
      comment: 'Ini untuk penjumlahan dari seluruh nilai masing-masing indikator yang diberikan evaluator'
    },
    id_skala: {
      type: DataTypes.CHAR(36),
      allowNull: false,
      references: {
        model: 'Skala_indikators',
        key: 'id_skala'
      }
    },
    id_pengisian_f02: {
      type: DataTypes.CHAR(36),
      allowNull: false,
      references: {
        model: 'Pengisian_f02s',
        key: 'id_pengisian_f02'
      }
    },
    id_indikator: {
      type: DataTypes.CHAR(36),
      allowNull: false,
      references: {
        model: 'Indikators',
        key: 'id_indikator'
      }
    }
  }, {
    sequelize,
    modelName: 'nilai_indikator',
  });
  return nilai_indikator;
};