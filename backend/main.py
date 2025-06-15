# backend/main.py
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
import sqlite3
import uuid
import openai
import os

app = FastAPI()

# Allow frontend to call backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# SQLite DB setup
db = sqlite3.connect("book_writer.db", check_same_thread=False)
cursor = db.cursor()

cursor.execute('''
CREATE TABLE IF NOT EXISTS chapters (
    id TEXT PRIMARY KEY,
    summary TEXT,
    tone TEXT,
    pov TEXT,
    word_count TEXT,
    must_include TEXT,
    generated_variants TEXT,
    selected_variant TEXT,
    edited_text TEXT
)
''')

cursor.execute('''
CREATE TABLE IF NOT EXISTS characters (
  id TEXT PRIMARY KEY,
  name TEXT,
  role TEXT,
  notes TEXT
)
''')

cursor.execute('''
CREATE TABLE IF NOT EXISTS timeline (
  id TEXT PRIMARY KEY,
  title TEXT,
  timestamp TEXT,
  description TEXT
)
''')

cursor.execute('''
CREATE TABLE IF NOT EXISTS glossary (
  id TEXT PRIMARY KEY,
  term TEXT,
  meaning TEXT
)
''')

db.commit()

openai.api_key = os.getenv("OPENAI_API_KEY")

class ChapterRequest(BaseModel):
    summary: str
    tone: str
    pov: str
    word_count: str
    must_include: str

class ChapterResponse(BaseModel):
    id: str
    variants: List[str]

class SelectVariantRequest(BaseModel):
    chapter_id: str
    variant_text: str

class EditVariantRequest(BaseModel):
    chapter_id: str
    edited_text: str

class ChapterMetadata(BaseModel):
    id: str
    summary: str
    tone: str
    pov: str

class Character(BaseModel):
    id: str
    name: str
    role: str
    notes: str

class TimelineEvent(BaseModel):
    id: str
    title: str
    timestamp: str
    description: str

class GlossaryItem(BaseModel):
    id: str
    term: str
    meaning: str


def generate_variants(chapter: ChapterRequest) -> List[str]:
    # Fetch world context from DB
    cursor.execute("SELECT name, role, notes FROM characters")
    characters = cursor.fetchall()

    cursor.execute("SELECT title, timestamp, description FROM timeline ORDER BY rowid DESC LIMIT 5")
    timeline = cursor.fetchall()

    cursor.execute("SELECT term, meaning FROM glossary")
    glossary = cursor.fetchall()

    # Format the data into readable blocks
    characters_text = "\n".join([f"- {name} ({role}): {notes}" for name, role, notes in characters])
    timeline_text = "\n".join([f"- [{timestamp}] {title}: {description}" for title, timestamp, description in timeline])
    glossary_text = "\n".join([f"- {term}: {meaning}" for term, meaning in glossary])

    # Construct the enhanced prompt
    prompt = f"""
You are a master dark fantasy author writing the next chapter of a novel.

World Context:
Characters:
{characters_text or 'None'}

Timeline of Key Events:
{timeline_text or 'None'}

Glossary of Lore Terms:
{glossary_text or 'None'}

Now, write three creative variants for the next chapter based on the following:

Summary: {chapter.summary}
Tone: {chapter.tone}
Point of View: {chapter.pov}
Target Word Count: {chapter.word_count}
Must Include: {chapter.must_include}
Each variant should be clearly marked and written in prose.
"""

    try:
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are an expert dark fantasy author."},
                {"role": "user", "content": prompt},
            ],
            max_tokens=2000,
            temperature=0.8,
        )
        content = response.choices[0].message.content
        variants = [v.strip() for v in content.split("Variant") if v.strip()]
        return variants[:3] if len(variants) >= 3 else variants
    except Exception as e:
        print("OpenAI error:", e)
        raise HTTPException(status_code=500, detail="LLM generation failed")


@app.post("/generate", response_model=ChapterResponse)
def generate_chapter(chapter: ChapterRequest):
    chapter_id = str(uuid.uuid4())
    variants = generate_variants(chapter)

    cursor.execute('''
        INSERT INTO chapters (id, summary, tone, pov, word_count, must_include, generated_variants, selected_variant, edited_text)
        VALUES (?, ?, ?, ?, ?, ?, ?, '', '')
    ''', (
        chapter_id,
        chapter.summary,
        chapter.tone,
        chapter.pov,
        chapter.word_count,
        chapter.must_include,
        "\n\n".join(variants)
    ))
    db.commit()

    return ChapterResponse(id=chapter_id, variants=variants)

@app.get("/chapter/{chapter_id}", response_model=ChapterResponse)
def get_chapter(chapter_id: str):
    cursor.execute("SELECT generated_variants FROM chapters WHERE id = ?", (chapter_id,))
    result = cursor.fetchone()
    if not result:
        raise HTTPException(status_code=404, detail="Chapter not found")
    variants = result[0].split("\n\n")
    return ChapterResponse(id=chapter_id, variants=variants)

@app.post("/select")
def select_variant(data: SelectVariantRequest):
    cursor.execute("UPDATE chapters SET selected_variant = ? WHERE id = ?", (data.variant_text, data.chapter_id))
    db.commit()
    return {"message": "Variant selected successfully."}

@app.post("/edit")
def save_edited_variant(data: EditVariantRequest):
    cursor.execute("UPDATE chapters SET edited_text = ? WHERE id = ?", (data.edited_text, data.chapter_id))
    db.commit()
    return {"message": "Edited text saved."}

@app.get("/all", response_model=List[ChapterMetadata])
def list_chapters():
    cursor.execute("SELECT id, summary, tone, pov FROM chapters ORDER BY rowid DESC")
    rows = cursor.fetchall()
    return [ChapterMetadata(id=row[0], summary=row[1], tone=row[2], pov=row[3]) for row in rows]

@app.put("/characters/{char_id}")
def update_character(char_id: str, character: Character):
    cursor.execute("UPDATE characters SET name = ?, role = ?, notes = ? WHERE id = ?", (character.name, character.role, character.notes, char_id))
    db.commit()
    return {"message": "Character updated."}

@app.put("/timeline/{event_id}")
def update_timeline_event(event_id: str, event: TimelineEvent):
    cursor.execute("UPDATE timeline SET title = ?, timestamp = ?, description = ? WHERE id = ?", (event.title, event.timestamp, event.description, event_id))
    db.commit()
    return {"message": "Event updated."}

@app.put("/glossary/{item_id}")
def update_glossary_term(item_id: str, item: GlossaryItem):
    cursor.execute("UPDATE glossary SET term = ?, meaning = ? WHERE id = ?", (item.term, item.meaning, item_id))
    db.commit()
    return {"message": "Glossary item updated."}

@app.get("/characters", response_model=List[Character])
def get_characters():
    with db:
        cursor = db.cursor()
        cursor.execute("SELECT id, name, role, notes FROM characters")
        rows = cursor.fetchall()
    return [Character(id=row[0], name=row[1], role=row[2], notes=row[3]) for row in rows]


@app.get("/timeline", response_model=List[TimelineEvent])
def get_timeline():
    with db:
        cursor = db.cursor()
        cursor.execute("SELECT id, title, timestamp, description FROM timeline")
        rows = cursor.fetchall()
    return [TimelineEvent(id=row[0], title=row[1], timestamp=row[2], description=row[3]) for row in rows]


@app.get("/glossary", response_model=List[GlossaryItem])
def get_glossary():
    with db:
        cursor = db.cursor()
        cursor.execute("SELECT id, term, meaning FROM glossary")
        rows = cursor.fetchall()
    return [GlossaryItem(id=row[0], term=row[1], meaning=row[2]) for row in rows]
