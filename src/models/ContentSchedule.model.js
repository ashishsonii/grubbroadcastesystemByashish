const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ContentSchedule = sequelize.define('ContentSchedule', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    content_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'content',
        key: 'id',
      },
    },
    slot_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'content_slots',
        key: 'id',
      },
    },
    rotation_order: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
      },
    },
    duration: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 5,
      validate: {
        min: 1,
        max: 60,
      },
    },
  }, {
    tableName: 'content_schedule',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
    indexes: [
      { fields: ['content_id'] },
      { fields: ['slot_id'] },
      { fields: ['slot_id', 'rotation_order'] },
    ],
  });

  return ContentSchedule;
};
