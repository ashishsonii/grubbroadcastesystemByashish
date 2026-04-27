'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.changeColumn('content', 'start_time', {
      type: Sequelize.DATE,
      allowNull: true,
    });
    await queryInterface.changeColumn('content', 'end_time', {
      type: Sequelize.DATE,
      allowNull: true,
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.changeColumn('content', 'start_time', {
      type: Sequelize.DATE,
      allowNull: false,
    });
    await queryInterface.changeColumn('content', 'end_time', {
      type: Sequelize.DATE,
      allowNull: false,
    });
  }
};
