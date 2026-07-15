"""
Graph engine: builds a NetworkX DiGraph from parsed nodes/edges and runs
attack-path simulation (BFS from a compromised start node, respecting
"what-if" edge overrides like disabled ports / isolated subnets).
"""
from __future__ import annotations
import networkx as nx
from typing import Any


class NetworkGraph:
    def __init__(self, nodes: list[dict], edges: list[dict]):
        self.g = nx.DiGraph()
        self._load(nodes, edges)

    def _load(self, nodes: list[dict], edges: list[dict]):
        # virtual internet node
        self.g.add_node("internet", label="Internet", type="Internet", ip="0.0.0.0",
                         open_ports=[], risk_score=0, criticality="low")
        for n in nodes:
            self.g.add_node(n["id"], **n)
        for e in edges:
            if e["source"] in self.g and e["target"] in self.g:
                self.g.add_edge(e["source"], e["target"],
                                 ports=e["ports"], trust=e["trust"], reason=e["reason"], blocked=False)

    def to_dict(self) -> dict[str, Any]:
        nodes = [dict(self.g.nodes[n], id=n) for n in self.g.nodes]
        edges = [
            {"source": u, "target": v, **d}
            for u, v, d in self.g.edges(data=True)
            if not d.get("blocked")
        ]
        return {"nodes": nodes, "edges": edges}

    def apply_scenario(self, action: str, params: dict) -> None:
        """Mutates the graph in place for 'what-if' scenarios."""
        if action == "block_port":
            port = params["port"]
            for u, v, d in self.g.edges(data=True):
                if port in d.get("ports", []):
                    d["ports"] = [p for p in d["ports"] if p != port]
                    if not d["ports"]:
                        d["blocked"] = True
        elif action == "isolate_node":
            node_id = params["node_id"]
            for u, v in list(self.g.in_edges(node_id)):
                if u != node_id:
                    self.g[u][v]["blocked"] = True
        elif action == "remove_node":
            node_id = params["node_id"]
            if node_id in self.g:
                self.g.remove_node(node_id)

    def simulate_attack(self, start_node: str) -> dict[str, Any]:
        """
        BFS traversal from start_node over non-blocked edges, ranked by
        target risk_score (attacker prefers highest-value next hop).
        Returns an ordered list of hops with hop metadata for narration.
        """
        if start_node not in self.g:
            raise ValueError(f"Unknown node: {start_node}")

        visited = {start_node}
        order = [start_node]
        hops = []
        frontier = [start_node]

        while frontier:
            current = frontier.pop(0)
            neighbors = [
                (v, d) for u, v, d in self.g.out_edges(current, data=True)
                if not d.get("blocked") and v not in visited
            ]
            # attacker prioritizes highest-risk / highest-value targets first
            neighbors.sort(key=lambda x: self.g.nodes[x[0]].get("risk_score", 0), reverse=True)

            for target, edge_data in neighbors:
                visited.add(target)
                order.append(target)
                frontier.append(target)
                hops.append({
                    "from": current,
                    "from_label": self.g.nodes[current].get("label", current),
                    "to": target,
                    "to_label": self.g.nodes[target].get("label", target),
                    "ports": edge_data.get("ports", []),
                    "trust": edge_data.get("trust"),
                    "reason": edge_data.get("reason"),
                    "target_type": self.g.nodes[target].get("type"),
                    "target_risk": self.g.nodes[target].get("risk_score", 0),
                })

        return {
            "start": start_node,
            "compromised_order": order,
            "hops": hops,
            "total_compromised": len(order),
        }

    def context_for_llm(self) -> str:
        """Serialize graph into compact text for LLM Q&A context."""
        lines = []
        for n, d in self.g.nodes(data=True):
            if n == "internet":
                continue
            ports = ", ".join(str(p["port"]) for p in d.get("open_ports", []))
            lines.append(f"- {d.get('label')} ({n}) type={d.get('type')} risk={d.get('risk_score')} open_ports=[{ports}] criticality={d.get('criticality')}")
        lines.append("\nConnections:")
        for u, v, d in self.g.edges(data=True):
            if d.get("blocked"):
                continue
            lines.append(f"- {u} -> {v} via ports {d.get('ports')} ({d.get('trust')}): {d.get('reason')}")
        return "\n".join(lines)
