'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Bukti_dukung extends Model {
    static associate(models) {
      this.belongsTo(models.Indikator, {
        foreignKey: 'id_indikator',
        targetKey: 'id_indikator',
        as: 'Indikator'
      });

      Bukti_dukung.hasMany(models.Bukti_dukung_upload, {
        foreignKey: 'id_bukti_dukung',
        as: 'bukti_dukung_uploads'
      });

      this.belongsTo(models.User, {
        foreignKey: 'deleted_by',
        as: 'DeletedByUser'
      });
    }
  }
  Bukti_dukung.init({
    id_bukti_dukung: {
      type: DataTypes.CHAR(36),
      allowNull: false,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
    },
    nama_bukti_dukung: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    urutan: {
      type: DataTypes.INTEGER(3),
      allowNull: false
    },
    id_indikator: {
      type: DataTypes.CHAR(36),
      allowNull: false,
      references: {
        model: 'Indikators',
        key: 'id_indikator'
      }
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
    modelName: 'Bukti_dukung',
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
  return Bukti_dukung;
};