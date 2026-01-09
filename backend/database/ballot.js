const { DataTypes } = require("sequelize");
const db = require("./db");

const Ballot = db.define("ballot", {
  pollId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: "polls",
      key: "id",
    },
  },
  rankings: {
    type: DataTypes.JSONB,
    allowNull: false,
    // rankings is an array of objects: [{ optionId: 1, rank: 1 }, { optionId: 2, rank: 2 }, ...]
    validate: {
      isArray(value) {
        if (!Array.isArray(value)) {
          throw new Error("Rankings must be an array");
        }
      },
    },
  },
  voterIdentifier: {
    type: DataTypes.STRING,
    allowNull: true,
    // Optional identifier to prevent duplicate votes (e.g., IP address, session ID)
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: "users",
      key: "id",
    },
    // User ID of the authenticated user who voted
  },
});

module.exports = Ballot;
