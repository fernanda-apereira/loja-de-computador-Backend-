const jwt = require("jsonwebtoken");

const auth = (req, res, next) => {
  //Verifica a autenticação através do cookie
  console.log(req.headers);
  if (req.headers.authorization) {
    try {
      const user = jwt.verify(req.headers.authorization, "batata");
      return next();
    } catch (error) {
      res.status(401).json({error});
    }
  }
  //Caso não esteja logado
  else {
    res.status(401).json({msg: "Usuário não autorizado"});
  }
};

module.exports = auth;
