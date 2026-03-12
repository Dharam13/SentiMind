"""
Text preprocessing for sentiment analysis.
- Remove URLs and @mentions
- Normalize to lowercase
- Convert emojis to text descriptions
- Expand common abbreviations
- Preserve negations (not, no, never, etc.)
"""

import re
from typing import Optional

try:
    import emoji
    HAS_EMOJI = True
except ImportError:
    HAS_EMOJI = False

# Common abbreviations (social/media) -> expansion (lowercase, preserve negation context)
ABBREVIATIONS = {
    "don't": "do not",
    "doesn't": "does not",
    "didn't": "did not",
    "wouldn't": "would not",
    "couldn't": "could not",
    "shouldn't": "should not",
    "can't": "cannot",
    "cannot": "cannot",
    "isn't": "is not",
    "aren't": "are not",
    "wasn't": "was not",
    "weren't": "were not",
    "haven't": "have not",
    "hasn't": "has not",
    "hadn't": "had not",
    "won't": "will not",
    "wtf": "what the heck",
    "omg": "oh my god",
    "lol": "laughing out loud",
    "imo": "in my opinion",
    "imho": "in my humble opinion",
    "btw": "by the way",
    "idk": "i do not know",
    "idc": "i do not care",
    "gonna": "going to",
    "wanna": "want to",
    "gotta": "got to",
    "kinda": "kind of",
    "sorta": "sort of",
    "could've": "could have",
    "would've": "would have",
    "should've": "should have",
    "might've": "might have",
    "must've": "must have",
    "i'm": "i am",
    "you're": "you are",
    "we're": "we are",
    "they're": "they are",
    "it's": "it is",
    "that's": "that is",
    "what's": "what is",
    "there's": "there is",
    "here's": "here is",
    "who's": "who is",
    "he's": "he is",
    "she's": "she is",
    "u": "you",
    "r": "are",
    "ur": "your",
    "n": "and",
    "&": "and",
    "tho": "though",
    "thru": "through",
    "plz": "please",
    "pls": "please",
    "def": "definitely",
    "defo": "definitely",
    "prob": "probably",
    "gud": "good",
    "gr8": "great",
    "bad": "bad",
    "sux": "sucks",
    "awesome": "awesome",
    "love": "love",
    "hate": "hate",
}

# Regex: URLs (http/https)
URL_PATTERN = re.compile(
    r"https?://[^\s]+",
    re.IGNORECASE,
)
# @mentions (keep the @ so we can strip consistently)
MENTION_PATTERN = re.compile(r"@\w+")
# Optional: strip leading/trailing spaces and collapse multiple spaces
SPACES_PATTERN = re.compile(r"\s+")


def _expand_abbreviations(text: str) -> str:
    """Replace known abbreviations with expansions (word-boundary aware where needed)."""
    result = text
    # Sort by length descending so longer phrases are replaced first (e.g. "don't" before "n't")
    for abbr, exp in sorted(ABBREVIATIONS.items(), key=lambda x: -len(x[0])):
        # Word boundary: \b or spaces; also handle at start/end
        pattern = re.compile(r"\b" + re.escape(abbr) + r"\b", re.IGNORECASE)
        result = pattern.sub(exp, result)
    return result


def _emojis_to_text(text: str) -> str:
    """Convert emojis to short text descriptions."""
    if not HAS_EMOJI:
        return text
    return emoji.demojize(text, delimiters=(" ", " "), language="en")


def preprocess(
    text: str,
    remove_urls: bool = True,
    remove_mentions: bool = True,
    to_lower: bool = True,
    expand_emojis: bool = True,
    expand_abbreviations: bool = True,
    normalize_spaces: bool = True,
) -> str:
    """
    Preprocess raw text for sentiment analysis.
    Negations (not, no, never, etc.) are preserved by default (no removal).
    """
    if not text or not isinstance(text, str):
        return ""

    out = text.strip()

    if remove_urls:
        out = URL_PATTERN.sub(" ", out)
    if remove_mentions:
        out = MENTION_PATTERN.sub(" ", out)

    if expand_emojis:
        out = _emojis_to_text(out)
    if expand_abbreviations:
        out = _expand_abbreviations(out)

    if to_lower:
        out = out.lower()

    if normalize_spaces:
        out = SPACES_PATTERN.sub(" ", out).strip()

    return out
