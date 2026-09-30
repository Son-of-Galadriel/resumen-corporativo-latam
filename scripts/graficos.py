#!/usr/bin/env python3
"""
graficos.py — Genera los gráficos PNG del Resumen Corporativo desde el mismo JSON de datos.

Uso:  python3 graficos.py datos.json carpeta_salida

Cada gráfico en datos["graficos"] tiene: id, tipo, titulo y los campos propios del tipo:
  - "linea":            x (lista de etiquetas), series [{nombre, valores}], opcional sma [valores]
  - "barras":           x, series [{nombre, valores}] (una serie)
  - "barras_agrupadas": x, series [{nombre, valores}] (2-4 series)
  - "dona":             etiquetas, valores
Campos opcionales: unidad (texto del eje Y), fuente (texto pequeño al pie), destacar (índice de barra).
Requiere: matplotlib
"""
import json
import sys
from pathlib import Path

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt  # noqa: E402
from matplotlib import font_manager  # noqa: E402

NAVY, BLUE, GOLD = "#0A2342", "#1040A0", "#B8860B"
GRIS, GRIS_CLARO, TEXTO = "#4A5568", "#E2E8F0", "#111111"
PALETA = [NAVY, BLUE, GOLD, "#5B8DEF", "#1A6B35", "#8899AA", "#A04000", "#7A5C99"]

for fam in ("Arial", "Liberation Sans", "DejaVu Sans"):
    if any(f.name == fam for f in font_manager.fontManager.ttflist):
        plt.rcParams["font.family"] = fam
        break
plt.rcParams.update({"axes.edgecolor": GRIS_CLARO, "axes.labelcolor": GRIS, "xtick.color": GRIS,
                     "ytick.color": GRIS, "text.color": TEXTO, "axes.titleweight": "bold"})


def _base(g, figsize=(6.6, 3.2)):
    fig, ax = plt.subplots(figsize=figsize, dpi=200)
    ax.spines[["top", "right"]].set_visible(False)
    ax.spines["left"].set_color(GRIS_CLARO)
    ax.spines["bottom"].set_color(GRIS_CLARO)
    ax.grid(axis="y", color=GRIS_CLARO, linewidth=0.7)
    ax.set_axisbelow(True)
    ax.set_title(g.get("titulo", ""), loc="left", fontsize=11, color=NAVY, pad=10)
    if g.get("unidad"):
        ax.set_ylabel(g["unidad"], fontsize=8)
    ax.tick_params(labelsize=8, length=0)
    return fig, ax


def _pie(fig, g):
    if g.get("fuente"):
        fig.text(0.01, 0.005, g["fuente"], fontsize=6.5, color=GRIS, ha="left", va="bottom")
    fig.tight_layout(rect=(0, 0.03, 1, 1))


def _etiquetas_x(ax, x):
    n = len(x)
    paso = max(1, n // 8)
    ax.set_xticks(range(0, n, paso))
    ax.set_xticklabels([x[i] for i in range(0, n, paso)], rotation=0)


def linea(g):
    fig, ax = _base(g)
    x = g["x"]
    for i, s in enumerate(g["series"]):
        ax.plot(range(len(x)), s["valores"], color=PALETA[i % len(PALETA)], linewidth=1.8, label=s["nombre"])
        if i == 0:
            ax.fill_between(range(len(x)), s["valores"], min(s["valores"]), color=BLUE, alpha=0.07)
    if g.get("sma"):
        ax.plot(range(len(x)), g["sma"], color=GOLD, linewidth=1.4, linestyle="--", label=g.get("sma_nombre", "SMA 200"))
    _etiquetas_x(ax, x)
    if len(g["series"]) > 1 or g.get("sma"):
        ax.legend(frameon=False, fontsize=8, loc="upper left")
    _pie(fig, g)
    return fig


def barras(g):
    fig, ax = _base(g)
    x, v = g["x"], g["series"][0]["valores"]
    colores = [BLUE] * len(v)
    d = g.get("destacar")
    if d is not None:
        colores[d] = GOLD
    barras_ = ax.bar(x, v, color=colores, width=0.55)
    for b, val in zip(barras_, v):
        ax.annotate(f"{val:,.1f}".rstrip("0").rstrip("."), (b.get_x() + b.get_width() / 2, b.get_height()),
                    ha="center", va="bottom", fontsize=8, color=NAVY, fontweight="bold", xytext=(0, 2), textcoords="offset points")
    ax.set_ylim(0, max(v) * 1.15 if max(v) > 0 else 1)
    _pie(fig, g)
    return fig


def barras_agrupadas(g):
    fig, ax = _base(g)
    x, series = g["x"], g["series"]
    n = len(series)
    ancho = 0.8 / n
    for i, s in enumerate(series):
        pos = [j + (i - (n - 1) / 2) * ancho for j in range(len(x))]
        bs = ax.bar(pos, s["valores"], width=ancho * 0.92, color=PALETA[i % len(PALETA)], label=s["nombre"])
        for b, val in zip(bs, s["valores"]):
            ax.annotate(f"{val:,.1f}".rstrip("0").rstrip("."), (b.get_x() + b.get_width() / 2, b.get_height()),
                        ha="center", va="bottom", fontsize=7, color=NAVY, xytext=(0, 2), textcoords="offset points")
    ax.set_xticks(range(len(x)))
    ax.set_xticklabels(x)
    ax.legend(frameon=False, fontsize=8, loc="upper left", ncol=n)
    ymax = max(max(s["valores"]) for s in series)
    ax.set_ylim(0, ymax * 1.2 if ymax > 0 else 1)
    _pie(fig, g)
    return fig


def dona(g):
    fig, ax = plt.subplots(figsize=(6.6, 3.2), dpi=200)
    et, val = g["etiquetas"], g["valores"]
    cols = [PALETA[i % len(PALETA)] for i in range(len(val))]
    ax.pie(val, colors=cols, startangle=90, counterclock=False, wedgeprops={"width": 0.38, "edgecolor": "white", "linewidth": 2})
    total = sum(val)
    ax.text(0, 0, g.get("centro", ""), ha="center", va="center", fontsize=10, color=NAVY, fontweight="bold")
    leyenda = [f"{e}  ·  {v / total * 100:.0f}%" for e, v in zip(et, val)]
    ax.legend(ax.patches, leyenda, loc="center left", bbox_to_anchor=(1.0, 0.5), frameon=False, fontsize=8.5)
    ax.set_title(g.get("titulo", ""), loc="left", fontsize=11, color=NAVY, pad=6)
    _pie(fig, g)
    return fig


TIPOS = {"linea": linea, "barras": barras, "barras_agrupadas": barras_agrupadas, "dona": dona}


def main():
    if len(sys.argv) != 3:
        sys.exit("Uso: python3 graficos.py datos.json carpeta_salida")
    datos = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))
    salida = Path(sys.argv[2])
    salida.mkdir(parents=True, exist_ok=True)
    for g in datos.get("graficos", []):
        f = TIPOS.get(g.get("tipo"))
        if not f:
            print(f"AVISO: tipo de gráfico desconocido: {g.get('tipo')}", file=sys.stderr)
            continue
        fig = f(g)
        fig.savefig(salida / f"{g['id']}.png", facecolor="white")
        plt.close(fig)
        print(f"OK  gráfico {g['id']}.png")


if __name__ == "__main__":
    main()
