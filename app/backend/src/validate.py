from typing import List
from pydantic import BaseModel, field_validator, ValidationError

ALLOWED_SENTENCE_TYPES = {
    "statement",
    "wh_question",
    "yes_no_question",
    "negation",
    "conditional",
    "command",
}

class ASLOutput(BaseModel):
    input_text: str
    sentence_type: str
    gloss_tokens: List[str]
    non_manual: List[str]
    confidence_note: str

    @field_validator("sentence_type")
    @classmethod
    def validate_sentence_type(cls, v: str) -> str:
        if v not in ALLOWED_SENTENCE_TYPES:
            raise ValueError(f"sentence_type must be one of {sorted(ALLOWED_SENTENCE_TYPES)}")
        return v

    @field_validator("gloss_tokens")
    @classmethod
    def validate_gloss_tokens(cls, v: List[str]) -> List[str]:
        if not isinstance(v, list):
            raise ValueError("gloss_tokens must be a list")
        for token in v:
            if not isinstance(token, str):
                raise ValueError("each gloss token must be a string")
        return v

    @field_validator("non_manual")
    @classmethod
    def validate_non_manual(cls, v: List[str]) -> List[str]:
        if not isinstance(v, list):
            raise ValueError("non_manual must be a list")
        for item in v:
            if not isinstance(item, str):
                raise ValueError("each non_manual item must be a string")
        return v


def validate_output(data: dict) -> ASLOutput:
    return ASLOutput(**data)