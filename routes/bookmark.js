const BookmarkController = require("../controllers/bookmarkController");

const router = require("express").Router();

router.get("/", BookmarkController.getBookmarks);
router.post("/", BookmarkController.addBookmark);
router.delete("/:pokemonId", BookmarkController.deleteBookmark);

module.exports = router;
