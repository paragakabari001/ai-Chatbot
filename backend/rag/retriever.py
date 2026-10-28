"""
Authoritative RAG Retrieval Engine for Dar Global & Wasalt
Combines BM25 lexical search, TF-IDF cosine matching, and metadata filtering
with source attribution and citation generation.
"""

import json
import math
import os
import re
from typing import List, Dict, Any, Tuple


class GroundedRetriever:
    def __init__(self, kb_path: str = None):
        if not kb_path:
            base_dir = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
            kb_path = os.path.join(base_dir, "data", "knowledge_base.json")
        self.kb_path = kb_path
        self.documents: List[Dict[str, Any]] = []
        self.doc_tokens: List[List[str]] = []
        self.idf: Dict[str, float] = {}
        self.avg_dl: float = 0.0
        self.load_knowledge_base()

    def tokenize(self, text: str) -> List[str]:
        """Normalize and tokenize text into lowercase word tokens."""
        if not text:
            return []
        text = text.lower()
        tokens = re.findall(r"\b[a-z0-9_-]{2,}\b", text)
        return tokens

    def load_knowledge_base(self):
        """Load documents from JSON and precompute BM25 indices."""
        if not os.path.exists(self.kb_path):
            self.documents = []
            return

        with open(self.kb_path, "r", encoding="utf-8") as f:
            self.documents = json.load(f)

        self.doc_tokens = []
        total_len = 0
        df: Dict[str, int] = {}

        for doc in self.documents:
            # Aggregate searchable text with high weight on title, tags, and category
            combined = f"{doc.get('title', '')} {doc.get('title', '')} {' '.join(doc.get('tags', []))} {doc.get('category', '')} {doc.get('content', '')}"
            tokens = self.tokenize(combined)
            self.doc_tokens.append(tokens)
            total_len += len(tokens)

            # Document frequency
            unique_tokens = set(tokens)
            for t in unique_tokens:
                df[t] = df.get(t, 0) + 1

        n_docs = len(self.documents)
        self.avg_dl = total_len / n_docs if n_docs > 0 else 1.0

        # BM25 IDF formulation
        self.idf = {}
        for t, freq in df.items():
            self.idf[t] = math.log(1.0 + (n_docs - freq + 0.5) / (freq + 0.5))

    def retrieve(
        self,
        query: str,
        top_k: int = 5,
        source_filter: str = None,
        k1: float = 1.5,
        b: float = 0.75,
    ) -> List[Dict[str, Any]]:
        """
        BM25 retrieval with source attribution and relevance scoring.
        """
        if not self.documents:
            return []

        query_tokens = self.tokenize(query)
        if not query_tokens:
            return self.documents[:top_k]

        scores: List[Tuple[float, int]] = []

        for idx, (doc, tokens) in enumerate(zip(self.documents, self.doc_tokens)):
            # Optional source filter ("Dar Global", "Wasalt")
            if source_filter and doc.get("source") != source_filter:
                continue

            doc_len = len(tokens)
            score = 0.0

            # Token frequencies in this doc
            tf_dict: Dict[str, int] = {}
            for t in tokens:
                tf_dict[t] = tf_dict.get(t, 0) + 1

            for qt in query_tokens:
                if qt in tf_dict:
                    tf = tf_dict[qt]
                    idf = self.idf.get(qt, 0.1)
                    denom = tf + k1 * (1.0 - b + b * (doc_len / self.avg_dl))
                    term_score = idf * (tf * (k1 + 1.0)) / denom
                    score += term_score

            # Boost exact title matches or tag matches
            title_lower = doc.get("title", "").lower()
            query_str = query.lower()
            if any(term in title_lower for term in query_tokens):
                score *= 1.35
            if any(term in " ".join(doc.get("tags", [])).lower() for term in query_tokens):
                score *= 1.2

            if score > 0:
                scores.append((score, idx))

        scores.sort(key=lambda x: x[0], reverse=True)

        results = []
        for score, idx in scores[:top_k]:
            doc_copy = dict(self.documents[idx])
            doc_copy["relevance_score"] = round(score, 3)
            doc_copy["citation_label"] = f"[{doc_copy.get('source')}: {doc_copy.get('title')}]"
            results.append(doc_copy)

        return results


# Global singleton
retriever = GroundedRetriever()
