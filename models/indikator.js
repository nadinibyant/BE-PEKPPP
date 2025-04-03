'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Indikator extends Model {
    static associate(models) {
      this.belongsTo(models.Aspek_penilaian, {
        foreignKey: 'id_aspek_penilaian',
        targetKey: 'id_aspek_penilaian',
        as: 'AspekPenilaian'
      });

      this.hasMany(models.Pertanyaan, {
        foreignKey: 'indikator_id_indikator',
        sourceKey: 'id_indikator',
        as: 'Pertanyaans'
      });

      this.hasMany(models.Bukti_dukung, {
        foreignKey: 'id_indikator',
        sourceKey: 'id_indikator',
        as: 'BuktiDukungs'
      });

      Indikator.hasMany(models.Skala_indikator, {
        foreignKey: 'id_indikator',
        as: 'skala_indikators'
      });

      Indikator.hasMany(models.Bukti_dukung_upload, {
        foreignKey: 'id_indikator',
        as: 'bukti_dukung_uploads'
      });

      Indikator.hasMany(models.nilai_indikator, {
        foreignKey: 'id_indikator',
        as: 'nilai_indikators'
      });

      this.belongsTo(models.User, {
        foreignKey: 'deleted_by',
        as: 'DeletedByUser'
      });
    }
  }
  Indikator.init({
    id_indikator: {
      type: DataTypes.CHAR(36),
      allowNull: false,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
    },
    nama_indikator: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    bobot_indikator: {
      type: DataTypes.DECIMAL(10,2),
      allowNull: false
    },
    penjelasan: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    urutan: {
      type: DataTypes.INTEGER(3),
      allowNull: false
    },
    kode_indikator: {
      type: DataTypes.STRING(10),
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
    modelName: 'Indikator',
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
  return Indikator;
};