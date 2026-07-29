# Sorteo de Alumnos

Aplicación web hecha con `HTML`, `CSS` y `JavaScript` vainilla para realizar sorteos entre alumnos usando una ruleta visual.

Está pensada para usar directamente en el navegador, sin backend ni base de datos externa. Toda la información se guarda en `localStorage`.

## Funciones

- Ruleta visual con animación.
- Sorteo de 1 o varios alumnos por turno.
- Estado `Sorteado` para excluir automáticamente a quienes ya salieron.
- Estado `Ausente` para excluir a quienes no están presentes sin marcarlos como sorteados.
- Marcado y desmarcado individual de estados.
- Acciones masivas:
  - `Todos Sorteado`
  - `Quitar Sorteado`
  - `Todos Ausente`
  - `Quitar Ausente`
- Edición y eliminación individual de alumnos.
- Gestión de cursos:
  - crear
  - renombrar
  - eliminar
  - resetear estados
- Carga de alumnos por:
  - pegado desde Excel o Google Sheets
  - archivo `.txt`
  - archivo `.csv`
- Sonido opcional durante el giro y al seleccionar ganador.
- Persistencia de:
  - cursos
  - alumnos
  - estados
  - curso activo
  - cantidad a sortear
  - sonido activado/desactivado

## Estructura

- `index.html`: estructura de la interfaz y estilos CSS.
- `app.js`: lógica de la aplicación, persistencia, ruleta, estados y sonido.

## Cómo usar

1. Abre `index.html` en el navegador.
2. Crea un curso nuevo.
3. Pega la lista de alumnos o carga un `.txt`/`.csv`.
4. Elige cuántos alumnos quieres sortear.
5. Activa o desactiva el sonido si lo deseas.
6. Pulsa `GIRAR RULETA`.

## Estados de alumnos

- `Disponible`: participa en el sorteo.
- `Sorteado`: no vuelve a participar hasta que lo desmarques o resetees el curso.
- `Ausente`: no participa, pero no cuenta como sorteado.

## Persistencia

La aplicación usa `localStorage`, por lo que los datos quedan guardados en ese navegador y en ese dispositivo.

Si cambias de navegador, borras los datos del navegador o usas otro equipo, la información no se conserva automáticamente.

## Desarrollo local

Puedes abrir el archivo directamente o levantar un servidor local simple.

Ejemplo con PHP:

```bash
php -S localhost:8080
```

Luego abre:

```text
http://localhost:8080/
```

## Compatibilidad

- Navegadores modernos con soporte para:
  - `localStorage`
  - `Canvas`
  - `Web Audio API`

## Notas

- El proyecto no usa frameworks ni librerías externas.
- Los sonidos se generan por código, sin archivos de audio externos.

