//Módulos
const express = require("express");

//Middlewares
const upload = require("../middlewares/upload.js");
const auth = require("../middlewares/auth.js"); //Middleware de autenticação, só da acesso a quem tá logado
const validarCadastro = require("../middlewares/validateUser.js");
const validarProduto = require("../middlewares/validateProduct.js");

//Controllers
const homeController = require("../controllers/homeController.js");
const productController = require("../controllers/productController.js"); //Controller produto
const monteSeuPcController = require("../controllers/monteSeuPcController.js");
const carrinhoController = require("../controllers/carrinhoController.js");
const userController = require("../controllers/userController.js");

//Código principal
const router = express.Router();

// -=-=-=-  Rotas produto -=-=-=-
//get
router.get("/departamento/:dep", productController.sendByDepartament);
router.get("/departamento/:dep/:subdep", productController.sendByDepartament);
router.get("/produto/:id", productController.sendById);
router.get("/enviarimagem/:id", productController.sendProductImage); // Envia img produto
router.get("/busca", productController.searchProducts); //Barra de pesquisa
//Criar produto
router.post(
  "/criarproduto",
  auth,
  upload.any(),
  validarProduto,
  productController.createProduct
);
//Editar produto
router.put(
  "/produto/:id",
  auth,
  upload.any(),
  validarProduto,
  productController.updateProduct
);
//Deletar produto
router.delete("/produto/:id", auth, productController.deleteProduct);

// -=-=-=-  Rotas usuário -=-=-=-
//Rota Cadastro
router.post("/cadastro", validarCadastro, userController.cadastro);
//Rota Login
router.post("/login", userController.login);
//Rota LogOut
router.get("/logout", auth, userController.logOut);
//Rota valida usuário
router.get("/checar-autenticacao", auth, userController.checkAuth);

// -=-=-=- Rotas do carrinho -=-=-=-
//carrinho usuário
router.post("/carrinho/:id", auth, carrinhoController.adicionaProduto);

// -=-=-=-  Rotas monteSeuPc -=-=-=-
router.get("/monteseupc/:dep", monteSeuPcController.sendProductByDep);
//Rota para enviar o produto
router.get("/enviaprod/:id", productController.sendById);

module.exports = router;
