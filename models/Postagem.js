const mongoose = require("mongoose")
const Schema = mongoose.Schema

const Postagem = new Schema({
    tituloPostagem: {
        type: String,
        required: true
    },
    slugPostagem: {
        type: String,
        required: true
    },
    descPostagem: {
        type: String,
        required: true
    },
    imgPostagem: {
        type: String,
    },
    conteudoPostagem: {
        type: String,
        required: true
    },
    topicoPostagem: {
        type: String,
        required: true
    },
    categoriaPostagem: {
        type: Schema.Types.ObjectId,
        ref: "categorias",
        required: true
    },
    cassinoPostagem: {
        type: Schema.Types.ObjectId,
        ref: "cassinos",
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now()
    }
})

mongoose.model("postagens", Postagem)