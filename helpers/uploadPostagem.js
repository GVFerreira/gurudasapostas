const multer  = require('multer')
const path = require("path")
const crypto = require("crypto")

module.exports = multer({
    fileFilter: (req, file, cb) => {
        const extensaoIMG = [
            'image/png',
            'image/jpg',
            'image/jpeg'
        ].find(formatoAceito => formatoAceito == file.mimetype)
        extensaoIMG ? cb(null, true) : cb(null,false)
    }
})