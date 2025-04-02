'use strict';

const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const userId = uuidv4();

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash('12345678', saltRounds);

    await queryInterface.bulkInsert('Users', [
      {
        id_user: userId,
        email: 'admin@gmail.com',
        password: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], {});

    await queryInterface.bulkInsert('Admins', [
      {
        id_admin: userId, 
        nama: 'Super Administrator',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Admins', {
      nama: 'Super Administrator'
    }, {});

    await queryInterface.bulkDelete('Users', {
      email: 'admin@example.com'
    }, {});
  }
};