var H5P = H5P || {};

H5P.ScapeRoom = (function ($) {
  /**
   * Constructor function.
   */
  function C(options, id) {
    this.$ = $(this);
    this.id = id;
  };

  /**
   * Attach function called by H5P framework to insert H5P content into
   * page
   *
   * @param {jQuery} $container
   */
  C.prototype.attach = function ($container) {
    const self = this;

    var m = new MenuSelector();
    var html = "<script type='text/javascript' src='https://cdn.jsdelivr.net/npm/jspython-interpreter/dist/jspython-interpreter.min.js'></script><div id='general' class='menu'>" + m.createMenu() + "</div>";


    $container.addClass("h5p-scaperoom");
    $container.append(html);
    
    setTimeout(function () {
      self.$.trigger('resize');
    }, 3000);
  };

  return C;
})(H5P.jQuery);


//Partida manager
class PartidaManager {
  constructor(leng, dif, numS, cont) {
      this.lenguaje=leng;
      this.dificultad=dif;
      this.numS=numS;
      this.contenido = cont;
      this.vidas = 4 - this.dificultad;
      this.salaActual = 1;
      this.pruebaActual = 1;
      this.pruebasARealizar = 2 + this.dificultad; 

      this.prueba = null;
      this.pruebas = [];

      this.crearEstructura();
      this.generarPruebas();
  }  

  crearEstructura() {
      var general = document.getElementById('general');
      general.removeAttribute("class");
      let data ='<header><h1> Scape Room</h1><div id="vidas">Vidas: ';
      for(let i=0;i<this.vidas;i++) {
          data += "<img src='https://uo281956.github.io/SRPrueba/corazon.png' alt='vida del personaje' class='vidaimg vertical-center'/> ";
      }
      data += '</div><p id="pact">Prueba: '+this.pruebaActual+'/'+this.pruebasARealizar+'</p><p id="sact">Sala: '+this.salaActual+'/'+this.numS+'</p><button id="pausa">Pausa</button></header><section id="pruebadiv"></section>';
      general.innerHTML = data;
      document.getElementById("pausa").addEventListener("click", this.mostrarPausa);
  }

  generarPruebas() {
      const xhr = new XMLHttpRequest();
      xhr.open('GET', 'https://uo281956.github.io/SRPrueba/pruebas.json', false);
      try {
          xhr.send();
          if (xhr.status === 200) {
              const lengua = this.lenguaje;
              const conte = this.contenido.toString().trim();
              var todas = JSON.parse(xhr.responseText).pruebas;
              this.pruebas = todas.filter(function(prueba) {
                  return prueba.lenguaje == lengua && (conte == "Mix" || prueba.contenido.toString().trim() == conte);
              });
              
              //Tener en cuenta en caso de que haya pocas pruebas para un caso concreto
              if(this.pruebas.length < this.pruebasARealizar) {
                  this.pruebasARealizar=this.pruebas.length;
                  document.getElementById("pact").innerText = "Prueba: "+this.pruebaActual+'/'+this.pruebasARealizar;
              }

              this.siguientePrueba();

          } else {
              console.error('Error al cargar el archivo');
          }
      } catch (error) {
          console.error('Error:', error);
      }
  }

    siguientePrueba() {
        document.getElementById("pruebadiv").innerHTML = "";

        let sig = Math.floor(Math.random() * this.pruebas.length);
        this.prueba = this.pruebas.splice(sig,1)[0];

        let html  = "<p>"+this.prueba.enunciado+"</p>";
        switch(this.prueba.base) {
            case 1:
                html += this.loadChoice();
                break;
            case 2:
                html += this.loadFillInBlank();
                break;
            case 3:
                html += this.loadDandD();
                break;
            default:
                html += this.loadPythonInterpreter();
                break;
        }

        if(this.prueba.base != 3)
            html += "<p><button id='com'>Comprobar</button></p>";

        document.getElementById("pruebadiv").innerHTML = html;

        if(this.prueba.base != 3)
            document.getElementById("com").addEventListener("click", this.checkAnswer.bind(this));
        else
            this.loadDragAndDropActions();
    }

  checkAnswer() {
      if(document.getElementById("ans") == null || document.getElementById("ans").value == null || document.getElementById("ans").value == "")
          return

      if(this.vidas<=0)
          return;

      let respuesta = document.getElementById("ans").value;
      if(respuesta.toString().trim() == this.prueba.respuesta.toString().trim()) {
          this.acertar();
      } else {
          this.perderVida();
      }
  }

  loadPythonInterpreter() {
      return '<h2>Escribe tu código aquí:</h2><p><textarea id="ta"></textarea></p><h2>Salida:</h2><textarea id="ans" readonly="readonly"></textarea><p><button onclick="pythonEvaluate()">Ejecutar</button></p>';
  }

  loadFillInBlank() {
      return "<label>Respuesta: </label><input id='ans'></input>";
  }

  loadChoice() {
      let text = "";
      let ops = this.prueba.opciones;
      ops.sort(() => Math.random() - 0.5);
      for(let i=0; i<ops.length;i++) {
          text += '<input type="radio" onclick="changeSelected()" id="'+ops[i].valor+'" name="rate" value="'+ops[i].valor+'"';
          text += '/><label for="'+ops[i].valor+'">'+ops[i].valor+'</label><br>';
      }

      return text;
  }

  loadDandD() {
      return '<section class="draggable-items"></section><section class="matching-pairs"><div class="matching-pair"><span class="droppable" data-brand="'+this.prueba.respuesta+'"></span></div></section>';
  }

  loadDragAndDropActions() {
      let draggableItems = document.querySelector(".draggable-items");
      
      for(let i=0;i<this.prueba.opciones.length;i++) {
          //draggableItems.insertAdjacentHTML("beforeend","<image draggable='true' src='./h5p-folder/content/images/"+this.prueba.opciones[i].icono+"' id='"+this.prueba.opciones[i].valor+"' alt='Imagen de drag and drop'/>");
          draggableItems.insertAdjacentHTML("beforeend",'<i class="fab draggable" draggable="true" id="'+this.prueba.opciones[i].valor+'"><img draggable="false" src="https://uo281956.github.io/SRPrueba/'+this.prueba.opciones[i].icono+'" alt="Imagen de drag and drop"/></i>');
      }

      var draggableElements = document.querySelectorAll(".draggable");
      var droppableElements = document.querySelectorAll(".droppable");
      
      draggableElements.forEach(elem => {
        elem.addEventListener("dragstart", dragStart);
      });
      
      droppableElements.forEach(elem => {
        elem.addEventListener("dragenter", dragEnter);
        elem.addEventListener("dragover", dragOver);
        elem.addEventListener("dragleave", dragLeave);
        elem.addEventListener("drop", this.drop.bind(this));
      });
  }

  drop(event) {
      event.preventDefault();
      event.target.classList.remove("droppable-hover");
      const draggableElementBrand = event.dataTransfer.getData("text");
      const droppableElementBrand = event.target.getAttribute("data-brand");

      const isCorrectMatching = draggableElementBrand===droppableElementBrand;
  
      if(isCorrectMatching) {
          this.acertar();
      } else {
          this.perderVida();
      }
  }

  acertar() {
      if(this.pruebaActual >= this.pruebasARealizar) {
          this.finDeSala();
      } else {
          this.pruebaActual += 1;
          document.getElementById("pact").innerText = 'Prueba: '+this.pruebaActual+'/'+this.pruebasARealizar;
          this.siguientePrueba();
      }
  }

  finDeSala() {
      if(this.salaActual >= this.numS){
          this.mostrarFin();
      } else {
          this.salaActual += 1;
          this.pruebaActual=1;
          this.mostrarCompletarSala();
          document.getElementById("pact").innerText = 'Prueba: '+this.pruebaActual+'/'+this.pruebasARealizar;
          document.getElementById("sact").innerText = 'Sala: '+this.salaActual+'/'+this.numS;
          this.generarPruebas();
      }
  }

  mostrarPausa() {
      document.getElementById("general").insertAdjacentHTML("beforeend",'<div class="window-notice" id="window-notice"><div class="content"><h2>Pausa</h2><br><div><button onclick="ocultarPausa()">Reanudar</button>\t<button onclick="cargarMenu()">Salir</button></div></div></div>');
  }

  mostrarPerder() {
      document.getElementById("general").innerHTML = '<div class="window-notice" id="window-notice"><div class="content"><h2>¡No has conseguido escapar!</h2><div><button id="reint">Reintentar</button>\t<button onclick="cargarMenu()">Salir</button></div></div></div>';
      document.getElementById("reint").addEventListener("click", this.reiniciar.bind(this));
  }

  mostrarFin() {
      document.getElementById("general").insertAdjacentHTML("beforeend",'<div class="window-notice" id="window-notice"><div class="content"><h2>¡Has conseguido escapar!</h2><div><button onclick="cargarMenu()">Escapar</button></div></div></div>');
  }

  mostrarCompletarSala() {
      document.getElementById("general").insertAdjacentHTML("beforeend",'<div class="window-notice" id="window-notice"><div class="content"><div class="content-text"><h2>Sala completada</h2><p>Has superado la sala. Completa '+(this.numS-this.salaActual+1)+' más para escapar.</p></div><div class="content-buttons"><button onclick="ocultarPausa()">Siguiente sala</button></div></div></div>');
  }

  reiniciar() {
      new  PartidaManager(this.lenguaje, this.dificultad, this.numS, this.contenido);
  }

  perderVida() {
      this.vidas -=1;
      if(this.vidas <= 0) {
          this.mostrarPerder();
          return;
      }

      let data = 'Vidas: ';
      for(let i=0;i<this.vidas;i++) {
          data += "<img src='https://uo281956.github.io/SRPrueba/corazon.png' alt='vida del personaje' class='vidaimg vertical-center'/> ";
      }
      document.getElementById("vidas").innerHTML = data;
  }

  cargarMenu() {
      document.getElementById("general").setAttribute("class","menu");
      document.getElementById("general").innerHTML = new MenuSelector().createMenu();
  }
}

function pythonEvaluate(){
  let jsPython = window.jspython.jsPython;
  jsPython().evaluate(document.getElementById("ta").value)
  .then(r=>document.getElementById("ans").value=r,e=>document.getElementById("ans").value="El código escrito no es válido");
}    

function changeSelected() {
  let inputs = document.getElementsByTagName("input");
  for(let i=0;i<inputs.length;i++) {
      inputs[i].removeAttribute('id');
  }

  document.querySelector('input[name="rate"]:checked').id = "ans";
}

function cargarMenu() {
  document.getElementById("general").setAttribute("class","menu");
  document.getElementById("general").innerHTML = new MenuSelector().createMenu();
}

function ocultarPausa() {
  document.getElementById("window-notice").remove();
}

function dragStart(event) {
  event.dataTransfer.setData("text", event.target.id); 
}

function dragEnter(event) {
  if(event.target.classList && event.target.classList.contains("droppable") && !event.target.classList.contains("dropped")) {
      event.target.classList.add("droppable-hover");
  }
}

function dragOver(event) {
  if(event.target.classList && event.target.classList.contains("droppable") && !event.target.classList.contains("dropped")) {
      event.preventDefault();
  }
}

function dragLeave(event) {
  if(event.target.classList && event.target.classList.contains("droppable") && !event.target.classList.contains("dropped")) {
      event.target.classList.remove("droppable-hover");
  }
}

// Menu Selector

class MenuSelector {
  constructor() {
  }

  createMenu() {
      let menu = "<h1>Scape Room</h1><div class='pline'><p>¡Bienvenido al Scape Room! Estás encerrado en un sitio desconocido.</p><p>Deberás superar una o varias salas compuestas de diversas pruebas para poder escapar.</p><p>Pon a prueba tus capacidades y lográ escapar.</p></div><p>";
      menu += this.loadLenguajes();
      menu += this.loadDificultadYNum();
      menu += this.loadContenidos();
      menu += "</p><script>var m= new MenuSelector();</script><p><button onclick='m.comenzar()'>Comenzar</button></p>";
      return menu;
  }

  loadLenguajes() {
      const xhr = new XMLHttpRequest();
      xhr.open('GET', 'https://uo281956.github.io/SRPrueba/lenguajes.txt', false);
      try {
          xhr.send();
          if (xhr.status === 200) {
              const texto = xhr.responseText.toString();
              var lines = texto.split("\n");
              var resp = "<label>Lenguaje: </label><select id='leng'>";
              for (var line = 0; line < lines.length; line++) {
                  resp += "<option value='"+lines[line]+"'>"+lines[line]+"</option>";
              }
              resp += '</select>';
              return resp;
          } else {
              document.getElementById('fileContent').textContent = 'Error al cargar el archivo';
              return "";
          }
      } catch (error) {
          console.error('Error:', error);
          document.getElementById('fileContent').textContent = 'Error al cargar el archivo';
          return "";
      }
  }

  loadDificultadYNum() {
      let text = "\t\t\t<label>Dificultad: </label><select id='dif'><option value=0>Fácil</option><option value=1>Medio</option><option value=2>Difícil</option></select></p>";
      text += "<p><label>Número de salas: </label><select id='num'><option value=1>1</option><option value=2>2</option><option value=3>3</option></select>";
      return text;
  }

  loadContenidos() {
      const xhr = new XMLHttpRequest();
      xhr.open('GET', 'https://uo281956.github.io/SRPrueba/contenidos.txt', false);
      try {
          xhr.send();
          if (xhr.status === 200) {
              const texto = xhr.responseText.toString();
              var lines = texto.split("\n");
              var resp = "\t<label>Contenido: </label><select id='cont'>";
              for (var line = 0; line < lines.length; line++) {
                  resp += "<option value='"+lines[line]+"'>"+lines[line]+"</option>";
              }
              resp += '</select>';
              return resp;
          } else {
              document.getElementById('fileContent').textContent = 'Error al cargar el archivo';
              return "";
          }
      } catch (error) {
          console.error('Error:', error);
          document.getElementById('fileContent').textContent = 'Error al cargar el archivo';
          return "";
      }
  }

  comenzar() {
      let leng = document.getElementById('leng').value;
      let dif = document.getElementById('dif').value;
      let nump = document.getElementById('num').value;
      let cont = document.getElementById('cont').value;
      let general = document.getElementById('general');
      general.innerHTML="";
      
      const pm = new PartidaManager(leng, parseInt(dif), parseInt(nump), cont);
  }
}