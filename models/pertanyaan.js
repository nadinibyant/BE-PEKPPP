'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Pertanyaan extends Model {
    static associate(models) {
      this.belongsTo(this, {
        foreignKey: 'pertanyaan_id_pertanyaan',
        as: 'ParentPertanyaan'
      });
      this.hasMany(this, {
        foreignKey: 'pertanyaan_id_pertanyaan',
        as: 'ChildPertanyaans'
      });
      this.belongsTo(models.Tipe_pertanyaan, {
        foreignKey: 'tipe_pertanyaan_id_tipe_pertanyaan',
        as: 'TipePertanyaan'
      });
      this.belongsTo(models.Indikator, {
        foreignKey: 'indikator_id_indikator',
        as: 'Indikator'
      });
      this.hasMany(models.Opsi_jawaban, {
        foreignKey: 'id_pertanyaan',
        sourceKey: 'id_pertanyaan',
        as: 'OpsiJawabans'
      });
      Pertanyaan.hasMany(models.Jawaban, {
        foreignKey: 'id_pertanyaan',
        as: 'jawabans'
      });
      this.belongsTo(models.User, {
        foreignKey: 'deleted_by',
        as: 'DeletedByUser'
      });
    }
  }
  Pertanyaan.init({
    id_pertanyaan: {
      type: DataTypes.CHAR(36),
      allowNull: false,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
    },
    teks_pertanyaan: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    trigger_value: {
      type: DataTypes.STRING(256),
      allowNull: true
    },
    urutan: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    pertanyaan_id_pertanyaan: {
      type: DataTypes.CHAR(36),
      allowNull: true,
      references: {
        model: 'Pertanyaans',
        key: 'id_pertanyaan'
      }
    },
    tipe_pertanyaan_id_tipe_pertanyaan: {
      type: DataTypes.CHAR(36),
      allowNull: false,
      references: {
        model: 'Tipe_pertanyaans',
        key: 'id_tipe_pertanyaan'
      }
    },
    indikator_id_indikator: {
      type: DataTypes.CHAR(36),
      allowNull: false,
      references: {
        model: 'Indikators',
        key: 'id_indikator'
      }
    },
    keterangan_trigger: {
      type: DataTypes.TEXT,
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
    modelName: 'Pertanyaan',
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
  return Pertanyaan;
};