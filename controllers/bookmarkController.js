const {Bookmark} = require('../models')

class BookmarkController {
    static async getBookmarks(req, res, next) {
        try {
            const bookmarks = await Bookmark.findAll({
                where: {UserId: req.user.id}
            })

            res.status(200).json(bookmarks)
        } catch (error) {
            next(error)
        }
    }

    static async addBookmark(req, res, next) {
        try {
            const {pokemonId} = req.body

            if (!pokemonId) {
                throw {name: 'BadRequest'}
            }

            const existing = await Bookmark.findOne({
                where: {
                    UserId: req.user.id,
                    pokemonId
                }
            })

            if (existing) {
                throw {name: 'DuplicateBookmark'}
            }

            const bookmark = await Bookmark.create({
                pokemonId,
                UserId: req.user.id
            })

            res.status(201).json(bookmark)
        } catch (error) {
            next(error)
        }
    }

    static async deleteBookmark(req, res, next) {
        try {
            const {pokemonId} = req.params

            const deleted = await Bookmark.destroy({
                where: {
                    UserId: req.user.id,
                    pokemonId
                }
            })

            if (!deleted) {
                throw {name: 'NotFound'}
            }

            res.status(200).json({message: 'Bookmark deleted'})
        } catch (error) {
            next(error)
        }
    }
}

module.exports = BookmarkController