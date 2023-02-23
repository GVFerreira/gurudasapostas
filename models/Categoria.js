const mongoose = require("mongoose")
const Schema = mongoose.Schema

const Categoria = new Schema({
    nomeCategoria: {
        type: String,
        required: true
    },
    slugCategoria: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now()
    }
})

mongoose.model("categorias", Categoria)