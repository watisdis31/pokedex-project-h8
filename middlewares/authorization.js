const { UserTeam } = require("../models");

async function authorization(req, res, next) {
  try {
    const { id, teamId } = req.params;

    const teamPrimaryKey = id || teamId;

    const team = await UserTeam.findByPk(teamPrimaryKey);

    if (!team) {
      throw { name: "TeamNotFound" };
    }

    if (team.UserId !== req.user.id) {
      throw { name: "Forbidden" };
    }

    next();
  } catch (error) {
    next(error);
  }
}

module.exports = authorization;
