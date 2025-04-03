'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Skala_indikator extends Model {
    static associate(models) {
      Skala_indikator.belongsTo(models.Indikator, {
        foreignKey: 'id_indikator',
        as: 'indikator'
      });

      Skala_indikator.hasMany(models.nilai_indikator, {
        foreignKey: 'id_skala',
        as: 'nilai_indikators'
      });

      this.belongsTo(models.User, {
        foreignKey: 'deleted_by',
        as: 'DeletedByUser'
      });
    }
  }
  Skala_indikator.init({
    id_skala: {
      type: DataTypes.CHAR(36),
      allowNull: false,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
    },
    nilai_skala: {
      type: DataTypes.INTEGER(2),
      allowNull: false
    },
    deskripsi_skala: {
      type: DataTypes.TEXT,
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
    modelName: 'Skala_indikator',
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
  return Skala_indikator;
};