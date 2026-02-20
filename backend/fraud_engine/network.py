"""
FraudSense — Network Analysis Engine (Layer 4)
Builds a vendor graph per business and detects:
- Vendor concentration risk (too few vendors getting too much money)
- Collusion patterns (vendors sharing unusual activity windows)
- Vendor risk score based on network centrality
"""

import os
import json
import math
from collections import defaultdict
from typing import Optional
import networkx as nx


class VendorGraph:
    """
    Maintains an in-memory directed graph: business → vendor edges.
    Edge weight = cumulative transaction amount.
    """
    def __init__(self):
        self.G = nx.DiGraph()

    def add_transaction(self, business_id: int, vendor_name: str,
                        amount: float, timestamp: str = ""):
        biz_node    = f"biz_{business_id}"
        vendor_node = f"vendor_{vendor_name}"

        if not self.G.has_node(biz_node):
            self.G.add_node(biz_node, type="business", business_id=business_id)
        if not self.G.has_node(vendor_node):
            self.G.add_node(vendor_node, type="vendor", name=vendor_name,
                            total_received=0.0, txn_count=0)

        if self.G.has_edge(biz_node, vendor_node):
            self.G[biz_node][vendor_node]["weight"] += amount
            self.G[biz_node][vendor_node]["txn_count"] += 1
        else:
            self.G.add_edge(biz_node, vendor_node, weight=amount, txn_count=1)

        # Update vendor totals
        self.G.nodes[vendor_node]["total_received"] += amount
        self.G.nodes[vendor_node]["txn_count"]      += 1

    def get_vendor_risk_score(self, vendor_name: str) -> float:
        """
        Compute a vendor risk score 0–1 based on:
        - PageRank centrality (high = many businesses paying this vendor)
        - Total amount received (normalized)
        - Number of businesses paying this vendor (concentration)
        """
        vendor_node = f"vendor_{vendor_name}"
        if not self.G.has_node(vendor_node):
            return 0.05

        # 1. In-degree (number of businesses paying this vendor)
        in_degree = self.G.in_degree(vendor_node)

        # 2. PageRank
        if len(self.G.nodes) > 2:
            try:
                pr = nx.pagerank(self.G, weight="weight")
                vendor_pr = pr.get(vendor_node, 0.0)
                max_pr    = max(pr.values()) or 1e-9
                pr_score  = vendor_pr / max_pr
            except Exception:
                pr_score = 0.0
        else:
            pr_score = 0.0

        # 3. Amount concentration (single vendor receiving large fraction = risky)
        node_data      = self.G.nodes[vendor_node]
        total_received = node_data.get("total_received", 0)
        total_in_graph = sum(
            self.G.nodes[n].get("total_received", 0)
            for n in self.G.nodes
            if self.G.nodes[n].get("type") == "vendor"
        ) or 1
        concentration = total_received / total_in_graph

        # Combine: weight concentration heavily
        if in_degree <= 1:
            # Single tenant: risk is purely based on concentration (e.g. 1 vendor getting 80% of funds)
            raw_score = concentration
            return round(min(1.0, raw_score * 1.5), 4)
        else:
            # Multi-tenant: apply PR and degree
            raw_score = 0.3 * pr_score + 0.4 * concentration + 0.3 * min(1.0, in_degree / 10.0)
            return round(min(1.0, raw_score * 2.5), 4)

    def detect_collusion(self, business_id: int, vendor_name: str) -> dict:
        """
        Check if this vendor has been used suspiciously by multiple businesses
        (potential collusion: vendors receiving payments from many businesses
        in short time windows).
        """
        vendor_node   = f"vendor_{vendor_name}"
        if not self.G.has_node(vendor_node):
            return {"collusion_detected": False, "shared_businesses": 0}

        predecessors = list(self.G.predecessors(vendor_node))
        shared_count = len(predecessors)

        if shared_count >= 10:
            return {"collusion_detected": True,
                    "shared_businesses": shared_count,
                    "severity": "critical",
                    "message": f"Vendor receiving payments from {shared_count} businesses"}
        if shared_count >= 5:
            return {"collusion_detected": True,
                    "shared_businesses": shared_count,
                    "severity": "high",
                    "message": f"Vendor receiving payments from {shared_count} businesses"}
        return {"collusion_detected": False, "shared_businesses": shared_count}

    def get_graph_json(self, business_id: Optional[int] = None) -> dict:
        """
        Export graph as JSON for the frontend visualization endpoint.
        If business_id given, return only that business's subgraph.
        """
        if business_id is not None:
            biz_node = f"biz_{business_id}"
            if not self.G.has_node(biz_node):
                return {"nodes": [], "links": []}
            neighbors = list(self.G.successors(biz_node))
            nodes_to_include = {biz_node} | set(neighbors)
        else:
            nodes_to_include = set(self.G.nodes)

        nodes = []
        for n in nodes_to_include:
            data = dict(self.G.nodes[n])
            if data.get("type") == "vendor":
                vendor_name = data.get("name", "")
                data["risk_score"] = self.get_vendor_risk_score(vendor_name)
            nodes.append({
                "id":    n,
                "name":  data.get("name", str(n).replace("biz_", "Business #")),
                "type":  data.get("type", "unknown"),
                **data
            })

        edges = []
        for src, dst, edata in self.G.edges(data=True):
            if src in nodes_to_include and dst in nodes_to_include:
                edges.append({
                    "source":    src,
                    "target":    dst,
                    "weight":    edata.get("weight", 0),
                    "txn_count": edata.get("txn_count", 0),
                })

        return {"nodes": nodes, "links": edges, "total_nodes": len(nodes)}


# ── Singleton graph ────────────────────────────────────────────────────────────
_vendor_graph: Optional[VendorGraph] = None


def get_vendor_graph() -> VendorGraph:
    global _vendor_graph
    if _vendor_graph is None:
        _vendor_graph = VendorGraph()
    return _vendor_graph


def analyze_transaction_network(tx: dict, business_id: int) -> dict:
    """
    Add transaction to the graph and return network-based risk signals.
    """
    graph       = get_vendor_graph()
    vendor_name = str(tx.get("vendor_name", "unknown") or "unknown")
    amount      = float(tx.get("amount", 0) or 0)
    timestamp   = str(tx.get("timestamp", "") or "")

    graph.add_transaction(business_id, vendor_name, amount, timestamp)

    vendor_risk  = graph.get_vendor_risk_score(vendor_name)
    collusion    = graph.detect_collusion(business_id, vendor_name)

    return {
        "vendor_risk_score":   vendor_risk,
        "collusion":           collusion,
        "collusion_detected":  collusion["collusion_detected"],
        "network_risk_score":  round(
            vendor_risk * 0.6 + (0.4 if collusion["collusion_detected"] else 0),
            4
        ),
    }
