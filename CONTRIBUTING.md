# Desarrollo de pxt-kroma

## Flujo de trabajo

El código viaja en una sola dirección: se escribe en el repositorio local y se mira en MakeCode.

1. **Escribir código** con Claude Code sobre el repositorio local. Commitear y pushear a la rama `dev`.

2. **Traerlo a MakeCode.** El repositorio se abre **como proyecto**, no como extensión: Importar → Importar URL, con la rama en el sufijo:

   ```
   https://github.com/snan-dev/pxt-kroma#dev
   ```

   Una vez abierto, cada vez que haya cambios nuevos se hace *pull* desde el panel de GitHub del editor (el ícono de GitHub junto al nombre del proyecto).

   En esta vista se ve el código y una previsualización de cada bloque —útil para revisar el texto, el orden de los parámetros y el ícono de la categoría—, pero **no la paleta real**: un repositorio de extensión abre siempre en modo texto, porque no es un proyecto de bloques.

3. **Ver los bloques de verdad** con la funcionalidad de extensión de prueba del editor, que abre un proyecto aparte con la extensión ya actualizada. Ahí está la paleta real: se arrastran bloques y corre el simulador. No hace falta crear un release nuevo para que tome los cambios.

## Ajustes menores hechos desde MakeCode

Pasa seguido: el texto de un bloque, un ícono, el orden de la paleta. Son cosas que conviene ajustar mirando el resultado, y se pueden editar y commitear directamente desde el editor.

En ese caso el código viaja en sentido inverso, así que **hay que hacer `git pull` en el repositorio local antes de que Claude Code vuelva a tocarlo.** Si no, el próximo cambio sale de una base vieja.

## Íconos de categoría

El ícono de la categoría se declara en la anotación del namespace, en `board.ts`:

```
//% color="#E3892B" icon="" block="KROMA"
```

Tiene que ser un codepoint del rango de **Font Awesome 4.7** (hasta cerca de ``), que es la fuente que usa la barra de categorías. Codepoints de Font Awesome 5, como `` (robot), se renderizan vacíos: la categoría aparece con su nombre pero sin ícono.

## Releases

Solo hacen falta para publicar una versión, no para desarrollar. Se hacen con el botón de *bump* del panel de GitHub del editor, que sube la versión en `pxt.json`, crea el tag y publica el release en un paso.

El primer release ya existe (`v0.0.1`); sin él, MakeCode no podía resolver la extensión.

## `mkc` para compilar y grabar sin navegador

Uso puntual, para verificar que el paquete compila y para probar sobre la placa:

```
npm install -g makecode
mkc build
```

Si dice `Build OK`, compila. El archivo a grabar queda en `built\binary.hex`: se arrastra a la unidad MICROBIT.

Esto es lo único que verifica los criterios de aceptación de hardware (DIG-1 a DIG-4, etc.): ni el simulador ni el editor emulan la placa KROMA, así que un bloque digital no hace nada visible fuera del hardware real.

**Requiere Node 20 LTS.** El CLI de `pxt` rompe con Node 24. Con [nvm-windows](https://github.com/coreybutler/nvm-windows):

```
nvm install 20
nvm use 20
```

nvm mantiene los paquetes globales por versión de Node, así que después de cambiar hay que reinstalar `makecode`.

## Lo que no funciona (probado el 2026-08-29, no repetir)

Levantar el editor completo en local con `pxt serve` y referenciar la extensión con una dependencia `file:`. El editor levanta y lista el paquete, pero nunca lo carga: falla con `Cannot read properties of null (reading 'config')` en `sortedDeps`. Se probaron todas las combinaciones de ruta relativa, nombre del paquete y ubicación del workspace. Los proyectos creados en ese editor tampoco se guardan en disco.

## Nota sobre el repositorio

Hoy vive en `snan-dev/pxt-kroma`. La organización destino es `ceibal-microbit` (ver `docs/ARQUITECTURA.md` §1); cuando se mude, hay que actualizar las URLs de este documento.
