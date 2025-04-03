'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('Users', 'is_active', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    });
  },

  async down (queryInterface, Sequelize) {
   // Hapus kolom dari User
   await queryInterface.removeColumn('Users', 'is_active');
  }
};
