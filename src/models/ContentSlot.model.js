const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ContentSlot = sequelize.define('ContentSlot', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    subject: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Subject is required' },
      },
      set(value) {
        this.setDataValue('subject', value ? value.toLowerCase().trim() : value);
      },
    },
    teacher_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
  }, {
    tableName: 'content_slots',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
    indexes: [
      { unique: true, fields: ['subject', 'teacher_id'] },
    ],
  });

  return ContentSlot;
};
