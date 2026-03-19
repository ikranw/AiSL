def map_to_signs(data: dict) -> dict:
    result = dict(data)
    result["sign_sequence"] = [
        {
            "token": token,
            "sign_id": token,
            "type": "sign"
        }
        for token in result.get("gloss_tokens", [])
    ]
    return result