const { UserTeam, TeamPokemon } = require("../models");
const axios = require("axios");
const { Op } = require("sequelize");

class TeamController {
  static async createTeam(req, res, next) {
    try {
      const { name } = req.body;

      const newTeam = await UserTeam.create({
        name,
        UserId: req.user.id,
      });

      res.status(201).json(newTeam);
    } catch (error) {
      next(error);
    }
  }

  static async getMyTeams(req, res, next) {
    try {
      const userId = req.user.id;

      let {
        page = 1,
        limit = 5,
        sort = "createdAt",
        order = "DESC",
        search,
      } = req.query;

      page = +page;
      limit = +limit;

      const offset = (page - 1) * limit;

      const whereCondition = {
        UserId: userId,
      };

      if (search) {
        whereCondition.name = {
          [Op.iLike]: `%${search}%`,
        };
      }

      const { count, rows } = await UserTeam.findAndCountAll({
        where: whereCondition,
        limit,
        offset,
        order: [[sort, order]],
      });

      const totalPages = Math.ceil(count / limit);

      res.status(200).json({
        totalData: count,
        totalPages,
        currentPage: page,
        data: rows,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getTeamDetail(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const team = await UserTeam.findOne({
        where: {
          id: id,
          UserId: userId,
        },
        include: {
          model: TeamPokemon,
        },
      });

      if (!team) {
        throw { name: "TeamNotFound" };
      }

      const pokemonPromises = team.TeamPokemons.map((tp) =>
        axios.get(`https://pokeapi.co/api/v2/pokemon/${tp.pokemonId}`),
      );

      const responses = await Promise.all(pokemonPromises);

      const pokemonDetails = responses.map((res) => ({
        id: res.data.id,
        name: res.data.name,
        types: res.data.types.map((t) => t.type.name),
      }));

      res.status(200).json({
        id: team.id,
        name: team.name,
        totalPokemon: pokemonDetails.length,
        pokemons: pokemonDetails,
      });
    } catch (error) {
      next(error);
    }
  }

  static async addPokemon(req, res, next) {
    try {
      const teamId = +req.params.teamId;
      const { pokemonId } = req.body;

      const team = await UserTeam.findOne({
        where: {
          id: teamId,
          UserId: req.user.id,
        },
      });

      if (!team) throw { name: "TeamNotFound" };

      const totalPokemon = await TeamPokemon.count({
        where: { UserTeamId: teamId },
      });

      console.log("TOTAL:", totalPokemon);

      if (totalPokemon >= 6) {
        throw { name: "TeamFull" };
      }

      const existing = await TeamPokemon.findOne({
        where: {
          UserTeamId: teamId,
          pokemonId,
        },
      });

      if (existing) {
        throw { name: "PokemonAlreadyInTeam" };
      }

      const newPokemon = await TeamPokemon.create({
        UserTeamId: teamId,
        pokemonId,
      });

      res.status(201).json(newPokemon);
    } catch (error) {
      next(error);
    }
  }

  static async removePokemon(req, res, next) {
    try {
      const { teamId, pokemonId } = req.params;
      const userId = req.user.id;

      const team = await UserTeam.findOne({
        where: {
          id: teamId,
          UserId: userId,
        },
      });

      if (!team) {
        throw { name: "TeamNotFound" };
      }

      const teamPokemon = await TeamPokemon.findOne({
        where: {
          UserTeamId: teamId,
          pokemonId: pokemonId,
        },
      });

      if (!teamPokemon) {
        throw { name: "PokemonNotInTeam" };
      }

      await teamPokemon.destroy();

      res.status(200).json({ message: "Pokemon removed from team" });
    } catch (error) {
      next(error);
    }
  }

  static async deleteTeam(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const team = await UserTeam.findOne({
        where: {
          id: id,
          UserId: userId,
        },
      });

      if (!team) {
        throw { name: "TeamNotFound" };
      }

      await TeamPokemon.destroy({
        where: {
          UserTeamId: id,
        },
      });

      await team.destroy();

      res.status(200).json({
        message: "Team deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = TeamController;
