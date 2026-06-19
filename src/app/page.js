"use client";

import { useState, useEffect, useRef } from 'react';

// Main App Component
export default function Home() {
    // State
    const [rawStream, setRawStream] = useState([]);
    const [masterLog, setMasterLog] = useState([]);
    const [anchors, setAnchors] = useState([]);
    const [briefings, setBriefings] = useState([]);

    // Loading state for hydration
    const [mounted, setMounted] = useState(false);
    const [showIntro, setShowIntro] = useState(false);

    // Modals visibility
    const [activeModal, setActiveModal] = useState(null); // 'panic', 'review', 'anchor', 'briefing', 'search'
    const [settingsOpen, setSettingsOpen] = useState(false);

    // Form states
    const [streamInput, setStreamInput] = useState("");
    const [anchorInput, setAnchorInput] = useState("");
    const [briefingWhere, setBriefingWhere] = useState("");
    const [briefingWho, setBriefingWho] = useState("");
    const [briefingWhat, setBriefingWhat] = useState("");
    const [reviewSummary, setReviewSummary] = useState("");
    const [searchInput, setSearchInput] = useState("");

    // Refs
    const fileInputRef = useRef(null);
    const importInputRef = useRef(null);
    const streamListRef = useRef(null);

    // Load state from localStorage on mount
    useEffect(() => {
        setRawStream(JSON.parse(localStorage.getItem('mizuta_stream')) || []);
        setMasterLog(JSON.parse(localStorage.getItem('mizuta_master')) || []);
        setAnchors(JSON.parse(localStorage.getItem('mizuta_anchors')) || []);
        setBriefings(JSON.parse(localStorage.getItem('mizuta_briefings')) || []);
        
        if (!localStorage.getItem('mizuta_intro_seen')) {
            setShowIntro(true);
        }

        setMounted(true);
    }, []);

    // Save state when it changes
    useEffect(() => {
        if (!mounted) return;
        try {
            localStorage.setItem('mizuta_stream', JSON.stringify(rawStream));
            localStorage.setItem('mizuta_master', JSON.stringify(masterLog));
            localStorage.setItem('mizuta_anchors', JSON.stringify(anchors));
            localStorage.setItem('mizuta_briefings', JSON.stringify(briefings));
        } catch (e) {
            console.error(e);
            alert("Storage Quota Exceeded! Your device doesn't have enough local storage left. Please perform a Nightly Review to clear out your daily stream.");
        }
    }, [rawStream, masterLog, anchors, briefings, mounted]);

    // Auto-scroll stream to top when new entry is added
    useEffect(() => {
        if (streamListRef.current) {
            streamListRef.current.scrollTop = 0;
        }
    }, [rawStream.length]);

    const closeIntro = () => {
        localStorage.setItem('mizuta_intro_seen', 'true');
        setShowIntro(false);
    };

    // Utilities
    const getTimestamp = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const getDateString = () => new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    // Data Management
    const exportData = () => {
        const data = { stream: rawStream, master: masterLog, anchors: anchors, briefings: briefings };
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", `mizuta_backup_${new Date().toISOString().split('T')[0]}.json`);
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    };

    const handleImport = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (evt) => {
                try {
                    const data = JSON.parse(evt.target.result);
                    if (data.stream) setRawStream(data.stream);
                    if (data.master) setMasterLog(data.master);
                    if (data.anchors) setAnchors(data.anchors);
                    if (data.briefings) setBriefings(data.briefings);
                    alert("Data successfully imported!");
                } catch (err) {
                    alert("Invalid backup file.");
                }
            };
            reader.readAsText(file);
        }
        e.target.value = '';
    };

    // Actions
    const addStreamEntry = (text, image = null) => {
        if (!text.trim() && !image) return;
        const newEntry = { id: Date.now(), time: getTimestamp(), text, image, isHighlighted: false };
        setRawStream(prev => [...prev, newEntry]);
        setStreamInput("");
    };

    const addAnchor = () => {
        if (!anchorInput.trim()) return;
        setAnchors(prev => [...prev, { id: Date.now(), time: getTimestamp(), text: anchorInput }]);
        setAnchorInput("");
        setActiveModal(null);
    };

    const removeAnchor = (id) => setAnchors(prev => prev.filter(a => a.id !== id));

    const addBriefing = () => {
        if (!briefingWhere.trim() && !briefingWho.trim() && !briefingWhat.trim()) return;
        setBriefings(prev => [...prev, { id: Date.now(), time: getTimestamp(), where: briefingWhere, who: briefingWho, what: briefingWhat }]);
        setBriefingWhere("");
        setBriefingWho("");
        setBriefingWhat("");
        setActiveModal(null);
    };

    const removeBriefing = (id) => setBriefings(prev => prev.filter(b => b.id !== id));

    const toggleHighlight = (id) => {
        setRawStream(prev => prev.map(entry => entry.id === id ? { ...entry, isHighlighted: !entry.isHighlighted } : entry));
    };

    const saveMasterLog = () => {
        if (!reviewSummary.trim()) {
            alert("Methodology Rule: You must actively type a summary of the highlighted events to commit them to long-term memory.");
            return;
        }
        const highlightedEntries = rawStream.filter(e => e.isHighlighted);
        const log = { id: Date.now(), date: getDateString(), text: reviewSummary, highlights: highlightedEntries };
        setMasterLog(prev => [...prev, log]);
        setRawStream([]); // Clear stream
        setReviewSummary("");
        setActiveModal(null);
    };

    // Camera Capture
    const handleCameraCapture = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (evt) => {
                const img = new window.Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const MAX_WIDTH = 800;
                    const MAX_HEIGHT = 800;
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > MAX_WIDTH) {
                            height *= MAX_WIDTH / width;
                            width = MAX_WIDTH;
                        }
                    } else {
                        if (height > MAX_HEIGHT) {
                            width *= MAX_HEIGHT / height;
                            height = MAX_HEIGHT;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    
                    // Compress to 60% quality JPEG to drastically save storage
                    const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
                    addStreamEntry('[Photo Capture]', dataUrl);
                };
                img.src = evt.target.result;
            };
            reader.readAsDataURL(file);
            e.target.value = '';
        }
    };

    // Dictation
    const [isDictating, setIsDictating] = useState(false);
    const [isSearchDictating, setIsSearchDictating] = useState(false);

    const startDictation = (target) => {
        if (!('webkitSpeechRecognition' in window)) {
            alert("Speech recognition not supported in this browser.");
            return;
        }
        const recognition = new window.webkitSpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        let finalTranscript = '';

        recognition.onstart = () => target === 'search' ? setIsSearchDictating(true) : setIsDictating(true);
        recognition.onresult = (event) => {
            let interimTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) finalTranscript += event.results[i][0].transcript;
                else interimTranscript += event.results[i][0].transcript;
            }
            if (target === 'search') setSearchInput(finalTranscript + interimTranscript);
            else setStreamInput(finalTranscript + interimTranscript);
        };
        recognition.onend = () => {
            target === 'search' ? setIsSearchDictating(false) : setIsDictating(false);
            if (target === 'stream' && finalTranscript.trim()) {
                addStreamEntry(finalTranscript.trim());
                setStreamInput("");
            }
        };
        try { recognition.start(); } catch (e) { console.error(e); }
    };

    // Search Filtering
    const searchQ = searchInput.trim().toLowerCase();
    const filteredMaster = searchQ ? masterLog.filter(l => l.text.toLowerCase().includes(searchQ)) : masterLog;
    const filteredRaw = searchQ ? rawStream.filter(e => e.text.toLowerCase().includes(searchQ)) : rawStream;

    const highlightText = (text, q) => {
        if (!q) return text;
        const parts = text.split(new RegExp(`(${q})`, 'gi'));
        return <span>{parts.map((p, i) => p.toLowerCase() === q.toLowerCase() ? <span key={i} className="search-highlight">{p}</span> : p)}</span>;
    };

    if (!mounted) return null; // Avoid SSR hydration mismatch

    return (
        <>
            <header className="top-bar">
                <h1>Mizuta Memory Stream</h1>
                <div className="actions">
                    <div style={{position: 'relative', display: 'inline-block'}}>
                        <button className="btn btn-secondary" onClick={() => setSettingsOpen(!settingsOpen)}>🧠 Memory ▼</button>
                        {settingsOpen && (
                            <div className="dropdown-menu" style={{position: 'absolute', top: '100%', right: 0, backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.5rem', zIndex: 100, display: 'flex', flexDirection: 'column', gap: '0.5rem', minWidth: '120px', boxShadow: '0 4px 6px rgba(0,0,0,0.3)', marginTop: '0.5rem'}}>
                                <button className="btn btn-secondary btn-small" onClick={() => { exportData(); setSettingsOpen(false); }} title="Backup Data to File" style={{width: '100%'}}>Backup</button>
                                <button className="btn btn-secondary btn-small" onClick={() => { importInputRef.current?.click(); setSettingsOpen(false); }} title="Restore Data from File" style={{width: '100%'}}>Restore</button>
                            </div>
                        )}
                    </div>
                    <input type="file" accept=".json" ref={importInputRef} onChange={handleImport} className="hidden" />
                    
                    <button className="btn btn-panic" onClick={() => setActiveModal('panic')}>PANIC</button>
                    <button className="btn btn-secondary" onClick={() => setActiveModal('search')}>Search</button>
                    <button className="btn btn-secondary" onClick={() => setActiveModal('review')}>Nightly Review</button>
                </div>
            </header>

            <main className="container">
                {/* Left Column */}
                <section className="left-col">
                    <div className="section-header">
                        <h2>Active Anchors</h2>
                        <button className="btn btn-small" onClick={() => setActiveModal('anchor')}>+ New Anchor</button>
                    </div>
                    <div className="anchor-list">
                        {anchors.map(a => (
                            <div key={a.id} className="anchor-card">
                                <div>
                                    <div className="anchor-time">{a.time}</div>
                                    <div className="anchor-text">{a.text}</div>
                                </div>
                                <button className="btn-done" onClick={() => removeAnchor(a.id)}>Done</button>
                            </div>
                        ))}
                    </div>

                    <div className="section-header">
                        <h2>Briefing Cards</h2>
                        <button className="btn btn-small" onClick={() => setActiveModal('briefing')}>+ New Briefing</button>
                    </div>
                    <div className="briefing-list">
                        {briefings.map(b => (
                            <div key={b.id} className="briefing-card">
                                <div>
                                    <div className="briefing-time">{b.time}</div>
                                    <div className="briefing-where"><strong>Where:</strong> {b.where}</div>
                                    <div className="briefing-who"><strong>Who:</strong> {b.who}</div>
                                    <div className="briefing-what"><strong>Note:</strong> {b.what}</div>
                                </div>
                                <button className="btn-briefing-done" onClick={() => removeBriefing(b.id)}>Done</button>
                            </div>
                        ))}
                    </div>

                    <div className="section-header" style={{ marginBottom: '0.5rem' }}>
                        <h2>Master Log (Summary)</h2>
                    </div>
                    <p style={{marginBottom: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem'}}>Your nightly summaries of important daily events.</p>
                    <div className="master-log-list">
                        {[...masterLog].reverse().map(log => (
                            <div key={log.id} className="master-log-card">
                                <div className="master-log-date">{log.date}</div>
                                <div className="master-log-text">{log.text}</div>
                                {log.highlights && log.highlights.length > 0 && (
                                    <div className="master-log-highlights" style={{marginTop:'1rem', paddingTop:'1rem', borderTop:'1px dashed var(--border-color)'}}>
                                        <h4 style={{fontSize:'0.85rem', color:'var(--text-muted)', marginBottom:'0.5rem'}}>Highlighted Source Logs:</h4>
                                        {log.highlights.map(h => (
                                            <div key={h.id} style={{fontSize:'0.85rem', color:'var(--memory-red)', marginBottom:'0.2rem'}}>
                                                <strong>{h.time}</strong> - {h.text} {h.image && <em>[Image]</em>}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </section>

                {/* Right Column */}
                <section className="right-col">
                    <div className="stream-input-container">
                        <input type="text" className="premium-input" value={streamInput} onChange={(e) => setStreamInput(e.target.value)} 
                            onKeyDown={(e) => e.key === 'Enter' && addStreamEntry(streamInput)}
                            placeholder={isDictating ? "Listening..." : "What is happening right now? (Press Enter)"} autoComplete="off" style={{flex: 1}} />
                        <button className={`btn btn-icon ${isDictating ? 'recording' : ''}`} onClick={() => startDictation('stream')} title="Dictate">&#127897;</button>
                        <button className="btn btn-icon" onClick={() => fileInputRef.current?.click()} title="Camera">&#128247;</button>
                        <input type="file" ref={fileInputRef} onChange={handleCameraCapture} accept="image/*" capture="environment" className="hidden" />
                        <button className="btn btn-primary" onClick={() => addStreamEntry(streamInput)}>Log</button>
                    </div>

                    <div className="raw-stream-list" ref={streamListRef}>
                        {[...rawStream].reverse().map(entry => (
                            <div key={entry.id} className={`stream-entry ${entry.isHighlighted ? 'highlighted' : ''}`}>
                                <div className="stream-time">{entry.time}</div>
                                <div className="stream-text">
                                    {entry.text}
                                    {entry.image && <><br/><img src={entry.image} className="stream-image" alt="Captured view" /></>}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </main>

            {/* Modals */}
            {activeModal === 'panic' && (
                <div className="modal">
                    <div className="modal-content panic-content">
                        <div className="modal-header" style={{ marginBottom: '0.5rem' }}>
                            <h2>DON'T PANIC. YOU ARE SAFE.</h2>
                            <button className="btn-close" onClick={() => setActiveModal(null)}>&times;</button>
                        </div>
                        <p style={{marginBottom: '1.5rem', color: 'var(--text-muted)'}}>Take a deep breath. Here is a summary of your most recent activities to help ground you.</p>
                        <div className="panic-body">
                            <h3>Latest Logs</h3>
                            <div className="panic-logs">
                                {[...rawStream].reverse().slice(0, 3).map(e => <div key={e.id} style={{marginBottom:'0.5rem'}}><strong>{e.time}</strong>: {e.text}</div>)}
                                {rawStream.length === 0 && <p>No recent activity.</p>}
                            </div>
                            <h3>Latest Master Log</h3>
                            <div className="panic-master-log">
                                {masterLog.length > 0 ? (
                                    <div style={{color:'var(--memory-red)'}}><strong>{masterLog[masterLog.length-1].date}</strong><br/>{masterLog[masterLog.length-1].text}</div>
                                ) : <p>No master log entries yet.</p>}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeModal === 'anchor' && (
                <div className="modal">
                    <div className="modal-content anchor-content">
                        <div className="modal-header" style={{ marginBottom: '0.5rem' }}>
                            <h2>Add New Anchor</h2>
                            <button className="btn-close" onClick={() => setActiveModal(null)}>&times;</button>
                        </div>
                        <p style={{marginBottom: '1.5rem', color: 'var(--text-muted)'}}>Set an anchor to remember your current task or state of mind.</p>
                        <div className="anchor-body">
                            <input autoFocus type="text" className="premium-input" value={anchorInput} onChange={(e) => setAnchorInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addAnchor()} placeholder="e.g., Eating lunch..." style={{marginBottom: 0}} />
                            <button className="btn btn-primary" onClick={addAnchor}>Add</button>
                        </div>
                    </div>
                </div>
            )}

            {activeModal === 'briefing' && (
                <div className="modal">
                    <div className="modal-content anchor-content">
                        <div className="modal-header" style={{ marginBottom: '0.5rem' }}>
                            <h2>Add Briefing Card</h2>
                            <button className="btn-close" onClick={() => setActiveModal(null)}>&times;</button>
                        </div>
                        <p style={{marginBottom: '1.5rem', color: 'var(--text-muted)'}}>Create a quick reference card for where you are going, who you are meeting, and what you need to know.</p>
                        <div className="anchor-body" style={{flexDirection: 'column'}}>
                            <input autoFocus type="text" className="premium-input" value={briefingWhere} onChange={(e) => setBriefingWhere(e.target.value)} placeholder="Where am I going?" style={{marginBottom:'0.5rem'}}/>
                            <input type="text" className="premium-input" value={briefingWho} onChange={(e) => setBriefingWho(e.target.value)} placeholder="Who am I meeting?" style={{marginBottom:'0.5rem'}}/>
                            <input type="text" className="premium-input" value={briefingWhat} onChange={(e) => setBriefingWhat(e.target.value)} placeholder="What do I need to know?" style={{marginBottom:'0.5rem'}}/>
                            <button className="btn btn-primary" onClick={addBriefing} style={{alignSelf: 'flex-end'}}>Save Briefing</button>
                        </div>
                    </div>
                </div>
            )}

            {activeModal === 'review' && (
                <div className="modal">
                    <div className="modal-content review-content">
                        <div className="modal-header">
                            <h2>Nightly Review Mode</h2>
                            <button className="btn-close" onClick={() => setActiveModal(null)}>&times;</button>
                        </div>
                        <div className="review-body">
                            <p>Highlight important events from today and summarize them below to commit to long-term memory.</p>
                            <div className="review-layout">
                                <div className="review-stream-list">
                                    {rawStream.map(entry => (
                                        <div key={entry.id} className={`review-stream-entry ${entry.isHighlighted ? 'highlighted' : ''}`} onClick={() => toggleHighlight(entry.id)}>
                                            <strong>{entry.time}</strong> - {entry.text}
                                            {entry.image && <><br/><img src={entry.image} className="stream-image-small" alt="view" /></>}
                                        </div>
                                    ))}
                                </div>
                                <div className="review-summary-container">
                                    <h3>Write Summary</h3>
                                    <textarea className="premium-input" style={{flex: 1, resize: 'none'}} value={reviewSummary} onChange={(e) => setReviewSummary(e.target.value)} placeholder="Type your summary..."></textarea>
                                    <button className="btn btn-primary" onClick={saveMasterLog}>Save to Master Log</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeModal === 'search' && (
                <div className="modal">
                    <div className="modal-content search-content">
                        <div className="modal-header" style={{ marginBottom: '0.5rem' }}>
                            <h2>Search Memories</h2>
                            <button className="btn-close" onClick={() => setActiveModal(null)}>&times;</button>
                        </div>
                        <p style={{marginBottom: '1.5rem', color: 'var(--text-muted)'}}>Search through your daily stream and master log entries.</p>
                        <div className="search-body">
                            <div className="stream-input-container">
                                <input autoFocus type="text" className="premium-input" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="What are you looking for?" style={{flex:1}} />
                                <button className={`btn btn-icon ${isSearchDictating ? 'recording' : ''}`} onClick={() => startDictation('search')}>&#127897;</button>
                            </div>
                            <div className="search-results-layout">
                                <div className="search-column">
                                    <h3>Today's Stream</h3>
                                    <div className="search-results-list">
                                        {[...filteredRaw].reverse().map(e => (
                                            <div key={e.id} className="search-result-item raw-result">
                                                <div className="stream-time">{e.time}</div>
                                                <div>{highlightText(e.text, searchQ)}{e.image && <><br/><img src={e.image} className="stream-image-small"/></>}</div>
                                            </div>
                                        ))}
                                        {filteredRaw.length===0 && <p>No matches.</p>}
                                    </div>
                                </div>
                                <div className="search-column">
                                    <h3>Master Log</h3>
                                    <div className="search-results-list">
                                        {[...filteredMaster].reverse().map(l => (
                                            <div key={l.id} className="search-result-item master-result">
                                                <div className="master-log-date">{l.date}</div>
                                                <div>{highlightText(l.text, searchQ)}</div>
                                            </div>
                                        ))}
                                        {filteredMaster.length===0 && <p>No matches.</p>}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showIntro && (
                <div className="modal">
                    <div className="modal-content" style={{ maxWidth: '600px' }}>
                        <div className="modal-header">
                            <h2>Welcome to Mizuta Memory Stream</h2>
                            <button className="btn-close" onClick={closeIntro}>&times;</button>
                        </div>
                        <div className="intro-body" style={{ padding: '1.5rem', lineHeight: '1.6' }}>
                            <p style={{ marginBottom: '1rem' }}>This application is designed to help you capture, retain, and review your daily experiences following the Mizuta Methodology.</p>
                            <ul style={{ paddingLeft: '1.5rem', marginBottom: '1.5rem' }}>
                                <li style={{ marginBottom: '0.5rem' }}><strong>Stream:</strong> Log what is happening right now in the right column. You can use text, voice dictation, or camera.</li>
                                <li style={{ marginBottom: '0.5rem' }}><strong>Anchors & Briefings:</strong> Set active tasks and important information to remind yourself of what you are doing or where you are going.</li>
                                <li style={{ marginBottom: '0.5rem' }}><strong>Nightly Review:</strong> At the end of the day, review your stream, highlight important events, and summarize them into your Master Log for long-term memory.</li>
                            </ul>
                            <button className="btn btn-primary" onClick={closeIntro} style={{ width: '100%', padding: '0.75rem', fontSize: '1.1rem' }}>Get Started</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
