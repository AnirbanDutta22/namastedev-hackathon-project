"""
Nmap XML Parser
Converts an Nmap XML scan (nmap -oX output.xml <target>) into a normalized
list of device nodes with services/ports, ready to be loaded into the
NetworkX graph builder.

We do NOT get real topology/edges from a flat Nmap scan (Nmap only tells you
about hosts, not who talks to whom). So edges are INFERRED using a simple,
transparent heuristic:
  - All hosts are assumed to sit behind an implicit "Internet" node.
  - A host with a "server-ish" open port (80/443/22/3389/8080/etc.) is
    reachable from the Internet node.
  - Hosts that share a /24 subnet are assumed to be able to reach each other
    on any port that is open locally (same-subnet lateral movement).
  - This is intentionally simple and explained to the user in the UI as
    "inferred trust" edges, not verified firewall rules.
"""
from __future__ import annotations
import xml.etree.ElementTree as ET
import ipaddress
from typing import Any

HIGH_RISK_PORTS = {22: "SSH", 23: "Telnet", 3389: "RDP", 445: "SMB", 21: "FTP", 3306: "MySQL", 5432: "PostgreSQL", 6379: "Redis", 27017: "MongoDB"}
WEB_PORTS = {80: "HTTP", 443: "HTTPS", 8080: "HTTP-Alt", 8443: "HTTPS-Alt"}


def classify_device(open_ports: list[dict]) -> str:
    port_nums = {p["port"] for p in open_ports}
    if 6379 in port_nums:
        return "Redis"
    if 3306 in port_nums or 5432 in port_nums or 27017 in port_nums:
        return "Database"
    if 8080 in port_nums or 8000 in port_nums:
        return "API Server"
    if 80 in port_nums or 443 in port_nums:
        return "Web Server"
    if 22 in port_nums and len(port_nums) == 1:
        return "Server"
    if 3389 in port_nums:
        return "Workstation"
    if 161 in port_nums or 23 in port_nums:
        return "Switch"
    return "Server"


def risk_score(open_ports: list[dict]) -> int:
    score = 5
    for p in open_ports:
        if p["port"] in HIGH_RISK_PORTS:
            score += 20
        if p.get("service", "").lower() in ("ftp", "telnet"):
            score += 15
    return min(score, 100)


def parse_nmap_xml(xml_content: str) -> dict[str, Any]:
    root = ET.fromstring(xml_content)
    nodes = []

    for host in root.findall("host"):
        status = host.find("status")
        if status is not None and status.get("state") != "up":
            continue

        addr_el = host.find("address")
        ip = addr_el.get("addr") if addr_el is not None else "unknown"

        hostname = ip
        hostnames_el = host.find("hostnames")
        if hostnames_el is not None:
            hn = hostnames_el.find("hostname")
            if hn is not None and hn.get("name"):
                hostname = hn.get("name")

        open_ports = []
        ports_el = host.find("ports")
        if ports_el is not None:
            for port_el in ports_el.findall("port"):
                state_el = port_el.find("state")
                if state_el is None or state_el.get("state") != "open":
                    continue
                port_num = int(port_el.get("portid"))
                service_el = port_el.find("service")
                service_name = service_el.get("name") if service_el is not None else "unknown"
                product = service_el.get("product", "") if service_el is not None else ""
                open_ports.append({
                    "port": port_num,
                    "protocol": port_el.get("protocol", "tcp"),
                    "service": service_name,
                    "product": product,
                })

        os_el = host.find("os")
        os_name = "Unknown"
        if os_el is not None:
            match = os_el.find("osmatch")
            if match is not None:
                os_name = match.get("name", "Unknown")

        node_id = ip
        nodes.append({
            "id": node_id,
            "label": hostname,
            "ip": ip,
            "os": os_name,
            "type": classify_device(open_ports),
            "open_ports": open_ports,
            "risk_score": risk_score(open_ports),
            "criticality": "high" if classify_device(open_ports) in ("Database", "Redis") else "medium",
        })

    edges = infer_edges(nodes)
    return {"nodes": nodes, "edges": edges}


def infer_edges(nodes: list[dict]) -> list[dict]:
    """Heuristic edge inference: internet-facing exposure + same-subnet lateral movement."""
    edges = []

    # Virtual internet node connects to anything with a public-facing web/remote port
    internet_facing_ports = set(WEB_PORTS) | {22, 3389, 21}
    for n in nodes:
        port_nums = {p["port"] for p in n["open_ports"]}
        if port_nums & internet_facing_ports:
            exposed = sorted(port_nums & internet_facing_ports)
            edges.append({
                "source": "internet",
                "target": n["id"],
                "ports": exposed,
                "trust": "untrusted",
                "reason": f"Host exposes port(s) {exposed} reachable from the public internet.",
            })

    # Same-subnet lateral movement (naive /24 grouping)
    def subnet_key(ip: str) -> str | None:
        try:
            return str(ipaddress.ip_network(ip + "/24", strict=False))
        except ValueError:
            return None

    buckets: dict[str, list[dict]] = {}
    for n in nodes:
        key = subnet_key(n["ip"])
        if key:
            buckets.setdefault(key, []).append(n)

    for key, group in buckets.items():
        if len(group) < 2:
            continue
        for a in group:
            for b in group:
                if a["id"] == b["id"]:
                    continue
                # b is reachable from a if b has any open port at all
                if b["open_ports"]:
                    exposed = sorted({p["port"] for p in b["open_ports"]})[:5]
                    edges.append({
                        "source": a["id"],
                        "target": b["id"],
                        "ports": exposed,
                        "trust": "same-subnet",
                        "reason": f"{a['label']} and {b['label']} share subnet {key}; lateral access to open ports assumed.",
                    })

    return edges
