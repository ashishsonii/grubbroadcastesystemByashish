'use strict';

const { v4: uuidv4 } = require('uuid');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Get the teachers and principal created in the previous seeder
    const [users] = await queryInterface.sequelize.query(
      `SELECT id, email, role FROM users WHERE email IN ('ravi@school.com', 'priya@school.com', 'principal@school.com');`
    );

    const ravi = users.find(u => u.email === 'ravi@school.com');
    const priya = users.find(u => u.email === 'priya@school.com');
    const principal = users.find(u => u.role === 'principal');

    if (!ravi || !priya || !principal) {
      console.warn('Seeder skipped: Required users not found.');
      return;
    }

    const now = new Date();
    // Content active window: from 1 hour ago to 24 hours from now
    const startTime = new Date(now.getTime() - 60 * 60 * 1000);
    const endTime = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    // 2. Create Content Slots
    const slotIdMaths = uuidv4();
    const slotIdScience = uuidv4();

    await queryInterface.bulkInsert('content_slots', [
      {
        id: slotIdMaths,
        subject: 'maths',
        teacher_id: ravi.id,
        created_at: now,
      },
      {
        id: slotIdScience,
        subject: 'science',
        teacher_id: priya.id,
        created_at: now,
      },
    ]);

    // 3. Create Content Items
    const contentMaths1 = uuidv4();
    const contentMaths2 = uuidv4();
    const contentScience1 = uuidv4();

    await queryInterface.bulkInsert('content', [
      {
        id: contentMaths1,
        title: 'Algebra Basics',
        description: 'Introduction to linear equations.',
        subject: 'maths',
        file_url: 'https://pub-8a7b64901d9945f49a75abd18e70e236.r2.dev/uploads/demo-math1.jpg',
        file_type: 'jpeg',
        file_size: 102400,
        uploaded_by: ravi.id,
        status: 'approved',
        approved_by: principal.id,
        approved_at: now,
        start_time: startTime,
        end_time: endTime,
        created_at: now,
      },
      {
        id: contentMaths2,
        title: 'Geometry Formulas',
        description: 'Area and perimeter formulas.',
        subject: 'maths',
        file_url: 'https://pub-8a7b64901d9945f49a75abd18e70e236.r2.dev/uploads/demo-math2.jpg',
        file_type: 'jpeg',
        file_size: 204800,
        uploaded_by: ravi.id,
        status: 'approved',
        approved_by: principal.id,
        approved_at: now,
        start_time: startTime,
        end_time: endTime,
        created_at: new Date(now.getTime() + 1000), // Slightly later
      },
      {
        id: contentScience1,
        title: 'Newton Laws',
        description: 'Three laws of motion.',
        subject: 'science',
        file_url: 'https://pub-8a7b64901d9945f49a75abd18e70e236.r2.dev/uploads/demo-science1.png',
        file_type: 'png',
        file_size: 150000,
        uploaded_by: priya.id,
        status: 'approved',
        approved_by: principal.id,
        approved_at: now,
        start_time: startTime,
        end_time: endTime,
        created_at: now,
      },
    ]);

    // 4. Create Content Schedules
    // Note: Short duration (1-2 mins) as requested for demo
    await queryInterface.bulkInsert('content_schedule', [
      {
        content_id: contentMaths1,
        slot_id: slotIdMaths,
        rotation_order: 1,
        duration: 1, // 1 minute
        created_at: now,
      },
      {
        content_id: contentMaths2,
        slot_id: slotIdMaths,
        rotation_order: 2,
        duration: 1, // 1 minute
        created_at: now,
      },
      {
        content_id: contentScience1,
        slot_id: slotIdScience,
        rotation_order: 1,
        duration: 2, // 2 minutes
        created_at: now,
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('content_schedule', null, {});
    await queryInterface.bulkDelete('content', null, {});
    await queryInterface.bulkDelete('content_slots', null, {});
  }
};
