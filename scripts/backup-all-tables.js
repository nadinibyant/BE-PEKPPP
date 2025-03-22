'use strict';
const fs = require('fs');
const path = require('path');

const models = require('../models');
const sequelize = models.sequelize;

async function backupAllTables() {
  try {
    const tableNames = Object.keys(models).filter(
      modelName => typeof models[modelName].tableName !== 'undefined'
    );
    
    const backupDir = path.join(__dirname, '../backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    for (const modelName of tableNames) {
      if (modelName === 'sequelize' || modelName === 'Sequelize') continue;
      
      const tableName = models[modelName].tableName || modelName;
      console.log(`Backing up table: ${tableName}`);
 
      const data = await models[modelName].findAll();

      fs.writeFileSync(
        path.join(backupDir, `${tableName}-backup.json`),
        JSON.stringify(data, null, 2)
      );
    }
    
    console.log('Backup semua tabel selesai!');
  } catch (error) {
    console.error('Error saat backup semua tabel:', error);
  } finally {
    await sequelize.close();
  }
}

backupAllTables();