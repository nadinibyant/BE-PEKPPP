'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const checkConstraints = async () => {
      try {
        const [results] = await queryInterface.sequelize.query(`
          SELECT 
            rc.CONSTRAINT_NAME, 
            kcu.TABLE_NAME, 
            kcu.COLUMN_NAME,
            rc.DELETE_RULE,
            rc.UPDATE_RULE
          FROM INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS rc
          JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE kcu 
            ON kcu.CONSTRAINT_NAME = rc.CONSTRAINT_NAME
          WHERE kcu.TABLE_NAME = 'bukti_dukung_uploads'
          AND kcu.CONSTRAINT_SCHEMA = '${queryInterface.sequelize.config.database}'
        `);
        
        return results;
      } catch (error) {
        console.log('Error checking constraints:', error.message);
        return [];
      }
    };

    const constraints = await checkConstraints();
    console.log('Current constraints:', constraints);

    try {
      const buktiDukungConstraint = constraints.find(c => c.COLUMN_NAME === 'id_bukti_dukung');
      
      if (buktiDukungConstraint) {
        if (buktiDukungConstraint.DELETE_RULE !== 'CASCADE') {
          await queryInterface.removeConstraint('bukti_dukung_uploads', buktiDukungConstraint.CONSTRAINT_NAME);
          
          await queryInterface.addConstraint('bukti_dukung_uploads', {
            fields: ['id_bukti_dukung'],
            type: 'foreign key',
            name: 'fk_bukti_dukung_uploads_bukti_dukungs_cascade_20250605',
            references: {
              table: 'bukti_dukungs',
              field: 'id_bukti_dukung'
            },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE'
          });
          console.log(`Updated constraint for id_bukti_dukung to CASCADE`);
        } else {
          console.log(`Constraint for id_bukti_dukung already has CASCADE`);
        }
      } else {
        console.log(`No constraint found for id_bukti_dukung`);
      }
    } catch (error) {
      console.log('Error updating bukti_dukung constraint:', error.message);
    }
    
    try {
      const indikatorConstraint = constraints.find(c => c.COLUMN_NAME === 'id_indikator');
      
      if (indikatorConstraint) {
        if (indikatorConstraint.DELETE_RULE !== 'CASCADE') {
          await queryInterface.removeConstraint('bukti_dukung_uploads', indikatorConstraint.CONSTRAINT_NAME);
          
          await queryInterface.addConstraint('bukti_dukung_uploads', {
            fields: ['id_indikator'],
            type: 'foreign key',
            name: 'fk_bukti_dukung_uploads_indikator_cascade_20250605',
            references: {
              table: 'indikators',
              field: 'id_indikator'
            },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE'
          });
          console.log(`Updated constraint for id_indikator to CASCADE`);
        } else {
          console.log(`Constraint for id_indikator already has CASCADE`);
        }
      } else {
        console.log(`No constraint found for id_indikator`);
      }
    } catch (error) {
      console.log('Error updating indikator constraint:', error.message);
    }

    try {
      const pengisianConstraint = constraints.find(c => c.COLUMN_NAME === 'id_pengisian_f01');
      
      if (pengisianConstraint) {
        if (pengisianConstraint.DELETE_RULE !== 'CASCADE') {
          await queryInterface.removeConstraint('bukti_dukung_uploads', pengisianConstraint.CONSTRAINT_NAME);
          
          await queryInterface.addConstraint('bukti_dukung_uploads', {
            fields: ['id_pengisian_f01'],
            type: 'foreign key',
            name: 'fk_bukti_dukung_uploads_pengisian_f01_cascade_20250605',
            references: {
              table: 'pengisian_f01s',
              field: 'id_pengisian_f01'
            },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE'
          });
          console.log(`Updated constraint for id_pengisian_f01 to CASCADE`);
        } else {
          console.log(`Constraint for id_pengisian_f01 already has CASCADE`);
        }
      } else {
        console.log(`No constraint found for id_pengisian_f01`);
      }
    } catch (error) {
      console.log('Error updating pengisian_f01 constraint:', error.message);
    }

    try {
      const [indikatorConstraints] = await queryInterface.sequelize.query(`
        SELECT 
          rc.CONSTRAINT_NAME, 
          kcu.COLUMN_NAME,
          rc.DELETE_RULE,
          rc.UPDATE_RULE
        FROM INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS rc
        JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE kcu 
          ON kcu.CONSTRAINT_NAME = rc.CONSTRAINT_NAME
        WHERE kcu.TABLE_NAME = 'indikators'
        AND kcu.COLUMN_NAME = 'id_aspek_penilaian'
        AND kcu.CONSTRAINT_SCHEMA = '${queryInterface.sequelize.config.database}'
      `);
      
      if (indikatorConstraints.length > 0) {
        const constraint = indikatorConstraints[0];
        if (constraint.DELETE_RULE !== 'CASCADE') {
          await queryInterface.removeConstraint('indikators', constraint.CONSTRAINT_NAME);
          
          await queryInterface.addConstraint('indikators', {
            fields: ['id_aspek_penilaian'],
            type: 'foreign key',
            name: 'fk_indikator_aspek_penilaian_cascade_20250605',
            references: {
              table: 'aspek_penilaians',
              field: 'id_aspek_penilaian'
            },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE'
          });
          console.log(`Updated constraint for indikators.id_aspek_penilaian to CASCADE`);
        } else {
          console.log(`Constraint for indikators.id_aspek_penilaian already has CASCADE`);
        }
      } else {
        console.log(`No constraint found for indikators.id_aspek_penilaian`);
      }
    } catch (error) {
      console.log('Error updating indikators constraint:', error.message);
    }
  },

  async down(queryInterface, Sequelize) {
    console.log('Running down migration - no automatic rollback for safety reasons');
    console.log('To rollback, manually update constraints in the database');
  }
};