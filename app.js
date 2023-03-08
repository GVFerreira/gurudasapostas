//Carregando módulos
    const express = require("express")
    const cors = require("cors")
    require('dotenv').config()
    const handlebars = require("express-handlebars")
    const handle = handlebars.create({
        defaultLayout: "main",
        runtimeOptions: {
            allowProtoPropertiesByDefault: true,
            allowProtoMethodsByDefault: true,
        },
        helpers: {
            formatDate: (date) => {
                return moment(date).format('DD/MM/YYYY')
            }
        }
    })
    const moment = require("moment")
    const bodyParser = require("body-parser")
    const app = express()
    const admin = require("./routes/admin")
    const users = require("./routes/users")
    const blog = require("./routes/blog")
    const path = require("path")
    const mongoose = require("mongoose")
    require("./models/Cassino")
    require("./models/Categoria")
    require("./models/Postagem")
    const Cassino = mongoose.model("cassinos")
    const Categoria = mongoose.model("categorias")
    const Postagem = mongoose.model("postagens")
    const session = require("express-session")
    const flash = require("connect-flash")
    const multer  = require('multer')
    const uploadLogo = require("./helpers/uploadCassino")
    const uploadCapa = require("./helpers/uploadPostagem")
    const compression = require('compression')

    //autenticação
    const passport = require("passport")
        require("./config/auth")(passport)

    //db
    // const db = require("./config/db")
    const {isAdmin} = require("./helpers/isAdmin")

//Configs
    //Sessão
        app.use(cors({origin: 'https://gurudasapostas.com.br'}))
        app.use(session({
            secret: process.env.SECRET_SESSION,
            resave: true,
            saveUninitialized: true
        }))
        
        app.use(compression())
        app.use(passport.initialize())
        app.use(passport.session())

        app.use(flash())

    //Middleware
        app.use((req, res, next) => {
            res.locals.success_msg = req.flash("success_msg")
            res.locals.error_msg = req.flash("error_msg")
            res.locals.error = req.flash("error")
            res.locals.user = req.user || null
            next()
        })
          
        app.use(cookieconsent.init(cookieOptions));
          

    //Body Parser
        app.use(bodyParser.urlencoded({extended: true}))
        app.use(bodyParser.json())

    //Handlebars
        app.engine("handlebars", handle.engine)
        app.set("view engine", "handlebars")

    //Mongoose
        mongoose.connect(`mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.bbkeaad.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`).then(() => {
            console.log("MongoDB connected...")
        }).catch((erro) => {
            console.log(`Erro: ${erro}`)
        })

    //Public
        app.use(express.static(path.join(__dirname, "public")))


//Rotas
    //Pública
        app.get("/", async (req, res) => {
            const title = "Home"
            const metaDescription = `Todas as informações sobre as melhores casas de apostas esportivas no país. Conheça todas as notícias sobre a Lei do Jogo Online no Brasil. Aprenda a se tornar um apostador de alto nível com os nossos guias de apostas gratuitos. Veja as listas dos Bônus que você não pode perder!`

            const todosCassinos = await Cassino.find().sort({orderList: "ASC"})
            const melhoresCassinos = await Cassino.find({incMelhores: 1}).sort({orderList: "ASC"})
            const brasilCassinos = await Cassino.find({incBrasil: 1}).sort({orderList: "ASC"})
            const novosCassinos = await Cassino.find({incNovos: 1}).sort({orderList: "ASC"})
            res.render("index", {todosCassinos, melhoresCassinos, brasilCassinos, novosCassinos, title, metaDescription})
        })

        app.get("/cassinos", async (req, res) => {
            const title = "Cassinos"
            const todosCassinos = await Cassino.find().sort({orderList: "ASC"})
            const bonusCassinos = await Cassino.find({bonusGratis: 1}).sort({orderList: "ASC"})
            res.render("cassinos", {todosCassinos, bonusCassinos, title})
        })

        app.get("/bonus", async (req, res) => {
            const title = "Bônus de cadastro" 
            const todosCassinos = await Cassino.find().sort({orderList: "ASC"})
            const bonusCassinos = await Cassino.find({bonusGratis: 1}).sort({orderList: "ASC"})
            res.render("bonus", {todosCassinos, bonusCassinos, title})
        })

        app.get("/analiseCassino/:slug", (req, res) => {
            Cassino.findOne({slugCassino: req.params.slug}).then((cassino) => {
                const title = cassino.nomeCassino
                res.render("analiseCassino", {cassino: cassino, title})
            }).catch((erro) => {
                    req.flash("error_msg", "Houve um erro ao exibir a análise do cassino")
                    res.redirect("/")
                })
        })

        app.get("/baixar", (req, res) => {
            res.render("baixar")
        })

        app.get("/politica-privacidade", (req, res) => {
            res.render("politica-privacidade", {title: "Política de privacidade"})
        })

        app.get("/termos-condicoes", (req, res) => {
            res.render("termos-condicoes", {title: "Termos e condições de uso"})
        })

        app.get("/jogo-responsavel", (req, res) => {
            res.render("jogo-responsavel", {title: "Jogo responsável"})
        })

        
        //Rotas alternativas
        app.use("/admin", /*isAdmin,*/ admin)
        app.use("/users", users)
        app.use("/blog", blog)
        app.use((req, res, next) => {
            res.status(404).render("404", {title: "Error 404"})
        })

//Outros
    app.listen(process.env.PORT || 8000, () => {
        console.log("Server ON!")
    })

