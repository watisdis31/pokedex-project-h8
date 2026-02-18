const { Team } = require("../models");

async function authorization(req, res, next) {
  try {
    const { id, teamId } = req.params;

    const teamPrimaryKey = id || teamId;

    const team = await Team.findByPk(teamPrimaryKey);

    if (!team) {
      throw { name: "NotFound" };
    }

    if (team.userId !== req.user.id) {
      throw { name: "Forbidden" };
    }

    next();
  } catch (error) {
    next(error);
  }
}

module.exports = authorization;
