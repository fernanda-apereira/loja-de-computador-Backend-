//Pacotes
const { Op } = require("sequelize"); //Módulo de operadores sequelize
const jwt = require("jsonwebtoken");

//Models
const { Carrinho, Item_carrinho, Produto, Imagem } = require("../models");

const carrinho = {
  
  async adicionaProduto(req, res) {
    const { id: id_usuario } = jwt.verify(req.cookies.token, "batata");
    const { id_produto } = req.body;

    try {
      const userCarrinho = await Carrinho.findOne({
        where: { id_usuario },
        raw: true,
      });

      //Verifica se o item já está no carrinho
      const item = await Item_carrinho.findOne({
        where: {
          [Op.and]: {
            id_produto,
            id_carrinho: userCarrinho.id_carrinho,
          },
        },
      });

      if (!item) {
        const itemNovo = {
          id_produto,
          id_carrinho: userCarrinho.id_carrinho,
          quantidade: 1,
        };

        try {
          const produtoAdd = await Item_carrinho.create(itemNovo);
          console.log(produtoAdd);
          return res.json({ produtoAdicionado: true });
        } catch (error) {
          return res.json({ produtoAdicionado: false, error });
        }
      } else
        return res.json({
          produtoAdicionado: true,
          error: "Produto já existente",
        });
    } catch (error) {
      return res.json({ produtoAdicionado: false, error });
    }
  },
};

module.exports = carrinho;
