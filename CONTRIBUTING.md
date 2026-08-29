# Desarrollo de pxt-kroma

Cómo probar cambios en la extensión antes de que lleguen a `main`.

## Flujo principal: rama `dev` + importar en MakeCode

Es la forma de **ver los bloques** como los va a ver el docente: nombre, ícono de la categoría, textos, selectores de puerto.

1. Pushear los cambios a la rama `dev` (nunca directo a `main`).
2. En el editor de MakeCode, abrir un proyecto y entrar en **Extensiones**.
3. Pegar la URL del repositorio apuntando a la rama:

   ```
   github:ceibal-microbit/pxt-kroma#dev
   ```

4. Los bloques de KROMA aparecen en la paleta.

### Si MakeCode no toma la última versión

Es un problema conocido del editor, no del repositorio: a veces se queda con una versión cacheada de la extensión después de un push. No hay solución oficial de los mantenedores; el workaround que reportan los usuarios es quitar la extensión del proyecto y volver a agregarla. Si aun así sigue vieja, crear un proyecto nuevo e importarla ahí.

## Uso puntual: `mkc` para compilar y grabar sin pushear

Sirve para dos cosas concretas: verificar que el código compila sin abrir el navegador, y generar el `.hex` para probar sobre la placa real. **No muestra los bloques** — para eso es el flujo de arriba.

Requisitos, una sola vez:

```
npm install -g makecode
```

Y en la raíz del repositorio:

```
mkc build
```

Si dice `Build OK`, el paquete compila. El archivo a grabar queda en `built\binary.hex`: se arrastra a la unidad MICROBIT y ya se puede probar el comportamiento real.

Esto último es lo único que verifica de verdad los criterios de aceptación de hardware (DIG-1 a DIG-4, etc.): ni el simulador ni el editor emulan la placa KROMA, así que un bloque digital no hace nada visible fuera del hardware.

## Versión de Node

El CLI de `pxt` es herramienta vieja y **rompe con Node 24** (crashes internos en `pxt install`, `pxt init` y `pxt target`). Usar **Node 20 LTS**, por ejemplo con [nvm-windows](https://github.com/coreybutler/nvm-windows):

```
nvm install 20
nvm use 20
```

Ojo: nvm mantiene los paquetes globales por versión de Node, así que después de cambiar de versión hay que reinstalar `makecode`.

## Lo que no funciona (probado el 2026-08-29, no repetir)

Levantar el editor completo en local con `pxt serve` y referenciar la extensión con una dependencia `file:`. El editor levanta y lista el paquete en el explorador, pero nunca lo carga: falla con `Cannot read properties of null (reading 'config')` en `sortedDeps`, y el paquete aparece vacío. Se probaron todas las combinaciones de ruta relativa, el nombre del paquete y la ubicación del workspace; ninguna funciona. Los proyectos creados en ese editor tampoco se guardan en disco, quedan en el almacenamiento del navegador.

Se documenta acá para no volver a invertir tiempo en ese camino.
