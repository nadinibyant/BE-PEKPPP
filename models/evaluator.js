'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Evaluator extends Model {
    static associate(models) {
      Evaluator.belongsTo(models.User, {
        foreignKey: 'id_evaluator',
        targetKey: 'id_user',
        as: 'user'
      });

      Evaluator.belongsToMany(models.Periode_penilaian, {
        through: models.Evaluator_periode_penilaian,
        foreignKey: 'id_evaluator',
        otherKey: 'id_periode_penilaian',
        as: 'periode_penilaians'
      });

      Evaluator.hasMany(models.Izin_hasil_penilaian, {
        foreignKey: 'id_evaluator',
        as: 'izin_hasil_penilaians'
      });

      this.belongsTo(models.User, {
        foreignKey: 'deleted_by',
        as: 'DeletedByUser'
      });
    }
  }
  Evaluator.init({
    id_evaluator: {
      type: DataTypes.CHAR(36),
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'Users',
        key: 'id_user'
      }
    },
    nama: {
      type: DataTypes.STRING(50),
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
    modelName: 'Evaluator',
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
  return Evaluator;
};