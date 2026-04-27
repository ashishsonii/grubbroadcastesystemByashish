const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Content = sequelize.define('Content', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Title is required' },
        len: { args: [3, 255], msg: 'Title must be at least 3 characters' },
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    subject: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Subject is required' },
      },
      set(value) {
        // Normalize subject to lowercase
        this.setDataValue('subject', value ? value.toLowerCase().trim() : value);
      },
    },
    file_url: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: { msg: 'File URL is required' },
      },
    },
    file_type: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    file_size: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    uploaded_by: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    status: {
      type: DataTypes.ENUM('uploaded', 'pending', 'approved', 'rejected'),
      allowNull: false,
      defaultValue: 'pending',
    },
    rejection_reason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    approved_by: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    approved_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    start_time: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    end_time: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  }, {
    tableName: 'content',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
    indexes: [
      { fields: ['uploaded_by'] },
      { fields: ['status'] },
      { fields: ['subject'] },
      { fields: ['approved_by'] },
      { fields: ['start_time', 'end_time'] },
    ],
  });

  return Content;
};
