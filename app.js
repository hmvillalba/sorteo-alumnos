// === Estado de la Aplicación ===
let cursos = JSON.parse(localStorage.getItem('appSorteo_cursos')) || {};
let cursoActual = localStorage.getItem('appSorteo_cursoActual') || '';
const configInicial = { cantidadSorteo: 2, sonidoActivado: true };
let config = {
    ...configInicial,
    ...(JSON.parse(localStorage.getItem('appSorteo_config')) || {})
};

// Colores modernos para la ruleta
const colores = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'];

// Referencias DOM
const refs = {
    selectorCurso: document.getElementById('selector-curso'),
    btnToggleNuevo: document.getElementById('btn-toggle-nuevo'),
    btnRenombrarCurso: document.getElementById('btn-renombrar-curso'),
    btnResetCurso: document.getElementById('btn-reset-curso'),
    btnEliminarCurso: document.getElementById('btn-eliminar-curso'),
    btnMarcarTodosSorteado: document.getElementById('btn-marcar-todos-sorteado'),
    btnDesmarcarTodosSorteado: document.getElementById('btn-desmarcar-todos-sorteado'),
    btnMarcarTodosAusente: document.getElementById('btn-marcar-todos-ausente'),
    btnDesmarcarTodosAusente: document.getElementById('btn-desmarcar-todos-ausente'),
    panelNuevo: document.getElementById('panel-nuevo-curso'),
    inputNombre: document.getElementById('input-nombre-curso'),
    inputLista: document.getElementById('input-lista-alumnos'),
    inputArchivo: document.getElementById('input-archivo-alumnos'),
    btnGuardar: document.getElementById('btn-guardar-curso'),
    listaAlumnosDOM: document.getElementById('lista-alumnos'),
    resumenAlumnos: document.getElementById('resumen-alumnos'),
    canvas: document.getElementById('canvas-ruleta'),
    ctx: document.getElementById('canvas-ruleta').getContext('2d'),
    btnSortear: document.getElementById('btn-sortear'),
    inputCantidad: document.getElementById('input-cantidad'),
    inputSonido: document.getElementById('input-sonido'),
    contenedorGanadores: document.getElementById('lista-ganadores')
};

// Variables de animación
let anguloActual = 0;
let isSpinning = false;
let editingAlumnoIndex = null;
let audioContext = null;

// === Inicialización ===
function init() {
    normalizarCursosGuardados();
    refs.inputCantidad.value = obtenerCantidadValida(config.cantidadSorteo);
    refs.inputSonido.checked = config.sonidoActivado !== false;
    actualizarSelectorCursos();
    sincronizarCursoActual();
    actualizarEstadoAccionesCurso();
    renderizarTodo();

    refs.btnToggleNuevo.addEventListener('click', () => {
        refs.panelNuevo.classList.toggle('hidden');
    });

    refs.btnGuardar.addEventListener('click', guardarNuevoCurso);
    refs.btnRenombrarCurso.addEventListener('click', renombrarCursoActual);
    refs.btnResetCurso.addEventListener('click', resetearCursoActual);
    refs.btnEliminarCurso.addEventListener('click', eliminarCursoActual);
    refs.btnMarcarTodosSorteado.addEventListener('click', () => aplicarEstadoMasivo('sorteado', true));
    refs.btnDesmarcarTodosSorteado.addEventListener('click', () => aplicarEstadoMasivo('sorteado', false));
    refs.btnMarcarTodosAusente.addEventListener('click', () => aplicarEstadoMasivo('ausente', true));
    refs.btnDesmarcarTodosAusente.addEventListener('click', () => aplicarEstadoMasivo('ausente', false));
    refs.btnSortear.addEventListener('click', iniciarSorteoMultiple);

    refs.selectorCurso.addEventListener('change', (e) => {
        cursoActual = e.target.value;
        refs.contenedorGanadores.innerHTML = '';
        guardarEstado();
        actualizarEstadoAccionesCurso();
        renderizarTodo();
    });

    refs.inputCantidad.addEventListener('change', guardarCantidadPreferida);
    refs.inputSonido.addEventListener('change', guardarPreferenciaSonido);
    refs.inputArchivo.addEventListener('change', manejarArchivoAlumnos);
}

// === Gestión de Datos ===
function guardarEstado() {
    localStorage.setItem('appSorteo_cursos', JSON.stringify(cursos));
    localStorage.setItem('appSorteo_cursoActual', cursoActual);
    localStorage.setItem('appSorteo_config', JSON.stringify(config));
}

function normalizarCursosGuardados() {
    Object.keys(cursos).forEach((nombreCurso) => {
        const alumnos = Array.isArray(cursos[nombreCurso]) ? cursos[nombreCurso] : [];
        cursos[nombreCurso] = alumnos
            .map((alumno) => {
                if (typeof alumno === 'string') {
                    return { nombre: limpiarNombre(alumno), sorteado: false, ausente: false };
                }

                return {
                    nombre: limpiarNombre(alumno?.nombre || ''),
                    sorteado: Boolean(alumno?.sorteado ?? alumno?.yaSorteado),
                    ausente: Boolean(alumno?.ausente)
                };
            })
            .filter((alumno) => alumno.nombre !== '');
    });
}

function sincronizarCursoActual() {
    if (cursoActual && cursos[cursoActual]) {
        refs.selectorCurso.value = cursoActual;
        return;
    }

    const primerCurso = Object.keys(cursos)[0] || '';
    cursoActual = primerCurso;
    refs.selectorCurso.value = cursoActual;
    guardarEstado();
}

function guardarCantidadPreferida() {
    const cantidad = obtenerCantidadValida(refs.inputCantidad.value);
    refs.inputCantidad.value = cantidad;
    config.cantidadSorteo = cantidad;
    guardarEstado();
}

function guardarPreferenciaSonido() {
    config.sonidoActivado = refs.inputSonido.checked;
    guardarEstado();
}

function obtenerCantidadValida(valor) {
    const cantidad = parseInt(valor, 10);
    if (Number.isNaN(cantidad)) return configInicial.cantidadSorteo;
    return Math.min(10, Math.max(1, cantidad));
}

function limpiarNombre(valor) {
    return String(valor || '').replace(/\s+/g, ' ').trim();
}

function deduplicarNombres(nombres) {
    const vistos = new Set();
    return nombres.filter((nombre) => {
        const clave = nombre.toLocaleLowerCase();
        if (vistos.has(clave)) return false;
        vistos.add(clave);
        return true;
    });
}

function existeNombreAlumno(nombre, indiceIgnorado = -1) {
    if (!cursoActual || !cursos[cursoActual]) return false;
    const normalizado = limpiarNombre(nombre).toLocaleLowerCase();
    return cursos[cursoActual].some((alumno, index) => index !== indiceIgnorado && alumno.nombre.toLocaleLowerCase() === normalizado);
}

function sonidoActivo() {
    return config.sonidoActivado !== false;
}

function obtenerAudioContext() {
    if (!sonidoActivo()) return null;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;

    if (!audioContext) {
        audioContext = new AudioContextClass();
    }

    if (audioContext.state === 'suspended') {
        audioContext.resume().catch(() => {});
    }

    return audioContext;
}

function reproducirTono({ frequency, duration, type = 'sine', volume = 0.03, attack = 0.005, release = 0.08 }) {
    const ctx = obtenerAudioContext();
    if (!ctx) return;

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    const startTime = ctx.currentTime;
    const endTime = startTime + duration;

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, startTime);

    gainNode.gain.setValueAtTime(0.0001, startTime);
    gainNode.gain.linearRampToValueAtTime(volume, startTime + attack);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, endTime + release);

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.start(startTime);
    oscillator.stop(endTime + release);
}

function reproducirClickRuleta() {
    reproducirTono({
        frequency: 900 + Math.random() * 180,
        duration: 0.03,
        type: 'square',
        volume: 0.018,
        attack: 0.001,
        release: 0.03
    });
}

function reproducirSonidoGanador() {
    const ctx = obtenerAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    [
        { frequency: 523.25, offset: 0, duration: 0.09 },
        { frequency: 659.25, offset: 0.08, duration: 0.1 },
        { frequency: 783.99, offset: 0.16, duration: 0.16 }
    ].forEach((note) => {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(note.frequency, now + note.offset);
        gainNode.gain.setValueAtTime(0.0001, now + note.offset);
        gainNode.gain.linearRampToValueAtTime(0.05, now + note.offset + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, now + note.offset + note.duration);
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        oscillator.start(now + note.offset);
        oscillator.stop(now + note.offset + note.duration);
    });
}

function parsearListaAlumnos(texto) {
    const contenido = String(texto || '').replace(/\r/g, '').trim();
    if (!contenido) return [];

    const lineas = contenido
        .split('\n')
        .map((linea) => linea.trim())
        .filter(Boolean);

    const nombres = [];

    lineas.forEach((linea) => {
        let candidato = linea;

        if (linea.includes('\t')) {
            candidato = linea.split('\t').find((parte) => limpiarNombre(parte)) || '';
        } else if (!linea.includes(' ') && (linea.includes(';') || linea.includes(','))) {
            const separador = linea.includes(';') ? ';' : ',';
            linea.split(separador).forEach((parte) => {
                const limpio = limpiarNombre(parte);
                if (limpio) nombres.push(limpio);
            });
            return;
        }

        candidato = limpiarNombre(candidato);
        if (candidato) nombres.push(candidato);
    });

    return deduplicarNombres(nombres);
}

function construirAlumnos(nombres) {
    return nombres.map((nombre) => ({
        nombre,
        sorteado: false,
        ausente: false
    }));
}

function obtenerNombresDesdeFormulario() {
    return parsearListaAlumnos(refs.inputLista.value);
}

function limpiarFormularioCurso() {
    refs.inputNombre.value = '';
    refs.inputLista.value = '';
    refs.inputArchivo.value = '';
}

function guardarNuevoCurso() {
    const nombre = limpiarNombre(refs.inputNombre.value);
    const nombres = obtenerNombresDesdeFormulario();

    if (!nombre) {
        alert('Escribe un nombre para el curso.');
        return;
    }

    if (nombres.length === 0) {
        alert('Pega una lista o carga un archivo con alumnos.');
        return;
    }

    if (cursos[nombre] && !confirm(`El curso "${nombre}" ya existe. ¿Quieres reemplazarlo?`)) {
        return;
    }

    cursos[nombre] = construirAlumnos(nombres);
    cursoActual = nombre;
    refs.panelNuevo.classList.add('hidden');
    limpiarFormularioCurso();
    guardarEstado();
    actualizarSelectorCursos();
    refs.selectorCurso.value = cursoActual;
    actualizarEstadoAccionesCurso();
    refs.contenedorGanadores.innerHTML = '';
    renderizarTodo();
}

function renombrarCursoActual() {
    if (!cursoActual || !cursos[cursoActual]) return;

    const nuevoNombre = limpiarNombre(prompt('Nuevo nombre para el curso:', cursoActual));
    if (!nuevoNombre || nuevoNombre === cursoActual) return;

    if (cursos[nuevoNombre]) {
        alert('Ya existe un curso con ese nombre.');
        return;
    }

    cursos[nuevoNombre] = cursos[cursoActual];
    delete cursos[cursoActual];
    cursoActual = nuevoNombre;
    guardarEstado();
    actualizarSelectorCursos();
    refs.selectorCurso.value = cursoActual;
    renderizarTodo();
}

function eliminarCursoActual() {
    if (!cursoActual || !cursos[cursoActual]) return;

    if (!confirm(`¿Eliminar el curso "${cursoActual}"? Esta acción no se puede deshacer.`)) {
        return;
    }

    delete cursos[cursoActual];
    cursoActual = Object.keys(cursos)[0] || '';
    refs.contenedorGanadores.innerHTML = '';
    guardarEstado();
    actualizarSelectorCursos();
    refs.selectorCurso.value = cursoActual;
    actualizarEstadoAccionesCurso();
    renderizarTodo();
}

function resetearCursoActual() {
    if (!cursoActual || !cursos[cursoActual]) return;

    if (!confirm(`¿Resetear estados de "${cursoActual}"? Esto quitará tanto "Sorteado" como "Ausente".`)) {
        return;
    }

    cursos[cursoActual].forEach((alumno) => {
        alumno.sorteado = false;
        alumno.ausente = false;
    });

    refs.contenedorGanadores.innerHTML = '';
    guardarEstado();
    renderizarTodo();
}

function aplicarEstadoMasivo(field, checked) {
    if (!cursoActual || !cursos[cursoActual]) return;

    cursos[cursoActual].forEach((alumno) => {
        if (field === 'sorteado') {
            alumno.sorteado = checked;
            if (checked) alumno.ausente = false;
            return;
        }

        if (field === 'ausente') {
            alumno.ausente = checked;
            if (checked) alumno.sorteado = false;
        }
    });

    refs.contenedorGanadores.innerHTML = '';
    guardarEstado();
    renderizarTodo();
}

function editarAlumno(index) {
    if (!cursoActual || !cursos[cursoActual]) return;
    editingAlumnoIndex = index;
    renderizarTodo();
}

function eliminarAlumno(index) {
    if (!cursoActual || !cursos[cursoActual]) return;

    const alumno = cursos[cursoActual][index];
    if (!alumno) return;

    if (!confirm(`¿Eliminar a "${alumno.nombre}" del curso actual?`)) {
        return;
    }

    cursos[cursoActual].splice(index, 1);
    if (editingAlumnoIndex === index) {
        editingAlumnoIndex = null;
    } else if (editingAlumnoIndex !== null && editingAlumnoIndex > index) {
        editingAlumnoIndex -= 1;
    }
    refs.contenedorGanadores.innerHTML = '';
    guardarEstado();
    renderizarTodo();
}

function guardarEdicionAlumno(index) {
    if (!cursoActual || !cursos[cursoActual]) return;

    const alumno = cursos[cursoActual][index];
    if (!alumno) return;

    const input = document.querySelector(`#lista-alumnos input[data-edit-index="${index}"]`);
    if (!input) return;

    const nuevoNombre = limpiarNombre(input.value);
    if (!nuevoNombre) {
        alert('El nombre no puede quedar vacío.');
        return;
    }

    if (existeNombreAlumno(nuevoNombre, index)) {
        alert('Ya existe otro alumno con ese nombre en este curso.');
        return;
    }

    alumno.nombre = nuevoNombre;
    editingAlumnoIndex = null;
    guardarEstado();
    renderizarTodo();
}

function cancelarEdicionAlumno() {
    editingAlumnoIndex = null;
    renderizarTodo();
}

function manejarArchivoAlumnos(event) {
    const archivo = event.target.files?.[0];
    if (!archivo) return;

    const lector = new FileReader();
    lector.onload = () => {
        const contenido = String(lector.result || '');
        const nombres = parsearListaAlumnos(contenido);
        refs.inputLista.value = nombres.join('\n');
    };
    lector.onerror = () => {
        alert('No se pudo leer el archivo seleccionado.');
    };
    lector.readAsText(archivo, 'utf-8');
}

// === UI: Barra Lateral ===
function actualizarSelectorCursos() {
    refs.selectorCurso.innerHTML = '<option value="">Selecciona un curso...</option>';
    Object.keys(cursos)
        .sort((a, b) => a.localeCompare(b, 'es'))
        .forEach((nombre) => {
            const opt = document.createElement('option');
            opt.value = nombre;
            opt.textContent = nombre;
            refs.selectorCurso.appendChild(opt);
        });
}

function actualizarEstadoAccionesCurso() {
    const hayCurso = Boolean(cursoActual && cursos[cursoActual]);
    refs.btnRenombrarCurso.disabled = !hayCurso;
    refs.btnResetCurso.disabled = !hayCurso;
    refs.btnEliminarCurso.disabled = !hayCurso;
    refs.btnMarcarTodosSorteado.disabled = !hayCurso;
    refs.btnDesmarcarTodosSorteado.disabled = !hayCurso;
    refs.btnMarcarTodosAusente.disabled = !hayCurso;
    refs.btnDesmarcarTodosAusente.disabled = !hayCurso;
    refs.btnSortear.disabled = !hayCurso || isSpinning;
}

function renderizarResumen() {
    if (!cursoActual || !cursos[cursoActual]) {
        refs.resumenAlumnos.textContent = 'Selecciona un curso para empezar';
        return;
    }

    const total = cursos[cursoActual].length;
    const disponibles = obtenerDisponibles().length;
    const sorteados = cursos[cursoActual].filter((alumno) => alumno.sorteado).length;
    const ausentes = cursos[cursoActual].filter((alumno) => alumno.ausente).length;
    refs.resumenAlumnos.textContent = `Disp: ${disponibles} | Sorteado: ${sorteados} | Ausente: ${ausentes} | Total: ${total}`;
}

function renderizarLista() {
    refs.listaAlumnosDOM.innerHTML = '';
    renderizarResumen();

    if (!cursoActual || !cursos[cursoActual]) {
        refs.listaAlumnosDOM.innerHTML = '<li class="empty-state">Crea o selecciona un curso para ver los alumnos.</li>';
        return;
    }

    cursos[cursoActual].forEach((alumno, index) => {
        const li = document.createElement('li');
        li.className = 'student-item';

        const textClass = alumno.sorteado || alumno.ausente ? 'student-name student-name--excluded' : 'student-name';
        const estadoTexto = alumno.ausente
            ? 'No participa por ausencia'
            : alumno.sorteado
                ? 'Ya salió sorteado'
                : 'Disponible para el sorteo';
        const claseSorteado = alumno.sorteado ? 'status-toggle status-toggle--done is-active' : 'status-toggle status-toggle--done';
        const claseAusente = alumno.ausente ? 'status-toggle status-toggle--absent is-active' : 'status-toggle status-toggle--absent';

        if (editingAlumnoIndex === index) {
            li.innerHTML = `
                <div class="student-edit-form">
                    <input
                        type="text"
                        class="field student-edit-input"
                        value="${alumno.nombre.replace(/"/g, '&quot;')}"
                        data-edit-index="${index}"
                        aria-label="Editar nombre de ${alumno.nombre}"
                    >
                    <div class="student-edit-actions">
                        <button type="button" class="button button-success button-small" data-action="save-edit" data-index="${index}">Guardar</button>
                        <button type="button" class="button button-secondary button-small" data-action="cancel-edit" data-index="${index}">Cancelar</button>
                    </div>
                </div>
                <div class="student-controls">
                    <label class="${claseSorteado}">
                        <input
                            type="checkbox"
                            ${alumno.sorteado ? 'checked' : ''}
                            data-index="${index}"
                            data-field="sorteado"
                            aria-label="Marcar a ${alumno.nombre} como ya sorteado"
                        >
                        <span>Sorteado</span>
                    </label>
                    <label class="${claseAusente}">
                        <input
                            type="checkbox"
                            ${alumno.ausente ? 'checked' : ''}
                            data-index="${index}"
                            data-field="ausente"
                            aria-label="Marcar a ${alumno.nombre} como ausente"
                        >
                        <span>Ausente</span>
                    </label>
                </div>
            `;
        } else {
            li.innerHTML = `
                <div class="student-main">
                    <span class="${textClass}">${alumno.nombre}</span>
                    <span class="student-meta">${estadoTexto}</span>
                </div>
                <div class="student-controls">
                    <label class="${claseSorteado}">
                        <input
                            type="checkbox"
                            ${alumno.sorteado ? 'checked' : ''}
                            data-index="${index}"
                            data-field="sorteado"
                            aria-label="Marcar a ${alumno.nombre} como ya sorteado"
                        >
                        <span>Sorteado</span>
                    </label>
                    <label class="${claseAusente}">
                        <input
                            type="checkbox"
                            ${alumno.ausente ? 'checked' : ''}
                            data-index="${index}"
                            data-field="ausente"
                            aria-label="Marcar a ${alumno.nombre} como ausente"
                        >
                        <span>Ausente</span>
                    </label>
                    <div class="student-actions">
                        <button type="button" class="icon-button" data-action="edit" data-index="${index}">Editar</button>
                        <button type="button" class="icon-button icon-button-danger" data-action="delete" data-index="${index}">Eliminar</button>
                    </div>
                </div>
            `;
        }
        refs.listaAlumnosDOM.appendChild(li);
    });

    document.querySelectorAll('#lista-alumnos input[type="checkbox"]').forEach((chk) => {
        chk.addEventListener('change', (e) => {
            const idx = Number(e.target.getAttribute('data-index'));
            const field = e.target.getAttribute('data-field');
            const checked = e.target.checked;

            if (field === 'sorteado') {
                cursos[cursoActual][idx].sorteado = checked;
                if (checked) cursos[cursoActual][idx].ausente = false;
            }

            if (field === 'ausente') {
                cursos[cursoActual][idx].ausente = checked;
                if (checked) cursos[cursoActual][idx].sorteado = false;
            }

            guardarEstado();
            renderizarTodo();
        });
    });

    document.querySelectorAll('#lista-alumnos button[data-action]').forEach((button) => {
        button.addEventListener('click', (e) => {
            const index = Number(e.currentTarget.getAttribute('data-index'));
            const action = e.currentTarget.getAttribute('data-action');

            if (action === 'edit') {
                editarAlumno(index);
                return;
            }

            if (action === 'save-edit') {
                guardarEdicionAlumno(index);
                return;
            }

            if (action === 'cancel-edit') {
                cancelarEdicionAlumno();
                return;
            }

            if (action === 'delete') {
                eliminarAlumno(index);
            }
        });
    });

    if (editingAlumnoIndex !== null) {
        const input = document.querySelector(`#lista-alumnos input[data-edit-index="${editingAlumnoIndex}"]`);
        if (input) {
            input.focus();
            input.select();
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    guardarEdicionAlumno(editingAlumnoIndex);
                }

                if (e.key === 'Escape') {
                    e.preventDefault();
                    cancelarEdicionAlumno();
                }
            }, { once: true });
        }
    }
}

function renderizarTodo() {
    renderizarLista();
    dibujarRuleta();
    actualizarEstadoAccionesCurso();
}

// === Lógica de la Ruleta (Canvas) ===
function obtenerDisponibles() {
    if (!cursoActual || !cursos[cursoActual]) return [];
    return cursos[cursoActual].filter((alumno) => !alumno.sorteado && !alumno.ausente);
}

function dibujarRuleta() {
    const disponibles = obtenerDisponibles();
    const ancho = refs.canvas.width;
    const alto = refs.canvas.height;
    const radio = ancho / 2;

    refs.ctx.clearRect(0, 0, ancho, alto);

    if (disponibles.length === 0) {
        refs.ctx.fillStyle = '#E5E7EB';
        refs.ctx.beginPath();
        refs.ctx.arc(radio, radio, radio, 0, Math.PI * 2);
        refs.ctx.fill();
        refs.ctx.fillStyle = '#6B7280';
        refs.ctx.font = '20px Arial';
        refs.ctx.textAlign = 'center';
        refs.ctx.fillText(cursoActual ? 'Sin alumnos disponibles' : 'Selecciona un curso', radio, radio);
        return;
    }

    const arco = (Math.PI * 2) / disponibles.length;

    for (let i = 0; i < disponibles.length; i += 1) {
        const anguloInicio = anguloActual + i * arco;
        const anguloFin = anguloInicio + arco;

        refs.ctx.beginPath();
        refs.ctx.moveTo(radio, radio);
        refs.ctx.arc(radio, radio, radio, anguloInicio, anguloFin);
        refs.ctx.fillStyle = colores[i % colores.length];
        refs.ctx.fill();
        refs.ctx.strokeStyle = '#FFFFFF';
        refs.ctx.lineWidth = 2;
        refs.ctx.stroke();

        refs.ctx.save();
        refs.ctx.translate(radio, radio);
        refs.ctx.rotate(anguloInicio + arco / 2);
        refs.ctx.textAlign = 'right';
        refs.ctx.fillStyle = '#FFFFFF';
        refs.ctx.font = 'bold 16px sans-serif';
        refs.ctx.fillText(disponibles[i].nombre, radio - 20, 5);
        refs.ctx.restore();
    }
}

// === Sistema de Sorteo y Animación ===
const esperar = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function iniciarSorteoMultiple() {
    if (isSpinning) return;

    guardarCantidadPreferida();
    obtenerAudioContext();

    let cantidad = obtenerCantidadValida(refs.inputCantidad.value);
    const disponiblesIniciales = obtenerDisponibles().length;

    if (!cursoActual || !cursos[cursoActual]) {
        alert('Selecciona un curso antes de sortear.');
        return;
    }

    if (disponiblesIniciales === 0) {
        alert('No hay alumnos disponibles para sortear.');
        return;
    }

    if (cantidad > disponiblesIniciales) {
        cantidad = disponiblesIniciales;
        refs.inputCantidad.value = cantidad;
        config.cantidadSorteo = cantidad;
        guardarEstado();
    }

    isSpinning = true;
    actualizarEstadoAccionesCurso();
    refs.contenedorGanadores.innerHTML = '';

    for (let i = 0; i < cantidad; i += 1) {
        await animarGiro();
        await esperar(1200);
    }

    isSpinning = false;
    actualizarEstadoAccionesCurso();
}

function animarGiro() {
    return new Promise((resolve) => {
        const disponibles = obtenerDisponibles();
        if (disponibles.length === 0) {
            resolve();
            return;
        }

        const tiempoGiro = 4000;
        const girosExtra = 5;
        const anguloObjetivo = Math.random() * Math.PI * 2;
        const distanciaTotal = (Math.PI * 2 * girosExtra) + anguloObjetivo;
        let ultimoTick = 0;

        let tiempoInicio = null;
        const anguloInicialGiro = anguloActual;

        function pasoAnimacion(timestamp) {
            if (!tiempoInicio) tiempoInicio = timestamp;
            const progreso = timestamp - tiempoInicio;
            const t = Math.min(progreso / tiempoGiro, 1);
            const easeOutQuart = 1 - Math.pow(1 - t, 4);
            const intervaloTick = 35 + (t * 160);

            anguloActual = anguloInicialGiro + (distanciaTotal * easeOutQuart);
            dibujarRuleta();

            if (timestamp - ultimoTick >= intervaloTick) {
                reproducirClickRuleta();
                ultimoTick = timestamp;
            }

            if (progreso < tiempoGiro) {
                requestAnimationFrame(pasoAnimacion);
                return;
            }

            procesarGanador();
            resolve();
        }

        requestAnimationFrame(pasoAnimacion);
    });
}

function procesarGanador() {
    const disponibles = obtenerDisponibles();
    if (disponibles.length === 0) return;

    const arco = (Math.PI * 2) / disponibles.length;
    const anguloNormalizado = ((anguloActual % (Math.PI * 2)) + (Math.PI * 2)) % (Math.PI * 2);
    const indiceGanador = Math.floor(
        (((Math.PI * 2) - anguloNormalizado - (Math.PI / 2) + (Math.PI * 2)) % (Math.PI * 2)) / arco
    ) % disponibles.length;

    const alumnoGanador = disponibles[indiceGanador];
    if (!alumnoGanador) return;

    const div = document.createElement('div');
    div.className = 'winner-pill';
    div.textContent = alumnoGanador.nombre;
    refs.contenedorGanadores.appendChild(div);
    reproducirSonidoGanador();

    const indexReal = cursos[cursoActual].indexOf(alumnoGanador);
    if (indexReal >= 0) {
        cursos[cursoActual][indexReal].sorteado = true;
        cursos[cursoActual][indexReal].ausente = false;
    }

    guardarEstado();
    renderizarTodo();
}

// Arrancar App
init();
