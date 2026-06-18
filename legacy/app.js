// --- State Management ---
let rawStream = JSON.parse(localStorage.getItem('mizuta_stream')) || [];
let masterLog = JSON.parse(localStorage.getItem('mizuta_master')) || [];
let anchors = JSON.parse(localStorage.getItem('mizuta_anchors')) || [];
let briefings = JSON.parse(localStorage.getItem('mizuta_briefings')) || [];

function saveState() {
    localStorage.setItem('mizuta_stream', JSON.stringify(rawStream));
    localStorage.setItem('mizuta_master', JSON.stringify(masterLog));
    localStorage.setItem('mizuta_anchors', JSON.stringify(anchors));
    localStorage.setItem('mizuta_briefings', JSON.stringify(briefings));
}

// --- Utility Functions ---
function getTimestamp() {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function getDateString() {
    const now = new Date();
    return now.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

// --- DOM Elements ---
const streamInput = document.getElementById('stream-input');
const btnLogStream = document.getElementById('btn-log-stream');
const btnDictate = document.getElementById('btn-dictate');
const btnCamera = document.getElementById('btn-camera');
const cameraInput = document.getElementById('camera-input');
const rawStreamList = document.getElementById('raw-stream-list');

const anchorInput = document.getElementById('anchor-input');
const btnSaveAnchor = document.getElementById('btn-save-anchor');
const anchorList = document.getElementById('anchor-list');
const btnAddAnchor = document.getElementById('btn-add-anchor');

const briefingList = document.getElementById('briefing-list');
const btnAddBriefing = document.getElementById('btn-add-briefing');
const modalBriefing = document.getElementById('modal-briefing');
const briefingWhere = document.getElementById('briefing-where');
const briefingWho = document.getElementById('briefing-who');
const briefingWhat = document.getElementById('briefing-what');
const btnSaveBriefing = document.getElementById('btn-save-briefing');

const masterLogList = document.getElementById('master-log-list');

// Modals
const modalPanic = document.getElementById('modal-panic');
const modalReview = document.getElementById('modal-review');
const modalAnchor = document.getElementById('modal-anchor');
const modalSearch = document.getElementById('modal-search');

const btnPanic = document.getElementById('btn-panic');
const btnReview = document.getElementById('btn-review');
const btnSearch = document.getElementById('btn-search');

// Search Elements
const searchInput = document.getElementById('search-input');
const btnSearchDictate = document.getElementById('btn-search-dictate');
const searchResultsRaw = document.getElementById('search-results-raw');
const searchResultsMaster = document.getElementById('search-results-master');

// Review Elements
const reviewStreamList = document.getElementById('review-stream-list');
const reviewSummaryInput = document.getElementById('review-summary-input');
const btnSaveSummary = document.getElementById('btn-save-summary');

// Panic Elements
const panicRecentLogs = document.getElementById('panic-recent-logs');
const panicMasterLog = document.getElementById('panic-master-log');


// --- Render Functions ---

function renderRawStream() {
    rawStreamList.innerHTML = '';
    // Reverse to show newest at the top
    const displayStream = [...rawStream].reverse();
    
    displayStream.forEach(entry => {
        const el = document.createElement('div');
        el.className = `stream-entry ${entry.isHighlighted ? 'highlighted' : ''}`;
        
        let imageHtml = entry.image ? `<img src="${entry.image}" class="stream-image" alt="Captured view" />` : '';
        
        el.innerHTML = `
            <div class="stream-time">${entry.time}</div>
            <div class="stream-text">
                ${entry.text}
                ${imageHtml}
            </div>
        `;
        rawStreamList.appendChild(el);
    });
}

function renderAnchors() {
    anchorList.innerHTML = '';
    
    anchors.forEach(anchor => {
        const el = document.createElement('div');
        el.className = 'anchor-card';
        el.innerHTML = `
            <div>
                <div class="anchor-time">${anchor.time}</div>
                <div class="anchor-text">${anchor.text}</div>
            </div>
            <button class="btn-done" data-id="${anchor.id}">Done</button>
        `;
        anchorList.appendChild(el);
    });

    // Attach event listeners to new done buttons
    document.querySelectorAll('.btn-done').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = parseInt(e.target.getAttribute('data-id'));
            removeAnchor(id);
        });
    });
}

function renderBriefings() {
    briefingList.innerHTML = '';
    
    briefings.forEach(brief => {
        const el = document.createElement('div');
        el.className = 'briefing-card';
        el.innerHTML = `
            <div>
                <div class="briefing-time">${brief.time}</div>
                <div class="briefing-where"><strong>Where:</strong> ${brief.where}</div>
                <div class="briefing-who"><strong>Who:</strong> ${brief.who}</div>
                <div class="briefing-what"><strong>Note:</strong> ${brief.what}</div>
            </div>
            <button class="btn-briefing-done" data-id="${brief.id}">Done</button>
        `;
        briefingList.appendChild(el);
    });

    document.querySelectorAll('.btn-briefing-done').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = parseInt(e.target.getAttribute('data-id'));
            removeBriefing(id);
        });
    });
}

function renderMasterLog() {
    masterLogList.innerHTML = '';
    const displayMaster = [...masterLog].reverse();

    displayMaster.forEach(log => {
        const el = document.createElement('div');
        el.className = 'master-log-card';
        
        let highlightsHtml = '';
        if (log.highlights && log.highlights.length > 0) {
            highlightsHtml = '<div class="master-log-highlights" style="margin-top: 1rem; padding-top: 1rem; border-top: 1px dashed var(--border-color);">';
            highlightsHtml += '<h4 style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0.5rem;">Highlighted Source Logs:</h4>';
            log.highlights.forEach(h => {
                 let img = h.image ? ' <em>[Image]</em>' : '';
                 highlightsHtml += `<div style="font-size: 0.85rem; color: var(--memory-red); margin-bottom: 0.2rem;"><strong>${h.time}</strong> - ${h.text}${img}</div>`;
            });
            highlightsHtml += '</div>';
        }

        el.innerHTML = `
            <div class="master-log-date">${log.date}</div>
            <div class="master-log-text">${log.text}</div>
            ${highlightsHtml}
        `;
        masterLogList.appendChild(el);
    });
}

function renderReviewStream() {
    reviewStreamList.innerHTML = '';
    // Show chronological order for review
    rawStream.forEach(entry => {
        const el = document.createElement('div');
        el.className = `review-stream-entry ${entry.isHighlighted ? 'highlighted' : ''}`;
        let imageHtml = entry.image ? `<br><img src="${entry.image}" class="stream-image-small" alt="Captured view" />` : '';
        el.innerHTML = `<strong>${entry.time}</strong> - ${entry.text}${imageHtml}`;
        
        el.addEventListener('click', () => {
            entry.isHighlighted = !entry.isHighlighted;
            saveState();
            renderReviewStream();
            renderRawStream(); // Update background too
        });

        reviewStreamList.appendChild(el);
    });
}

function highlightSearchMatch(text, query) {
    if (!query) return text;
    const regex = new RegExp(`(${query})`, 'gi');
    return text.replace(regex, '<span class="search-highlight">$1</span>');
}

function performSearch(query) {
    searchResultsRaw.innerHTML = '';
    searchResultsMaster.innerHTML = '';
    
    const q = query.trim().toLowerCase();
    
    // Filter Master Log
    const filteredMaster = q ? masterLog.filter(log => log.text.toLowerCase().includes(q)) : masterLog;
    if (filteredMaster.length === 0) {
        searchResultsMaster.innerHTML = '<p>No matches.</p>';
    } else {
        [...filteredMaster].reverse().forEach(log => {
            const el = document.createElement('div');
            el.className = 'search-result-item master-result';
            el.innerHTML = `<div class="master-log-date">${log.date}</div><div>${highlightSearchMatch(log.text, q)}</div>`;
            searchResultsMaster.appendChild(el);
        });
    }

    // Filter Raw Stream
    const filteredRaw = q ? rawStream.filter(entry => entry.text.toLowerCase().includes(q)) : rawStream;
    if (filteredRaw.length === 0) {
        searchResultsRaw.innerHTML = '<p>No matches.</p>';
    } else {
        [...filteredRaw].reverse().forEach(entry => {
            const el = document.createElement('div');
            el.className = 'search-result-item raw-result';
            let imageHtml = entry.image ? `<br><img src="${entry.image}" class="stream-image-small" />` : '';
            el.innerHTML = `<div class="stream-time">${entry.time}</div><div>${highlightSearchMatch(entry.text, q)}${imageHtml}</div>`;
            searchResultsRaw.appendChild(el);
        });
    }
}

// --- Action Functions ---

function addStreamEntry(text, image = null) {
    if (!text.trim() && !image) return;
    
    const entry = {
        id: Date.now(),
        time: getTimestamp(),
        text: text,
        image: image,
        isHighlighted: false
    };
    
    rawStream.push(entry);
    saveState();
    renderRawStream();
    
    streamInput.value = '';
    streamInput.focus();
}

function addAnchor(text) {
    if (!text.trim()) return;

    const anchor = {
        id: Date.now(),
        time: getTimestamp(),
        text: text
    };

    anchors.push(anchor);
    saveState();
    renderAnchors();

    anchorInput.value = '';
    closeModal(modalAnchor);
}

function removeAnchor(id) {
    anchors = anchors.filter(a => a.id !== id);
    saveState();
    renderAnchors();
}

function addBriefing(where, who, what) {
    if (!where.trim() && !who.trim() && !what.trim()) return;

    const brief = {
        id: Date.now(),
        time: getTimestamp(),
        where: where,
        who: who,
        what: what
    };

    briefings.push(brief);
    saveState();
    renderBriefings();

    briefingWhere.value = '';
    briefingWho.value = '';
    briefingWhat.value = '';
    closeModal(modalBriefing);
}

function removeBriefing(id) {
    briefings = briefings.filter(b => b.id !== id);
    saveState();
    renderBriefings();
}

function saveMasterLog(text) {
    if (!text.trim()) {
        alert("Methodology Rule: You must actively type a summary of the highlighted events to commit them to long-term memory.");
        return;
    }

    const highlightedEntries = rawStream.filter(e => e.isHighlighted);

    const log = {
        id: Date.now(),
        date: getDateString(),
        text: text,
        highlights: highlightedEntries
    };

    masterLog.push(log);
    
    // Clear the daily stream as it's been synthesized
    rawStream = [];
    
    saveState();
    renderMasterLog();
    renderRawStream();
    renderReviewStream();
    
    reviewSummaryInput.value = '';
    closeModal(modalReview);
}

// --- Modal Functions ---
function openModal(modal) {
    modal.classList.remove('hidden');
}

function closeModal(modal) {
    modal.classList.add('hidden');
}

document.querySelectorAll('.btn-close').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const modalId = e.target.getAttribute('data-close');
        closeModal(document.getElementById(modalId));
    });
});

// Panic Action
btnPanic.addEventListener('click', () => {
    // Populate panic modal
    panicRecentLogs.innerHTML = '';
    const recentLogs = [...rawStream].reverse().slice(0, 3);
    if(recentLogs.length === 0) {
        panicRecentLogs.innerHTML = '<p>No recent activity.</p>';
    } else {
        recentLogs.forEach(entry => {
            const el = document.createElement('div');
            el.innerHTML = `<strong>${entry.time}</strong>: ${entry.text}`;
            el.style.marginBottom = '0.5rem';
            panicRecentLogs.appendChild(el);
        });
    }

    panicMasterLog.innerHTML = '';
    if(masterLog.length === 0) {
        panicMasterLog.innerHTML = '<p>No master log entries yet.</p>';
    } else {
        const recentMaster = masterLog[masterLog.length - 1];
        const el = document.createElement('div');
        el.innerHTML = `<strong>${recentMaster.date}</strong><br/>${recentMaster.text}`;
        el.style.color = 'var(--memory-red)';
        panicMasterLog.appendChild(el);
    }

    openModal(modalPanic);
});


// --- Event Listeners ---

btnLogStream.addEventListener('click', () => {
    addStreamEntry(streamInput.value);
});

streamInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        addStreamEntry(streamInput.value);
    }
});

btnAddAnchor.addEventListener('click', () => {
    openModal(modalAnchor);
    anchorInput.focus();
});

btnSaveAnchor.addEventListener('click', () => {
    addAnchor(anchorInput.value);
});

anchorInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        addAnchor(anchorInput.value);
    }
});

btnReview.addEventListener('click', () => {
    renderReviewStream();
    openModal(modalReview);
});

btnSaveSummary.addEventListener('click', () => {
    saveMasterLog(reviewSummaryInput.value);
});

// Multi-modal Capture Listeners
btnCamera.addEventListener('click', () => {
    cameraInput.click();
});

cameraInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(evt) {
            addStreamEntry('[Photo Capture]', evt.target.result);
        };
        reader.readAsDataURL(file);
        // clear input
        cameraInput.value = '';
    }
});

let recognition;
let finalTranscript = '';

if ('webkitSpeechRecognition' in window) {
    recognition = new webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    
    recognition.onstart = function() {
        btnDictate.classList.add('recording');
        streamInput.placeholder = "Listening...";
        finalTranscript = '';
    };
    
    recognition.onresult = function(event) {
        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
                finalTranscript += event.results[i][0].transcript;
            } else {
                interimTranscript += event.results[i][0].transcript;
            }
        }
        streamInput.value = finalTranscript + interimTranscript;
    };
    
    recognition.onend = function() {
        btnDictate.classList.remove('recording');
        streamInput.placeholder = "What is happening right now? (Press Enter)";
        streamInput.value = '';
        if (finalTranscript.trim()) {
            addStreamEntry(finalTranscript.trim());
            finalTranscript = '';
        }
    };
} else {
    btnDictate.style.display = 'none'; // hide if not supported
}

btnDictate.addEventListener('click', () => {
    if (recognition) {
        try {
            recognition.start();
        } catch (e) {
            console.error("Speech recognition already started or failed.");
        }
    } else {
        alert("Speech recognition not supported in this browser.");
    }
});

let searchRecognition;
let searchFinalTranscript = '';
if ('webkitSpeechRecognition' in window) {
    searchRecognition = new webkitSpeechRecognition();
    searchRecognition.continuous = false;
    searchRecognition.interimResults = true;
    
    searchRecognition.onstart = function() {
        btnSearchDictate.classList.add('recording');
        searchInput.placeholder = "Listening...";
        searchFinalTranscript = '';
    };
    
    searchRecognition.onresult = function(event) {
        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
                searchFinalTranscript += event.results[i][0].transcript;
            } else {
                interimTranscript += event.results[i][0].transcript;
            }
        }
        searchInput.value = searchFinalTranscript + interimTranscript;
        performSearch(searchInput.value);
    };
    
    searchRecognition.onend = function() {
        btnSearchDictate.classList.remove('recording');
        searchInput.placeholder = "What are you looking for?";
        searchInput.value = searchFinalTranscript;
        performSearch(searchInput.value);
    };
} else {
    btnSearchDictate.style.display = 'none';
}

btnSearchDictate.addEventListener('click', () => {
    if (searchRecognition) {
        try {
            searchRecognition.start();
        } catch (e) {
            console.error("Speech recognition already started.");
        }
    }
});

btnSearch.addEventListener('click', () => {
    searchInput.value = '';
    performSearch('');
    openModal(modalSearch);
    searchInput.focus();
});

searchInput.addEventListener('input', () => {
    performSearch(searchInput.value);
});

// Briefing Listeners
btnAddBriefing.addEventListener('click', () => {
    openModal(modalBriefing);
    briefingWhere.focus();
});

btnSaveBriefing.addEventListener('click', () => {
    addBriefing(briefingWhere.value, briefingWho.value, briefingWhat.value);
});

// Auto-focus logic
document.addEventListener('keydown', (e) => {
    // If pressing Escape, focus the main stream input
    if (e.key === 'Escape') {
        // close all modals
        document.querySelectorAll('.modal').forEach(m => closeModal(m));
        streamInput.focus();
    }
});

// Initial Render
renderRawStream();
renderAnchors();
renderBriefings();
renderMasterLog();
streamInput.focus();
