// Toto VI.3 Converter - Complete standalone JavaScript application
// This file contains all the logic for the converter tool

// Team mapping - maps forum usernames to team names
const teamMapping = {
    trebge: "Maid'n Atletic",
    dabbenvanger: "Toasty Town",
    prettyparacetamol: "You Will Never Find Brian Here",
    blow_your_mind: "NAC Breda 1912",
    bokkie2: "Rode Ster Nijmegen",  // NEW TEAM ADDED
    vinz_clortho: "Keymasters",
    soestvb: "Het Flevoslot",
    robinkor: "Walburg"
};

// Team order for display - determines the order in the output table
const teamOrder = [
    "Maid'n Atletic",
    "Keymasters",
    "Walburg",
    "Toasty Town",
    "You Will Never Find Brian Here",
    "Het Flevoslot",
    "NAC Breda 1912",
    "Rode Ster Nijmegen"  // NEW TEAM ADDED as 8th position
];

// Initialize the application
let inputText = '';
let convertedData = [];
let isCopied = false;

// Function to find bonus answer after match 6
function findBonusAnswer(lines, startIndex) {
    for (let i = startIndex; i < Math.min(startIndex + 10, lines.length); i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const cleanLine = line.replace("[/quote]", "").trim();
        
        // Check if this line contains the bonus question
        if (cleanLine.toLowerCase().includes("bonus") && cleanLine.includes("?")) {
            // Try to find answer right after the question mark
            const parts = cleanLine.split("?");
            if (parts.length > 1 && parts[1].trim()) {
                return parts[1].trim();
            }
            
            // Otherwise look in the next few lines for the answer
            for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
                const answerLine = lines[j].trim().replace("[/quote]", "").trim();
                if (answerLine && !answerLine.toLowerCase().includes("bonus")) {
                    return answerLine;
                }
            }
        }
    }
    return "";
}

// Function to convert the input data
function convertData() {
    const tableData = [];
    
    // Initialize table with empty rows for each team
    teamOrder.forEach((teamName, index) => {
        // Add separator row between teams (except for the first team)
        if (index > 0) {
            tableData.push(["", "", "", ""]);
        }
        
        // Add 7 rows for each team (6 matches + 1 bonus)
        for (let matchNum = 0; matchNum < 7; matchNum++) {
            tableData.push([
                teamName,
                matchNum === 6 ? "BONUS" : `Match ${matchNum + 1}`,
                "",
                ""
            ]);
        }
    });
    
    // Create regex pattern from all usernames (case-insensitive)
    const usernamePattern = new RegExp(
        Object.keys(teamMapping).map(username => username.toLowerCase()).join("|"),
        "i"
    );
    
    // Pattern to match scores like "2 - 1" or "3-0"
    const scorePattern = /(\d+)\s*-\s*(\d+)/g;
    
    let currentUsername = "";
    let matchCount = 0;
    const lines = inputText.split("\n");
    
    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
        const line = lines[lineIndex];
        
        // Check if this line contains a username
        const usernameMatch = line.toLowerCase().match(usernamePattern);
        if (usernameMatch) {
            currentUsername = usernameMatch[0].toLowerCase();
            matchCount = 0;
            continue;
        }
        
        // If we have a current username, look for scores
        if (currentUsername) {
            const scores = line.match(scorePattern);
            if (scores) {
                const [fullMatch] = scores;
                const [homeScore, awayScore] = fullMatch.split("-").map(s => s.trim());
                
                const teamName = teamMapping[currentUsername];
                const teamIndex = teamOrder.indexOf(teamName);
                
                if (teamIndex !== -1 && matchCount < 6) {
                    // Calculate row index (8 rows per team: 7 data rows + 1 separator)
                    const rowIndex = teamIndex * 8 + matchCount;
                    
                    // Update the scores
                    tableData[rowIndex][2] = homeScore;
                    tableData[rowIndex][3] = awayScore;
                    
                    matchCount++;
                    
                    // After 6th match, look for bonus answer
                    if (matchCount === 6) {
                        const bonusAnswer = findBonusAnswer(lines, lineIndex + 1);
                        if (bonusAnswer) {
                            const bonusRowIndex = teamIndex * 8 + 6;
                            tableData[bonusRowIndex][2] = bonusAnswer;
                        }
                        
                        // Reset for next team
                        currentUsername = "";
                        matchCount = 0;
                    }
                }
            }
        }
    }
    
    convertedData = tableData;
    renderTable();
}

// Function to copy data to clipboard
function copyToClipboard() {
    const textData = convertedData
        .map(row => row.join("\t"))
        .join("\n");
    
    navigator.clipboard.writeText(textData).then(() => {
        isCopied = true;
        renderCopyButton();
        setTimeout(() => {
            isCopied = false;
            renderCopyButton();
        }, 2000);
    });
}

// Function to render the copy button
function renderCopyButton() {
    const copyBtn = document.getElementById('copyBtn');
    if (copyBtn) {
        copyBtn.className = `px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
            isCopied 
                ? 'bg-green-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }`;
        copyBtn.innerHTML = `
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect>
                <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path>
            </svg>
            ${isCopied ? 'Copied!' : 'Copy to Clipboard'}
        `;
    }
}

// Function to render the table
function renderTable() {
    const outputDiv = document.getElementById('output');
    
    if (convertedData.length === 0) {
        outputDiv.innerHTML = '';
        return;
    }
    
    let tableHTML = `
        <div class="mt-6">
            <div class="flex justify-between items-center mb-2">
                <h2 class="text-lg font-semibold text-gray-800">Converted Data:</h2>
                <button id="copyBtn" onclick="copyToClipboard()" class="px-4 py-2 rounded-lg flex items-center gap-2 transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect>
                        <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path>
                    </svg>
                    Copy to Clipboard
                </button>
            </div>
            <div class="overflow-x-auto">
                <table class="min-w-full bg-white border rounded-lg">
                    <thead>
                        <tr class="bg-gray-50">
                            <th class="px-6 py-3 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Team</th>
                            <th class="px-6 py-3 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Match</th>
                            <th class="px-6 py-3 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Home</th>
                            <th class="px-6 py-3 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Away</th>
                        </tr>
                    </thead>
                    <tbody>
    `;
    
    convertedData.forEach((row, index) => {
        const isEmpty = row[0] === "";
        const rowClass = isEmpty ? 'h-4' : (index % 2 === 0 ? 'bg-gray-50' : 'bg-white');
        
        tableHTML += `<tr class="${rowClass}">`;
        row.forEach(cell => {
            tableHTML += `<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 border-b">${cell}</td>`;
        });
        tableHTML += `</tr>`;
    });
    
    tableHTML += `
                    </tbody>
                </table>
            </div>
        </div>
    `;
    
    outputDiv.innerHTML = tableHTML;
}

// Function to render the main app
function renderApp() {
    const root = document.getElementById('root');
    root.innerHTML = `
        <div class="min-h-screen bg-gray-50 py-8 px-4">
            <div class="max-w-4xl mx-auto">
                <div class="bg-white rounded-lg shadow-lg p-6">
                    <h1 class="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"></path>
                            <path d="M14 2v4a2 2 0 0 0 2 2h4"></path>
                            <path d="M10 9H8"></path>
                            <path d="M16 13H8"></path>
                            <path d="M16 17H8"></path>
                        </svg>
                        Toto VI.3 Converter
                    </h1>
                    
                    <div class="mb-6">
                        <label class="block text-sm font-medium text-gray-700 mb-2">
                            Paste forum data here:
                        </label>
                        <textarea 
                            id="inputTextarea"
                            class="w-full h-64 px-3 py-2 text-gray-700 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Paste the forum data here..."
                        ></textarea>
                    </div>
                    
                    <button 
                        id="convertBtn"
                        class="mb-6 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path d="M12 3v18"></path>
                            <rect width="18" height="18" x="3" y="3" rx="2"></rect>
                            <path d="M3 9h18"></path>
                            <path d="M3 15h18"></path>
                        </svg>
                        Convert to Table Format
                    </button>
                    
                    <div id="output"></div>
                </div>
            </div>
        </div>
    `;
    
    // Add event listeners
    document.getElementById('inputTextarea').addEventListener('input', (e) => {
        inputText = e.target.value;
    });
    
    document.getElementById('convertBtn').addEventListener('click', convertData);
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', renderApp);