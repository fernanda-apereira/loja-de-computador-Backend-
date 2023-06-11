//Pacotes
const fs = require("fs");
const path = require("path");
const { validationResult } = require("express-validator");
const { Op } = require("sequelize"); //Módulo de operadores sequelize

//Models
const productsData = require("../database/produtos.json");
const {Produto, Imagem} = require("../models");

//Funções externas para o controller
function formatImagesPath(filesArray) {
  /*
    Função que retorna a array the imagens, isso possibilita adicionar várias imagens ao mesmo tempo com o produto
  */
  return filesArray.map((file) => {
    let caminhoImg = file.path.replace(/public/g, "");
    caminhoImg = caminhoImg.replace(/\\/g, "/");

    return caminhoImg;
  });
}

function deleteImages(imagesPaths) {
  //Remove as imagens antigas
  imagesPaths.forEach((imgCam) => {
    imgPath = path.join(__dirname, "../../public", imgCam);
    fs.unlinkSync(imgPath);
  });
}

const productController = {
  async sendById(req, res) {
    const id_produto = Number(req.params.id);
    
    try {
    
      const targetProduct = await Produto.findOne({
        where: { id_produto },
        raw: true,
      });

      if (targetProduct === null) res.status(404).send("Produto não encontrado");

      //Faz o query das imagens
      const imagens = await Imagem.findAll({
        where: { id_produto },
        raw: true,
      });
      targetProduct.Imagem = imagens;
      targetProduct.preco = Number(targetProduct.preco);

      res.status(200).json(targetProduct);
    } catch (error) {
      res.status(400).json({ error });
    }
  },

  async sendByDepartament(req, res) {
    const departNums = new Map([
      ["computadores", 1],
      ["hardware", 2],
      ["perifericos", 3],
      ["notebooks", 4],
      ["kit-upgrade", 5],
      ["cadeiras-gamer", 6],
      ["monitores", 7],
      ["celulares", 8],
      ["games", 9],
    ]);

    const subDepartNums = new Map([
      ["pc-gamer", 1],
      ["pc-escritorio", 2],
      ["pc-casual", 3],
      ["processador", 4],
      ["placa-de-video", 5],
      ["placa-mae", 6],
      ["memoria", 7],
      ["armazenamento", 8],
      ["refrigeramento", 9],
      ["teclado", 10],
      ["mouse", 11],
      ["fone", 12],
      ["headset", 13],
      ["webcam", 14],
      ["macbook", 15],
      ["notebook-gamer", 16],
      ["notebook-escritorio", 17],
    ]);

    const dep = departNums.get(req.params.dep);

    if (!dep) res.status(404).render("404"); //Caso o parâmetro da rota não seja um departamento responde com a 404

    //Fazer o query dos produtos
    try {
      let produtos;
      //Caso seja um query de um subdepartamento
      if (req.params.subdep) {
        console.log("Entrou aqui");

        const subdep = subDepartNums.get(req.params.subdep);

        if (!subdep) throw new Error("Sub departamento não encontrado"); //Da erro caso ele não encontre o sub departamento

        produtos = await Produto.findAll({
          where: {
            [Op.and]: {
              id_departamento: dep,
              id_sub_departamento: subdep,
            },
          },
          raw: true,
        });
      } else {
        produtos = await Produto.findAll({
          where: { id_departamento: dep },
          raw: true,
        });
      }

      //Verifica se achou algum produto, caso contrário manda pra 404
      if (produtos.length == 0)
        throw new Error("Nenhum produto encontrado nesse departamento");

      res.status(200).json(produtos);
    } catch (error) {
      console.error(error);
      res.status(400).json({ error });
    }
  },

  async searchProducts(req, res) {
    let search = req.query.keywords
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\w\s]/g, "");

    try {
      const productsToSearch = await Produto.findAll({
        where: {
          nome: {
            [Op.substring]: search,
          },
        },
        raw: true,
      });

      if (productsToSearch.length === 0) res.status(404).render("404");

      res.status(200).json(productsToSearch);
    } catch (error) {
      console.error(error);
      res.status(404).send("Nenhum produto encontrado");
    }
  },

  sendProductImage(req, res) {
    const targetProduct = getProductById(req.params.id);
    const caminhoImg = path.join(
      __dirname,
      "/../../public",
      targetProduct.imagens[0]
    );

    res.sendFile(caminhoImg);
  },

  //CRUDS POST, PUT, DELETE
  async createProduct(req, res) {
    
    const errorsVal = validationResult(req);

    //Adiciona o caminho das imagens no banco
    const caminhoImagens = formatImagesPath(req.files);

    if (!errorsVal.isEmpty()) {
      deleteImages(caminhoImagens);
      return res.status(400).json({ errorsVal: errorsVal.mapped() });
    }

    //Recebe o objeto contendo as infos do produto
    const {
      nome,
      id_departamento,
      id_sub_departamento,
      fabricante,
      preco,
      descricao,
    } = req.body;
    


    //Cria o produto no banco
    try {
      const {
        dataValues: { id_produto },
      } = await Produto.create({
        nome,
        id_departamento: Number(id_departamento),
        id_sub_departamento: id_sub_departamento
          ? Number(id_sub_departamento)
          : null,
        fabricante: fabricante ? fabricante : null,
        preco,
        descricao: descricao ? descricao : null,
        imagem_principal: caminhoImagens[0]
      });

      //Adiciona as imagens do produto no banco
      for (let img of caminhoImagens) {
        try {
          await Imagem.create({
            id_produto,
            caminho: img,
          });
        } catch (error) {
          console.error(error);

          return res.status(400).json({msg: "Erro ao adicionar imagens"});
        }
      }

      return res.status(200).json({msg: "Produto criado com sucesso"});
    } catch (error) {
      console.error(error);

      return res.status(400).json(error);
    }
  },

  async updateProduct(req, res) {
    /* FAZER A EDIÇÃO DA IMAGEM OPICIONAL */
    //Produto a ser modificado
    try {
      const id = Number(req.params.id);

      //Puxa os dados originais do produto
      const dadosProduto = await Produto.findOne({
        where: { id_produto: id },
        raw: true,
      });

      const errorsVal = validationResult(req);//Pega os erros do express validator

      const caminhoImagens = formatImagesPath(req.files); //Formata o caminho as imagens que vieram no request

      //Caso tenha erros
      if (!errorsVal.isEmpty()) {
        deleteImages(caminhoImagens);
        return res.status(400).json({errors: errorsVal.mapped()});
      }

      if (!dadosProduto) throw new Error("Produto não encontrado");

      const produtoNovo = {
        ...req.body,
        fabricante: req.body.fabricante ? req.body.fabricante : null,
        descricao: req.body.descricao ? req.body.descricao : null,
      };

      const resultado = await Produto.update(produtoNovo, {
        where: { id_produto: id },
      });

      //caso tenha imagens ele deleta as imagens antigas no banco e no diretório e adiciona as novas imagens
      if (req.files.length > 0) {
        const imagens = await Imagem.findAll({
          where: { id_produto: id },
          raw: true,
        });

        //Deleta as imagens do diretório
        imagens.forEach((img) => {
          imgPath = path.join(__dirname, "../../public", img.caminho);
          fs.unlinkSync(imgPath);
        });

        //Deleta as imagens do banco
        const resultadoImg = await Imagem.destroy({
          where: { id_produto: id },
        });

        //Adiciona as imagens do produto no banco
        for (let img of caminhoImagens) {
          await Imagem.create({
            id_produto: id,
            caminho: img,
          });
        }
      }

      res.status(200).json({msg:"Produto editado com sucesso", sucess:true});
    } catch (error) {
      console.log(error);
      res.status(400).json({error});
    }

    /*
    OTIMIZAR 
    */
  },

  async deleteProduct(req, res) {
    // LEMBRA DE DESTRUIR TAMBÉM NAS TABELAS DO CARRINHO QUANDO ESTIVER PRONTA

    try {
      const id = Number(req.params.id);

      const imagens = await Imagem.findAll({
        where: { id_produto: id },
        raw: true,
      });

      imagens.forEach((img) => {
        imgPath = path.join(__dirname, "../../public", img.caminho);
        fs.unlinkSync(imgPath);
      });

      const resultadoImg = await Imagem.destroy({ where: { id_produto: id } });
      const resultadoProd = await Produto.destroy({
        where: { id_produto: id },
      });

      res.status(200).json({msg:"Produto deletado com sucesso"});
    } catch (error) {
      console.log(error);
      res.status(401).json(error);
    }
  },
};

module.exports = productController;
