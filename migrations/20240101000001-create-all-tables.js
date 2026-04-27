'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // ─── 1. USERS TABLE ──────────────────────────────────
    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      password_hash: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      role: {
        type: Sequelize.ENUM('principal', 'teacher'),
        allowNull: false,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    // ─── 2. CONTENT TABLE ────────────────────────────────
    await queryInterface.createTable('content', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      subject: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      file_url: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      file_type: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      file_size: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      uploaded_by: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      status: {
        type: Sequelize.ENUM('uploaded', 'pending', 'approved', 'rejected'),
        allowNull: false,
        defaultValue: 'pending',
      },
      rejection_reason: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      approved_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      approved_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      start_time: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      end_time: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    // ─── 3. CONTENT_SLOTS TABLE ──────────────────────────
    await queryInterface.createTable('content_slots', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      subject: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      teacher_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    // ─── 4. CONTENT_SCHEDULE TABLE ───────────────────────
    await queryInterface.createTable('content_schedule', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      content_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'content',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      slot_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'content_slots',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      rotation_order: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      duration: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 5,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    // ─── INDEXES ─────────────────────────────────────────
    await queryInterface.addIndex('content', ['uploaded_by']);
    await queryInterface.addIndex('content', ['status']);
    await queryInterface.addIndex('content', ['subject']);
    await queryInterface.addIndex('content', ['approved_by']);
    await queryInterface.addIndex('content', ['start_time', 'end_time']);
    await queryInterface.addIndex('content_slots', ['subject', 'teacher_id'], { unique: true });
    await queryInterface.addIndex('content_schedule', ['content_id']);
    await queryInterface.addIndex('content_schedule', ['slot_id']);
    await queryInterface.addIndex('content_schedule', ['slot_id', 'rotation_order']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('content_schedule');
    await queryInterface.dropTable('content_slots');
    await queryInterface.dropTable('content');
    await queryInterface.dropTable('users');
  },
};
