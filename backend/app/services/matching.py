import re
import json
from typing import List, Dict, Any, Tuple
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from app.services.extractor import SKILLS_DICTIONARY, extract_text_from_url

def clean_text(text: str) -> str:
    """Preprocess and normalize text for vectorization."""
    if not text:
        return ""
    text = text.lower()
    text = re.sub(r"[^a-zA-Z0-9\s\+\#\.]", " ", text)
    return " ".join(text.split())

def extract_skills_from_text(text: str) -> List[str]:
    """Find known tech skills present in the given text."""
    if not text:
        return []
    text_lower = text.lower()
    skills = []
    for skill in SKILLS_DICTIONARY:
        pattern = r"(?<!\w)" + re.escape(skill) + r"(?!\w)"
        if re.search(pattern, text_lower):
            skills.append(skill.title() if len(skill) > 3 else skill.upper())
    return sorted(list(set(skills)))

def calculate_ats_score(
    jd_text: str,
    jd_skills: List[str],
    resume_text: str,
    student_dept: str = "",
    student_ug: float = 75.0
) -> Tuple[float, str, List[str], List[str]]:
    """
    Computes ATS match score (0-100), ATS Category (O, S, A, B, D),
    and identifies matched vs missing skills.
    
    Category Scale:
    - 91–100 -> O (Outstanding)
    - 81–90  -> S (Superior)
    - 71–80  -> A (Excellent)
    - 61–70  -> B (Good)
    - 0–60   -> D (Developing)
    """
    if not resume_text or len(resume_text.strip()) < 10:
        # Base estimate using department & academic profile if resume text is brief
        base = min(60.0, max(35.0, student_ug * 0.6))
        return round(base, 1), "D", [], jd_skills[:5]

    resume_skills = extract_skills_from_text(resume_text)
    
    # Normalize skill names for comparison
    jd_skills_normalized = {s.lower(): s for s in jd_skills}
    resume_skills_normalized = {s.lower(): s for s in resume_skills}
    
    matched = []
    missing = []
    for skill_key, original_name in jd_skills_normalized.items():
        if skill_key in resume_skills_normalized or any(skill_key in r for r in resume_skills_normalized):
            matched.append(original_name)
        else:
            missing.append(original_name)
    
    # 1. Skill Overlap Ratio (0.0 to 1.0)
    skill_match_ratio = len(matched) / max(1, len(jd_skills)) if jd_skills else 0.5

    # 2. TF-IDF Cosine Similarity
    try:
        clean_jd = clean_text(jd_text)
        clean_resume = clean_text(resume_text)
        
        vectorizer = TfidfVectorizer(ngram_range=(1, 2), stop_words="english")
        tfidf_matrix = vectorizer.fit_transform([clean_jd, clean_resume])
        sim_score = float(cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0])
    except Exception as e:
        sim_score = 0.4

    # 3. Weighted ATS calculation
    # 60% skill direct match + 35% text semantics + 5% academic consistency bonus
    academic_bonus = (student_ug / 100.0) * 5.0
    raw_score = (skill_match_ratio * 60.0) + (sim_score * 35.0) + academic_bonus
    
    # Normalize score between 15 and 98
    final_score = round(max(15.0, min(98.5, raw_score)), 1)
    
    # Category Assignment
    if final_score >= 91.0:
        category = "O"
    elif final_score >= 81.0:
        category = "S"
    elif final_score >= 71.0:
        category = "A"
    elif final_score >= 61.0:
        category = "B"
    else:
        category = "D"

    return final_score, category, matched, missing
