const express = require("express")
const router = express.Router()

const mongoose = require("mongoose")
    require("../models/Postagem")
    require("../models/Categoria")
    require("../models/Cassino")

const Postagem = mongoose.model("postagens")
const Categoria = mongoose.model("categorias")
const Cassino = mongoose.model("cassinos")

const path = require("path")
const moment = require("moment")
const uploadCassino = require("../helpers/uploadCassino")

const { Storage } = require('@google-cloud/storage')
const storage = new Storage({
    projectId: 'guru-374616',
    keyFilename: './config/guru-374616-9bf213e88ded.json'
})

const bucket = storage.bucket('uploads-node')

//Deixar o bucket publico para consumir no front-end
async function makeBucketPublic() {
    await storage.bucket('uploads-node').makePublic()
}
makeBucketPublic().catch(console.error)


router.get("/", (req, res) => {
    Postagem.find().sort({createdAt: "DESC"}).then((postagens) => {
        res.render("blog/index", {postagens: postagens, title: "Blog"})
    })
})

router.get('/postagem/:id', (req, res) => {
    Postagem.findOne({_id: req.params.id}).populate("categoriaPostagem cassinoPostagem").then((postagem) => {
        res.render('blog/postagem', {postagem: postagem, title: postagem.tituloPostagem})
    }).catch((erro) => {
            req.flash("error_msg", "Houve um erro ao exibir a postagem")
            res.redirect("/")
        })
})

module.exports = router