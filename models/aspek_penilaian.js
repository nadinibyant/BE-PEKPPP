'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Aspek_penilaian extends Model {
    static associate(models) {
      this.belongsTo(this, {
        foreignKey: 'parent_id_aspek_penilaian',
        as: 'ParentAspek'
      });
      this.hasMany(this, {
        foreignKey: 'parent_id_aspek_penilaian',
        as: 'ChildAspeks'
      });

      this.hasMany(models.Indikator, {
        foreignKey: 'id_aspek_penilaian',
        sourceKey: 'id_aspek_penilaian',
        as: 'Indikators'
      });

      Aspek_penilaian.hasMany(models.Nilai_aspek, {
        foreignKey: 'id_aspek_penilaian',
        as: 'nilai_aspeks'
      });

      this.belongsTo(models.User, {
        foreignKey: 'deleted_by',
        as: 'DeletedByUser'
      });
    }
  }
  Aspek_penilaian.init({
    id_aspek_penilaian: {
      type: DataTypes.CHAR(36),
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false
    },
    nama_aspek: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    bobot_aspek: {
      type: DataTypes.INTEGER(3),
      allowNull: true
    },
    parent_id_aspek_penilaian: {
      type: DataTypes.CHAR(36),
      allowNull: true,
      references: {
        model: 'Aspek_penilaians',
        key: 'id_aspek_penilaian'
      }
    },
    urutan: {
      type: DataTypes.INTEGER,
      allowNull: false
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
    modelName: 'Aspek_penilaian',
    // defaultScope: {
    //   where: {
    //     is_active: true
    //   }
    // },
    // scopes: {
    //   allRecords: {},
    //   deletedOnly: {
    //     where: {
    //       is_active: false
    //     }
    //   }
    // }
  });
  return Aspek_penilaian;
};