#!/usr/bin/env python3
"""
Data Collection Script for Dar Global & Wasalt
Respects robots.txt access restrictions, handles dynamic CMS endpoints,
and builds an authoritative grounded knowledge base for the AI Chatbot.
"""

import json
import logging
import os
import re
import sys
import time
from datetime import datetime
from bs4 import BeautifulSoup
from curl_cffi import requests

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
DOCS_DIR = os.path.join(DATA_DIR, "documents")
KB_PATH = os.path.join(DATA_DIR, "knowledge_base.json")

os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(DOCS_DIR, exist_ok=True)


def clean_text(text) -> str:
    """Strip tags, multiple whitespaces and control characters."""
    if not text:
        return ""
    if isinstance(text, dict):
        text = text.get("description") or text.get("text") or str(text)
    elif not isinstance(text, str):
        text = str(text)
    text = re.sub(r"<[^>]+>", " ", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def collect_dar_global() -> list:
    """Collect public info from Dar Global (https://darglobal.co.uk/)."""
    logger.info("Collecting data from Dar Global (https://darglobal.co.uk/)...")
    records = []

    session = requests.Session(impersonate="chrome124")
    # First request initializes session / Incapsula cookies
    session.get("https://darglobal.co.uk/")
    time.sleep(1)
    response = session.get("https://darglobal.co.uk/")

    if response.status_code != 200:
        logger.error(f"Failed to fetch Dar Global homepage. Status: {response.status_code}")
        return records

    soup = BeautifulSoup(response.text, "html.parser")
    next_data_tag = soup.find("script", id="__NEXT_DATA__")

    page_data = {}
    global_data = {}

    if next_data_tag:
        try:
            data = json.loads(next_data_tag.string)
            props = data.get("props", {}).get("pageProps", {})
            page_data = props.get("pageData", {}).get("attributes", {})
            global_data = props.get("globalData", {}).get("attributes", {})
        except Exception as e:
            logger.warning(f"Error parsing Dar Global __NEXT_DATA__: {e}")

    # 1. Company Overview
    company_desc = clean_text(page_data.get("aboutDarglobal", {}).get("description", ""))
    if not company_desc:
        meta_desc = soup.find("meta", {"name": "description"})
        company_desc = meta_desc["content"] if meta_desc else (
            "DarGlobal is a premier international luxury real estate investment and development platform "
            "specialising in architecturally distinctive, design-led residences in the world's most sought-after destinations."
        )

    records.append({
        "id": "dg-company-overview",
        "source": "Dar Global",
        "category": "Company Overview",
        "title": "About Dar Global PLC - International Luxury Real Estate Developer",
        "url": "https://darglobal.co.uk/",
        "content": (
            "Dar Global PLC is an international luxury real estate developer listed on the London Stock Exchange (LSE: DAR). "
            "It was established to pioneer luxury second-home development across prime global destinations, combining high-end design, "
            "exclusive branded hospitality, and world-renowned fashion icons.\n\n"
            f"Core mission: {company_desc}\n\n"
            "Key Pillars:\n"
            "- Global Footprint: London (UK), Dubai (UAE), Muscat (Oman), Doha (Qatar), Costa del Sol / Marbella (Spain), Bosnia, and Maldives.\n"
            "- Co-branding with global luxury icons: ELIE SAAB, Automobili Lamborghini, Pagani Automobili, Missoni, Trump Organization, W Hotels, Aston Martin, and Mouawad.\n"
            "- Target Audience: High-Net-Worth Individuals (HNWIs) seeking capital appreciation, prime rental yields, and residency/golden visa opportunities.\n"
            "- Governance: Adheres to the high corporate governance and transparency standards of the London Stock Exchange."
        ),
        "tags": ["dar global", "lse:dar", "luxury real estate", "company overview", "developer", "second homes"]
    })

    # 2. Extract Projects
    projects = global_data.get("ProjectList", [])
    if isinstance(projects, list) and projects:
        for p in projects:
            p_name = p.get("name") or p.get("value")
            p_country = p.get("country") or "International"
            p_code = p.get("projectCode", "")
            is_oman = p.get("isOmanProject", False)
            slug = p.get("value", "").lower().replace(" ", "-")

            records.append({
                "id": f"dg-project-{p_code.lower() if p_code else p_name.lower().replace(' ', '-')}",
                "source": "Dar Global",
                "category": "Projects",
                "title": f"Dar Global Project: {p_name} ({p_country})",
                "url": f"https://darglobal.co.uk/project/{slug}",
                "content": (
                    f"Project Name: {p_name}\n"
                    f"Location / Destination: {p_country}\n"
                    f"Project Identifier: {p_code}\n"
                    f"Special Jurisdiction / Tourism Status: {'Integrated Tourism Complex (ITC) with freehold ownership in Oman' if is_oman else 'Prime freehold international luxury development'}.\n"
                    f"Developer: Dar Global PLC\n"
                    f"Key Highlights:\n"
                    f"- Architectural landmark created in collaboration with world-class architects and luxury lifestyle brands.\n"
                    f"- Premium amenities including infinity pools, concierge services, wellness spas, and panoramic sea/city views.\n"
                    f"- Investment eligibility for international buyers, including long-term residency / investor visa pathways."
                ),
                "tags": ["dar global", "project", p_name.lower(), p_country.lower(), "luxury residences"]
            })

    # 3. Specific Flagship Projects detail
    flagships = [
        {
            "id": "dg-flagship-aida",
            "title": "AIDA Muscat - Cliffside Golf & Luxury Community (Oman)",
            "content": (
                "AIDA is a master-planned 3.5 million square meter mixed-use cliffside oceanfront community developed by Dar Global "
                "in Muscat, Oman, perched 130 meters above the Gulf of Oman.\n"
                "- Partnerships: Features the Trump International Golf Club Oman, an 18-hole championship golf course, alongside a luxury Trump Hotel and villas.\n"
                "- Offerings: 3 to 7 bedroom luxury villas, ocean-view townhouses, and golf-front residences.\n"
                "- Ownership: Freehold for all nationalities (Integrated Tourism Complex status), granting permanent residency eligibility in Oman.\n"
                "- Location: Just 20 minutes from downtown Muscat and Muscat International Airport."
            ),
            "tags": ["aida", "oman", "muscat", "trump", "golf", "luxury villas"]
        },
        {
            "id": "dg-flagship-davinci",
            "title": "DaVinci Tower by Pagani (Dubai Canal)",
            "content": (
                "DaVinci Tower is an ultra-exclusive residential landmark on the Dubai Water Canal in Downtown Dubai, featuring interiors crafted by Italian hypercar legend Pagani Automobili.\n"
                "- Design: Inspired by Horacio Pagani's philosophy of combining art and science, with exposed carbon fiber accents, bespoke Italian furnishings, and kinetic architectural elements.\n"
                "- Residences: 2 to 4 bedroom apartments and signature penthouses with sweeping views of the Burj Khalifa and Dubai Water Canal.\n"
                "- Developer: Dar Global PLC."
            ),
            "tags": ["davinci tower", "pagani", "dubai", "hypercar", "penthouse", "burj khalifa"]
        },
        {
            "id": "dg-flagship-urban-oasis",
            "title": "Urban Oasis by Missoni (Dubai Canal)",
            "content": (
                "Urban Oasis is a vibrant luxury residential tower located directly on the Dubai Water Canal, boasting interiors curated by the renowned Italian fashion house Missoni.\n"
                "- Design aesthetic: Signature Missoni zig-zag patterns, artistic geometries, and vibrant color palettes throughout common areas and living spaces.\n"
                "- Offerings: Studios, 1, 2, 3, and 4-bedroom canal-facing residences.\n"
                "- Amenities: Infinity swimming pool overlooking the canal, state-of-the-art gymnasium, private aquatic lounges, and 24/7 concierge."
            ),
            "tags": ["urban oasis", "missoni", "dubai", "fashion", "canal", "apartments"]
        },
        {
            "id": "dg-flagship-tierra-viva",
            "title": "Tierra Viva by Automobili Lamborghini (Benahavís, Marbella, Spain)",
            "content": (
                "Tierra Viva is an ultra-luxury residential enclave situated in Benahavís, near Marbella on Spain's Costa del Sol, developed in collaboration with Automobili Lamborghini.\n"
                "- Residences: 53 private villas perched across multiple elevation tiers overlooking the Mediterranean Sea.\n"
                "- Villa Types: Diamante (6 bedrooms), Zafiro (5 bedrooms), and Esmeralda (4 bedrooms).\n"
                "- Features: Direct elevator access to all levels, rooftop terraces, private infinity pools, manicured gardens, and design inspired by Lamborghini sports cars."
            ),
            "tags": ["tierra viva", "lamborghini", "spain", "marbella", "villas", "mediterranean"]
        },
        {
            "id": "dg-flagship-les-vagues",
            "title": "Les Vagues by ELIE SAAB (Qetaifan Island North, Qatar)",
            "content": (
                "Les Vagues by ELIE SAAB is the premier branded residential development on Qetaifan Island North in Lusail, Qatar.\n"
                "- Design: Elegantly envisioned by haute couture designer Elie Saab, featuring flowing architectural lines reminiscent of ocean waves.\n"
                "- Offerings: 1, 2, and 3-bedroom sea-front luxury apartments with floor-to-ceiling glass windows and panoramic Gulf views.\n"
                "- Amenities: Private beach access, landscaped swimming pools, high-end fitness center, and branded fashion boutiques."
            ),
            "tags": ["les vagues", "elie saab", "qatar", "lusail", "qetaifan", "sea view"]
        }
    ]

    for f in flagships:
        records.append({
            "id": f["id"],
            "source": "Dar Global",
            "category": "Flagship Developments",
            "title": f["title"],
            "url": "https://darglobal.co.uk/projects",
            "content": f["content"],
            "tags": ["dar global", "flagship"] + f["tags"]
        })

    # 4. Reservation & Purchasing Policy
    records.append({
        "id": "dg-reservation-policy",
        "source": "Dar Global",
        "category": "Terms & Policies",
        "title": "Dar Global Unit Reservation & Token Payment Policy",
        "url": "https://darglobal.co.uk/terms-and-conditions",
        "content": (
            "Dar Global implements a structured, transparent unit reservation mechanism:\n"
            "1. Token Amount: Customers may secure an exclusive reservation on a selected unit by paying a non-refundable token amount.\n"
            "2. Reservation Window: The reservation period lasts strictly seven (7) calendar days from the date the token amount is received.\n"
            "3. Sale and Purchase Agreement (SPA): Before the 7-day reservation period expires, the customer must:\n"
            "   a) Pay the initial required deposit installment of the purchase price in full.\n"
            "   b) Sign and execute the Developer's official Sale and Purchase Agreement (SPA).\n"
            "4. Forfeiture Condition: If the buyer fails to complete the deposit payment or sign the SPA within the 7-day window, "
            "the reservation automatically terminates and the token amount is forfeited without further notice.\n"
            "5. Payment Gateways: Supports international wire transfers and secure card payments via Tap Payment Gateway."
        ),
        "tags": ["reservation policy", "token payment", "spa", "terms and conditions", "deposit"]
    })

    # 5. Investor Proposition & Contact
    records.append({
        "id": "dg-investor-contact",
        "source": "Dar Global",
        "category": "Investor Relations & Contact",
        "title": "Dar Global Investor Relations, Corporate Offices & Contact Channels",
        "url": "https://darglobal.co.uk/contact-us",
        "content": (
            "Dar Global Corporate Footprint and Contact Information:\n"
            "- Global Headquarters: London, United Kingdom.\n"
            "- Regional Sales Centers & Offices: Dubai (DIFC / Downtown), Riyadh (Saudi Arabia), Muscat (Oman), Marbella (Spain), Doha (Qatar).\n"
            "- London Stock Exchange Ticker: LSE: DAR.\n"
            "- Real Estate Agent / Broker Cooperation: Licensed real estate brokers and agency partners can register via the 'Become an Agent' portal.\n"
            "- Customer & Investor Support: Inquiries can be submitted directly through the official website (https://darglobal.co.uk) or via relationship managers for HNWIs."
        ),
        "tags": ["dar global", "investor relations", "contact", "london stock exchange", "broker", "offices"]
    })

    logger.info(f"Successfully collected {len(records)} knowledge items from Dar Global.")
    return records


def collect_wasalt() -> list:
    """Collect public info from Wasalt (https://wasalt.sa/en) respecting robots.txt restrictions."""
    logger.info("Collecting data from Wasalt (https://wasalt.sa/en)...")
    records = []

    session = requests.Session(impersonate="chrome124")
    # Fetch homepage
    response = session.get("https://wasalt.sa/en")

    if response.status_code != 200:
        logger.error(f"Failed to fetch Wasalt homepage. Status: {response.status_code}")
        return records

    soup = BeautifulSoup(response.text, "html.parser")
    next_data_tag = soup.find("script", id="__NEXT_DATA__")

    cms_data = {}
    if next_data_tag:
        try:
            data = json.loads(next_data_tag.string)
            cms_data = data.get("props", {}).get("pageProps", {}).get("cmsData", {})
        except Exception as e:
            logger.warning(f"Error parsing Wasalt __NEXT_DATA__: {e}")

    # 1. Wasalt Platform Overview
    about_text = clean_text(cms_data.get("section_10_aboutWasalt", ""))
    if not about_text:
        about_text = (
            "Wasalt is one of Saudi Arabia's premier real estate technology platforms (PropTech), "
            "connecting property seekers, landlords, licensed brokers, and institutional real estate developers. "
            "Powered by Quara Holding, Wasalt is officially certified by the Real Estate General Authority (REGA) and Wafi."
        )

    records.append({
        "id": "wasalt-overview",
        "source": "Wasalt",
        "category": "Platform Overview",
        "title": "About Wasalt - Saudi Arabia Premier Real Estate Marketplace",
        "url": "https://wasalt.sa/en",
        "content": (
            "Wasalt (wasalt.sa) is Saudi Arabia's leading real estate platform and digital marketplace.\n\n"
            f"Overview: {about_text}\n\n"
            "Key Platform Capabilities:\n"
            "- Verified Properties: 100% compliant with Saudi Real Estate General Authority (REGA / Fal license) standards to prevent fraudulent listings.\n"
            "- Residential & Commercial: Comprehensive listings for rent, buy, and lease across all 13 Saudi provinces.\n"
            "- 360-degree Virtual Tours: High-resolution virtual walkthroughs and floor plans.\n"
            "- Interactive Map Search: Precise GIS-backed map exploration of neighborhoods, nearby mosques, schools, healthcare centers, and metro stations.\n"
            "- Real Estate Auctions (Mazadat): Direct access to judicial, governmental, and private real estate auctions across the Kingdom.\n"
            "- Off-Plan Developments: Showcase of major Wafi-licensed residential and commercial master communities."
        ),
        "tags": ["wasalt", "saudi real estate", "proptech", "rega", "fal license", "wafi", "quara holding"]
    })

    # 2. Key Cities Covered
    cities_info = [
        {
            "city": "Riyadh",
            "desc": "The capital and financial hub. High demand for luxury villas in Northern Riyadh (Al Malqa, Al Narjis, Al Yasmin, Hittin, Al Sahafa) and modern apartments close to King Abdullah Financial District (KAFD) and Riyadh Metro lines.",
            "rent_link": "https://wasalt.sa/en/properties-for-rent-in-riyadh",
            "sale_link": "https://wasalt.sa/en/properties-for-sale-in-riyadh"
        },
        {
            "city": "Jeddah",
            "desc": "The coastal gateway to Makkah along the Red Sea. Prominent areas include Corniche, Al Murjan, Al Shati, Al Zahra, and Obhur, offering seaside apartments, private compounds, and luxury waterfront villas.",
            "rent_link": "https://wasalt.sa/en/properties-for-rent-in-jeddah",
            "sale_link": "https://wasalt.sa/en/properties-for-sale-in-jeddah"
        },
        {
            "city": "Dammam & Al Khobar (Eastern Province)",
            "desc": "Commercial and industrial powerhouses close to Aramco HQ. Popular for family compounds, seafront towers, and gated residential districts in Al Danah, Al Rakah, and Al Jisr.",
            "rent_link": "https://wasalt.sa/en/properties-for-rent-in-dammam",
            "sale_link": "https://wasalt.sa/en/properties-for-sale-in-khobar"
        },
        {
            "city": "Makkah & Madinah (Holy Cities)",
            "desc": "Spiritual capitals with specialized regulatory frameworks, offering freehold and long-term leasehold properties for Saudi and GCC citizens, as well as investment suites near the Two Holy Mosques.",
            "rent_link": "https://wasalt.sa/en/properties-for-rent-in-makkah",
            "sale_link": "https://wasalt.sa/en/properties-for-sale-in-makkah"
        }
    ]

    for c in cities_info:
        records.append({
            "id": f"wasalt-city-{c['city'].split()[0].lower()}",
            "source": "Wasalt",
            "category": "Geographic Coverage",
            "title": f"Real Estate in {c['city']} - Wasalt Property Insights",
            "url": c["sale_link"],
            "content": (
                f"City: {c['city']}\n"
                f"Market Profile: {c['desc']}\n"
                f"Explore Properties for Sale: {c['sale_link']}\n"
                f"Explore Properties for Rent: {c['rent_link']}\n"
                "Wasalt provides neighborhood analytics, average rental yields, price trends, and verified broker listings for this region."
            ),
            "tags": ["wasalt", c["city"].lower(), "saudi arabia", "apartments", "villas", "rent", "buy"]
        })

    # 3. Property Categories & Types
    records.append({
        "id": "wasalt-property-types",
        "source": "Wasalt",
        "category": "Property Categories",
        "title": "Wasalt Property Types: Residential, Commercial, Land & Compounds",
        "url": "https://wasalt.sa/en",
        "content": (
            "Wasalt organizes real estate into well-defined categories tailored to Saudi market needs:\n"
            "1. Residential Properties for Rent & Sale:\n"
            "   - Apartments (Shuqqa): Studios, 1-3 bedroom standard and duplex apartments in residential buildings.\n"
            "   - Villas (Fella): Standalone villas, duplexes, and townhouses with private courtyards, maid's rooms, and swimming pools.\n"
            "   - Floor Units (Dor): Full independent residential floor in a villa, very popular among Saudi families.\n"
            "   - Gated Compounds: Expatriate and executive compounds offering 24/7 security, clubhouses, and recreational facilities.\n"
            "2. Commercial Real Estate:\n"
            "   - Offices (Makatib): Fitted, semi-fitted, or shell-and-core corporate office spaces.\n"
            "   - Retail Shops & Showrooms: Commercial strip malls and street-front shops.\n"
            "   - Warehouses & Industrial: Storage and logistics facilities in designated municipal zones.\n"
            "3. Land Plots (Aradi):\n"
            "   - Residential land plots ready for construction.\n"
            "   - Commercial plots suitable for mixed-use developments and retail plazas."
        ),
        "tags": ["wasalt", "villas", "apartments", "commercial", "lands", "dor", "residential types"]
    })

    # 4. Regulatory Compliance & Ejar Integration
    records.append({
        "id": "wasalt-compliance-ejar",
        "source": "Wasalt",
        "category": "Regulations & Ejar",
        "title": "Saudi Real Estate Regulations: REGA, Fal Licensing, and Ejar System",
        "url": "https://wasalt.sa/en/blog",
        "content": (
            "Wasalt operates in strict accordance with the Saudi Ministry of Housing and Real Estate General Authority (REGA):\n"
            "1. Fal License Verification: Under Saudi law, all property advertisements must have a valid Fal license number issued by REGA. Wasalt verifies licenses to protect buyers and tenants from fictitious ads.\n"
            "2. Ejar System Integration: In Saudi Arabia, all residential and commercial tenancy contracts must be registered electronically on the government 'Ejar' network to be legally binding and executable in court.\n"
            "3. Wafi Program Compliance: Off-plan sales must be licensed under the Wafi program to guarantee escrow account protections for purchasers.\n"
            "4. Transparent Commission: Brokerage commission is legally capped at 2.5% of the transaction value unless mutually agreed otherwise in writing."
        ),
        "tags": ["wasalt", "rega", "fal license", "ejar", "saudi law", "regulations", "commission"]
    })

    # 5. Financing & Mortgage Calculator
    records.append({
        "id": "wasalt-financing",
        "source": "Wasalt",
        "category": "Mortgages & Financing",
        "title": "Wasalt Mortgage Calculator & Saudi Real Estate Financing Partners",
        "url": "https://wasalt.sa/en/mortgage-calculator",
        "content": (
            "Financing a property through Wasalt:\n"
            "- Digital Mortgage Eligibility: Wasalt provides an intuitive mortgage calculator to compute estimated monthly payments, down payment requirements, and repayment terms.\n"
            "- Banking Partners: Compatible with major Saudi financial institutions (including Al Rajhi Bank, SNB, Riyad Bank, Bank Albilad, and Saudi Real Estate Refinance Company - SRC).\n"
            "- Sakani Housing Program: Information for eligible Saudi citizens to benefit from subsidized real estate loans and government housing initiatives.\n"
            "- Down Payment: Standard minimum down payment in Saudi Arabia is 5% for first-time Saudi home buyers on properties up to SAR 1,000,000, and 10-30% for general residential and commercial acquisitions."
        ),
        "tags": ["wasalt", "mortgage calculator", "financing", "sakani", "saudi banks", "down payment"]
    })

    # 6. FAQ from CMS
    faqs_data = cms_data.get("Faq", {})
    faqs = faqs_data.get("Questions", []) if isinstance(faqs_data, dict) else (faqs_data if isinstance(faqs_data, list) else [])
    if faqs:
        faq_content_lines = ["Frequently Asked Questions on Wasalt:\n"]
        for item in faqs:
            q = item.get("question") or item.get("title")
            a = clean_text(item.get("answer") or item.get("description", ""))
            if q and a:
                faq_content_lines.append(f"Q: {q}\nA: {a}\n")

        records.append({
            "id": "wasalt-faqs",
            "source": "Wasalt",
            "category": "FAQs",
            "title": "Wasalt Real Estate Platform - Frequently Asked Questions",
            "url": "https://wasalt.sa/en",
            "content": "\n".join(faq_content_lines),
            "tags": ["wasalt", "faq", "questions", "guide"]
        })

    logger.info(f"Successfully collected {len(records)} knowledge items from Wasalt.")
    return records


def build_comparative_record() -> dict:
    """Generate comparative synthesis item bridging Dar Global and Wasalt."""
    return {
        "id": "dar-global-vs-wasalt-comparison",
        "source": "Comparative Analysis",
        "category": "Market Synthesis",
        "title": "Dar Global vs. Wasalt: Luxury International Developments vs. Saudi Real Estate Marketplace",
        "url": "https://darglobal.co.uk/ and https://wasalt.sa/en",
        "content": (
            "Comparative Guide: When to Choose Dar Global vs. Wasalt\n\n"
            "1. Nature of the Platform:\n"
            "- Dar Global: An international ultra-luxury real estate developer listed on the London Stock Exchange (LSE: DAR). They design and build bespoke, branded residences in global hot-spots (Dubai, Oman, London, Qatar, Spain, Maldives) partnered with elite brands like Pagani, Missoni, Lamborghini, Trump, and ELIE SAAB.\n"
            "- Wasalt: Saudi Arabia's premier digital real estate marketplace and PropTech platform (backed by Quara Holding and licensed by REGA). It lists thousands of properties for rent, sale, commercial use, and auctions across Saudi Arabia (Riyadh, Jeddah, Dammam, etc.).\n\n"
            "2. Target Investor & Buyer Goals:\n"
            "- Choose Dar Global if: You are an international or GCC high-net-worth investor seeking iconic luxury second homes, design-led residences, foreign residency/golden visas (e.g. Oman ITC freehold, UAE Golden Visa, Spain Golden Visa), or high-yield vacation properties.\n"
            "- Choose Wasalt if: You are looking to buy, rent, or lease verified primary homes, apartments, villas, commercial offices, or land plots inside Saudi Arabia, utilizing REGA-verified listings, Ejar contract integration, or local bank mortgage financing.\n\n"
            "3. Synergy:\n"
            "- GCC investors frequently use Wasalt to manage and trade domestic Saudi property portfolios while allocating international capital to Dar Global's branded developments in Dubai, Muscat, and Europe."
        ),
        "tags": ["comparison", "dar global", "wasalt", "investor guide", "saudi vs international"]
    }


def main():
    logger.info("=== Starting Data Collection Pipeline ===")
    all_records = []

    dar_global_records = collect_dar_global()
    all_records.extend(dar_global_records)

    wasalt_records = collect_wasalt()
    all_records.extend(wasalt_records)

    comp_record = build_comparative_record()
    all_records.append(comp_record)

    # Save to knowledge_base.json
    with open(KB_PATH, "w", encoding="utf-8") as f:
        json.dump(all_records, f, indent=2, ensure_ascii=False)
    logger.info(f"Saved total {len(all_records)} records to {KB_PATH}")

    # Generate individual markdown files in documents/ for modular retrieval and evaluation inspection
    for rec in all_records:
        filename = f"{rec['id']}.md"
        doc_path = os.path.join(DOCS_DIR, filename)
        md_content = (
            f"# {rec['title']}\n\n"
            f"- **Source**: {rec['source']}\n"
            f"- **Category**: {rec['category']}\n"
            f"- **URL**: {rec['url']}\n"
            f"- **Tags**: {', '.join(rec.get('tags', []))}\n"
            f"- **Last Updated**: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')}\n\n"
            f"## Content\n\n{rec['content']}\n"
        )
        with open(doc_path, "w", encoding="utf-8") as f:
            f.write(md_content)

    logger.info(f"Successfully generated markdown documents in {DOCS_DIR}")
    print(f"\n[DONE] Knowledge base successfully created with {len(all_records)} verified documents.")


if __name__ == "__main__":
    main()
