# Top-Down — Contrato de API

Parsers en esta carpeta para análisis **descendente**. Cada módulo expone `run_analysis(input_data)` con el mismo esquema de **entrada**; la **salida** comparte campos base y añade campos propios del método.

## Punto de entrada

| Módulo | Función | Clase interna |
|--------|---------|---------------|
| `ll1_parser.py` | `run_analysis(input_data)` | `LL1Parser` |
| `dr_parser.py` | `run_analysis(input_data)` | `RecursiveDescentParser` |

```python
from ll1_parser import run_analysis as analyze_ll1
from dr_parser import run_analysis as analyze_rd

result = analyze_ll1(input_data)
```

---

## Entrada (`input_data`)

Objeto JSON/dict con **tres claves obligatorias** (todas `str`):

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `gramatica` | `string` | Gramática en texto plano: **una producción por línea**, formato `NT -> alt1 \| alt2 \| ...`. |
| `simbolo_inicial` | `string` | No terminal inicial (debe existir en la gramática). |
| `cadena_entrada` | `string` | Cadena **ya tokenizada**: tokens separados por **un espacio**. El parser añade `$` al final internamente. |

### Formato de la gramática

- Separador de producción: `->`
- Alternativas en la misma línea: `|`
- Símbolos dentro de una alternativa: separados por espacios.
- Líneas vacías o sin `->` se ignoran (LL1) o se omiten (RD).

### Épsilon

| Representación | Uso |
|----------------|-----|
| **`eps`** | Único símbolo en JSON y lógica interna. |
| Alternativa vacía | `A -> b \|` o `A -> b \| ` (nada tras el último `\|`) → se normaliza a `eps`. |
| `ε`, `epsilon`, `EPS`, … | Solo en **texto de entrada**: se normalizan a `eps` al parsear. |

Ejemplo:

```text
E  -> T E'
E' -> + T E' | eps
T  -> F T'
T' -> * F T' | eps
F  -> ( E ) | id
```

### Ejemplo de request (frontend → backend)

```json
{
  "gramatica": "E  -> T E'\nE' -> + T E' | eps\nT  -> F T'\nT' -> * F T' | eps\nF  -> ( E ) | id",
  "simbolo_inicial": "E",
  "cadena_entrada": "id + id * id"
}
```

---

## Salida común

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `gramatica_parseable` | `boolean` | Si la gramática es usable con **ese** método (ver criterio por parser). |
| `cadena_valida` | `boolean` | Si la cadena pertenece al lenguaje (análisis de entrada completado con éxito). |
| `mensaje` | `string` | Resumen legible del resultado o del error. |
| `proceso_paso_a_paso` | `array` | Traza del análisis (vacía si se abortó por gramática no parseable / conflictos LL(1)). |

### Elemento de `proceso_paso_a_paso`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `paso` | `number` | Índice del paso (1-based). |
| `accion` | `string` | Descripción de la acción (formato depende del parser). |

**LL(1)** — cada paso incluye además:

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `pila` | `string` | Pila con el tope a la **derecha** (incluye `$`). |
| `entrada` | `string` | Buffer de entrada restante (incluye `$`). |

Valores típicos de `accion` (LL1): `ACEPTAR`, `Coincidencia: 'id'`, `E -> T E'`, `ERROR: ...`.

**Descenso recursivo** — solo `paso` y `accion` (backtracking, match, ACEPTAR, RECHAZAR, etc.).

---

## `gramatica_parseable` por método

| Parser | `true` cuando | `false` cuando |
|--------|---------------|--------------|
| **LL(1)** | Tabla LL(1) sin conflictos (gramática LL(1)). | Conflictos en `M[NT, t]` y/o necesidad de transformación (p. ej. recursividad izquierda). |
| **Descenso recursivo** | Símbolo inicial definido y **sin** recursividad izquierda directa. | NT inicial ausente o `A -> A α ...`. |

Importante: `gramatica_parseable === true` **no implica** `cadena_valida === true` (la cadena puede ser inválida con gramática LL(1) correcta).

---

## Salida específica: LL(1) (`ll1_parser.py`)

### Campos adicionales

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `conjuntos_first_follow` | `object` | Por cada NT: `{ "FIRST": string[], "FOLLOW": string[] }` (listas ordenadas). En JSON, épsilon aparece como **`"eps"`**. |
| `construccion_tablas` | `object` | Tabla predictiva (ver abajo). |
| `sugerencias_transformacion` | `object` | Si la gramática no es LL(1). |

### `construccion_tablas`

```json
{
  "tipo": "LL1",
  "columnas": ["NoTerminal", "id", "+", "*", "(", ")", "$"],
  "filas": [
    { "NoTerminal": "E", "id": "E -> T E'", "$": "E -> T E'" }
  ]
}
```

- Celdas vacías: clave de terminal **omitida** (no string vacío).
- Conflictos: varias producciones en la misma celda unidas por ` o ` (ej. `E -> E + T o E -> T`).

### `sugerencias_transformacion`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `requiere_transformacion` | `boolean` | |
| `motivo` | `string` | Causa (conflictos, recursividad izquierda, etc.). |
| `gramatica_sugerida` | `string \| null` | Gramática transformada (texto multilínea) o `null`. |

Si `gramatica_parseable === false`, `proceso_paso_a_paso` suele ser `[]` y `cadena_valida === false`.

---

## Salida específica: Descenso recursivo (`dr_parser.py`)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `arbol_derivacion` | `object \| null` | Árbol de la derivación exitosa; `null` si rechazo o gramática no compatible. |

### Nodo del árbol

```json
{
  "name": "E",
  "children": [
    { "name": "T", "children": [...] },
    { "name": "eps", "children": [] }
  ]
}
```

- Hojas terminales: `name` = lexema (`id`, `+`, …).
- Producción vacía: nodo con `"name": "eps"` y `children: []`.

---

## Integración frontend ↔ backend

1. **Enviar siempre** los tres campos de entrada; no enviar `$` en `cadena_entrada` (se añade en servidor).
2. **Elegir endpoint o query** según método (`LL1` vs `RD`) y llamar al `run_analysis` correspondiente.
3. **UI recomendada:**
   - Badge `gramatica_parseable` (gramática compatible con el método).
   - Badge `cadena_valida` (resultado sobre la cadena).
   - Tabla desde `construccion_tablas` (LL1) o árbol desde `arbol_derivacion` (RD).
   - Lista/tabla desde `proceso_paso_a_paso`.
4. **Épsilon en UI:** en JSON usar `eps`; en pantalla de demostración los tests muestran `ε` (solo presentación).
5. **Errores:** usar `mensaje` para toast/alert; no asumir simulación si `proceso_paso_a_paso.length === 0`.

### Ejemplo de respuesta LL(1) (éxito)

```json
{
  "gramatica_parseable": true,
  "cadena_valida": true,
  "mensaje": "Análisis completado exitosamente. La cadena es válida.",
  "conjuntos_first_follow": {
    "E": { "FIRST": ["(", "id"], "FOLLOW": ["$", ")"] },
    "E'": { "FIRST": ["+", "eps"], "FOLLOW": ["$", ")"] }
  },
  "construccion_tablas": { "tipo": "LL1", "columnas": [...], "filas": [...] },
  "proceso_paso_a_paso": [
    { "paso": 1, "pila": "E $", "entrada": "id + id $", "accion": "E -> T E'" }
  ],
  "sugerencias_transformacion": {
    "requiere_transformacion": false,
    "motivo": "La gramática ya es LL(1) válida.",
    "gramatica_sugerida": null
  }
}
```

### Tests locales

```bash
cd backend/test
python test_ll1.py
python test_rd.py
```

---

## Constantes internas (referencia)

| Constante | Valor |
|-----------|--------|
| Épsilon | `eps` |
| Fin de entrada | `$` |
