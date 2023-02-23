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

/*
module.exports = (multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => {
          cb(null, "./public/uploads/logoCassino")
        },
        filename: (req, file, cb) => {
            crypto.randomBytes(16, (error, hash) => {
                if (error) {
                    cb(null, false)
                }
                cb(null, `${hash.toString("hex")}${path.extname(file.originalname)}`)
            })
        }
    }),
    fileFilter: (req, file, cb) => {
        const extensaoIMG = ['image/png', 'image/jpg', 'image/jpeg'].find(formatoAceito => formatoAceito == file.mimetype)

        if(extensaoIMG){
            return cb(null, true)
        } else {
            return cb(null, false)
        }

    }
}))
*/