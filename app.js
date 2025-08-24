// Toto VI.3 Converter - Complete standalone JavaScript application
// This file contains all the logic for the converter tool

// Configuration will be loaded from teams-config.js
let teamMapping = {};
let teamOrder = [];
let settings = {};

// Initialize configuration
if (typeof teamsConfig !== 'undefined') {
    teamMapping = teamsConfig.teamMappings;
    teamOrder = teamsConfig.teamOrder;
    settings = teamsConfig.settings;
} else {
    console.error('Configuration file not loaded! Please ensure teams-config.js is included.');
}

// Initialize the application
let inputText = '';
let convertedData = [];
let isCopied = false;
let parseErrors = [];
let infoMessages = [];
let isHelpVisible = false;

// Function to toggle help visibility
function toggleHelp() {
    isHelpVisible = !isHelpVisible;
    renderHelpSection();
}

// Function to render help section
function renderHelpSection() {
    const helpSection = document.getElementById('helpSection');
    const helpIcon = document.getElementById('helpIcon');
    
    if (helpSection && helpIcon) {
        helpSection.style.display = isHelpVisible ? 'block' : 'none';
        
        // Rotate the help icon when expanded
        helpIcon.style.transform = isHelpVisible ? 'rotate(180deg)' : 'rotate(0deg)';
    }
}

// Function to find bonus answer after match 6
function findBonusAnswer(lines, startIndex) {
    const searchRange = settings.bonusSearchRange || 10;
    for (let i = startIndex; i < Math.min(startIndex + searchRange, lines.length); i++) {
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
    parseErrors = [];
    infoMessages = [];
    const matchesPerTeam = settings.matchesPerTeam || 6;
    const includeBonusRound = settings.includeBonusRound !== false;
    const totalRowsPerTeam = includeBonusRound ? matchesPerTeam + 1 : matchesPerTeam;
    
    // Initialize table with empty rows for each team
    teamOrder.forEach((teamName, index) => {
        // Add separator row between teams (except for the first team)
        if (index > 0) {
            tableData.push(["", "", "", ""]);
        }
        
        // Add rows for each team (matches + optional bonus)
        for (let matchNum = 0; matchNum < totalRowsPerTeam; matchNum++) {
            tableData.push([
                teamName,
                matchNum === matchesPerTeam ? "BONUS" : `Match ${matchNum + 1}`,
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
    
    // Create score pattern from settings or use default
    const scorePatterns = settings.scorePatterns || ["(\\d+)\\s*-\\s*(\\d+)"];
    const scorePattern = new RegExp(scorePatterns.join("|"), "g");
    
    let currentUsername = "";
    let matchCount = 0;
    const lines = inputText.split("\n");
    const foundTeams = new Set();
    
    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
        const line = lines[lineIndex];
        
        // Check if this line contains a username
        const usernameMatch = line.toLowerCase().match(usernamePattern);
        if (usernameMatch) {
            currentUsername = usernameMatch[0].toLowerCase();
            matchCount = 0;
            foundTeams.add(teamMapping[currentUsername]);
            continue;
        }
        
        // If we have a current username, look for scores
        if (currentUsername) {
            const scores = line.match(scorePattern);
            if (scores) {
                const [fullMatch] = scores;
                // Try to extract scores with both patterns
                let homeScore, awayScore;
                
                // Try dash separator
                if (fullMatch.includes("-")) {
                    [homeScore, awayScore] = fullMatch.split("-").map(s => s.trim());
                }
                // Try colon separator
                else if (fullMatch.includes(":")) {
                    [homeScore, awayScore] = fullMatch.split(":").map(s => s.trim());
                }
                
                const teamName = teamMapping[currentUsername];
                const teamIndex = teamOrder.indexOf(teamName);
                
                if (teamIndex !== -1 && matchCount < matchesPerTeam) {
                    // Calculate row index (8 rows per team: 7 data rows + 1 separator)
                    const rowIndex = teamIndex * (totalRowsPerTeam + 1) + matchCount;
                    
                    // Update the scores
                    tableData[rowIndex][2] = homeScore;
                    tableData[rowIndex][3] = awayScore;
                    
                    matchCount++;
                    
                    // After last match, look for bonus answer if enabled
                    if (matchCount === matchesPerTeam) {
                        if (includeBonusRound) {
                            const bonusAnswer = findBonusAnswer(lines, lineIndex + 1);
                            if (bonusAnswer) {
                                const bonusRowIndex = teamIndex * (totalRowsPerTeam + 1) + matchesPerTeam;
                                tableData[bonusRowIndex][2] = bonusAnswer;
                            }
                        }
                        
                        // Reset for next team
                        currentUsername = "";
                        matchCount = 0;
                    }
                }
            }
        }
    }
    
    // Check for missing data
    teamOrder.forEach((teamName, teamIndex) => {
        if (!foundTeams.has(teamName)) {
            infoMessages.push(`ℹ️ Team "${teamName}" not found in input data`);
        } else {
            // Check for missing matches
            let hasMatchData = false;
            for (let matchNum = 0; matchNum < matchesPerTeam; matchNum++) {
                const rowIndex = teamIndex * (totalRowsPerTeam + 1) + matchNum;
                if (!tableData[rowIndex][2] || !tableData[rowIndex][3]) {
                    parseErrors.push(`⚠️ ${teamName}: Missing data for Match ${matchNum + 1}`);
                } else {
                    hasMatchData = true;
                }
            }
            
            // Check for missing bonus answer if team has match data and bonus is enabled
            if (hasMatchData && includeBonusRound) {
                const bonusRowIndex = teamIndex * (totalRowsPerTeam + 1) + matchesPerTeam;
                if (!tableData[bonusRowIndex][2]) {
                    parseErrors.push(`⚠️ ${teamName}: Missing bonus answer`);
                }
            }
        }
    });
    
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
                <path d="M4 16c-1.1 0-2-.9-2 2-2h10c1.1 0 2 .9 2 2"></path>
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
    
    // Build error messages HTML if any
    let errorHTML = '';
    
    // Warning messages (more important)
    if (parseErrors.length > 0) {
        errorHTML += `
            <div class="mb-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <h3 class="text-sm font-semibold text-orange-800 mb-2 flex items-center gap-1">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.664-.833-2.464 0L4.732 18.5c-.77.833.192 2.5 1.732 2.5z"></path>
                    </svg>
                    Warnings:
                </h3>
                <ul class="text-sm text-orange-700 space-y-1">
                    ${parseErrors.map(error => `<li>${error}</li>`).join('')}
                </ul>
            </div>
        `;
    }
    
    // Info messages (less important)
    if (infoMessages.length > 0) {
        errorHTML += `
            <div class="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 class="text-sm font-semibold text-blue-800 mb-2 flex items-center gap-1">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10"></circle>
                        <path d="M12 16v-4"></path>
                        <path d="M12 8h.01"></path>
                    </svg>
                    Information:
                </h3>
                <ul class="text-sm text-blue-700 space-y-1">
                    ${infoMessages.map(message => `<li>${message}</li>`).join('')}
                </ul>
            </div>
        `;
    }
    
    let tableHTML = `
        <div class="mt-6">
            ${errorHTML}
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
        const isMissingData = !isEmpty && row[1] !== "BONUS" && (!row[2] || !row[3]);
        const rowClass = isEmpty ? 'h-4' : (index % 2 === 0 ? 'bg-gray-50' : 'bg-white');
        const cellClass = isMissingData ? 'text-orange-600' : 'text-gray-500';
        
        tableHTML += `<tr class="${rowClass}">`;
        row.forEach(cell => {
            tableHTML += `<td class="px-6 py-4 whitespace-nowrap text-sm ${cellClass} border-b">${cell || '-'}</td>`;
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
                        <div class="flex items-center gap-2 mb-2">
                            <label class="block text-sm font-medium text-gray-700">
                                Forum Data Input
                            </label>
                            <button 
                                id="helpButton" 
                                onclick="toggleHelp()" 
                                class="p-1 text-gray-400 hover:text-gray-600 transition-colors rounded-full hover:bg-gray-100"
                                title="Help"
                            >
                                <svg id="helpIcon" class="w-4 h-4 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                                    <path d="M12 17h.01"></path>
                                </svg>
                            </button>
                        </div>
                        
                        <div id="helpSection" class="mb-3 p-3 bg-gray-50 border border-gray-200 rounded-lg" style="display: none;">
                            <p class="text-sm text-gray-600">
                                Select all text from the forum entries related to the active <em>speelronde</em>. Copy and paste the text in the box below and click the button to convert the text to table format.
                            </p>
                        </div>
                        
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