"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class UserTeam extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      UserTeam.belongsTo(models.User);
      UserTeam.hasMany(models.TeamPokemon, {
        onDelete: "CASCADE",
      });
    }
  }
  UserTeam.init(
    {
      name: DataTypes.STRING,
      UserId: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: "UserTeam",
    },
  );
  return UserTeam;
};
