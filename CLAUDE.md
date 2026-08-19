# CLAUDE.md

Convenciones y flujo de trabajo de este repositorio. Se carga automáticamente.

## Qué es esto

**KROMA** (Kit de Robótica Maker) — extensión de MakeCode para la placa controladora y expansora de Plan Ceibal. Paquete `pxt-kroma`. Los usuarios finales son docentes y estudiantes sin formación en electrónica.

## Cadena de autoridad

1. `docs/ESPECIFICACION.md` — qué debe hacer. Prescriptivo, manda sobre todo lo demás.
2. `docs/ARQUITECTURA.md` — cómo se construye. Prescriptivo para bloques públicos y tablas; descriptivo para el interior de los drivers.
3. `docs/PLAN-DE-TAREAS.md` — descomposición, con trazabilidad a requisitos.

Leer los tres antes de planificar cualquier cambio. Ninguna tarea existe sin un requisito que la justifique.

## Principio rector

El docente nombra el periférico y el puerto donde lo conectó. Ningún bloque expone pines, canales, direcciones I2C ni nombres del esquemático.

## Reglas que no se rompen

1. **Ningún literal de mapeo fuera de `tablas.ts`.** Ni canales, ni pines del expansor, ni direcciones I2C. Los cruces son demasiado fáciles de equivocar.
2. **`placa.ts` solo tiene bloques.** Anotaciones, validación de argumentos y delegación. La lógica de hardware vive en los drivers.
3. **Los `blockId` son permanentes.** Cambiar uno rompe los proyectos guardados de los docentes.
4. **Inicialización perezosa e idempotente** en cada driver. No se le puede pedir al docente que arrastre un bloque de inicialización.
5. **No existe bloque "frenar motor".** El hardware no puede hacerlo.
6. **El bloque de distancia solo ofrece los puertos 4 y 6.** En los demás la línea digital pasa por el expansor y es mil veces demasiado lenta.
7. **Sin cambios especulativos.** Una discrepancia entre documento y código se reporta y se confirma. Nunca se corrige en silencio en ninguna de las dos direcciones.
8. **Ninguna tarea arranca con una ambigüedad abierta que la toque.** La tabla está en `docs/ESPECIFICACION.md`. Si se avanza igual, el supuesto adoptado se escribe allí como tal.

## Identificadores de bloque (GEN-6)

- Un `blockId` publicado no se renombra ni se elimina nunca, aunque cambie
  su texto visible (`block=`), su grupo, su ícono o su posición en la paleta.
- El `blockId` se fija antes de mergear el bloque y se revisa con más cuidado
  que el resto del código: no hay forma de corregirlo después sin romper los
  programas ya guardados por los docentes.
- Un bloque que se deja de recomendar se oculta (`deprecated`), nunca se
  renombra ni se borra.
- El `blockId` de un bloque retirado no se reutiliza para otra cosa.

## Idioma

Todo lo visible al docente va en español, escrito así en el código fuente. Sin `_locales/`, sin capa de traducción.

Inglés y sin acentos para lo que no se ve: `blockId`, nombres de variables y de funciones internas. Los `blockId` son identificadores permanentes, no texto.

## TypeScript de pxt

No es TypeScript completo. Sin `any` dinámico, sin `async`/`await`, sin genéricos complejos. Código simple, verificado contra el compilador de MakeCode.

## Comandos

```bash
node tools/check-tablas.js    # invariantes de las tablas de correspondencia
```

No hay build step propio: la compilación la hace MakeCode.

## Al empezar cualquier tarea

1. Declarar qué requisitos de `docs/ESPECIFICACION.md` satisface
2. Confirmar que ninguna ambigüedad abierta los toca

## Al terminar cualquier tarea

0. Todos los criterios de aceptación de los requisitos declarados, cumplidos
1. `node tools/check-tablas.js` en verde
2. La extensión compila en MakeCode
3. `docs/ARQUITECTURA.md` actualizado si cambiaron exportaciones, flujos o tablas
4. Invocar `revisor-placa`
5. Invocar `revisor-didactico` si se agregaron o modificaron bloques públicos
6. Ejecutar la porción correspondiente de `docs/VERIFICACION.md` con la placa física

## Al proponer alternativas

Presentar opciones con enfoque, ventajas, desventajas, complejidad y archivos afectados. Terminar con una recomendación. Esperar la decisión del desarrollador antes de implementar.
