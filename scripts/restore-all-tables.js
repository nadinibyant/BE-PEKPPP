'use strict';
const fs = require('fs');
const path = require('path');

const models = require('../models');
const sequelize = models.sequelize;

async function restoreAllTables() {
  try {
    const tableNames = Object.keys(models).filter(
      modelName => typeof models[modelName].tableName !== 'undefined'
    );
    
    const backupDir = path.join(__dirname, '../backups');
    
    for (const modelName of tableNames) {
      if (modelName === 'sequelize' || modelName === 'Sequelize') continue;
      
      const tableName = models[modelName].tableName || modelName;
      const backupPath = path.join(backupDir, `${tableName}-backup.json`);
      
      if (fs.existsSync(backupPath)) {
        console.log(`Restoring table: ${tableName}`);
        
        const backupData = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
        
        await models[modelName].destroy({ truncate: true, cascade: true });
 
        if (backupData.length > 0) {
          const plainData = backupData.map(item => {
            const plain = item.dataValues || item;
            delete plain.createdAt;
            delete plain.updatedAt;
            return plain;
          });
          
          await models[modelName].bulkCreate(plainData, { 
            individualHooks: true 
          });
        }
      } else {
        console.log(`Skip restore table ${tableName}: File backup tidak ditemukan`);
      }
    }
    
    console.log('Restore semua tabel selesai!');
  } catch (error) {
    console.error('Error saat restore semua tabel:', error);
  } finally {
    await sequelize.close();
  }
}

restoreAllTables();