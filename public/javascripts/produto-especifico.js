'use strict'
// FUNÇÕES 
function cookieExist(nomeCookie) {
  const cookies = document.cookie.split(";");
  for(let cookie of cookies) {
    if(cookie.startsWith(nomeCookie)) return true
  }

  return false;
}

function getCookie(c_name) {
  var c_value = " " + document.cookie;
  var c_start = c_value.indexOf(" " + c_name + "=");
  if (c_start == -1) {
      c_value = null;
  }
  else {
      c_start = c_value.indexOf("=", c_start) + 1;
      var c_end = c_value.indexOf(";", c_start);
      if (c_end == -1) {
          c_end = c_value.length;
      }
      c_value = unescape(c_value.substring(c_start,c_end));
  }
  return c_value;
}

function createCookie(name,value,days) {
  if (days) {
      var date = new Date();
      date.setTime(date.getTime() + (days * 24 * 60 * 60 *1000));
      var expires = "; expires=" + date.toGMTString();
  } else {
      var expires = "";
  }
  document.cookie = name + "=" + value + expires + "; path=/";
}


// VARIÁVEIS
const imagens = document.querySelectorAll(".slide-imagens img");
const slideImg = document.querySelector(".slide-imagens");
const imgAtiva = document.querySelector(".img-ativa");
const btnPassa = document.querySelector(".passa-imagem");
const btnVolta = document.querySelector(".volta-imagem");
const btnCompra = document.querySelector(".btn-add-carrinho");

//FAZ A PÁGINA MUDAR
let imgAtual = 0;


const ativaImg = (img) => {
  imagens.forEach((im) => {
    im.classList.remove("ativa");
  });
  img.classList.add("ativa");

  imgAtiva.src = slideImg.querySelector(".ativa").src;
}

//Adiciona o event listener nas imagens
imagens.forEach((img, i) => {
  img.addEventListener("click", function (e) {
    ativaImg(this);
    imgAtual = i;
  });
});

//Adiciona o evento nos botões
btnVolta.addEventListener("click", function () {
  imgAtual === imagens.length - 1 ? (imgAtual = 0) : imgAtual++;
  ativaImg(imagens[imgAtual]);
});

btnPassa.addEventListener("click", function () {
  imgAtual === 0 ? (imgAtual = imagens.length - 1) : imgAtual--;
  ativaImg(imagens[imgAtual]);
});
//Transforma a primeira imagem na ativa
ativaImg(imagens[0]);

//Modal de produto adicionado no carrinho
const modalProduto = {
  janelaModal: document.querySelector(".modal-add-produto"),
  overlay: document.querySelector(".overlay"),
  botaoFechar: document.querySelector(".fecha-modal"),
  botaoContinua: document.querySelector(".continuar-comprando"),

  init() {
    this.botaoFechar.addEventListener("click", this.fechaModal.bind(this));
    this.botaoContinua.addEventListener("click", this.fechaModal.bind(this));
    this.overlay.addEventListener("click", this.fechaModal.bind(this));
  },
  abreModal() {
    this.janelaModal.classList.remove("fechado");
    this.overlay.classList.remove("fechado");
    document.body.style.overflow = "hidden";
  },
  fechaModal() {
    this.janelaModal.classList.add("fechado");
    this.overlay.classList.add("fechado");
    document.body.style.overflow = "visible";
  },
};
modalProduto.init();




//ADICIONA PRODUTO NO CARRINHO OU COOKIE
const id = Number(location.href.split("/").slice(-1)[0]); //Gambiarra pra puxar o id do produto

//Verifica se o produto já existe
const existeProduto = (itens, produto) => {
  for (let prod of itens) {
    if (prod.id === produto.id) {
      return true;
    }
  }
  return false;
};

btnCompra.addEventListener("click", async function (e) {
  try {
    const resp = await fetch("/checar-autenticacao");
    const logado = await resp.json();

    if (logado) {
      let resultado = await fetch(`/carrinho/${id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id_produto: id }),
      });

      resultado = await resultado.json();

      if (resultado.produtoAdicionado) return modalProduto.abreModal();

      throw new Error("produto não adicionado ao carrinho:", resultado.error);
    } else {
      //Verifica se o cookie existe
      if(!cookieExist("cr")) {
        const cartData = [];
        const expirationDate = new Date();
        expirationDate.setDate(expirationDate.getDate() + 7);
        
        createCookie("cr", encodeURIComponent(JSON.stringify(cartData)), 7);
      }

      const cartData = JSON.parse(getCookie("cr"));
      const itemExist = cartData.find(d => d.id == id);

      if(!itemExist) {
        cartData.push({id, qt: 1});
        createCookie("cr", encodeURIComponent(JSON.stringify(cartData), 7));
        return modalProduto.abreModal();
      }else{
        return modalProduto.abreModal();
      }
      



    }
  } catch (error) {
    console.error(error);
  }
});


