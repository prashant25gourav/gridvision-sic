"""RAG Retriever Service.

Indexes domain markdown documents in knowledge_base/ and provides
top-k cosine similarity retrieval over passage chunks.

Runs entirely local and offline.
"""

from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple
import logging
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

logger = logging.getLogger(__name__)


class LocalRAGRetriever:
    """Local vector/TF-IDF retriever for GridVision knowledge base."""

    def __init__(self, kb_dir: Optional[Path] = None):
        if kb_dir is None:
            kb_dir = Path(__file__).parent / "knowledge_base"
        self.kb_dir = kb_dir
        self.documents: List[Dict[str, str]] = []
        self.vectorizer: Optional[TfidfVectorizer] = None
        self.tfidf_matrix = None

        self._load_and_index()

    def _load_and_index(self) -> None:
        """Load markdown files and split into paragraph-level chunks."""
        self.documents = []
        if not self.kb_dir.exists():
            logger.warning(f"Knowledge base directory {self.kb_dir} not found.")
            return

        for md_file in sorted(self.kb_dir.glob("*.md")):
            try:
                content = md_file.read_text(encoding="utf-8")
                # Split by sections or paragraphs
                sections = content.split("\n\n")
                current_heading = md_file.stem.replace("_", " ").title()
                for sec in sections:
                    clean_sec = sec.strip()
                    if not clean_sec:
                        continue
                    if clean_sec.startswith("#"):
                        current_heading = clean_sec.lstrip("#").strip().split("\n")[0]
                    self.documents.append({
                        "source": md_file.name,
                        "heading": current_heading,
                        "text": clean_sec,
                    })
            except Exception as e:
                logger.warning(f"Failed to read KB doc {md_file}: {e}")

        if self.documents:
            corpus = [f"{d['heading']}: {d['text']}" for d in self.documents]
            self.vectorizer = TfidfVectorizer(stop_words="english", ngram_range=(1, 2))
            self.tfidf_matrix = self.vectorizer.fit_transform(corpus)
            logger.info(f"RAG indexed {len(self.documents)} passages from {self.kb_dir.name}.")

    def retrieve(self, query: str, top_k: int = 3) -> List[Dict[str, Any]]:
        """Retrieve top-k relevant knowledge passages for a query."""
        if not self.documents or self.vectorizer is None or self.tfidf_matrix is None:
            return []

        query_vec = self.vectorizer.transform([query])
        similarities = cosine_similarity(query_vec, self.tfidf_matrix).flatten()

        # Get top-k indices
        top_indices = similarities.argsort()[::-1][:top_k]
        results = []
        for idx in top_indices:
            score = float(similarities[idx])
            if score > 0.05:  # Relevance threshold
                doc = self.documents[idx]
                results.append({
                    "source": doc["source"],
                    "heading": doc["heading"],
                    "text": doc["text"],
                    "score": round(score, 4),
                })
        return results


# Global singleton instance
retriever = LocalRAGRetriever()
