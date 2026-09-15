import os
import json
import time

import pandas as pd
from dotenv import load_dotenv
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from google import genai


# ==========================================
# ENVIRONMENT
# ==========================================

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not GEMINI_API_KEY:
    raise RuntimeError("GEMINI_API_KEY is missing from .env")

client = genai.Client(api_key=GEMINI_API_KEY)


# ==========================================
# FASTAPI
# ==========================================

app = FastAPI(
    title="AI Product Intelligence Platform"
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==========================================
# HEALTH CHECK
# ==========================================

@app.get("/")
def home():
    return {
        "message": "AI Product Intelligence API is running"
    }


# ==========================================
# GEMINI AI CALL
# ==========================================

def call_ai(prompt):

    last_error = None

    for attempt in range(3):

        try:

            response = client.models.generate_content(
                model="gemini-3.5-flash-lite",
                contents=prompt
            )

            if not response or not response.text:
                raise Exception(
                    "Gemini returned an empty response"
                )

            return response.text

        except Exception as e:

            last_error = e

            print(
                f"Gemini attempt {attempt + 1}/3 failed: {e}"
            )

            if attempt < 2:
                time.sleep(3)

    raise Exception(
        f"Gemini request failed after 3 attempts: {last_error}"
    )


# ==========================================
# JSON CLEANER
# ==========================================

def clean_json_response(text):

    text = text.strip()

    if text.startswith("```json"):
        text = text[7:]

    elif text.startswith("```"):
        text = text[3:]

    if text.endswith("```"):
        text = text[:-3]

    text = text.strip()

    return json.loads(text)


# ==========================================
# AI ANALYSIS
# ==========================================

def analyze_feedback(feedback_items):

    # --------------------------------------
    # STEP 1 — CATEGORIZATION + SENTIMENT
    # --------------------------------------

    feedback_text = "\n".join(
        [
            f"{i + 1}. {item}"
            for i, item in enumerate(feedback_items)
        ]
    )

    prompt_1 = f"""
You are a senior product analyst.

Analyze the following customer feedback.

For EVERY feedback item return:

- text
- category
- sentiment
- summary

Allowed sentiment values:
Positive
Neutral
Negative

Use practical product categories such as:
Bug
Performance
Billing
UI/UX
Onboarding
Feature Request
Account
Notifications
Security
Other

Return ONLY valid JSON.

Format:

[
  {{
    "text": "...",
    "category": "...",
    "sentiment": "...",
    "summary": "..."
  }}
]

Customer feedback:

{feedback_text}
"""

    result_1 = call_ai(prompt_1)

    items = clean_json_response(result_1)


    # --------------------------------------
    # STEP 2 — THEME CLUSTERING
    # --------------------------------------

    categorized_text = json.dumps(
        items,
        ensure_ascii=False
    )

    prompt_2 = f"""
You are a senior product manager.

Group the following customer feedback into
the most important recurring product themes.

Return 3 to 6 themes.

For each theme return:

- theme_name
- description
- count
- dominant_sentiment
- example_quote

Return ONLY valid JSON.

Format:

[
  {{
    "theme_name": "...",
    "description": "...",
    "count": 5,
    "dominant_sentiment": "Negative",
    "example_quote": "..."
  }}
]

Feedback:

{categorized_text}
"""

    result_2 = call_ai(prompt_2)

    themes = clean_json_response(result_2)


    # --------------------------------------
    # STEP 3 — PRODUCT PRIORITIZATION
    # --------------------------------------

    themes_text = json.dumps(
        themes,
        ensure_ascii=False
    )

    prompt_3 = f"""
You are a senior product manager responsible
for product prioritization.

Based on these customer feedback themes,
rank the most important product improvements.

For every priority return:

- theme_name
- description
- priority
- impact
- effort
- recommendation
- rationale

Priority must be:
HIGH
MEDIUM
LOW

Impact must be:
High
Medium
Low

Effort must be:
High
Medium
Low

Return ONLY valid JSON.

Format:

[
  {{
    "theme_name": "...",
    "description": "...",
    "priority": "HIGH",
    "impact": "High",
    "effort": "Medium",
    "recommendation": "...",
    "rationale": "..."
  }}
]

Themes:

{themes_text}
"""

    result_3 = call_ai(prompt_3)

    priorities = clean_json_response(result_3)


    # --------------------------------------
    # STEP 4 — EXECUTIVE SUMMARY
    # --------------------------------------

    prompt_4 = f"""
You are a product leader.

Create a concise executive summary based on
the customer feedback analysis below.

Mention:

1. The most important customer problems.
2. The strongest recurring themes.
3. The most important product priorities.
4. What product leaders should focus on next.

Write 60 to 100 words.

Do NOT use bullet points.

Return ONLY the plain text summary.

Themes:

{json.dumps(themes, ensure_ascii=False)}

Priorities:

{json.dumps(priorities, ensure_ascii=False)}
"""

    executive_summary = call_ai(prompt_4).strip()


    # --------------------------------------
    # FINAL RESULT
    # --------------------------------------

    return {
        "items": items,
        "themes": themes,
        "priorities": priorities,
        "executive_summary": executive_summary
    }


# ==========================================
# ANALYZE CSV
# ==========================================

@app.post("/analyze")
async def analyze(file: UploadFile = File(...)):

    try:

        if not file.filename.lower().endswith(".csv"):
            raise HTTPException(
                status_code=400,
                detail="Please upload a CSV file."
            )

        contents = await file.read()

        temp_path = "/tmp/product_feedback.csv"

        with open(temp_path, "wb") as f:
            f.write(contents)

        df = pd.read_csv(temp_path)

        possible_columns = [
            "feedback",
            "text",
            "review",
            "comment",
            "message"
        ]

        feedback_column = None

        for column in possible_columns:

            if column in df.columns:
                feedback_column = column
                break

        if feedback_column is None:

            raise HTTPException(
                status_code=400,
                detail=(
                    "CSV must contain one of these columns: "
                    "feedback, text, review, comment, message"
                )
            )

        feedback_items = (
            df[feedback_column]
            .dropna()
            .astype(str)
            .tolist()
        )

        if not feedback_items:

            raise HTTPException(
                status_code=400,
                detail="No feedback found in the CSV."
            )

        # Keep AI request manageable
        feedback_items = feedback_items[:100]

        analysis = analyze_feedback(
            feedback_items
        )

        return {
            "filename": file.filename,
            "total_feedback": len(feedback_items),
            "items": analysis["items"],
            "themes": analysis["themes"],
            "priorities": analysis["priorities"],
            "executive_summary": analysis[
                "executive_summary"
            ]
        }

    except HTTPException:
        raise

    except Exception as e:

        print(
            f"ANALYZE ERROR: {type(e).__name__}: {e}"
        )

        raise HTTPException(
            status_code=502,
            detail=f"AI request failed: {e}"
        )