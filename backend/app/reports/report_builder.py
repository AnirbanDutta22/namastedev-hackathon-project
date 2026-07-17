"""
Assembles a structured, board-ready report from a session's current graph
state plus the attack simulation result the frontend already holds in
memory. Deliberately does NOT render PDF/HTML here -- the frontend renders
a print-friendly document and lets the browser's native "Save as PDF" do the
rendering, so the backend stays a plain JSON API with no extra PDF
dependency to install or break on deploy.

The frontend is the source of truth for "what attack result is currently on
screen" (including whether it's pre- or post-patch), so this function takes
attack_result / original_result / patched as passed-in data rather than
trying to reconstruct simulation history server-side.
"""
from __future__ import annotations
from datetime import datetime, timezone
from typing import Any

CRITICALITY_WEIGHT = {"critical": 4, "high": 3, "medium": 2, "low": 1}


def build_report(
    graph_dict: dict[str, Any],
    attack_result: dict[str, Any] | None,
    original_result: dict[str, Any] | None,
    patched: bool,
    persona: dict[str, str],
    network_name: str = "Uploaded Network",
) -> dict[str, Any]:
    nodes = graph_dict.get("nodes", [])
    edges = graph_dict.get("edges", [])
    real_nodes = [n for n in nodes if n.get("id") != "internet"]
    total_nodes = len(real_nodes)

    compromised_ids: set[str] = set()
    hops: list[dict] = []
    if attack_result:
        compromised_ids = set(attack_result.get("compromised_order", [])) - {"internet"}
        hops = attack_result.get("hops", [])

    before_compromised = None
    if original_result:
        before_compromised = len(set(original_result.get("compromised_order", [])) - {"internet"})
    after_compromised = len(compromised_ids)
    contained = attack_result is not None and after_compromised == 0

    blocked_edges = [e for e in edges if e.get("blocked")]

    total_weight = sum(
        CRITICALITY_WEIGHT.get(str(n.get("criticality", "low")).lower(), 1) for n in real_nodes
    ) or 1
    compromised_weight = sum(
        CRITICALITY_WEIGHT.get(str(n.get("criticality", "low")).lower(), 1)
        for n in real_nodes
        if n["id"] in compromised_ids
    )
    exposure_score = round((compromised_weight / total_weight) * 100)

    inventory = sorted(
        [
            {
                "id": n["id"],
                "label": n.get("label", n["id"]),
                "type": n.get("type", "Server"),
                "ip": n.get("ip", "-"),
                "risk_score": n.get("risk_score", 0),
                "criticality": n.get("criticality", "low"),
                "status": "Compromised" if n["id"] in compromised_ids else "Not reached",
            }
            for n in real_nodes
        ],
        key=lambda x: -x["risk_score"],
    )

    attack_timeline = [
        {
            "hop_index": i,
            "from": h.get("from_label") or h.get("from"),
            "to": h.get("to_label") or h.get("to"),
            "ports": h.get("ports", []),
            "trust": h.get("trust", "-"),
            "mitre_stage": h.get("mitre_stage") or "-",
            "explanation": h.get("explanation") or "",
            "recommendation": h.get("recommendation") or "",
            "risk_reduction": h.get("risk_reduction") or 0,
        }
        for i, h in enumerate(hops)
    ]

    return {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "network_name": network_name,
        "persona": persona,
        "summary": {
            "total_assets": total_nodes,
            "assets_compromised": after_compromised,
            "assets_compromised_before_patch": before_compromised,
            "assets_secured_by_patches": len(blocked_edges),
            "exposure_score": exposure_score,
            "contained": contained,
            "patched": patched,
        },
        "attack_timeline": attack_timeline,
        "patched_hops": [
            {"source": e["source"], "target": e["target"]} for e in blocked_edges
        ],
        "asset_inventory": inventory,
    }