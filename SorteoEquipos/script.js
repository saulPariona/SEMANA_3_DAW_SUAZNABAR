/* =========================================================
   SORTEO DE EQUIPOS - Punto 2 de la Práctica Calificada 3
   Mi parte del trabajo grupal: F3 (generar y mostrar
   resultados) y F4 (descargar JPG / copiar texto / copiar
   por columnas).

   PUNTOS DE INTEGRACIÓN con la parte de mi compañero/a
   (F1: lista de participantes con localStorage, F2:
   configuración de cantidad de equipos o participantes por
   equipo + título):
     - Debe existir un textarea con id="area-participantes"
     - Debe existir un input de radio name="modo-division"
       con valores "equipos" o "porEquipo"
     - Debe existir un <select id="select-valor-division">
       con la cantidad elegida como "value"
     - Debe existir un input id="input-titulo-sorteo"
   Si mi compañero/a nombra distinto sus elementos, solo hay
   que actualizar los "document.getElementById(...)" de la
   sección "LECTURA DEL FORMULARIO" de abajo.
   ========================================================= */

document.addEventListener('DOMContentLoaded', inicializarAplicacion);

let ultimosEquiposGenerados = [];
let ultimoTituloGenerado = 'Resultado del sorteo';

function inicializarAplicacion() {
  const areaParticipantes = document.getElementById('area-participantes');
  const contadorNumero = document.getElementById('contador-numero');

  // --- F1 (compañero/a): persistencia simple en localStorage ---
  const textoGuardado = localStorage.getItem('sorteoEquipos_participantes');
  if (textoGuardado) areaParticipantes.value = textoGuardado;
  actualizarContador();

  areaParticipantes.addEventListener('input', () => {
    localStorage.setItem('sorteoEquipos_participantes', areaParticipantes.value);
    actualizarContador();
  });

  function actualizarContador() {
    const cantidad = obtenerListaParticipantes().length;
    contadorNumero.textContent = cantidad;
  }

  document.getElementById('boton-limpiar').addEventListener('click', () => {
    areaParticipantes.value = '';
    localStorage.removeItem('sorteoEquipos_participantes');
    actualizarContador();
  });

  document.getElementById('boton-generar').addEventListener('click', manejarClicGenerar);
  document.getElementById('boton-volver').addEventListener('click', volverAlFormulario);
  document.getElementById('boton-descargar-jpg').addEventListener('click', descargarResultadosComoJPG);
  document.getElementById('boton-copiar-texto').addEventListener('click', copiarResultadosAlPortapapeles);
  document.getElementById('boton-copiar-columnas').addEventListener('click', copiarResultadosPorColumnas);
}

/* ================= LECTURA DEL FORMULARIO ================= */

function obtenerListaParticipantes() {
  const texto = document.getElementById('area-participantes').value;
  return texto
    .split('\n')
    .map(nombre => nombre.trim())
    .filter(nombre => nombre.length > 0)
    .slice(0, 100); // límite F1: hasta 100 participantes
}

function obtenerModoDivision() {
  const radioSeleccionado = document.querySelector('input[name="modo-division"]:checked');
  return radioSeleccionado ? radioSeleccionado.value : 'equipos';
}

function obtenerValorDivision() {
  const valor = parseInt(document.getElementById('select-valor-division').value, 10);
  return isNaN(valor) || valor < 1 ? 2 : valor;
}

function obtenerTituloSorteo() {
  const titulo = document.getElementById('input-titulo-sorteo').value.trim();
  return titulo.length > 0 ? titulo : 'Resultado del sorteo';
}

/* ===================== F3: GENERACIÓN ===================== */

function manejarClicGenerar() {
  const participantes = obtenerListaParticipantes();
  const mensaje = document.getElementById('mensaje-estado');

  if (participantes.length < 2) {
    alert('Ingresa al menos 2 participantes para poder sortear equipos.');
    return;
  }

  const modo = obtenerModoDivision();
  const valor = obtenerValorDivision();
  const titulo = obtenerTituloSorteo();

  const equipos = generarEquiposAleatoriamente(participantes, modo, valor);

  ultimosEquiposGenerados = equipos;
  ultimoTituloGenerado = titulo;

  mostrarPantallaResultados(equipos, titulo);
  if (mensaje) mensaje.textContent = '';
}

function mezclarArreglo(arreglo) {
  const copia = [...arreglo];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

function generarEquiposAleatoriamente(participantes, modo, valor) {
  const participantesMezclados = mezclarArreglo(participantes);
  const equipos = [];

  if (modo === 'porEquipo') {
    const participantesPorEquipo = Math.max(1, valor);
    for (let i = 0; i < participantesMezclados.length; i += participantesPorEquipo) {
      equipos.push(participantesMezclados.slice(i, i + participantesPorEquipo));
    }
  } else {
    const cantidadEquipos = Math.min(Math.max(1, valor), participantesMezclados.length);
    for (let i = 0; i < cantidadEquipos; i++) equipos.push([]);
    participantesMezclados.forEach((persona, indice) => {
      equipos[indice % cantidadEquipos].push(persona);
    });
  }

  return equipos;
}

function mostrarPantallaResultados(equipos, titulo) {
  document.getElementById('pantalla-formulario').classList.remove('activa');
  document.getElementById('pantalla-resultados').classList.add('activa');
  document.getElementById('titulo-resultados').textContent = titulo;

  const contenedor = document.getElementById('contenedor-equipos');
  contenedor.innerHTML = '';

  equipos.forEach((integrantes, indiceEquipo) => {
    const rectangulo = document.createElement('div');
    rectangulo.className = 'equipo-rectangulo';
    rectangulo.style.animationDelay = `${indiceEquipo * 0.08}s`;

    const subtitulo = document.createElement('h2');
    subtitulo.textContent = `Equipo ${indiceEquipo + 1}`;
    rectangulo.appendChild(subtitulo);

    const lista = document.createElement('ul');
    integrantes.forEach((nombre, indicePersona) => {
      const item = document.createElement('li');
      item.textContent = nombre;
      // Aparecen uno a uno dentro del equipo, como pide el enunciado
      item.style.animationDelay = `${indiceEquipo * 0.08 + indicePersona * 0.12}s`;
      lista.appendChild(item);
    });
    rectangulo.appendChild(lista);

    contenedor.appendChild(rectangulo);
  });
}

function volverAlFormulario() {
  document.getElementById('pantalla-resultados').classList.remove('activa');
  document.getElementById('pantalla-formulario').classList.add('activa');
}

/* ===================== F4: LOS 3 BOTONES ===================== */

function mostrarMensajeEstado(texto) {
  const mensaje = document.getElementById('mensaje-estado');
  if (!mensaje) return;
  mensaje.textContent = texto;
  setTimeout(() => { mensaje.textContent = ''; }, 2500);
}

// Botón 1: descargar como imagen JPG (dibujado a mano en <canvas>,
// sin librerías externas como html2canvas, tal como exige el enunciado)
function descargarResultadosComoJPG() {
  const equipos = ultimosEquiposGenerados;
  if (equipos.length === 0) return;

  const lienzo = document.getElementById('lienzo-exportar');
  const contexto = lienzo.getContext('2d');

  const anchoColumna = 260;
  const margen = 30;
  const alturaEncabezado = 70;
  const alturaPorFila = 28;
  const maxFilas = Math.max(...equipos.map(e => e.length));

  lienzo.width = margen * 2 + anchoColumna * equipos.length;
  lienzo.height = alturaEncabezado + maxFilas * alturaPorFila + margen * 2;

  // Fondo
  contexto.fillStyle = '#FFFFFF';
  contexto.fillRect(0, 0, lienzo.width, lienzo.height);

  // Título
  contexto.fillStyle = '#2B2740';
  contexto.font = 'bold 24px Arial';
  contexto.fillText(ultimoTituloGenerado, margen, 40);

  equipos.forEach((integrantes, indiceEquipo) => {
    const x = margen + indiceEquipo * anchoColumna;
    const y = alturaEncabezado;
    const altoRectangulo = integrantes.length * alturaPorFila + 40;

    contexto.strokeStyle = '#6C4AB6';
    contexto.lineWidth = 2;
    contexto.strokeRect(x, y, anchoColumna - 15, altoRectangulo);

    contexto.fillStyle = '#4B2E96';
    contexto.font = 'bold 16px Arial';
    contexto.fillText(`Equipo ${indiceEquipo + 1}`, x + 12, y + 24);

    contexto.fillStyle = '#2B2740';
    contexto.font = '14px Arial';
    integrantes.forEach((nombre, indicePersona) => {
      contexto.fillText(nombre, x + 12, y + 46 + indicePersona * alturaPorFila);
    });
  });

  const enlace = document.createElement('a');
  enlace.download = `${ultimoTituloGenerado.replace(/\s+/g, '_')}.jpg`;
  enlace.href = lienzo.toDataURL('image/jpeg', 0.92);
  enlace.click();

  mostrarMensajeEstado('Imagen JPG descargada.');
}

// Botón 2: copiar los equipos al portapapeles como texto plano
function copiarResultadosAlPortapapeles() {
  const equipos = ultimosEquiposGenerados;
  if (equipos.length === 0) return;

  let texto = `${ultimoTituloGenerado}\n\n`;
  equipos.forEach((integrantes, indiceEquipo) => {
    texto += `Equipo ${indiceEquipo + 1}:\n`;
    integrantes.forEach(nombre => { texto += `  - ${nombre}\n`; });
    texto += '\n';
  });

  copiarTextoAlPortapapeles(texto, 'Equipos copiados al portapapeles.');
}

// Botón 3: copiar en formato de columnas (separado por tabulaciones,
// listo para pegar en Excel / Google Sheets: una columna por equipo)
function copiarResultadosPorColumnas() {
  const equipos = ultimosEquiposGenerados;
  if (equipos.length === 0) return;

  const encabezados = equipos.map((_, indice) => `Equipo ${indice + 1}`);
  const maxFilas = Math.max(...equipos.map(e => e.length));

  const filas = [encabezados.join('\t')];
  for (let fila = 0; fila < maxFilas; fila++) {
    const valoresFila = equipos.map(integrantes => integrantes[fila] || '');
    filas.push(valoresFila.join('\t'));
  }

  copiarTextoAlPortapapeles(filas.join('\n'), 'Equipos copiados por columnas.');
}

function copiarTextoAlPortapapeles(texto, mensajeExito) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(texto)
      .then(() => mostrarMensajeEstado(mensajeExito))
      .catch(() => copiarTextoConAreaTemporal(texto, mensajeExito));
  } else {
    copiarTextoConAreaTemporal(texto, mensajeExito);
  }
}

// Alternativa por si el navegador no soporta navigator.clipboard
function copiarTextoConAreaTemporal(texto, mensajeExito) {
  const areaTemporal = document.createElement('textarea');
  areaTemporal.value = texto;
  areaTemporal.style.position = 'fixed';
  areaTemporal.style.left = '-9999px';
  document.body.appendChild(areaTemporal);
  areaTemporal.select();
  document.execCommand('copy');
  document.body.removeChild(areaTemporal);
  mostrarMensajeEstado(mensajeExito);
}