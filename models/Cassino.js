const mongoose = require("mongoose")
const Schema = mongoose.Schema

const Cassino = new Schema({
    orderList: {
        type: Number,
        default: 50
    },
    nomeCassino:{
        type: String,
        required: true
    },
    slugCassino:{
        type: String,
        required: true
    },
    imgCassino: {
        type: String
    },
    colorCard: {
        type: String,
        default: "#FFFFFF"
    },
    tagCard: {
        type: String
    },
    classCassino: {
        type: String,
        required: true
    },
    tipoCassino1: {
        type: String
    },
    tipoCassino2: {
        type: String
    },
    tipoCassino3: {
        type: String
    },
    adjCassino1: {
        type: String,
        required: true 
    },
    adjCassino2: {
        type: String,
        required: true 
    },
    adjCassino3: {
        type: String,
        required: true 
    },
    formaPagamento1: {
        type: String
    },
    formaPagamento2: {
        type: String,
    },
    formaPagamento3: {
        type: String,
    },
    formaPagamento4: {
        type: String,
    },
    formaPagamento5: {
        type: String,
    },
    formaPagamento6: {
        type: String,
    },
    formaPagamento7: {
        type: String,
    },
    formaPagamento8: {
        type: String,
    },
    formaPagamento9: {
        type: String,
    },
    formaPagamento10: {
        type: String,
    },
    valorBonus: {
        type: Number,
        required: true
    },
    linkCassino: {
        type: String,
        required: true
    },
    licencasCassino: {
        type: String,
        required: true
    },
    suporte1: {
        type: String,
    },
    suporte2: {
        type: String,
    },
    suporte3: {
        type: String,
    },
    app1: {
        type: String,
    },
    app2: {
        type: String,
    },
    depositoMinimo: {
        type: String,
        required: true
    },
    saqueMinimo: {
        type: String,
        required: true
    },
    bonusGratis: {
        type: Number,
        required: true
    },
    incMelhores: {
        type: Number,
        required: true
    },
    incNovos: {
        type: Number,
        required: true
    },
    incBrasil: {
        type: Number,
        required: true
    },
    analiseCassino: {
        type: String,
        required: true
    },
    topicoAnalise: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
})

mongoose.model("cassinos", Cassino)