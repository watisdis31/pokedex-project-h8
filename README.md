# 📘 Pokedex Project API

A simple RESTful API built with **Node.js** and **Express** — designed to serve Pokémon-related data for use in frontend apps or learning projects.

## 🚀 Features

✨ Basic Express server setup  
✨ Cross-origin support (CORS)  
✨ JSON request body handling  
✨ Centralized routing and error handling  

---

## 🧱 Tech Stack

- **Node.js**  
- **Express**  
- **Sequelize (ORM)**  
- **PostgreSQL** (via `pg` / `pg-hstore`)  
- **Axios** (for external requests)  
- **dotenv** (for environment variables)  
- **bcryptjs** & **jsonwebtoken** (for auth via tokens)  
- **Jest** & **Supertest** (for testing)  
- **Nodemon** (dev server reload)

---


- `app.js` — entry point for the Express application  
- `controllers/` — route handlers implementing API logic  
- `routes/` — Express router definitions mapping URLs to controllers  
- `middlewares/` — custom middleware (e.g., error handling)  
- `models/` — Sequelize models representing database tables  
- `migrations/` — database schema setup  
- `__tests__/` — tests using Jest + Supertest  
- `config/` — environment + database connection configs  

---

## 🛠️ Getting Started

### Prerequisites

Make sure you have the following installed on your system:

- Node.js (v14+)  
- npm (comes with Node.js)  
- PostgreSQL (for database)  

---

### Installation

1. **Clone the repo**  
```bash
git clone https://github.com/watisdis31/pokedex-project-h8.git
```

2. **Install dependencies**  
```bash
npm install
```

3. Setup your .env file
   ```bash
   PORT=3000
   DATABASE_URL=postgres://user:pass@host:port/dbname
   JWT_SECRET=yourSecretKey
   ```

4. Migrate database
   ```bash
   npx sequelize-cli db:migrate
   ```
   
5. Start the server
   ```bash
   npm start
   ```

## 📖 API Endpoints

### **Authentication**

| Method | Endpoint        | Description                       | Success Response Example                  | Error Response Example                               |
|--------|----------------|-----------------------------------|------------------------------------------|------------------------------------------------------|
| POST   | `/login`       | Authenticate user and return JWT  | `{ "token": "jwt_token_here" }`          | `{ "message": "Invalid email/password" }` (401)     |
| POST   | `/register`    | Create a new user                 | `{ "id": 1, "email": "user@mail.com" }`  | `{ "message": "Email already used" }` (400)        |

### **Pokémon Data**

| Method | Endpoint             | Description                 | Success Response Example                                 | Error Response Example                                     |
|--------|--------------------|-----------------------------|---------------------------------------------------------|------------------------------------------------------------|
| GET    | `/pokemons`         | List all Pokémon            | `[ { "id": 1, "name": "Pikachu" }, ... ]`             | `{ "message": "Internal Server Error" }` (500)            |
| GET    | `/pokemons/:id`     | Get Pokémon by ID           | `{ "id": 1, "name": "Pikachu" }`                       | `{ "message": "Data not found" }` (404)                   |
| POST   | `/pokemons`         | Add new Pokémon             | `{ "id": 25, "name": "Pikachu" }`                     | `{ "message": "Pokemon already exists" }` (400)           |
| PUT    | `/pokemons/:id`     | Update Pokémon data         | `{ "id": 25, "name": "Raichu" }`                       | `{ "message": "Data not found" }` (404)                   |
| DELETE | `/pokemons/:id`     | Remove a Pokémon            | `{ "message": "Pokemon deleted successfully" }`        | `{ "message": "Data not found" }` (404)                   |

> *(Adjust endpoints and response examples based on your actual controllers.)*

---

## 🛠️ Error Handling

All API errors are processed via a centralized error handler:

| Error Name                               | Status Code | Message                                |
|------------------------------------------|------------|----------------------------------------|
| `SequelizeValidationError` / `SequelizeUniqueConstraintError` | 400 | Error from validation: message from Sequelize |
| `SequelizeDatabaseError`                  | 400        | Invalid input                           |
| `Unauthorized`                            | 401        | Unauthorized                             |
| `UnauthorizedLogin`                       | 401        | Invalid email/password                   |
| `JsonWebTokenError` / `TokenExpiredError` | 401        | Unauthorized                             |
| `DuplicateBookmark`                        | 400        | Pokemon already bookmarked               |
| `BadRequest`                              | 400        | pokemonId is required                     |
| `GoogleBadRequest`                         | 400        | googleToken is required                   |
| `TeamFull`                                | 400        | Team already has 6 Pokemon               |
| `PokemonAlreadyInTeam`                     | 400        | Pokemon already in this team             |
| `Forbidden`                                | 403        | You are not allowed                       |
| `NotFound` / `TeamNotFound`               | 404        | Data not found                            |
| `PokemonNotInTeam`                         | 404        | Pokemon not found in this team           |
| *Any other error*                          | 500        | Internal Server Error                     |

> Example usage in Express:

```javascript
const express = require("express");
const app = express();
const errorHandler = require("./middlewares/errorHandler");

app.use(express.json());

// Routes
app.use("/pokemons", require("./routes/pokemons"));
app.use("/auth", require("./routes/auth"));

// Global error handler
app.use(errorHandler);
