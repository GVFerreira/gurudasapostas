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
        app.get("/", (req, res) => {
            Cassino.find().sort({createdAt: "DESC"}).then((cassinos) => {
                const title = "Home"
                const metaDescription = `Todas as informações sobre as melhores casas de apostas esportivas no país. Conheça todas as notícias sobre a Lei do Jogo Online no Brasil. Aprenda a se tornar um apostador de alto nível com os nossos guias de apostas gratuitos. Veja as listas dos Bônus que você não pode perder!`
                res.render("index", {cassinos: cassinos, title, metaDescription})
            }).catch((erro) => {
                    req.flash("error_msg", "Houve um erro ao listar os casssinos")
                    res.redirect("/")
                })
        })

        app.get("/cassinos" , (req, res) => {
            Cassino.find().sort({createdAt: "DESC"}).then((cassinos) => {
                const title = "Cassinos"
                res.render("cassinos", {cassinos: cassinos, title})
            }).catch((erro) => {
                    req.flash("error_msg", "Houve um erro ao listar os casssinos")
                    res.redirect("/")
                })
        })

        app.get("/bonus" , (req, res) => {
            Cassino.find().sort({createdAt: "DESC"}).then((cassinos) => {
                const title = "Bônus de cadastro" 
                res.render("bonus", {cassinos: cassinos, title})
            }).catch((erro) => {
                    req.flash("error_msg", "Houve um erro ao listar os casssinos")
                    res.redirect("/")
                })
        })

        app.get("/analiseCassino/:id", (req, res) => {
            Cassino.findOne({_id: req.params.id}).then((cassino) => {
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

        app.get("/404", (req, res) => {
            res.send("Erro 404!", {title: "Erro 404"})
        })

        
    //Rotas alternativas
        app.use("/admin", /*isAdmin,*/ admin)
        app.use("/users", users)
        app.use("/blog", blog)

//Outros
    app.listen(process.env.PORT || 8000, () => {
        console.log("Server ON!")
    })

