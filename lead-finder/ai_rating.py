"""Ask Claude to look at a site's screenshots and rate the design like a web designer."""

import base64
import json

import anthropic

MODEL = "claude-opus-5"

PROMPT = """You are a senior web designer judging a small business website from two screenshots:
the first screen on a laptop, then the first screen on an iPhone.

Judge only what a customer would notice: is it attractive, modern, easy to read, trustworthy,
and obvious what to do next (call, book, buy)? Ignore anything you can't see.

Website: {url}

Score each area from 1 (very poor) to 10 (excellent). Then list up to 3 problems in plain,
non-technical words a business owner would understand, and write one friendly sentence I could put
in a cold email that mentions the single biggest visual problem without being insulting."""

SCHEMA = {
    "type": "object",
    "properties": {
        "overall": {"type": "integer", "description": "Overall visual quality, 1-10"},
        "modern": {"type": "integer", "description": "1 = looks 15 years old, 10 = current design"},
        "mobile": {"type": "integer", "description": "How good the phone view looks and works, 1-10"},
        "trust": {"type": "integer", "description": "Does it look professional and trustworthy, 1-10"},
        "clarity": {"type": "integer", "description": "Is it obvious what they offer and what to do next, 1-10"},
        "problems": {"type": "array", "items": {"type": "string"}},
        "pitch_line": {"type": "string"},
    },
    "required": ["overall", "modern", "mobile", "trust", "clarity", "problems", "pitch_line"],
    "additionalProperties": False,
}


def _image_block(path):
    with open(path, "rb") as f:
        data = base64.standard_b64encode(f.read()).decode("utf-8")
    return {"type": "image", "source": {"type": "base64", "media_type": "image/jpeg", "data": data}}


class DesignRater:
    def __init__(self):
        self.client = anthropic.Anthropic()

    def rate(self, desktop_shot, mobile_shot, url):
        try:
            response = self.client.messages.create(
                model=MODEL,
                max_tokens=4000,
                output_config={"effort": "low", "format": {"type": "json_schema", "schema": SCHEMA}},
                messages=[{
                    "role": "user",
                    "content": [
                        _image_block(desktop_shot),
                        _image_block(mobile_shot),
                        {"type": "text", "text": PROMPT.format(url=url)},
                    ],
                }],
            )
        except anthropic.AuthenticationError:
            print("  ! Claude rating skipped: the API key was rejected.")
            return None
        except anthropic.RateLimitError:
            print("  ! Claude rating skipped: rate limited. Try again later or run with fewer sites.")
            return None
        except anthropic.APIStatusError as e:
            print(f"  ! Claude rating skipped: API error {e.status_code}.")
            return None
        except anthropic.APIConnectionError:
            print("  ! Claude rating skipped: couldn't reach the API.")
            return None

        if response.stop_reason != "end_turn":
            return None
        text = next((b.text for b in response.content if b.type == "text"), "")
        try:
            rating = json.loads(text)
        except json.JSONDecodeError:
            return None
        for k in ("overall", "modern", "mobile", "trust", "clarity"):
            rating[k] = max(1, min(10, int(rating[k])))
        return rating
