'use strict';

const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

const SALT_ROUNDS = 10;

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const principalPassword = await bcrypt.hash('Admin@123', SALT_ROUNDS);
    const teacherPassword = await bcrypt.hash('Teacher@123', SALT_ROUNDS);

    const now = new Date();

    await queryInterface.bulkInsert('users', [
      {
        id: uuidv4(),
        name: 'Principal Admin',
        email: 'principal@school.com',
        password_hash: principalPassword,
        role: 'principal',
        created_at: now,
      },
      {
        id: uuidv4(),
        name: 'Ravi Kumar',
        email: 'ravi@school.com',
        password_hash: teacherPassword,
        role: 'teacher',
        created_at: now,
      },
      {
        id: uuidv4(),
        name: 'Priya Sharma',
        email: 'priya@school.com',
        password_hash: teacherPassword,
        role: 'teacher',
        created_at: now,
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('users', {
      email: {
        [require('sequelize').Op.in]: [
          'principal@school.com',
          'ravi@school.com',
          'priya@school.com',
        ],
      },
    });
  },
};
