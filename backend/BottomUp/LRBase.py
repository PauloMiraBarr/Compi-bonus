"""
lr_base.py
Clases y funciones compartidas entre LR1 y LALR1.
  - Production, Grammar
  - compute_first, first_of_sequence
  - LR1Item, LR1State
  - closure, goto_state
  - ActionType, Action, LRTable
"""

from collections import defaultdict
from dataclasses import dataclass
from typing import Optional
from enum import Enum, auto


# ------------------------------------------------------------------------------
# Production
# ------------------------------------------------------------------------------

@dataclass
class Production:
    non_terminal: str
    transaction: list[str]

    def __eq__(self, other):
        return (self.non_terminal == other.non_terminal and
                self.transaction == other.transaction)

    def __hash__(self):
        return hash((self.non_terminal, tuple(self.transaction)))

    def __lt__(self, other):
        if self.non_terminal != other.non_terminal:
            return self.non_terminal < other.non_terminal
        return self.transaction < other.transaction

    def __repr__(self):
        return f"{self.non_terminal} -> {' '.join(self.transaction)}"


# ------------------------------------------------------------------------------
# Grammar
# ------------------------------------------------------------------------------

class Grammar:
    def __init__(self):
        self.productions: list[Production] = []
        self.simbolo_inicial: Optional[str] = None

    def add_production(self, non_terminal: str, transaction: list[str]):
        self.productions.append(Production(non_terminal, transaction))

    @classmethod
    def from_text(cls, text: str, simbolo_inicial: Optional[str] = None) -> "Grammar":
        """
        Parsea texto estilo:
            E -> E + T | T
            T -> T * F | F
            F -> ( E ) | id

        Cada token separado por espacios. El scanner ya tokenizo.
        Agrega automaticamente la produccion aumentada S' -> simbolo_inicial.
        """
        g = cls()
        for line in text.strip().splitlines():
            line = line.strip()
            if not line:
                continue
            if "->" not in line:
                raise ValueError(f"Produccion sin '->': {line!r}")
            lhs, rhs = line.split("->", 1)
            lhs = lhs.strip()
            for alt in rhs.split("|"):
                tokens = alt.strip().split()
                if not tokens:
                    raise ValueError(f"Alternativa vacia en: {line!r}")
                g.add_production(lhs, tokens)

        if simbolo_inicial is None:
            simbolo_inicial = g.productions[0].non_terminal if g.productions else "S"
        g.simbolo_inicial = simbolo_inicial
        augmented = Production(simbolo_inicial + "'", [simbolo_inicial])
        g.productions.insert(0, augmented)
        return g

    def non_terminals(self) -> set[str]:
        return {p.non_terminal for p in self.productions}

    def terminals(self) -> set[str]:
        nt = self.non_terminals()
        result = {"$"}
        for p in self.productions:
            for sym in p.transaction:
                if sym not in nt:
                    result.add(sym)
        return result

    def productions_of(self, nt: str) -> list[Production]:
        return [p for p in self.productions if p.non_terminal == nt]


# ------------------------------------------------------------------------------
# FIRST sets
# ------------------------------------------------------------------------------

def compute_first(grammar: Grammar) -> dict[str, set[str]]:
    nt = grammar.non_terminals()
    first: dict[str, set[str]] = defaultdict(set)

    for p in grammar.productions:
        for sym in p.transaction:
            if sym not in nt:
                first[sym].add(sym)
    first["$"].add("$")

    changed = True
    while changed:
        changed = False
        for p in grammar.productions:
            F = first[p.non_terminal]
            all_eps = True
            for sym in p.transaction:
                before = len(F)
                F |= first[sym] - {"e"}
                if len(F) > before:
                    changed = True
                if "e" not in first[sym]:
                    all_eps = False
                    break
            if all_eps and "e" not in F:
                F.add("e")
                changed = True

    return first


def first_of_sequence(seq: list[str], first_sets: dict[str, set[str]]) -> set[str]:
    result = set()
    all_eps = True
    for sym in seq:
        fs = first_sets.get(sym, set())
        result |= fs - {"e"}
        if "e" not in fs:
            all_eps = False
            break
    if all_eps:
        result.add("e")
    return result


# ------------------------------------------------------------------------------
# LR1 Item
# ------------------------------------------------------------------------------

@dataclass
class LR1Item:
    production: Production
    dot_pos: int
    lookaheads: frozenset

    def next_symbol(self) -> Optional[str]:
        if self.dot_pos < len(self.production.transaction):
            return self.production.transaction[self.dot_pos]
        return None

    def beta(self) -> list[str]:
        return self.production.transaction[self.dot_pos + 1:]

    def is_reduce(self) -> bool:
        return self.dot_pos == len(self.production.transaction)

    def same_core(self, other: "LR1Item") -> bool:
        return self.production == other.production and self.dot_pos == other.dot_pos

    def core_key(self) -> tuple:
        """Identificador del nucleo: (produccion, dot_pos) sin lookaheads."""
        return (self.production, self.dot_pos)

    def __eq__(self, other):
        return (self.production == other.production and
                self.dot_pos == other.dot_pos and
                self.lookaheads == other.lookaheads)

    def __hash__(self):
        return hash((self.production, self.dot_pos, self.lookaheads))

    def __lt__(self, other):
        if self.production != other.production:
            return self.production < other.production
        if self.dot_pos != other.dot_pos:
            return self.dot_pos < other.dot_pos
        return sorted(self.lookaheads) < sorted(other.lookaheads)

    def to_str(self) -> str:
        """Formato: "E -> E . + T , $/+" """
        syms = list(self.production.transaction)
        syms.insert(self.dot_pos, ".")
        la = "/".join(sorted(self.lookaheads))
        return f"{self.production.non_terminal} -> {' '.join(syms)} , {la}"


# ------------------------------------------------------------------------------
# LR1 State
# ------------------------------------------------------------------------------

class LR1State:
    def __init__(self, state_id: int):
        self.id = state_id
        self._cores: list[tuple[Production, int]] = []
        self._lookaheads: list[set[str]] = []

    def add_item(self, item: LR1Item) -> bool:
        for i, (prod, dot) in enumerate(self._cores):
            if prod == item.production and dot == item.dot_pos:
                before = len(self._lookaheads[i])
                self._lookaheads[i] |= set(item.lookaheads)
                return len(self._lookaheads[i]) > before
        self._cores.append((item.production, item.dot_pos))
        self._lookaheads.append(set(item.lookaheads))
        return True

    def items(self) -> list[LR1Item]:
        return [
            LR1Item(prod, dot, frozenset(la))
            for (prod, dot), la in zip(self._cores, self._lookaheads)
        ]

    def core_key(self) -> frozenset:
        """
        Identificador del nucleo del estado: conjunto de (produccion, dot_pos).
        Dos estados LR1 con el mismo core_key son fusionables en LALR1.
        """
        return frozenset((prod, dot) for prod, dot in self._cores)

    def same_items(self, other: "LR1State") -> bool:
        return self.items() == other.items()


# ------------------------------------------------------------------------------
# Closure y Goto
# ------------------------------------------------------------------------------

def closure(state: LR1State, grammar: Grammar, first_sets: dict) -> LR1State:
    nt = grammar.non_terminals()
    changed = True
    while changed:
        changed = False
        for item in state.items():
            ns = item.next_symbol()
            if ns is None or ns not in nt:
                continue
            for prod in grammar.productions_of(ns):
                beta_seq = item.beta()
                new_la = set()
                for la in item.lookaheads:
                    seq = beta_seq + [la]
                    f = first_of_sequence(seq, first_sets)
                    new_la |= f - {"e"}
                new_item = LR1Item(prod, 0, frozenset(new_la))
                if state.add_item(new_item):
                    changed = True
    return state


def goto_state(state: LR1State, symbol: str, state_id: int,
               grammar: Grammar, first_sets: dict) -> LR1State:
    next_state = LR1State(state_id)
    for item in state.items():
        if item.next_symbol() == symbol:
            moved = LR1Item(item.production, item.dot_pos + 1, item.lookaheads)
            next_state.add_item(moved)
    return closure(next_state, grammar, first_sets)


# ------------------------------------------------------------------------------
# Action
# ------------------------------------------------------------------------------

class ActionType(Enum):
    SHIFT  = auto()
    REDUCE = auto()
    ACCEPT = auto()
    ERROR  = auto()


@dataclass
class Action:
    type: ActionType = ActionType.ERROR
    value: int = -1
    reduce_prod: Optional[Production] = None

    def __eq__(self, other):
        return self.type == other.type and self.value == other.value

    def to_str(self) -> str:
        if self.type == ActionType.SHIFT:
            return f"S{self.value}"
        if self.type == ActionType.REDUCE:
            body = " ".join(self.reduce_prod.transaction)
            return f"R({self.reduce_prod.non_terminal} -> {body})"
        if self.type == ActionType.ACCEPT:
            return "ACC"
        return ""


# ------------------------------------------------------------------------------
# LR Table  (compartida entre LR1 y LALR1)
# ------------------------------------------------------------------------------

class LRTable:
    def __init__(self):
        self.action: dict[int, dict[str, Action]] = defaultdict(dict)
        self.goto_table: dict[int, dict[str, int]] = defaultdict(dict)
        self.conflicts: list[dict] = []

    def set_action(self, state: int, sym: str, act: Action):
        existing = self.action[state].get(sym)
        if existing and existing != act:
            self.conflicts.append({
                "estado": state,
                "simbolo": sym,
                "conflicto": f"{existing.to_str()} vs {act.to_str()}"
            })
        self.action[state][sym] = act

    def to_json(self, terminals: set[str], non_terminals: set[str],
                tipo: str = "LR") -> dict:
        """
        {
          "tipo": "LR",
          "columnas": ["Estado", "id", "+", ...],
          "filas": [{"Estado": "0", "id": "S5", ...}, ...],
          "conflictos": [...]
        }
        """
        terms = sorted(terminals)
        nts   = sorted(s for s in non_terminals if not s.endswith("'"))
        columnas = ["Estado"] + terms + nts

        all_states = sorted(set(self.action.keys()) | set(self.goto_table.keys()))

        filas = []
        for st in all_states:
            fila: dict[str, str] = {"Estado": str(st)}
            for t in terms:
                act = self.action[st].get(t)
                if act:
                    fila[t] = act.to_str()
            for nt in nts:
                dst = self.goto_table[st].get(nt)
                if dst is not None:
                    fila[nt] = str(dst)
            filas.append(fila)

        return {
            "tipo":       tipo,
            "columnas":   columnas,
            "filas":      filas,
            "conflictos": self.conflicts
        }


# ------------------------------------------------------------------------------
# Logica de parseo paso a paso  (compartida, recibe la tabla ya construida)
# ------------------------------------------------------------------------------

def run_parser(tokens: list[str], table: LRTable) -> dict:
    """
    Simula el parseo LR sobre la tabla dada.
    Devuelve:
    {
      "cadena_valida": bool,
      "mensaje": str,
      "proceso_paso_a_paso": [
        {"paso": 1, "pila": "0", "entrada": "id * id $", "accion": "..."},
        ...
      ]
    }
    """
    inp = tokens + ["$"]
    steps = []
    state_stack:  list[int] = [0]
    symbol_stack: list[str] = []
    pos      = 0
    paso     = 1
    accepted = False
    mensaje  = ""

    while True:
        cur_state = state_stack[-1]
        token     = inp[pos]

        pila_parts = [str(state_stack[0])]
        for sym, st in zip(symbol_stack, state_stack[1:]):
            pila_parts.append(sym)
            pila_parts.append(str(st))
        pila_str    = " ".join(pila_parts)
        entrada_str = " ".join(inp[pos:])

        act = table.action[cur_state].get(token, Action())

        if act.type == ActionType.SHIFT:
            steps.append({
                "paso":    paso,
                "pila":    pila_str,
                "entrada": entrada_str,
                "accion":  f"Desplazar (Shift) al estado {act.value}"
            })
            symbol_stack.append(token)
            state_stack.append(act.value)
            pos += 1

        elif act.type == ActionType.REDUCE:
            prod = act.reduce_prod
            body = " ".join(prod.transaction)
            steps.append({
                "paso":    paso,
                "pila":    pila_str,
                "entrada": entrada_str,
                "accion":  f"Reducir (Reduce) por {prod.non_terminal} -> {body}"
            })
            for _ in prod.transaction:
                state_stack.pop()
                symbol_stack.pop()
            symbol_stack.append(prod.non_terminal)
            top  = state_stack[-1]
            goto = table.goto_table[top].get(prod.non_terminal, -1)
            if goto == -1:
                mensaje = (f"Error interno: GOTO faltante para estado "
                           f"{top} con {prod.non_terminal}")
                break
            state_stack.append(goto)

        elif act.type == ActionType.ACCEPT:
            steps.append({
                "paso":    paso,
                "pila":    pila_str,
                "entrada": entrada_str,
                "accion":  "Aceptar (ACC)"
            })
            accepted = True
            mensaje  = "La cadena fue aceptada exitosamente."
            break

        else:
            steps.append({
                "paso":    paso,
                "pila":    pila_str,
                "entrada": entrada_str,
                "accion":  (f"Error: no hay accion para '{token}' "
                            f"en estado {cur_state}")
            })
            mensaje = (f"La cadena fue rechazada. "
                       f"Token inesperado '{token}' en estado {cur_state}.")
            break

        paso += 1

    return {
        "cadena_valida":       accepted,
        "mensaje":             mensaje,
        "proceso_paso_a_paso": steps
    }