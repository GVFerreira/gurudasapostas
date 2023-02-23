const express = require("express")
const router = express.Router()

const mongoose = require("mongoose")
    require("../models/Cassino")
    require("../models/User")
    require("../models/Categoria")
    require("../models/Postagem")

const Cassino = mongoose.model("cassinos")
const User = mongoose.model("users")
const Categoria = mongoose.model("categorias")
const Postagem = mongoose.model("postagens")

const multer  = require('multer')
const { Storage } = require('@google-cloud/storage')
const uploadCassino = require("../helpers/uploadCassino") 
const uploadCapa = require("../helpers/uploadPostagem") 

const localStrategy = require("passport-local").Strategy
const path = require("path")
const moment = require("moment")
const bcrypt = require("bcryptjs")
const fs = require('fs')
const crypto = require("crypto")


const {isAdmin} = require("../helpers/isAdmin")

//rota inicial
router.get("/", (req, res) => {
    const title = "Admin"
    res.render("admin/index", {title})
})


/*====================================USUÁRIO=================================== */

router.get("/cadastrarUsuario", (req, res) => {
    const title = "Cadastro de usuário"
    res.render("admin/cadastrarUsuario", {title})
})

//Rota que recebe os dados do novo usuário, que são inseridos no formulário de cadastro
router.post("/cadastrandoUsuario", (req, res) => {
    let errors = []

    if(!req.body.name || typeof !req.body.name == undefined || req.body.name == null) {
        errors.push({text: "Nome inválido"})
    }

    if(!req.body.email || typeof !req.body.email == undefined || req.body.email == null) {
        errors.push({text: "E-mail inválido"})
    }

    if(req.body.password.length < 4) {
        errors.push({text: "Senha muito curta"})
    }

    if(req.body.password != req.body.password2) {
        errors.push({text: "As senhas não são iguais"})
    }

    if(errors.length > 0) {
        res.render("admin/cadastrarUsuario", {errors: errors})
    }else {
        User.findOne({email: req.body.email}).then((user) => {
            if(user) {
                req.flash("error_msg", "E-mail já cadastrado")
                res.redirect("/admin")
            } else{
                const newUser = new User({
                    name: req.body.name,
                    email: req.body.email,
                    password: req.body.password
                })

                //criptografar senha
                bcrypt.genSalt(10, (error, salt) => {
                    bcrypt.hash(newUser.password, salt, (error, hash) => {
                        if(error){
                            req.flash("error_msg", "Houve um erro durante o registro do usuário")
                            res.redirect("/admin")
                        } 

                        newUser.password = hash

                        newUser.save().then(() => {
                            req.flash("success_msg", "Usuário registrado com sucesso")
                            res.redirect("/admin")
                        }).catch(() => {
                            req.flash("error_msg", "Houve um erro ao registrar o seu uusário")
                            res.redirect("/admin")
                        })
                    })
                })
            }
        }).catch((err) => {
            req.flash("error_msg", "Houve um erro interno")
            res.redirect("admin/cadastrarUsuario")
        })
    }
})

router.get('/consultarUsuarios', (req, res) => {
    User.find().sort({createdAt: 'DESC'}).then((users) => {
        const title = "Consulta de usuários"
        res.render('admin/consultarUsuarios', {users: users, title})
    }).catch((err) => {
        req.flash('error_msg', 'Houve um erro ao listar os usuários' + err)
        res.redirect('/admin')
    })
})

router.get('/editarUsuario/:id' ,(req, res) => {
    User.findOne({_id: req.params.id}).then((user) => {
        const title = "Editando usuário"
        res.render('admin/editarUsuario', {user: user, title})
    }).catch((err) => {
        req.flash('error_msg', 'Houve um erro ao carregar o usuário a ser editado')
        res.redirect('/admin/consultarUsuarios')
    })
})

router.post('/editandoUsuario', (req, res) => {
    User.findOne({_id: req.body.id}).then((user) => {
        user.name = req.body.name
        user.email = req.body.email
        user.password = req.body.password
        user.password2 = req.body.password2
        
        let errors = []

        if(user.password != user.password2) {
            errors.push({text: 'As senhas digitadas não coincidem'})
        }

        if(errors.length > 0) {
            res.render('admin/editarUsuario', {errors: errors, user: user})
        } else {
            bcrypt.genSalt(10, (error, salt) => {
                bcrypt.hash(user.password, salt, (error, hash) => {
                    if(error){
                        req.flash("error_msg", "Houve um erro durante o registro do usuário")
                        res.redirect("/admin")
                    } 
    
                    user.password = hash
    
                    user.save().then(() => {
                        req.flash("success_msg", "Usuário registrado com sucesso")
                        res.redirect('/admin/consultarUsuarios')
                    }).catch((err) => {
                        req.flash("error_msg", "Houve um erro ao registrar o seu usuário"+ err)
                        res.redirect('/admin')
                    })
                })
            })
        }
  
    }).catch((err) => {
            req.flash('error_msg', 'Não foi possível encontrar esse usuário' + err)
            res.redirect('/admin/consultarUsuarios')
    })
})

router.get("/deletarUsuario/:id", (req, res) => {
    User.deleteOne({_id: req.params.id}).then(() => {
        req.flash("success_msg", "Usuário excluído com sucesso")
        res.redirect("/admin/consultarUsuarios")
    }).catch(() => {
            req.flash("error_msg", "Houve um erro ao deletar esse usuário")
            res.redirect("/admin")
        })
})



/*====================================CASSINO=================================== */
router.get("/cadastrarCassino", (req, res) => {
    const title = "Cadastro de cassino"
    res.render("admin/cadastrarCassino", {title})
})

router.post("/cadastrandoCassino", uploadCassino.single('imgCassino'), (req, res) => {
    if(req.file === undefined) {
        req.flash('error_msg', 'O arquivo não foi enviado com sucesso')
        res.redirect('/admin/consultarCassinos')
    } else {
        const storage = new Storage({
            projectId: 'guru-374616',
            keyFilename: './config/guru-374616-9bf213e88ded.json'
        })
    
        //renomeando o arquivo
        const fileId = crypto.randomBytes(16).toString("hex")
        req.file.filename = `${fileId}-${req.file.originalname}`
        
        
        const bucket = storage.bucket('uploads-media')
    
        //Deixar o bucket publico para consumir no front-end
        async function makeBucketPublic() {
            await storage.bucket('uploads-media').makePublic()
        }
        makeBucketPublic().catch(console.error)
    
        const file = bucket.file(req.file.filename)
        const stream = file.createWriteStream({
            metadata: {
                contentType: req.file.mimetype
            }
        })
    
        stream.on('error', (err) => {
            console.log(err)
            res.status(500)
        });
    
        stream.on('finish', () => {
            console.log(`Imagem ${req.file.filename} salva no bucket.`)
        })
    
        stream.end(req.file.buffer)
    
        const newCassino = new Cassino({
            nomeCassino: req.body.nomeCassino,
            imgCassino: req.file.filename,
            classCassino: req.body.classCassino,
            tipoCassino1: req.body.tipoCassino1,
            tipoCassino2: req.body.tipoCassino2,
            tipoCassino3: req.body.tipoCassino3,
            adjCassino1: req.body.adjCassino1,
            adjCassino2: req.body.adjCassino2,
            adjCassino3: req.body.adjCassino3,
            formaPagamento1: req.body.formaPagamento1,
            formaPagamento2: req.body.formaPagamento2,
            formaPagamento3: req.body.formaPagamento3,
            formaPagamento4: req.body.formaPagamento4,
            formaPagamento5: req.body.formaPagamento5,
            formaPagamento6: req.body.formaPagamento6,
            formaPagamento7: req.body.formaPagamento7,
            valorBonus: req.body.valorBonus,
            bonusGratis: req.body.bonusGratis,
            linkCassino: req.body.linkCassino,
            licencasCassino: req.body.licencasCassino,
            suporte1: req.body.suporte1,
            suporte2: req.body.suporte2,
            suporte3: req.body.suporte3,
            app1: req.body.app1,
            app2: req.body.app2,
            depositoMinimo: req.body.depositoMinimo,
            saqueMinimo: req.body.saqueMinimo,
            incMelhores: req.body.incMelhores,
            incNovos: req.body.incNovos,
            incBrasil: req.body.incBrasil,
            analiseCassino: req.body.analiseCassino,
            topicoAnalise: req.body.topicoAnalise,
        })
        
        newCassino.save().then(() => {
            req.flash("success_msg", "Cadastrado com sucesso")
            res.redirect("/admin/consultarCassinos")
        }).catch((error) => {
            req.flash("error_msg", "Erro ao cadastrar: " + error)
            res.redirect("/admin/")
        })
    }
})

router.get("/consultarCassinos", (req, res) => {
    Cassino.find().sort({createdAt: "DESC"}).then((cassinos) => {
        const title = "Consulta de cassinos"
        res.render("admin/consultarCassinos", {cassinos: cassinos, title})
    }).catch((erro) => {
            req.flash("error_msg", "Houve um erro ao listar os casssinos")
            res.redirect("/admin")
        })
})

router.get("/editarCassino/:id", (req, res) => {
    Cassino.findOne({_id: req.params.id}).then((cassino) => {
        const title = "Editando cassino"
        res.render("admin/editarCassino", {cassino: cassino, title})
    }).catch((erro) => {
        req.flash("error_msg", "Esse cassino não existe")
        res.redirect("/admin")
    })
})

router.post("/editandoCassino", uploadCassino.single('imgCassino'), (req, res) => {
    if(req.file === undefined) {
        Cassino.findOne({_id: req.body.id}).then((cassino) => {
            cassino.nomeCassino = req.body.nomeCassino,
            cassino.classCassino = req.body.classCassino,
            cassino.tipoCassino1 = req.body.tipoCassino1,
            cassino.tipoCassino2 = req.body.tipoCassino2,
            cassino.tipoCassino3 = req.body.tipoCassino3,
            cassino.adjCassino1 = req.body.adjCassino1,
            cassino.adjCassino2 = req.body.adjCassino2,
            cassino.adjCassino3 = req.body.adjCassino3,
            cassino.formaPagamento1 = req.body.formaPagamento1,
            cassino.formaPagamento2 = req.body.formaPagamento2,
            cassino.formaPagamento3 = req.body.formaPagamento3,
            cassino.formaPagamento4 = req.body.formaPagamento4,
            cassino.formaPagamento5 = req.body.formaPagamento5,
            cassino.formaPagamento6 = req.body.formaPagamento6,
            cassino.formaPagamento7 = req.body.formaPagamento7,
            cassino.valorBonus = req.body.valorBonus,
            cassino.bonusGratis = req.body.bonusGratis,
            cassino.linkCassino = req.body.linkCassino,
            cassino.licencasCassino = req.body.licencasCassino,
            cassino.suporte1 = req.body.suporte1,
            cassino.suporte2 = req.body.suporte2,
            cassino.suporte3 = req.body.suporte3,
            cassino.app1 = req.body.app1,
            cassino.app2 = req.body.app2,
            cassino.depositoMinimo = req.body.depositoMinimo,
            cassino.saqueMinimo = req.body.saqueMinimo,
            cassino.incMelhores = req.body.incMelhores,
            cassino.incNovos = req.body.incNovos,
            cassino.incBrasil = req.body.incBrasil,
            cassino.analiseCassino = req.body.analiseCassino,
            cassino.topicoAnalise = req.body.topicoAnalise,
    
            cassino.save().then(() => {
                req.flash("success_msg", "Cassino editado com sucesso")
                res.redirect("/admin/consultarCassinos")
            }).catch((err) => {
                req.flash("error_msg", "Houve um erro ao interno ao salvar a edição " + err)
                res.redirect("/admin/consultarCassinos")
            })
        })
    } else {
        const storage = new Storage({
            projectId: 'guru-374616',
            keyFilename: './config/guru-374616-9bf213e88ded.json'
        })
    
        const fileId = crypto.randomBytes(16).toString("hex")
        req.file.filename = `${fileId}-${req.file.originalname}`
        
        
        const bucket = storage.bucket('uploads-media')
    
        //Deixar o bucket publico para consumir no front-end
        async function makeBucketPublic() {
            await storage.bucket('uploads-media').makePublic()
        }
        makeBucketPublic().catch(console.error)
    
        const file = bucket.file(req.file.filename)
        const stream = file.createWriteStream({
            metadata: {
                contentType: req.file.mimetype
            }
        })
    
        stream.on('error', (err) => {
            console.log(err)
            res.status(500)
        });
    
        stream.on('finish', () => {
            console.log(`Imagem ${req.file.filename} salva no bucket.`)
        })
    
        stream.end(req.file.buffer)
        Cassino.findOne({_id: req.body.id}).then((cassino) => {
            cassino.nomeCassino = req.body.nomeCassino,
            cassino.imgCassino = req.file.filename,
            cassino.classCassino = req.body.classCassino,
            cassino.tipoCassino1 = req.body.tipoCassino1,
            cassino.tipoCassino2 = req.body.tipoCassino2,
            cassino.tipoCassino3 = req.body.tipoCassino3,
            cassino.adjCassino1 = req.body.adjCassino1,
            cassino.adjCassino2 = req.body.adjCassino2,
            cassino.adjCassino3 = req.body.adjCassino3,
            cassino.formaPagamento1 = req.body.formaPagamento1,
            cassino.formaPagamento2 = req.body.formaPagamento2,
            cassino.formaPagamento3 = req.body.formaPagamento3,
            cassino.formaPagamento4 = req.body.formaPagamento4,
            cassino.formaPagamento5 = req.body.formaPagamento5,
            cassino.formaPagamento6 = req.body.formaPagamento6,
            cassino.formaPagamento7 = req.body.formaPagamento7,
            cassino.valorBonus = req.body.valorBonus,
            cassino.bonusGratis = req.body.bonusGratis,
            cassino.linkCassino = req.body.linkCassino,
            cassino.licencasCassino = req.body.licencasCassino,
            cassino.suporte1 = req.body.suporte1,
            cassino.suporte2 = req.body.suporte2,
            cassino.suporte3 = req.body.suporte3,
            cassino.app1 = req.body.app1,
            cassino.app2 = req.body.app2,
            cassino.depositoMinimo = req.body.depositoMinimo,
            cassino.saqueMinimo = req.body.saqueMinimo,
            cassino.incMelhores = req.body.incMelhores,
            cassino.incNovos = req.body.incNovos,
            cassino.incBrasil = req.body.incBrasil,
            cassino.analiseCassino = req.body.analiseCassino,
            cassino.topicoAnalise = req.body.topicoAnalise,
    
            cassino.save().then(() => {
                req.flash("success_msg", "Cassino editado com sucesso")
                res.redirect("/admin/consultarCassinos")
            }).catch((err) => {
                req.flash("error_msg", "Houve um erro ao interno ao salvar a edição " + err)
                res.redirect("/admin/consultarCassinos")
            })
        }).catch((err) => {
            req.flash("error_msg", "Houve um erro ao editar o cassino " + err)
            res.redirect("/admin/consultarCassinos")
        })
    }
})

router.get("/deletarCassino/:id", (req, res) => {
    Cassino.deleteOne({_id: req.params.id}).then((cassino) => {
        req.flash("success_msg", "Cassino excluído com sucesso")
        res.redirect("/admin/consultarCassinos")
    }).catch((err) => {
        req.flash("error_msg", `Houve um erro ao deletar esse cassino: ${err}`)
        res.redirect("/admin")
    })
})

/*====================================BLOG=================================== */

/*=========== CATEGORIA =============*/

router.get("/cadastrarCategoria", (req, res) => {
    const title = "Cadastro de categoria"
    res.render("admin/cadastrarCategoria", {title})
})

router.post("/cadastrandoCategoria", (req, res) => {
    let errors = []

    //validando se o nome está vazio, indefinido ou nulo
    if(!req.body.nomeCategoria || typeof !req.body.nomeCategoria == undefined || req.body.nomeCategoria == null) {
        errors.push({text: "Nome inválido"})

        //validando se o nome é curto demais
    } else if(req.body.nomeCategoria.length < 3) {
        errors.push({text: "O nome inserido é muito pequeno"})
    }

    //verificando se ocorreu algum erro, senão cadastrará no banco de dados
    if(errors.length > 0) {
        res.render("admin/index", {errors: errors})
    } else {

        const newCategoria = new Categoria ({
            nomeCategoria: req.body.nomeCategoria,
            slugCategoria: req.body.nomeCategoria.toLowerCase().replace(/"|á|â|à|ã|ä"/g, "a").replace(/"|é|ê|è|ë"/g, "e").replace(/"|í|ì|î|ï"/g, "i").replace(/"|ó|ò|ô|õ|ø|ö"/g, "o").replace(/"|ú|ù|û|ü"/g, "u").replace(/ç/g, "c").replace(/ñ/g, "n").replace(/ý/g, "y").replace(/ /g, "-")
        })
    
        newCategoria.save().then(() => {
            req.flash("success_msg", "Categoria criada com sucesso")
            res.redirect("/admin")
        }).catch((error) => {
            req.flash("error_msg", "Houve um erro ao criar a categoria, tente novamente")
            res.render("admin/index")
        })
    }
})

router.get("/consultarCategorias", (req, res) => {
    Categoria.find().sort({createdAt: "DESC"}).then((categorias) => {
        const title = "Consulta de categorias"
        res.render("admin/consultarCategorias", {categorias: categorias, title})
    }).catch((erro) => {
            req.flash("error_msg", "Houve um erro ao listar as categorias")
            res.redirect("/admin")
        })
})

router.get("/editarCategoria/:id", (req, res) => {
    Categoria.findOne({_id: req.params.id}).then((categoria) => {
        const title = "Editando categoria"
        res.render("admin/editarCategoria", {categoria: categoria, title})
    }).catch((err) => {
        res.flash("error_msg", `Ocorreu um erro inesperado: ${err}`)
        res.redirect("/admin")
    })
})

router.post("/editandoCategoria", (req, res) => {
    Categoria.findOne({_id: req.body.id}).then((categoria) => {
        categoria.nomeCategoria = req.body.nomeCategoria
        categoria.slugCategoria = req.body.nomeCategoria.toLowerCase().replace(/"|á|â|à|ã|ä"/g, "a").replace(/"|é|ê|è|ë"/g, "e").replace(/"|í|ì|î|ï"/g, "i").replace(/"|ó|ò|ô|õ|ø|ö"/g, "o").replace(/"|ú|ù|û|ü"/g, "u").replace(/ç/g, "c").replace(/ñ/g, "n").replace(/ý/g, "y").replace(/ /g, "-")

        categoria.save().then(() => {
            req.flash("success_msg", "Categoria alterada com sucesso")
            res.redirect("/admin/consultarCategorias")
        }).catch((err) => {
            req.flash("error_msg", `Houve um erro ao editar a categoria. Tente novamente ${err}`)
            res.redirect("/admin")
        })
    }).catch((err) => {
        req.flash("error_msg", `Ocorreu um erro ao salvar a edição: ${err}`)
        res.redirect("/admin")
    })
})

router.get("/deletarCategoria/:id", (req, res) => {
    Categoria.deleteOne({_id: req.params.id}).then(() => {
        req.flash("success_msg", "Categoria excluída com sucesso")
        res.redirect("/admin/consultarCategorias")
    }).catch(() => {
            req.flash("error_msg", "Houve um erro ao deletar essa categoria")
            res.redirect("/admin")
        })
})


/*=========== POSTAGEM =============*/

router.get("/cadastrarPostagem", (req, res) => {
    Categoria.find().then((categorias) => {
        Cassino.find().then((cassinos) => {
            const title = "Cadastro de postagem"
            res.render("admin/cadastrarPostagem", {categorias: categorias, cassinos: cassinos, title})
        }).catch((err) => {
            req.flash("error_msg", "Houve um erro ao listar as categorias e postagens")
            res.redirect("admin/index")
        })
    }).catch(() => {
        req.flash("error_msg", "Houve um erro ao carregar o formulário")
        res.redirect("admin/index")
    })
    
})

router.post("/cadastrandoPostagem", uploadCapa.single('imgPostagem'), (req, res) => {
    if(req.file === undefined) {
        req.flash('error_msg', 'O arquivo não foi enviado com sucesso')
        res.redirect('/admin/consultarPostagens')
    } else {
        let errors = []
    
        //validando se o titulo da postagem está vazio, indefinido ou nulo
        if(!req.body.tituloPostagem || typeof !req.body.tituloPostagem == undefined || req.body.tituloPostagem == null){
            errors.push({text: "Título inválido"})
    
        //validando se o título da postagem é curto demais
        }else if(req.body.tituloPostagem.length < 3) {
            errors.push({text: "O título inserido é muito pequeno"})
        }
    
        //validando a categoria
        if(req.body.categoriaPostagem == 0) {
            errors.push({text: "Necessário cadastrar uma categoria"})
        }
    
        //verificando se ocorreu algum erro, senão cadastrará no banco de dados
        if (errors.length > 0) {
            res.render("admin/index", {errors: errors})
        } else {
            const storage = new Storage({
                projectId: 'guru-374616',
                keyFilename: './config/guru-374616-9bf213e88ded.json'
            })
        
            const fileId = crypto.randomBytes(16).toString("hex")
            req.file.filename = `${fileId}-${req.file.originalname}`
            
            
            const bucket = storage.bucket('uploads-media')
        
            //Deixar o bucket publico para consumir no front-end
            async function makeBucketPublic() {
                await storage.bucket('uploads-media').makePublic()
            }
            makeBucketPublic().catch(console.error)
        
            const file = bucket.file(req.file.filename)
            const stream = file.createWriteStream({
                metadata: {
                    contentType: req.file.mimetype
                }
            })
        
            stream.on('error', (err) => {
                console.log(err)
                res.status(500)
            });
        
            stream.on('finish', () => {
                console.log(`Imagem ${req.file.filename} salva no bucket.`)
            })
        
            stream.end(req.file.buffer)
    
            const newPostagem = new Postagem({
                tituloPostagem:  req.body.tituloPostagem,
                slugPostagem: req.body.tituloPostagem.toLowerCase().replace(/"|á|â|à|ã|ä"/g, "a").replace(/"|é|ê|è|ë"/g, "e").replace(/"|í|ì|î|ï"/g, "i").replace(/"|ó|ò|ô|õ|ø|ö"/g, "o").replace(/"|ú|ù|û|ü"/g, "u").replace(/ç/g, "c").replace(/ñ/g, "n").replace(/ý/g, "y").replace(/ /g, "-"),
                descPostagem: req.body.descPostagem,
                imgPostagem: req.file.filename,
                conteudoPostagem: req.body.conteudoPostagem,
                topicoPostagem: req.body.topicoPostagem,
                categoriaPostagem: req.body.categoriaPostagem,
                cassinoPostagem: req.body.cassinoPostagem
            })
        
            newPostagem.save().then(() => {
                req.flash("success_msg", "Postagem criada com sucesso")
                res.redirect("/admin/consultarPostagens")
            }).catch((err) => {
                req.flash("error_msg", `Houve um erro ao criar a postagem, tente novamente: ${err}`)
                res.redirect(`admin/consultarPostagem`)
            })
        }

    }
    
})

router.get("/consultarPostagens", (req, res) => {
    Postagem.find().populate("categoriaPostagem cassinoPostagem").sort({createdAt: "DESC"}).then((postagens) => {
        const title = "Consulta de postagens"
        res.render("admin/consultarPostagens", {postagens: postagens, title})
    }).catch((err) => {
        req.flash("error_msg", `Houve um erro ao listar as postagens: ${err}`)
        res.redirect("/admin")
    })
})

router.get("/editarPostagem/:id", (req, res) => {
    Postagem.findOne({_id: req.params.id}).then((postagem) => {
        Categoria.find().then((categorias) => {
            Cassino.find().then((cassinos) => {
                const title = "Editando postagem"
                res.render("admin/editarPostagem", {postagem, categorias, cassinos, title})
            }).catch((err) => {
                req.flash("error_msg", "Houve um erro ao listar as categorias e postagens")
                res.redirect("admin/index")
            })
        }).catch(() => {
            req.flash("error_msg", "Houve um erro ao carregar o formulário")
            res.redirect("admin/index")
        })
    }).catch((err) => {
        req.flash("error_msg", `Não foi possível carregar a edição da postagem devido ao seguinte erro: ${err}`)
        res.redirect("/admin")
    })
})

router.post("/editandoPostagem", uploadCapa.single('imgPostagem'), (req, res) => {
    if(req.file == undefined) {
        Postagem.findOne({_id: req.body.id}).then((postagem) => {
            postagem.tituloPostagem = req.body.tituloPostagem,
            postagem.slugPostagem = req.body.tituloPostagem.toLowerCase().replace(/"|á|â|à|ã|ä"/g, "a").replace(/"|é|ê|è|ë"/g, "e").replace(/"|í|ì|î|ï"/g, "i").replace(/"|ó|ò|ô|õ|ø|ö"/g, "o").replace(/"|ú|ù|û|ü"/g, "u").replace(/ç/g, "c").replace(/ñ/g, "n").replace(/ý/g, "y").replace(/ /g, "-"),
            postagem.descPostagem = req.body.descPostagem,
            postagem.conteudoPostagem = req.body.conteudoPostagem,
            postagem.topicoPostagem = req.body.topicoPostagem,
            postagem.categoriaPostagem = req.body.categoriaPostagem,
            postagem.cassinoPostagem = req.body.cassinoPostagem
    
            postagem.save().then(() => {
                req.flash("success_msg", "Postagem alterada com sucesso")
                res.redirect("/admin/consultarPostagens")
            }).catch((err) => {
                req.flash("error_msg", `Houve um erro ao editar a postagem. Tente novamente. Erro: ${err}`)
                res.redirect("/admin")
            })
        }).catch((err) => {
            req.flash("error_msg", `Ocorreu um erro ao salvar a edição: ${err}`)
            res.redirect("/admin")
        })
    } else {
        const storage = new Storage({
            projectId: 'guru-374616',
            keyFilename: './config/guru-374616-9bf213e88ded.json'
        })
    
        const fileId = crypto.randomBytes(16).toString("hex")
        req.file.filename = `${fileId}-${req.file.originalname}`
        
        
        const bucket = storage.bucket('uploads-media')
    
        //Deixar o bucket publico para consumir no front-end
        async function makeBucketPublic() {
            await storage.bucket('uploads-media').makePublic()
        }
        makeBucketPublic().catch(console.error)
    
        const file = bucket.file(req.file.filename)
        const stream = file.createWriteStream({
            metadata: {
                contentType: req.file.mimetype
            }
        })
    
        stream.on('error', (err) => {
            console.log(err)
            res.status(500)
        });
    
        stream.on('finish', () => {
            console.log(`Imagem ${req.file.filename} salva no bucket.`)
        })
    
        stream.end(req.file.buffer)

        Postagem.findOne({_id: req.body.id}).then((postagem) => {
            postagem.tituloPostagem = req.body.tituloPostagem,
            postagem.slugPostagem = req.body.tituloPostagem.toLowerCase().replace(/"|á|â|à|ã|ä"/g, "a").replace(/"|é|ê|è|ë"/g, "e").replace(/"|í|ì|î|ï"/g, "i").replace(/"|ó|ò|ô|õ|ø|ö"/g, "o").replace(/"|ú|ù|û|ü"/g, "u").replace(/ç/g, "c").replace(/ñ/g, "n").replace(/ý/g, "y").replace(/ /g, "-"),
            postagem.descPostagem = req.body.descPostagem,
            postagem.imgPostagem = req.file.filename,
            postagem.conteudoPostagem = req.body.conteudoPostagem,
            postagem.topicoPostagem = req.body.topicoPostagem,
            postagem.categoriaPostagem = req.body.categoriaPostagem,
            postagem.cassinoPostagem = req.body.cassinoPostagem
    
            postagem.save().then(() => {
                req.flash("success_msg", "Postagem alterada com sucesso")
                res.redirect("/admin/consultarPostagens")
            }).catch((err) => {
                req.flash("error_msg", `Houve um erro ao editar a postagem. Tente novamente. Erro: ${err}`)
                res.redirect("/admin")
            })
        }).catch((err) => {
            req.flash("error_msg", `Ocorreu um erro ao salvar a edição: ${err}`)
            res.redirect("/admin")
        })
    }

})

router.get("/deletarPostagem/:id", (req, res) => {
    Postagem.deleteOne({_id: req.params.id}).then(() => {
        req.flash("success_msg", "Postagem excluída com sucesso")
        res.redirect("/admin/consultarPostagens")
    }).catch((err) => {
            req.flash("error_msg", `Houve um erro ao deletar essa postagem devido à: ${err}`)
            res.redirect("/admin")
        })
})


module.exports = router