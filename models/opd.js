'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Opd extends Model {

    static associate(models) {
      Opd.belongsTo(models.User, {
        foreignKey: 'id_opd',
        targetKey: 'id_user',
        as: 'user'
      });

      Opd.hasMany(models.Message, {
        foreignKey: 'id_opd',
        as: 'messages'
      });

      Opd.hasOne(models.Pengisian_f01, {
        foreignKey: 'id_opd',
        as: 'pengisian_f01'
      });

      Opd.hasMany(models.Pengisian_f02, {
        foreignKey: 'id_opd',
        as: 'pengisian_f02s'
      });

      Opd.hasMany(models.Nilai_akhir_kumulatif, {
        foreignKey: 'id_opd',
        as: 'nilai_kumulatifs'
      });

      Opd.hasMany(models.Izin_hasil_penilaian, {
        foreignKey: 'id_opd',
        as: 'izin_hasil_penilaians'
      });
    }
  }
  Opd.init({
    id_opd:{
      type: DataTypes.CHAR(36),
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'Users',
        key:'id_user'
      }
    },
    nama_opd:{
      type: DataTypes.STRING(50),
      allowNull: false
    },
    alamat: {
      type: DataTypes.STRING,
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'Opd',
  });
  return Opd;
};