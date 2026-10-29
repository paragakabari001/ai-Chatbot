"""
Grounding Engine & Prompt Guardrails
Formats strict context prompts and handles grounded synthesis.
"""

from typing import List, Dict, Any

SYSTEM_PROMPT = """You are an expert AI Real Estate Advisor specializing exclusively in Dar Global (https://darglobal.co.uk/) and Wasalt (https://wasalt.sa/en).

Your goal is to deliver accurate, helpful, and strictly grounded answers to prospective real estate buyers, investors, and tenants.

STRICT GROUNDING & BEHAVIOR RULES:
1. ONLY state facts substantiated by the provided official context from Dar Global and Wasalt.
2. If the user's question cannot be answered using the provided context, state clearly and politely:
   "Based on the official public information currently available from Dar Global and Wasalt, this detail is not specified. Please consult their official websites or sales teams directly."
3. Never invent prices, reservation conditions, or legal rules not present in the context.
4. When discussing Dar Global, highlight its international luxury developments (LSE: DAR listed), branded partnerships (Pagani, Missoni, Lamborghini, Trump, ELIE SAAB), prime destinations (Dubai, Oman, London, Qatar, Spain, Maldives), and the 7-day token reservation policy.
5. When discussing Wasalt, highlight its status as Saudi Arabia's premier PropTech marketplace, REGA (Fal) licensing, Wafi escrow compliance, Ejar rental integration, and city coverage (Riyadh, Jeddah, Dammam, Khobar, etc.).
6. Professional Formatting:
   - Structure your response with an executive summary followed by thematic sections.
   - Use clean Markdown with headers (###, ####), bullet points, and bold key terms.
   - Provide direct verified source references at the conclusion of your response.
7. Maintain an executive, trustworthy, and knowledgeable real estate advisory tone at all times.
"""


def build_grounded_prompt(query: str, retrieved_docs: List[Dict[str, Any]]) -> str:
    """Format prompt with retrieved context snippets."""
    context_blocks = []
    for i, doc in enumerate(retrieved_docs, start=1):
        context_blocks.append(
            f"--- [DOCUMENT {i}] ---\n"
            f"Source: {doc.get('source')}\n"
            f"Title: {doc.get('title')}\n"
            f"Category: {doc.get('category')}\n"
            f"URL: {doc.get('url')}\n"
            f"Content:\n{doc.get('content')}\n"
        )

    context_str = "\n".join(context_blocks) if context_blocks else "No relevant documents found."

    user_message = (
        f"### CONTEXT INFORMATION FROM DAR GLOBAL & WASALT:\n\n"
        f"{context_str}\n\n"
        f"### USER INQUIRY:\n"
        f"{query}\n\n"
        f"Please provide a thorough, structured, and factually grounded response citing the sources above."
    )
    return user_message


def generate_extractive_fallback(query: str, retrieved_docs: List[Dict[str, Any]]) -> str:
    """
    Synthesize high-quality grounded answer directly from context if OpenRouter
    is not configured or temporarily unavailable.
    """
    if not retrieved_docs:
        return (
            "I could not locate specific public records matching your inquiry in the Dar Global and Wasalt "
            "knowledge base. Please try rephrasing your question or check their official portals:\n\n"
            "- [Dar Global](https://darglobal.co.uk/)\n"
            "- [Wasalt](https://wasalt.sa/en)"
        )

    sources_seen = set()
    citations = []

    answer_parts = [
        f"### Summary for: *\"{query}\"*\n",
        "Based on official public data from **Dar Global** and **Wasalt**, here are the verified details:\n"
    ]

    for doc in retrieved_docs[:4]:
        src = doc.get("source", "Real Estate Portal")
        title = doc.get("title", "")
        url = doc.get("url", "")
        content = doc.get("content", "").strip()

        sources_seen.add(src)
        citations.append(f"- [{src}: {title}]({url})")

        # Extract top bullet points or concise sentences
        lines = [line.strip() for line in content.split("\n") if line.strip()]
        lead = lines[0] if lines else ""
        details = lines[1:4] if len(lines) > 1 else []

        answer_parts.append(f"#### {title} ({src})")
        if lead:
            answer_parts.append(f"{lead}\n")
        if details:
            for d in details:
                if not d.startswith("-") and not d.startswith("Q:") and not d.startswith("A:"):
                    answer_parts.append(f"- {d}")
                else:
                    answer_parts.append(d)
            answer_parts.append("")

    answer_parts.append("\n### Verified Sources & References:")
    answer_parts.extend(citations)

    return "\n".join(answer_parts)
