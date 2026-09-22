/* ============================================================
   RULETA ALEATORIA - AULA VIRTUAL
   Lógica de la aplicación (nombres de variables y funciones en español)
   ============================================================ */

(function () {
  "use strict";

  /* ---------------- Referencias al DOM ---------------- */
  const contenedorApp      = document.getElementById("contenedorApp");
  const lienzoRuleta        = document.getElementById("lienzoRuleta");
  const contextoLienzo      = lienzoRuleta.getContext("2d");
  const zonaRuleta          = document.getElementById("zonaRuleta");
  const botonCentro         = document.getElementById("botonCentro");
  const botonIniciar        = document.getElementById("botonIniciar");
  const botonReiniciar      = document.getElementById("botonReiniciar");
  const botonEditar         = document.getElementById("botonEditar");
  const botonEsconder       = document.getElementById("botonEsconder");
  const botonTitulo         = document.getElementById("botonTitulo");
  const tituloRespuesta     = document.getElementById("tituloRespuesta");
  const subtituloResultado  = document.getElementById("subtituloResultado");
  const areaTexto           = document.getElementById("areaTexto");
  const capaResaltado       = document.getElementById("capaResaltado");
  const contenedorTexto     = document.getElementById("contenedorTexto");
  const mensajeAviso        = document.getElementById("mensajeAviso");

  /* ---------------- Constantes ---------------- */
  const COLORES_BASE = ["#8CE68C", "#FF8B7B", "#E8C99B", "#D9A6E0", "#4C6FE0"]; // (F2) 5 colores básicos
  const CLAVE_ALMACENAMIENTO = "ruletaAulaVirtual_datos";
  const CLAVE_TITULO_ALMACENADO = "ruletaAulaVirtual_titulo";
  const ALTURA_RENGLON_PX = 24; // debe coincidir con line-height del CSS
  const DURACION_GIRO_MS = 4200;
  const VUELTAS_MINIMAS = 6;

  const ELEMENTOS_POR_DEFECTO = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];

  /* ---------------- Estado de la aplicación ---------------- */
  let elementosRuleta = [];        // [{ texto: string, oculto: bool }] uno por cada línea del textarea
  let rotacionAcumuladaGrados = 0; // rotación total aplicada al lienzo (siempre creciente)
  let estaGirando = false;
  let elementoSeleccionadoActual = null; // referencia al objeto dentro de elementosRuleta

  /* ============================================================
     PERSISTENCIA (F4 - guardar / recuperar del local storage)
     ============================================================ */

  function guardarDatosEnLocalStorage() {
    try {
      localStorage.setItem(CLAVE_ALMACENAMIENTO, JSON.stringify(elementosRuleta));
    } catch (error) {
      console.warn("No se pudo guardar en localStorage:", error);
    }
  }

  function cargarDatosDesdeLocalStorage() {
    try {
      const datosGuardados = localStorage.getItem(CLAVE_ALMACENAMIENTO);
      if (datosGuardados) {
        const listaRecuperada = JSON.parse(datosGuardados);
        if (Array.isArray(listaRecuperada) && listaRecuperada.length > 0) {
          return listaRecuperada.map(function (elemento) {
            return { texto: String(elemento.texto || ""), oculto: Boolean(elemento.oculto) };
          });
        }
      }
    } catch (error) {
      console.warn("No se pudo leer localStorage:", error);
    }
    return ELEMENTOS_POR_DEFECTO.map(function (texto) {
      return { texto: texto, oculto: false };
    });
  }

  function guardarTituloEnLocalStorage(texto) {
    try {
      localStorage.setItem(CLAVE_TITULO_ALMACENADO, texto);
    } catch (error) { /* almacenamiento no disponible: se ignora */ }
  }

  function cargarTituloDesdeLocalStorage() {
    try {
      return localStorage.getItem(CLAVE_TITULO_ALMACENADO);
    } catch (error) {
      return null;
    }
  }

  /* ============================================================
     LECTURA / RENDERIZADO DEL CONTROL DE TEXTO (F3, F5, F6)
     ============================================================ */

  // Reconstruye "elementosRuleta" a partir del texto crudo del textarea,
  // conservando el estado "oculto" cuando la línea no cambió de posición/texto.
  function actualizarElementosDesdeTextoCrudo() {
    const lineasCrudas = areaTexto.value.split("\n");
    const elementosAnteriores = elementosRuleta;

    elementosRuleta = lineasCrudas.map(function (lineaCruda, indice) {
      const anterior = elementosAnteriores[indice];
      const seguiaOculto = anterior && anterior.texto === lineaCruda ? anterior.oculto : false;
      return { texto: lineaCruda, oculto: seguiaOculto };
    });
  }

  function obtenerElementosVisiblesParaRuleta() {
    return elementosRuleta.filter(function (elemento) {
      return elemento.texto.trim() !== "" && !elemento.oculto;
    });
  }

  function renderizarCapaResaltado() {
    capaResaltado.innerHTML = "";
    elementosRuleta.forEach(function (elemento) {
      const renglon = document.createElement("div");
      renglon.style.height = ALTURA_RENGLON_PX + "px";
      renglon.className = elemento.oculto ? "renglon-resaltado" : "renglon-normal";
      capaResaltado.appendChild(renglon);
    });
  }

  function sincronizarTextoVisible() {
    // Mantiene el valor del textarea alineado con elementosRuleta (por ejemplo tras Reiniciar)
    const posicionCursor = areaTexto.selectionStart;
    areaTexto.value = elementosRuleta.map(function (elemento) { return elemento.texto; }).join("\n");
    if (document.activeElement === areaTexto) {
      areaTexto.selectionStart = areaTexto.selectionEnd = posicionCursor;
    }
  }

  /* ============================================================
     DIBUJO DE LA RULETA EN CANVAS (F1, F2)
     ============================================================ */

  function dibujarRuleta() {
    const elementosVisibles = obtenerElementosVisiblesParaRuleta();
    const ancho = lienzoRuleta.width;
    const alto = lienzoRuleta.height;
    const centroX = ancho / 2;
    const centroY = alto / 2;
    const radio = Math.min(ancho, alto) / 2 - 4;

    contextoLienzo.clearRect(0, 0, ancho, alto);

    if (elementosVisibles.length === 0) {
      contextoLienzo.beginPath();
      contextoLienzo.arc(centroX, centroY, radio, 0, Math.PI * 2);
      contextoLienzo.fillStyle = "#eef0f4";
      contextoLienzo.fill();
      contextoLienzo.fillStyle = "#8a8d99";
      contextoLienzo.font = "bold 18px Segoe UI, Arial";
      contextoLienzo.textAlign = "center";
      contextoLienzo.textBaseline = "middle";
      contextoLienzo.fillText("Agrega elementos", centroX, centroY);
      return;
    }

    const cantidadElementos = elementosVisibles.length;
    const anguloPorElementoRad = (Math.PI * 2) / cantidadElementos;

    elementosVisibles.forEach(function (elemento, indice) {
      const anguloInicio = indice * anguloPorElementoRad;
      const anguloFin = anguloInicio + anguloPorElementoRad;

      contextoLienzo.beginPath();
      contextoLienzo.moveTo(centroX, centroY);
      contextoLienzo.arc(centroX, centroY, radio, anguloInicio, anguloFin);
      contextoLienzo.closePath();
      contextoLienzo.fillStyle = COLORES_BASE[indice % COLORES_BASE.length]; // (F2) repite cada 5 colores
      contextoLienzo.fill();
      contextoLienzo.strokeStyle = "rgba(255,255,255,0.7)";
      contextoLienzo.lineWidth = 2;
      contextoLienzo.stroke();

      // Texto del elemento, orientado hacia afuera del centro
      const anguloMedio = anguloInicio + anguloPorElementoRad / 2;
      contextoLienzo.save();
      contextoLienzo.translate(centroX, centroY);
      contextoLienzo.rotate(anguloMedio);
      contextoLienzo.fillStyle = "#2c2c34";
      contextoLienzo.font = "bold 22px Segoe UI, Arial";
      contextoLienzo.textAlign = "center";
      contextoLienzo.textBaseline = "middle";
      const textoElemento = elemento.texto.length > 14 ? elemento.texto.slice(0, 13) + "…" : elemento.texto;
      contextoLienzo.fillText(textoElemento, radio * 0.62, 0);
      contextoLienzo.restore();
    });

    // Círculo central decorativo (debajo del botón "haz clic para girarlo")
    contextoLienzo.beginPath();
    contextoLienzo.arc(centroX, centroY, radio * 0.05, 0, Math.PI * 2);
    contextoLienzo.fillStyle = "#ffffff";
    contextoLienzo.fill();
  }

  /* ============================================================
     GIRO DE LA RULETA (F3)
     ============================================================ */

  function mostrarAviso(texto) {
    mensajeAviso.textContent = texto;
    mensajeAviso.classList.add("visible");
    window.clearTimeout(mostrarAviso.temporizador);
    mostrarAviso.temporizador = window.setTimeout(function () {
      mensajeAviso.classList.remove("visible");
    }, 2200);
  }

  function mostrarResultadoEnRespuesta(texto) {
    subtituloResultado.textContent = "Resultado: " + texto;
    subtituloResultado.classList.add("tiene-resultado");
  }

  function limpiarResultadoEnRespuesta() {
    subtituloResultado.textContent = "Presiona Iniciar para girar";
    subtituloResultado.classList.remove("tiene-resultado");
  }

  function girarRuleta() {
    if (estaGirando) return;

    const elementosVisibles = obtenerElementosVisiblesParaRuleta();
    if (elementosVisibles.length === 0) {
      mostrarAviso("No hay elementos disponibles para girar.");
      return;
    }
    if (elementosVisibles.length === 1) {
      elementoSeleccionadoActual = elementosVisibles[0];
      mostrarResultadoEnRespuesta(elementoSeleccionadoActual.texto);
      return;
    }

    estaGirando = true;
    botonIniciar.disabled = true;

    const cantidadElementos = elementosVisibles.length;
    const anguloPorElementoGrados = 360 / cantidadElementos;

    // 1) Elegimos el índice ganador al azar ANTES de animar
    const indiceElegido = Math.floor(Math.random() * cantidadElementos);

    // 2) Punto de destino dentro del sector (evitando los bordes)
    const desplazamientoDentroDelSector = anguloPorElementoGrados * (0.15 + Math.random() * 0.7);
    const anguloDestinoGrados = indiceElegido * anguloPorElementoGrados + desplazamientoDentroDelSector;

    // 3) Calculamos la nueva rotación total para que ese punto quede bajo el puntero (ángulo 0, lado derecho)
    const restoActual = rotacionAcumuladaGrados % 360;
    const baseVueltasCompletas = rotacionAcumuladaGrados - restoActual;
    const anguloRestoNecesario = (360 - anguloDestinoGrados) % 360;
    const nuevaRotacion = baseVueltasCompletas + VUELTAS_MINIMAS * 360 + anguloRestoNecesario;

    rotacionAcumuladaGrados = nuevaRotacion;

    lienzoRuleta.style.transition = "transform " + DURACION_GIRO_MS + "ms cubic-bezier(0.17, 0.67, 0.12, 0.99)";
    lienzoRuleta.style.transform = "rotate(" + rotacionAcumuladaGrados + "deg)";

    limpiarResultadoEnRespuesta();

    window.setTimeout(function () {
      elementoSeleccionadoActual = elementosVisibles[indiceElegido];
      mostrarResultadoEnRespuesta(elementoSeleccionadoActual.texto);
      estaGirando = false;
      botonIniciar.disabled = false;
    }, DURACION_GIRO_MS + 60);
  }

  /* ============================================================
     OCULTAR ELEMENTO SELECCIONADO (F6 / tecla S)
     ============================================================ */

  function ocultarElementoSeleccionado() {
    if (!elementoSeleccionadoActual) {
      mostrarAviso("Primero gira la ruleta para tener un elemento seleccionado.");
      return;
    }
    if (elementoSeleccionadoActual.oculto) {
      mostrarAviso("Ese elemento ya está oculto.");
      return;
    }
    elementoSeleccionadoActual.oculto = true;
    renderizarCapaResaltado();
    dibujarRuleta();
    guardarDatosEnLocalStorage();
    mostrarAviso('"' + elementoSeleccionadoActual.texto + '" oculto del próximo sorteo.');
  }

  /* ============================================================
     REINICIAR (F8 / tecla R)
     ============================================================ */

  function reiniciarSorteo() {
    elementosRuleta.forEach(function (elemento) {
      elemento.oculto = false;
    });
    elementoSeleccionadoActual = null;
    limpiarResultadoEnRespuesta();
    renderizarCapaResaltado();
    dibujarRuleta();
    guardarDatosEnLocalStorage();
    mostrarAviso("Elementos ocultos restaurados. Todo listo para un nuevo sorteo.");
  }

  /* ============================================================
     EDICIÓN DEL TEXTAREA (F7 / tecla E o clic)
     ============================================================ */

  function activarEdicionTexto() {
    areaTexto.readOnly = false;
    contenedorTexto.classList.add("modo-edicion");
    botonEditar.classList.add("activo");
    areaTexto.focus();
  }

  function desactivarEdicionTexto() {
    areaTexto.readOnly = true;
    contenedorTexto.classList.remove("modo-edicion");
    botonEditar.classList.remove("activo");
    areaTexto.blur();
  }

  function alternarEdicionTexto() {
    if (areaTexto.readOnly) {
      activarEdicionTexto();
    } else {
      desactivarEdicionTexto();
    }
  }

  /* ============================================================
     PANTALLA COMPLETA (F9 / tecla F)
     ============================================================ */

  function alternarPantallaCompleta() {
    if (!document.fullscreenElement) {
      contenedorApp.requestFullscreen().catch(function () {
        mostrarAviso("El navegador no permitió activar pantalla completa.");
      });
    } else {
      document.exitFullscreen();
    }
  }

  /* ============================================================
     TÍTULO EDITABLE ("Título")
     ============================================================ */

  function alternarEdicionTitulo() {
    const yaEditable = tituloRespuesta.getAttribute("contenteditable") === "true";
    if (!yaEditable) {
      tituloRespuesta.setAttribute("contenteditable", "true");
      tituloRespuesta.focus();
      document.execCommand && document.execCommand("selectAll", false, null);
    } else {
      tituloRespuesta.setAttribute("contenteditable", "false");
      const nuevoTitulo = tituloRespuesta.textContent.trim() || "RESPUESTA";
      tituloRespuesta.textContent = nuevoTitulo;
      guardarTituloEnLocalStorage(nuevoTitulo);
    }
  }

  /* ============================================================
     MANEJO DE EVENTOS
     ============================================================ */

  function manejarPegadoTextoPlano(evento) {
    evento.preventDefault();
    const textoPlano = (evento.clipboardData || window.clipboardData).getData("text/plain");
    document.execCommand("insertText", false, textoPlano);
  }

  function manejarEntradaTexto() {
    actualizarElementosDesdeTextoCrudo();
    renderizarCapaResaltado();
    dibujarRuleta(); // (F5/F6) la ruleta se actualiza automáticamente
    guardarDatosEnLocalStorage();
  }

  function manejarTeclado(evento) {
    const editandoTextoActivo = document.activeElement === areaTexto && !areaTexto.readOnly;
    const editandoTituloActivo = tituloRespuesta.getAttribute("contenteditable") === "true";

    if (editandoTextoActivo || editandoTituloActivo) {
      return; // deja escribir con normalidad, no interpretar atajos
    }

    if (evento.code === "Space") {
      evento.preventDefault();
      girarRuleta();
      return;
    }

    switch (evento.key.toLowerCase()) {
      case "s":
        ocultarElementoSeleccionado();
        break;
      case "r":
        reiniciarSorteo();
        break;
      case "e":
        evento.preventDefault();
        alternarEdicionTexto();
        break;
      case "f":
        alternarPantallaCompleta();
        break;
    }
  }

  function inicializarEventos() {
    botonIniciar.addEventListener("click", girarRuleta);
    botonCentro.addEventListener("click", girarRuleta);
    lienzoRuleta.addEventListener("click", girarRuleta);

    botonReiniciar.addEventListener("click", reiniciarSorteo);
    botonEsconder.addEventListener("click", ocultarElementoSeleccionado);
    botonEditar.addEventListener("click", alternarEdicionTexto);
    botonTitulo.addEventListener("click", alternarEdicionTitulo);

    areaTexto.addEventListener("click", function () {
      if (areaTexto.readOnly) activarEdicionTexto(); // (F7) clic habilita edición
    });
    areaTexto.addEventListener("input", manejarEntradaTexto);
    areaTexto.addEventListener("paste", manejarPegadoTextoPlano); // (F4) pegado multilínea

    document.addEventListener("keydown", manejarTeclado);
  }

  /* ============================================================
     INICIALIZACIÓN
     ============================================================ */

  function inicializarAplicacion() {
    elementosRuleta = cargarDatosDesdeLocalStorage();
    sincronizarTextoVisible();

    const tituloGuardado = cargarTituloDesdeLocalStorage();
    if (tituloGuardado) tituloRespuesta.textContent = tituloGuardado;

    renderizarCapaResaltado();
    dibujarRuleta();
    inicializarEventos();
  }

  document.addEventListener("DOMContentLoaded", inicializarAplicacion);
})();
