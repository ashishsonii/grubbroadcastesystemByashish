const { Sequelize } = require('sequelize');
const config = require('../config/database');

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

// Initialize Sequelize
const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  dbConfig
);

// Import models
const User = require('./User.model')(sequelize);
const Content = require('./Content.model')(sequelize);
const ContentSlot = require('./ContentSlot.model')(sequelize);
const ContentSchedule = require('./ContentSchedule.model')(sequelize);

// ─── ASSOCIATIONS ──────────────────────────────────────────

// User hasMany Content (as uploads — content uploaded by this user)
User.hasMany(Content, {
  as: 'uploads',
  foreignKey: 'uploaded_by',
  onDelete: 'CASCADE',
});
Content.belongsTo(User, {
  as: 'uploader',
  foreignKey: 'uploaded_by',
});

// User hasMany Content (as approvals — content approved by this user)
User.hasMany(Content, {
  as: 'approvals',
  foreignKey: 'approved_by',
  onDelete: 'SET NULL',
});
Content.belongsTo(User, {
  as: 'approver',
  foreignKey: 'approved_by',
});

// User hasMany ContentSlot
User.hasMany(ContentSlot, {
  as: 'slots',
  foreignKey: 'teacher_id',
  onDelete: 'CASCADE',
});
ContentSlot.belongsTo(User, {
  as: 'teacher',
  foreignKey: 'teacher_id',
});

// ContentSlot hasMany ContentSchedule
ContentSlot.hasMany(ContentSchedule, {
  as: 'schedules',
  foreignKey: 'slot_id',
  onDelete: 'CASCADE',
});
ContentSchedule.belongsTo(ContentSlot, {
  as: 'slot',
  foreignKey: 'slot_id',
});

// Content hasOne/hasMany ContentSchedule
Content.hasOne(ContentSchedule, {
  as: 'schedule',
  foreignKey: 'content_id',
  onDelete: 'CASCADE',
});
ContentSchedule.belongsTo(Content, {
  as: 'content',
  foreignKey: 'content_id',
});

// ─── EXPORTS ───────────────────────────────────────────────

const db = {
  sequelize,
  Sequelize,
  User,
  Content,
  ContentSlot,
  ContentSchedule,
};

module.exports = db;
