function errorHandler(err, req, res, next) {
  console.log(err);

  switch (err.name) {
    case "SequelizeValidationError":
    case "SequelizeUniqueConstraintError":
      res.status(400).json({ message: err.errors[0].message });
      break;

    case "SequelizeDatabaseError":
      res.status(400).json({ message: "Invalid input" });
      break;
    

    case "Unauthorized":
      res.status(401).json({ message: "Unauthorized" });
      break;

    case "UnauthorizedLogin":
      res.status(401).json({ message: "Invalid email/password" });
      break;

    case "JsonWebTokenError":
    case "TokenExpiredError":
      res.status(401).json({ message: "Unauthorized" });
      break;

    case "DuplicateBookmark":
      res.status(400).json({ message: "Pokemon already bookmarked" });
      break;

    case "BadRequest":
      res.status(400).json({ message: "pokemonId is required" });
      break;

    case "BadRequestGithub":
      res.status(400).json({ message: "No code provided" });
      break;

    case "GoogleBadRequest":
      res.status(400).json({ message: "googleToken is required" });
      break;

    case "TeamFull":
      res.status(400).json({ message: "Team already has 6 Pokemon" });
      break;

    case "PokemonAlreadyInTeam":
      res.status(400).json({ message: "Pokemon already in this team" });
      break;

    case "Forbidden":
      res.status(403).json({ message: "You are not allowed" });
      break;

    case "NotFound":
    case "TeamNotFound":
      res.status(404).json({ message: "Data not found" });
      break;

    case "PokemonNotInTeam":
      res.status(404).json({ message: "Pokemon not found in this team" });
      break;

    default:
      res.status(500).json({ message: "Internal Server Error" });
  }
}

module.exports = errorHandler;
