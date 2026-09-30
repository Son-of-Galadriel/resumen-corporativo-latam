# Métricas y fórmulas

Use estas fórmulas cuando una cifra no venga publicada. Toda cifra calculada se marca "(calculado)" y se indica el período, la moneda y los insumos. Si no puede obtener los insumos, escriba `n/d`.

| Métrica | Fórmula | Notas |
|---|---|---|
| Capitalización bursátil | Precio de la acción × acciones en circulación | Sume todas las series de acciones, cada una con su precio. Fecha de precio obligatoria |
| Valor de empresa (EV) | Capitalización + deuda financiera + participaciones no controladoras + acciones preferentes − caja y equivalentes | Aclare si incluye pasivos por arrendamiento (NIIF 16) |
| EBITDA | Resultado operacional (EBIT) + depreciación + amortización | Use el EBITDA que reporta la empresa solo si define cómo lo calcula; si no, calcule y rotule |
| EBIT | Utilidad antes de intereses e impuestos (resultado operacional) | |
| Caja libre | Caja y equivalentes + inversiones financieras corrientes de libre disposición, sin restricciones | Es la definición que usa esta skill para "caja libre". Si la fuente publica flujo de caja libre (FCF = flujo operativo − capex), anótelo por separado como FCF |
| Deuda financiera neta | Deuda financiera − caja y equivalentes | |
| Deuda / EBITDA | Deuda financiera (o neta, indicando cuál) / EBITDA de los últimos 12 meses | |
| ROIC | NOPAT / capital invertido promedio | NOPAT = EBIT × (1 − tasa de impuesto); capital invertido = deuda financiera + patrimonio − caja. Use la tasa efectiva o la legal del país (verificada) |
| ROE | Utilidad neta atribuible / patrimonio promedio | Indique si es anualizado |
| PER (P/E) | Precio / utilidad por acción de los últimos 12 meses | Si hay pérdida, escriba `n/a` |
| P/VL | Precio / valor libro por acción | Clave en banca |
| EV / EBITDA | EV / EBITDA de los últimos 12 meses | |
| Rentabilidad por dividendo (yield) | Dividendos por acción de los últimos 12 meses / precio actual | Indique fecha y si es bruto |
| Razón de pago (payout) | Dividendos totales / utilidad neta | |
| SMA (media móvil simple) | Promedio del precio de cierre de las últimas N ruedas (SMA 50, SMA 200) | Cite la fuente del dato (TradingView, Investing) o calcule desde el histórico |

## Reglas de cálculo

- Use datos de **una misma fecha** y de una misma moneda para cada razón.
- Los últimos 12 meses (LTM) se obtienen sumando los cuatro últimos trimestres reportados.
- Si la moneda funcional difiere de la de cotización, convierta con el tipo de cambio de la fecha del dato y diga cuál usó.
- Redondee de forma consistente y use `~` cuando la cifra sea aproximada.
- Ejemplo de nota bajo una tabla: "ROIC calculado: NOPAT 2025 (EBIT × (1 − tasa de impuesto vigente verificada)) / capital invertido promedio 2024–2025. Fuente de insumos: estados financieros CMF."
