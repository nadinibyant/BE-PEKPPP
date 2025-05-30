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
        as: 'user',

      });

      Opd.hasMany(models.Message, {
        foreignKey: 'id_opd',
        as: 'messages',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      });

      Opd.hasOne(models.Pengisian_f01, {
        foreignKey: 'id_opd',
        as: 'pengisian_f01',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      });

      Opd.hasMany(models.Pengisian_f02, {
        foreignKey: 'id_opd',
        as: 'pengisian_f02s',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      });

      Opd.hasMany(models.Nilai_akhir_kumulatif, {
        foreignKey: 'id_opd',
        as: 'nilai_kumulatifs',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      });

      Opd.hasMany(models.Izin_hasil_penilaian, {
        foreignKey: 'id_opd',
        as: 'izin_hasil_penilaians',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      });

      this.belongsTo(models.User, {
        foreignKey: 'deleted_by',
        as: 'DeletedByUser'
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
    },
    no_hp: {
      type: DataTypes.STRING(15),
      allowNull: true
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null
    },
    deleted_by: {
      type: DataTypes.CHAR(36),
      allowNull: true,
      defaultValue: null,
      references: {
        model: 'Users',
        key: 'id_user'
      }
    }
  }, {
    sequelize,
    modelName: 'Opd',
    defaultScope: {
      where: {
        is_active: true
      }
    },
    scopes: {
      allRecords: {},
      deletedOnly: {
        where: {
          is_active: false
        }
      }
    }
  });
  return Opd;
};