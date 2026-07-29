# Release Notes

## v1.0.0 - Primera version publica

### Resumen

Primera version funcional de **Sorteo de Alumnos**, una app web hecha con HTML, CSS y JavaScript vainilla para realizar sorteos mediante una ruleta visual, gestionar cursos y guardar estados en el navegador.

### Novedades

- Ruleta visual con animacion para realizar sorteos de alumnos.
- Cantidad de sorteados configurable por ronda.
- Gestion de multiples cursos o divisiones.
- Carga de alumnos por copiado y pegado.
- Importacion de alumnos desde archivos `.txt` y `.csv`.
- Persistencia local con `localStorage`.
- Estado `Sorteado` para excluir automaticamente a quienes ya salieron.
- Estado `Ausente` para excluir temporalmente a quienes no estan disponibles.
- Marcado y desmarcado interactivo por alumno.
- Acciones masivas:
  - `Todos Sorteado`
  - `Quitar Sorteado`
  - `Todos Ausente`
  - `Quitar Ausente`
- Edicion y eliminacion individual de alumnos.
- Gestion de cursos:
  - crear
  - renombrar
  - eliminar
  - resetear estados
- Sonido opcional durante el giro y al anunciar ganadores.
- Ajuste de volumen del sonido para mejorar la percepcion durante el uso real.

### Mejoras visuales

- Interfaz rehecha en CSS vainilla, sin dependencias externas.
- Estructura mas clara para uso rapido en clase.
- Controles y estados visibles para manejar sorteados y ausentes de forma simple.

### Notas tecnicas

- Proyecto 100% frontend.
- Sin backend ni base de datos externa.
- Los datos quedan guardados en el navegador del dispositivo donde se use.

### Recomendaciones

- Usar en un navegador moderno.
- Si se limpia el almacenamiento del navegador, se perderan los cursos y estados guardados.

### Proximos pasos sugeridos

- Exportacion e importacion de backups.
- Soporte para archivos de Excel `.xlsx`.
- Ajustes de volumen mas finos desde la interfaz.
- Mejoras esteticas adicionales para presentacion en clase.
