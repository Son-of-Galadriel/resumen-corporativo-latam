# Esquema del archivo JSON de datos

`scripts/render.js` lee un único JSON. Hay un ejemplo completo, con datos ficticios, en `assets/ejemplo_datos.json`. Todos los textos aceptan `**negrita**`. Los saltos de línea se escriben `\n`.

## Estructura general

```
{
  "meta":      { ... },
  "portada":   { ... },
  "secciones": [ { "titulo": "...", "bloques": [ ... ] }, ... ],
  "glosario":  [ { "termino": "...", "definicion": "...", "formula": "..." } ],
  "fuentes":   [ { "titulo": "...", "url": "...", "uso": "...", "acceso": "AAAA o DD-MM-AAAA" } ],
  "graficos":  [ { "id": "...", "tipo": "...", ... } ]
}
```

## meta (obligatorio)

| Campo | Ejemplo | Nota |
|---|---|---|
| `empresa` | `"Banco de Chile"` | Aparece en portada y pie |
| `ticker` | `"CHILE"` | Ticker principal |
| `bolsa` | `"Bolsa de Santiago"` | |
| `pais` | `"Chile"` | Se usa en la etiqueta de portada |
| `sector` | `"Banca"` | Se usa en la etiqueta de portada |
| `fecha` | `"2026-09-29"` | AAAA-MM-DD; define el nombre del archivo |
| `moneda` | `"CLP"` | Opcional; aparece en la nota de la portada |
| `papel` | `"letter"` o `"a4"` | Opcional; por defecto `letter` |
| `archivo_nombre` | `"BancodeChile"` | Opcional; anula el nombre calculado |
| `salto_pagina_secciones` | `false` | Opcional; `false` hace fluir las secciones sin salto de página |

## portada

| Campo | Nota |
|---|---|
| `aspecto_relevante` | Frase en cursiva bajo el nombre (un aspecto relevante) |
| `linea_bolsas` | Bolsa, ticker, índice, grupo (opcional; por defecto `bolsa: ticker`) |
| `etiqueta` | Texto dorado superior (opcional) |
| `linea_fecha` | Línea de fecha (opcional; por defecto "Mes AAAA \| Análisis Fundamental Completo") |
| `resumen_izq`, `resumen_der` | Listas de `{ "k": "Rótulo", "v": "Valor" }`; 5 filas cada una |
| `nota_datos` | Nota pequeña bajo las tablas (opcional) |

## Bloques de una sección

| `tipo` | Campos | Resultado |
|---|---|---|
| `h2` | `texto` | Subtítulo (Título 2 nativo de Word) |
| `p` | `texto` | Párrafo |
| `lista` | `items` | Viñetas |
| `lista_numerada` | `items` | Lista numerada (reinicia en cada bloque) |
| `tabla` | `columnas`, `filas`, `anchos` (porcentajes), `colorear_col` (índice de la columna de nivel), `primera_col_negrita` | Tabla con encabezado azul marino y filas alternadas. Valores que empiezan con ▲ o ↑ se pintan verdes; con ▼ o ↓, rojos; con ▲▼ o ↑↓, ámbar |
| `kv` | `filas` (pares `[rótulo, valor]`), `anchos` | Tabla de dos columnas, rótulo gris y valor en negrita |
| `callout` | `color` (`dorado`, `verde`, `rojo`, `azul`), `titulo`, `texto` | Recuadro de color |
| `nota_didactica` | `referencia`, `texto` | Recuadro azul "Nota didáctica · referencia" |
| `grafico` | `id` (debe existir en `graficos`), `titulo`, `pie`, `alt` | Imagen PNG centrada con pie |
| `espacio` | | Espacio vertical |

Niveles en tablas de riesgo (con `colorear_col`): `Alto`, `Medio-Alto`, `Medio`, `Bajo-Medio`, `Bajo`.

## graficos

Cada gráfico se genera como PNG en `assets/<id>.png` y se enlaza desde el `.md`.

| `tipo` | Campos |
|---|---|
| `linea` | `x` (etiquetas), `series` (una o más `{nombre, valores}`), opcional `sma` y `sma_nombre` |
| `barras` | `x`, `series` (una serie), opcional `destacar` (índice de la barra dorada) |
| `barras_agrupadas` | `x`, `series` (2 a 4) |
| `dona` | `etiquetas`, `valores`, opcional `centro` |

Campos comunes opcionales: `titulo`, `unidad` (título del eje Y), `fuente` (texto pequeño al pie de la imagen). Las etiquetas `x` de una serie larga pueden llevar cadenas vacías; el eje muestra unas 8.

## fuentes

Cada fuente: `titulo`, `url`, `uso` (para qué se usó), `acceso` (fecha de consulta). Si no está en el listado preferente, agregue `complementaria: true` y `motivo`. Se numeran en el orden en que las escriba; ponga primero las oficiales.
