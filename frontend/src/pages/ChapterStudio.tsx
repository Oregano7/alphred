// src/pages/ChapterStudio.tsx
import {JSX, useEffect, useState} from "react";
import {Button} from "../components/ui/button";
import {Card, CardContent} from "../components/ui/card";
import {Textarea} from "../components/ui/textarea";
import {Input} from "../components/ui/input";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "../components/ui/tabs";

interface Character {
    id: string;
    name: string;
    role: string;
    notes: string;
}

interface Event {
    id: string;
    title: string;
    timestamp: string;
    description: string;
}

interface LoreItem {
    id: string;
    term: string;
    meaning: string;
}

interface ChapterMeta {
    id: string;
    summary: string;
    tone: string;
    pov: string;
}

function uuid() {
    return crypto.randomUUID();
}

export default function ChapterStudio() {
    const [summary, setSummary] = useState("");
    const [tone, setTone] = useState("");
    const [pov, setPOV] = useState("");
    const [wordCount, setWordCount] = useState("");
    const [mustInclude, setMustInclude] = useState("");
    const [variants, setVariants] = useState<string[]>([]);
    const [selectedVariant, setSelectedVariant] = useState<string>("");
    const [editedText, setEditedText] = useState<string>("");
    const [chapterId, setChapterId] = useState<string>("");
    const [allChapters, setAllChapters] = useState<ChapterMeta[]>([]);
    const [loading, setLoading] = useState<boolean>(false);

    const [characters, setCharacters] = useState<Character[]>([]);
    const [timeline, setTimeline] = useState<Event[]>([]);
    const [glossary, setGlossary] = useState<LoreItem[]>([]);

    const [newCharacter, setNewCharacter] = useState({name: "", role: "", notes: ""});
    const [newEvent, setNewEvent] = useState({title: "", timestamp: "", description: ""});
    const [newGlossary, setNewGlossary] = useState({term: "", meaning: ""});

    const [editingCharId, setEditingCharId] = useState<string | null>(null);
    const [editingEventId, setEditingEventId] = useState<string | null>(null);
    const [editingGlossaryId, setEditingGlossaryId] = useState<string | null>(null);


    useEffect(() => {
        fetch("http://localhost:8000/characters").then(res => res.json()).then(setCharacters);
        fetch("http://localhost:8000/timeline").then(res => res.json()).then(setTimeline);
        fetch("http://localhost:8000/glossary").then(res => res.json()).then(setGlossary);
        fetch("http://localhost:8000/all").then(res => res.json()).then(setAllChapters);
    }, []);

    const putAndRefresh = async (url: string, body: any, refresh: () => void) => {
        await fetch(url, {
            method: "PUT",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify(body),
        });
        refresh();
    };

    const deleteAndRefresh = async (url: string, id: string, refresh: () => void) => {
        await fetch(`${url}/${id}`, {method: "DELETE"});
        refresh();
    };

    const postAndRefresh = async (url: string, body: any, refresh: () => void) => {
        await fetch(url, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify(body),
        });
        refresh();
    };

    const handleSubmit = async () => {
        setLoading(true);
        const res = await fetch("http://localhost:8000/generate", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({summary, tone, pov, word_count: wordCount, must_include: mustInclude}),
        });
        const data = await res.json();
        setVariants(data.variants);
        setChapterId(data.id);
        setLoading(false);
    };

    const handleSelect = async (variant: string) => {
        setSelectedVariant(variant);
        setEditedText(variant);
        await fetch("http://localhost:8000/select", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({chapter_id: chapterId, variant_text: variant}),
        });
    };

    const handleSaveEdit = async () => {
        await fetch("http://localhost:8000/edit", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({chapter_id: chapterId, edited_text: editedText}),
        });
        alert("Saved!");
    };

    const loadChapter = async (id: string) => {
        const res = await fetch(`http://localhost:8000/chapter/${id}`);
        const data = await res.json();
        setVariants(data.variants);
        setChapterId(id);
        setSelectedVariant("");
        setEditedText("");
    };

    const [modalContent, setModalContent] = useState<string | null>(null);
    const [showModal, setShowModal] = useState(false);

    const cleanWord = (word: string) => word.replace(/[.,;:!?()"']/g, "").toLowerCase();

    function highlightGlossaryTerms(text: string): JSX.Element {
        const words = text.split(/\s+/);

        return (
            <>
                {words.map((word, i) => {
                    const cleaned = cleanWord(word);
                    const found = glossary.find(g => cleanWord(g.term) === cleaned);
                    if (found) {
                        return (
                            <span
                                key={i}
                                className="cursor-pointer text-yellow-300 underline"
                                onClick={() => {
                                    setModalContent(found.meaning);
                                    setShowModal(true);
                                }}
                            >
                {word}{" "}
              </span>
                        );
                    }
                    return <span key={i}>{word} </span>;
                })}
            </>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
            {/* LEFT PANEL */}
            <div className="col-span-1 space-y-4">
                <Card>
                    <CardContent className="p-4 space-y-2">
                        <h2 className="text-lg font-semibold">Prompt Next Chapter</h2>
                        <Textarea placeholder="Chapter Summary" value={summary}
                                  onChange={(e) => setSummary(e.target.value)}/>
                        <Input placeholder="Tone (e.g., dark, poetic)" value={tone}
                               onChange={(e) => setTone(e.target.value)}/>
                        <Input placeholder="Point of View (e.g., Vyomketu, Selene)" value={pov}
                               onChange={(e) => setPOV(e.target.value)}/>
                        <Input placeholder="Word Count Preference (e.g., 1200)" value={wordCount}
                               onChange={(e) => setWordCount(e.target.value)}/>
                        <Textarea placeholder="Must-Include Scenes or Dialogues" value={mustInclude}
                                  onChange={(e) => setMustInclude(e.target.value)}/>
                        <Button onClick={handleSubmit} disabled={loading}>
                            {loading ? "Generating..." : "Generate Variants"}
                        </Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4 space-y-2">
                        <h2 className="text-lg font-semibold">Previous Chapters</h2>
                        {allChapters.length === 0 ? (
                            <div className="text-gray-400">No chapters yet</div>
                        ) : (
                            <div className="space-y-2 max-h-96 overflow-y-auto">
                                {allChapters.map((ch) => (
                                    <div
                                        key={ch.id}
                                        onClick={() => loadChapter(ch.id)}
                                        className="cursor-pointer border p-2 rounded bg-gray-700 text-white hover:bg-gray-600"
                                    >
                                        <div className="font-semibold">{ch.pov} - {ch.tone}</div>
                                        <div className="text-sm text-gray-300">{ch.summary.slice(0, 60)}...</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* RIGHT PANEL */}
            <div className="col-span-3 space-y-4">
                <Tabs defaultValue="chapter1">
                    <TabsList>
                        <TabsTrigger value="chapter1">Current Material</TabsTrigger>
                        <TabsTrigger value="characters">Characters</TabsTrigger>
                        <TabsTrigger value="timeline">Timeline</TabsTrigger>
                        <TabsTrigger value="lore">Lore & Yantras</TabsTrigger>
                    </TabsList>

                    <TabsContent value="chapter1">
                        <Card>
                            <CardContent className="p-4 space-y-4">
                                {variants.length === 0 ? (
                                    <div className="text-gray-400">No variants loaded</div>
                                ) : (
                                    <div className="space-y-2">
                                        {variants.map((v, i) => (
                                            <div key={i} className="border p-2 rounded bg-gray-800 text-white">
                                                <label className="flex items-start gap-2">
                                                    <input
                                                        type="radio"
                                                        name="variant"
                                                        value={v}
                                                        checked={selectedVariant === v}
                                                        onChange={() => handleSelect(v)}
                                                    />
                                                    <div>
                                                        <strong>Variant {i + 1}:</strong>
                                                        <p>{v}</p>
                                                    </div>
                                                </label>
                                            </div>
                                        ))}
                                        {selectedVariant && (
                                            <div className="mt-4">
                                                <h3 className="text-md font-semibold mb-1">Preview with Glossary
                                                    Links:</h3>
                                                <div
                                                    className="p-4 border rounded bg-gray-900 text-white max-h-96 overflow-y-auto leading-relaxed">
                                                    {highlightGlossaryTerms(selectedVariant)}
                                                </div>
                                            </div>
                                        )}

                                        {selectedVariant && (
                                            <div className="mt-4">
                                                <h3 className="text-md font-semibold mb-2">Edit Selected Variant:</h3>
                                                <Textarea rows={8} value={editedText}
                                                          onChange={(e) => setEditedText(e.target.value)}/>
                                                <Button className="mt-2" onClick={handleSaveEdit}>Save Final
                                                    Version</Button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                    <TabsContent value="characters">
                        <Card><CardContent className="space-y-2">
                            {characters.map((char) => (
                                <div key={char.id} className="p-2 border">
                                    {editingCharId === char.id ? (
                                        <>
                                            <Input value={char.name}
                                                   onChange={(e) => setCharacters(c => c.map(cc => cc.id === char.id ? {
                                                       ...cc,
                                                       name: e.target.value
                                                   } : cc))}/>
                                            <Input value={char.role}
                                                   onChange={(e) => setCharacters(c => c.map(cc => cc.id === char.id ? {
                                                       ...cc,
                                                       role: e.target.value
                                                   } : cc))}/>
                                            <Textarea value={char.notes}
                                                      onChange={(e) => setCharacters(c => c.map(cc => cc.id === char.id ? {
                                                          ...cc,
                                                          notes: e.target.value
                                                      } : cc))}/>
                                            <Button onClick={async () => {
                                                await putAndRefresh(`http://localhost:8000/characters/${char.id}`, char, () => fetch("http://localhost:8000/characters").then(res => res.json()).then(setCharacters));
                                                setEditingCharId(null);
                                            }}>Save</Button>
                                            <Button onClick={() => setEditingCharId(null)}>Cancel</Button>
                                        </>
                                    ) : (
                                        <>
                                            <div className="font-bold">{char.name}</div>
                                            <div>{char.role}</div>
                                            <div>{char.notes}</div>
                                            <Button onClick={() => setEditingCharId(char.id)}>Edit</Button>
                                            <Button
                                                onClick={() => deleteAndRefresh("http://localhost:8000/characters", char.id, () => fetch("http://localhost:8000/characters").then(res => res.json()).then(setCharacters))}>Delete</Button>
                                        </>
                                    )}
                                </div>
                            ))}
                            <Input placeholder="Name" value={newCharacter.name}
                                   onChange={(e) => setNewCharacter({...newCharacter, name: e.target.value})}/>
                            <Input placeholder="Role" value={newCharacter.role}
                                   onChange={(e) => setNewCharacter({...newCharacter, role: e.target.value})}/>
                            <Textarea placeholder="Notes" value={newCharacter.notes}
                                      onChange={(e) => setNewCharacter({...newCharacter, notes: e.target.value})}/>
                            <Button
                                onClick={() => postAndRefresh("http://localhost:8000/characters", {id: uuid(), ...newCharacter}, () => fetch("http://localhost:8000/characters").then(res => res.json()).then(setCharacters))}>Add
                                Character</Button>
                        </CardContent></Card>
                    </TabsContent>

                    <TabsContent value="timeline">
                        <Card><CardContent className="space-y-2">
                            {timeline.map((e) => (
                                <div key={e.id} className="p-2 border">
                                    {editingEventId === e.id ? (
                                        <>
                                            <Input value={e.title}
                                                   onChange={(ev) => setTimeline(t => t.map(te => te.id === e.id ? {
                                                       ...te,
                                                       title: ev.target.value
                                                   } : te))}/>
                                            <Input value={e.timestamp}
                                                   onChange={(ev) => setTimeline(t => t.map(te => te.id === e.id ? {
                                                       ...te,
                                                       timestamp: ev.target.value
                                                   } : te))}/>
                                            <Textarea value={e.description}
                                                      onChange={(ev) => setTimeline(t => t.map(te => te.id === e.id ? {
                                                          ...te,
                                                          description: ev.target.value
                                                      } : te))}/>
                                            <Button onClick={async () => {
                                                await putAndRefresh(`http://localhost:8000/timeline/${e.id}`, e, () => fetch("http://localhost:8000/timeline").then(res => res.json()).then(setTimeline));
                                                setEditingEventId(null);
                                            }}>Save</Button>
                                            <Button onClick={() => setEditingEventId(null)}>Cancel</Button>
                                        </>
                                    ) : (
                                        <>
                                            <div className="font-bold">{e.title}</div>
                                            <div>{e.timestamp}</div>
                                            <div>{e.description}</div>
                                            <Button onClick={() => setEditingEventId(e.id)}>Edit</Button>
                                            <Button
                                                onClick={() => deleteAndRefresh("http://localhost:8000/timeline", e.id, () => fetch("http://localhost:8000/timeline").then(res => res.json()).then(setTimeline))}>Delete</Button>
                                        </>
                                    )}
                                </div>
                            ))}
                            <Input placeholder="Title" value={newEvent.title}
                                   onChange={(e) => setNewEvent({...newEvent, title: e.target.value})}/>
                            <Input placeholder="Timestamp" value={newEvent.timestamp}
                                   onChange={(e) => setNewEvent({...newEvent, timestamp: e.target.value})}/>
                            <Textarea placeholder="Description" value={newEvent.description}
                                      onChange={(e) => setNewEvent({...newEvent, description: e.target.value})}/>
                            <Button
                                onClick={() => postAndRefresh("http://localhost:8000/timeline", {id: uuid(), ...newEvent}, () => fetch("http://localhost:8000/timeline").then(res => res.json()).then(setTimeline))}>Add
                                Event</Button>
                        </CardContent></Card>
                    </TabsContent>

                    <TabsContent value="lore">
                        <Card><CardContent className="space-y-2">
                            {glossary.map((g) => (
                                <div key={g.id} className="p-2 border">
                                    {editingGlossaryId === g.id ? (
                                        <>
                                            <Input value={g.term}
                                                   onChange={(e) => setGlossary(l => l.map(li => li.id === g.id ? {
                                                       ...li,
                                                       term: e.target.value
                                                   } : li))}/>
                                            <Textarea value={g.meaning}
                                                      onChange={(e) => setGlossary(l => l.map(li => li.id === g.id ? {
                                                          ...li,
                                                          meaning: e.target.value
                                                      } : li))}/>
                                            <Button onClick={async () => {
                                                await putAndRefresh(`http://localhost:8000/glossary/${g.id}`, g, () => fetch("http://localhost:8000/glossary").then(res => res.json()).then(setGlossary));
                                                setEditingGlossaryId(null);
                                            }}>Save</Button>
                                            <Button onClick={() => setEditingGlossaryId(null)}>Cancel</Button>
                                        </>
                                    ) : (
                                        <>
                                            <div className="font-bold">{g.term}</div>
                                            <div>{g.meaning}</div>
                                            <Button onClick={() => setEditingGlossaryId(g.id)}>Edit</Button>
                                            <Button
                                                onClick={() => deleteAndRefresh("http://localhost:8000/glossary", g.id, () => fetch("http://localhost:8000/glossary").then(res => res.json()).then(setGlossary))}>Delete</Button>
                                        </>
                                    )}
                                </div>
                            ))}
                            <Input placeholder="Term" value={newGlossary.term}
                                   onChange={(e) => setNewGlossary({...newGlossary, term: e.target.value})}/>
                            <Textarea placeholder="Meaning" value={newGlossary.meaning}
                                      onChange={(e) => setNewGlossary({...newGlossary, meaning: e.target.value})}/>
                            <Button
                                onClick={() => postAndRefresh("http://localhost:8000/glossary", {id: uuid(), ...newGlossary}, () => fetch("http://localhost:8000/glossary").then(res => res.json()).then(setGlossary))}>Add
                                Term</Button>

                            <div className="mt-4">
                                <Input placeholder="Term" value={newGlossary.term}
                                       onChange={(e) => setNewGlossary({...newGlossary, term: e.target.value})}/>
                                <Textarea placeholder="Meaning" value={newGlossary.meaning}
                                          onChange={(e) => setNewGlossary({...newGlossary, meaning: e.target.value})}/>
                                <Button
                                    onClick={() => postAndRefresh("http://localhost:8000/glossary", {id: uuid(), ...newGlossary}, () => {
                                        fetch("http://localhost:8000/glossary").then(res => res.json()).then(setGlossary);
                                        setNewGlossary({term: "", meaning: ""});
                                    })}>Add Term</Button>
                            </div>
                        </CardContent></Card>
                    </TabsContent>
                </Tabs>
            </div>
            {showModal && modalContent && (
                <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
                    <div className="bg-white text-black p-6 rounded-lg max-w-md relative shadow-lg">
                        <button
                            onClick={() => setShowModal(false)}
                            className="absolute top-2 right-3 text-gray-600 hover:text-black"
                        >
                            ×
                        </button>
                        <h3 className="text-lg font-semibold mb-2">Glossary Meaning</h3>
                        <p className="whitespace-pre-wrap">{modalContent}</p>
                    </div>
                </div>
            )}

        </div>
    );
}