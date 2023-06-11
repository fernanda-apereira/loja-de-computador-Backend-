//Pacotes
const { validationResult } = require("express-validator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

//Models
const { Usuario, Endereco, Carrinho} = require("../models");


const userController = {

  async cadastro(req, res) {
    //Fazer as validações do express validator aqui
    const errors = validationResult(req);

    //Verifica se o email e o cpf já existem
    const userExist = await Usuario.findOne({
      where: { email: req.body.email },
    });
    const cpfExist = await Usuario.findOne({ where: { cpf: req.body.cpf } });

    if (userExist) {
      errors.errors.push({ msg: "Email já existente" });
    }
    if (cpfExist) {
      errors.errors.push({ msg: "CPF já existente" });
    }

    //Verifica se existem erros no express validator
    if (!errors.isEmpty()) {
      return res.render("cadastro", { errors: errors.mapped() });
    }

    //Cria o cadastro caso não tenha erros

    const {
      nome,
      email,
      cpf,
      data_nasc,
      telefone,
      cep,
      rua,
      numero,
      complemento,
      bairro,
      cidade,
      estado,
      senha,
    } = req.body;

    const userInfo = {
      nome,
      email,
      cpf,
      data_nasc,
      telefone,
      senha: bcrypt.hashSync(senha, 10), //Faz o hash da senha
      adm: 0,
    };

   

    //Pega o ID do usuário criado através do email
    const {dataValues:{id_usuario}} =  await Usuario.create(userInfo);

    const userAdress = {
      id_usuario,
      cep,
      rua,
      numero,
      complemento,
      bairro,
      cidade,
      estado,
    };

    //Cria a fileira do endereço daquele usuário
    await Endereco.create(userAdress);
    await Carrinho.create({
      id_usuario,
    })
    res.redirect("/login");
  },
  
  async login(req, res) {
    const { email, senha } = req.body;

    try {
      const user = await Usuario.findOne({
        where: {
          email: email,
        },
      });

      if (user && bcrypt.compareSync(senha, user.dataValues.senha)) {
        
        //Caso ele já esteja logado desloga antes de fazer o login
        if (res.locals.isLogged) userController.logOut.bind(userController);
  
        const userData = user.dataValues;
        const userName = userData.nome.split(" ")[0];
  
        //Gera o token de autenticação
        const token = jwt.sign(
          { id: userData.id_usuario, email: userData.email, name: userName },
          "batata"
        );
        //Cria o cookie com o token
        res.cookie("token", token, { maxAge: 2592000000 });
        res.status(200).json({token});
      } else {
        return res.status(400).json({error: "Usuário ou senha incorretos"});
      }
    } catch (error) {
      return res.status(400).send(error);
    }
    
  },

  logOut(req, res) {
    // req.session.destroy();
    res.clearCookie("token");
    res.locals.isLogged = false;
    delete res.locals.nameLogged;

    return res.redirect("/");
  },

  checkAuth(req,res) {
    if(res.locals.isLogged) return res.json(true);
    
    res.json(false);
  },
  
  //Perfil usuário
  async sendUserInfo(req, res) {

  },

};

module.exports = userController;
