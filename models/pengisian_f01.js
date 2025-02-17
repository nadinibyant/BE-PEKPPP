'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Pengisian_f01 extends Model {
    static associate(models) {
      Pengisian_f01.belongsTo(models.Opd, {
        foreignKey: 'id_opd',
        as: 'opd'
      });
      
      Pengisian_f01.belongsTo(models.Periode_penilaian, {
        foreignKey: 'id_periode_penilaian',
        as: 'periode_penilaian'
      });

      Pengisian_f01.hasMany(models.Jawaban, {
        foreignKey: 'id_pengisian_f01',
        as: 'jawabans'
      });

      Pengisian_f01.hasMany(models.Bukti_dukung_upload, {
        foreignKey: 'id_pengisian_f01',
        as: 'bukti_dukung_uploads'
      });
    }
  }
  Pengisian_f01.init({
    id_pengisian_f01: {
      type: DataTypes.CHAR(36),
      allowNull: false,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
    },
    status_pengisian: {
      type: DataTypes.STRING(20),
      allowNull: false
    },
    id_opd: {
      type: DataTypes.CHAR(36),
      allowNull: false,
      references: {
        model: 'Opds',
        key: 'id_opd'
      }
    },
    id_periode_penilaian: {
      type: DataTypes.CHAR(36),
      allowNull: false,
      references: {
        model: 'Periode_penilaians',
        key: 'id_periode_penilaian'
      }
    }
  }, {
    sequelize,
    modelName: 'Pengisian_f01',
  });
  return Pengisian_f01;
};