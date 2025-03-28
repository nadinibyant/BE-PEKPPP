'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('Opds', 'no_hp', {
      type: Sequelize.STRING(15),
      allowNull: true,
      comment: 'Nomor HP untuk notifikasi WhatsApp'
    });
    
    await queryInterface.addColumn('Evaluators', 'no_hp', {
      type: Sequelize.STRING(15),
      allowNull: true,
      comment: 'Nomor HP untuk notifikasi WhatsApp'
    });
  },

  async down (queryInterface, Sequelize) {

    await queryInterface.removeColumn('Opds', 'no_hp');
  
    await queryInterface.removeColumn('Evaluators', 'no_hp');
  }
};