const { DataTypes } = require("sequelize");
const db = require("./db");

const Poll = db.define("poll", {
  title: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [1, 200],
    },
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  shareLink: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true,
  },
  isPublished: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  isClosed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  creatorId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: "users",
      key: "id",
    },
  },
});

module.exports = Poll;
