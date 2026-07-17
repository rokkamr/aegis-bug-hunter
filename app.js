// Aegis AI Bug Hunter - Unified Application Logic (Code Scanner & Web Tester)

// State Management
const state = {
  apiKey: localStorage.getItem('aegis_api_key') || '',
  model: localStorage.getItem('aegis_model') || 'gemini-2.5-flash',
  directoryHandle: null,
  projectName: '',
  files: {}, // Flat object: relativePath -> FileEntry { file, relativePath, handle, content: null }
  bugs: [], // Array of bug objects: { id, file, line, bug, severity, description, originalCode, fixedCode }
  activeView: 'dashboard',
  selectedFile: null, // File path currently selected in dashboard/tree
  testWriterSelectedFile: null,
  chatSelectedFile: null,
  chatHistory: [],
  isScanning: false,
  
  // Web Tester State
  isBrowserConnected: false,
  webTargetUrl: 'https://example.com',
  webTestGoal: 'Explore the site, find layout bugs, broken links, and console exceptions.',
  isWebTesting: false,
  webWs: null,
  webCdpId: 1,
  webCdpPromises: {},
  webConsoleLogs: [],
  webTimelineEvents: [],
  webBugs: [],
  webSessionTabId: null
};

// UI Elements
const el = {
  navItems: document.querySelectorAll('.nav-item'),
  views: document.querySelectorAll('.view'),
  pageTitle: document.getElementById('page-title'),
  statusDot: document.getElementById('status-dot'),
  statusText: document.getElementById('status-text'),
  browserStatusDot: document.getElementById('browser-status-dot'),
  browserStatusText: document.getElementById('browser-status-text'),
  workspaceBadge: document.getElementById('workspace-badge'),
  activeProjectName: document.getElementById('active-project-name'),
  
  // Dashboard
  valTotalFiles: document.getElementById('val-total-files'),
  valTotalBugs: document.getElementById('val-total-bugs'),
  valHealthScore: document.getElementById('val-health-score'),
  folderPickerPanel: document.getElementById('folder-picker-panel'),
  folderPicker: document.getElementById('folder-picker'),
  scannerStatusPanel: document.getElementById('scanner-status-panel'),
  scanHeading: document.getElementById('scan-heading'),
  scanSubtext: document.getElementById('scan-subtext'),
  scanProgressFill: document.getElementById('scan-progress-fill'),
  btnCancelScan: document.getElementById('btn-cancel-scan'),
  consoleLog: document.getElementById('console-log'),
  btnClearConsole: document.getElementById('btn-clear-console'),
  fileTreeRoot: document.getElementById('file-tree-root'),
  btnStartScan: document.getElementById('btn-start-scan'),
  
  // Bug Hunter
  bugFilesList: document.getElementById('bug-files-list'),
  bugDetailsList: document.getElementById('bug-details-list'),
  bugStatsBadge: document.getElementById('bug-stats-badge'),
  
  // Test Writer
  testFilesList: document.getElementById('test-files-list'),
  testWriterEmptyState: document.getElementById('test-writer-empty-state'),
  testWriterWorkspace: document.getElementById('test-writer-workspace'),
  testWriterSelectedFileLabel: document.getElementById('test-writer-selected-file'),
  testFramework: document.getElementById('test-framework'),
  btnGenerateTest: document.getElementById('btn-generate-test'),
  btnCopyTest: document.getElementById('btn-copy-test'),
  btnSaveTest: document.getElementById('btn-save-test'),
  testCodeBlock: document.getElementById('test-code-block'),
  
  // Web Tester UI
  webDisconnectedAlert: document.getElementById('web-disconnected-alert'),
  webTesterWorkspace: document.getElementById('web-tester-workspace'),
  btnRetryBrowserConn: document.getElementById('btn-retry-browser-conn'),
  webTargetUrlInput: document.getElementById('web-target-url'),
  webTestGoalInput: document.getElementById('web-test-goal'),
  btnStartWebTest: document.getElementById('btn-start-web-test'),
  btnStopWebTest: document.getElementById('btn-stop-web-test'),
  browserScreenshot: document.getElementById('browser-screenshot'),
  browserCanvasOverlay: document.getElementById('browser-canvas-overlay'),
  browserScreenEmpty: document.getElementById('browser-screen-empty'),
  browserViewTabTitle: document.getElementById('browser-view-tab-title'),
  webAgentTimeline: document.getElementById('web-agent-timeline'),
  webPageConsole: document.getElementById('web-page-console'),
  webAgentBugsList: document.getElementById('web-agent-bugs-list'),
  
  // Code Chat
  chatContextFiles: document.getElementById('chat-context-files'),
  chatContextIndicator: document.getElementById('chat-context-indicator'),
  btnResetChat: document.getElementById('btn-reset-chat'),
  chatMessagesContainer: document.getElementById('chat-messages-container'),
  chatUserInput: document.getElementById('chat-user-input'),
  btnSendChat: document.getElementById('btn-send-chat'),
  
  // Settings
  geminiApiKey: document.getElementById('gemini-api-key'),
  geminiModel: document.getElementById('gemini-model'),
  btnSaveSettings: document.getElementById('btn-save-settings'),
  btnRemoveKey: document.getElementById('btn-remove-key')
};

// Supported extensions for text analysis
const SUPPORTED_EXTENSIONS = [
  'js', 'jsx', 'ts', 'tsx', 'py', 'java', 'cpp', 'c', 'h', 'cs', 
  'html', 'css', 'json', 'go', 'rs', 'php', 'rb', 'sh', 'yml', 'yaml', 'md'
];

// Helper: Logging to agent console
function logConsole(message, type = 'info') {
  const line = document.createElement('div');
  line.className = `console-line ${type}`;
  const timestamp = new Date().toLocaleTimeString();
  line.textContent = `[${timestamp}] ${message}`;
  el.consoleLog.appendChild(line);
  el.consoleLog.scrollTop = el.consoleLog.scrollHeight;
}

// Initialize Settings Inputs
function initSettings() {
  if (state.apiKey) {
    el.geminiApiKey.value = '••••••••••••••••••••••••••••••••';
    el.statusDot.classList.add('connected');
    el.statusText.textContent = `Gemini Online (${state.model})`;
    logConsole('Gemini API configured and online.', 'success');
  } else {
    el.geminiApiKey.value = '';
    el.statusDot.classList.remove('connected');
    el.statusText.textContent = 'Gemini Offline';
  }
  el.geminiModel.value = state.model;
}

// Router logic
el.navItems.forEach(item => {
  item.addEventListener('click', (e) => {
    e.preventDefault();
    const viewName = item.getAttribute('data-view');
    switchView(viewName);
  });
});

function switchView(viewName) {
  state.activeView = viewName;
  
  // Update nav active state
  el.navItems.forEach(nav => {
    if (nav.getAttribute('data-view') === viewName) {
      nav.classList.add('active');
    } else {
      nav.classList.remove('active');
    }
  });

  // Show active view, hide others
  el.views.forEach(view => {
    if (view.id === `view-${viewName}`) {
      view.classList.add('active');
    } else {
      view.classList.remove('active');
    }
  });

  // Update top bar title
  const formattedTitle = viewName.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  el.pageTitle.textContent = formattedTitle;

  // Refresh lists if files are loaded
  if (viewName === 'bug-hunter') {
    renderBugHunterView();
  } else if (viewName === 'test-generator') {
    renderTestWriterFiles();
  } else if (viewName === 'code-chat') {
    renderChatFiles();
  } else if (viewName === 'web-tester') {
    checkBrowserConnection();
  }
}

// Save Settings
el.btnSaveSettings.addEventListener('click', () => {
  const key = el.geminiApiKey.value.trim();
  const model = el.geminiModel.value;

  if (key && key !== '••••••••••••••••••••••••••••••••') {
    state.apiKey = key;
    localStorage.setItem('aegis_api_key', key);
  }
  
  state.model = model;
  localStorage.setItem('aegis_model', model);
  
  initSettings();
  logConsole('Settings saved successfully.', 'success');
});

el.btnRemoveKey.addEventListener('click', () => {
  state.apiKey = '';
  localStorage.removeItem('aegis_api_key');
  el.geminiApiKey.value = '';
  initSettings();
  logConsole('API key removed.', 'warn');
});

// Folder Selection Handling
el.folderPicker.addEventListener('click', async () => {
  try {
    if (!window.showDirectoryPicker) {
      alert("Folder selection is not supported in this browser. Please ensure you are opening this page via http://localhost:8000 using Chrome, Edge, or Opera.");
      logConsole("Error: showDirectoryPicker API is not available. Please use http://localhost:8000.", "error");
      return;
    }
    
    logConsole("Requesting folder selection permission...", "info");
    state.directoryHandle = await window.showDirectoryPicker({
      mode: 'readwrite'
    });
    
    state.projectName = state.directoryHandle.name;
    el.activeProjectName.textContent = state.projectName;
    el.workspaceBadge.style.display = 'flex';
    
    logConsole(`Directory loaded: ${state.projectName}. Starting scan...`, "success");
    
    // Scan the directory
    await scanProjectDirectory();
    
  } catch (err) {
    logConsole(`Folder selection cancelled or failed: ${err.message}`, "error");
  }
});

// Recursively scan directories
async function scanProjectDirectory() {
  state.files = {};
  state.bugs = [];
  el.valTotalFiles.textContent = '0';
  el.valTotalBugs.textContent = '0';
  el.valHealthScore.textContent = '100%';
  
  el.folderPickerPanel.style.display = 'none';
  el.scannerStatusPanel.style.display = 'block';
  el.scanHeading.textContent = "Scanning Project Structure...";
  el.scanSubtext.textContent = "Traversing folders...";
  el.scanProgressFill.style.width = "0%";
  state.isScanning = true;
  
  try {
    await traverseDirectory(state.directoryHandle, '');
    
    const fileCount = Object.keys(state.files).length;
    el.valTotalFiles.textContent = fileCount;
    logConsole(`Project structure scan completed. Found ${fileCount} source files.`, 'success');
    
    // Render file tree
    renderFileTree();
    
    // Enable full scan button
    el.btnStartScan.removeAttribute('disabled');
    
    el.folderPickerPanel.style.display = 'block';
    el.scannerStatusPanel.style.display = 'none';
    state.isScanning = false;
    
  } catch (error) {
    logConsole(`Error scanning project: ${error.message}`, 'error');
    el.folderPickerPanel.style.display = 'block';
    el.scannerStatusPanel.style.display = 'none';
    state.isScanning = false;
  }
}

async function traverseDirectory(dirHandle, currentPath) {
  for await (const entry of dirHandle.values()) {
    const entryPath = currentPath ? `${currentPath}/${entry.name}` : entry.name;
    
    // Skip node_modules, .git, venv, .gemini, etc.
    if (['node_modules', '.git', 'venv', '.gemini', '.idea', '.vscode', 'build', 'dist', 'bin', 'obj'].includes(entry.name)) {
      continue;
    }
    
    if (entry.kind === 'directory') {
      await traverseDirectory(entry, entryPath);
    } else if (entry.kind === 'file') {
      const ext = entry.name.split('.').pop().toLowerCase();
      if (SUPPORTED_EXTENSIONS.includes(ext)) {
        state.files[entryPath] = {
          file: await entry.getFile(),
          relativePath: entryPath,
          handle: entry,
          content: null
        };
      }
    }
  }
}

// Render File Tree UI
function renderFileTree() {
  el.fileTreeRoot.innerHTML = '';
  
  const root = {};
  
  // Convert flat path structure to a tree object
  Object.keys(state.files).forEach(path => {
    const parts = path.split('/');
    let currentLevel = root;
    
    parts.forEach((part, index) => {
      const isLast = index === parts.length - 1;
      if (!currentLevel[part]) {
        currentLevel[part] = isLast ? { __file: path } : {};
      }
      currentLevel = currentLevel[part];
    });
  });

  // Helper to build tree HTML
  function buildTreeHTML(node, container, depth = 0) {
    const sortedKeys = Object.keys(node).sort((a, b) => {
      const aIsDir = !node[a].hasOwnProperty('__file');
      const bIsDir = !node[b].hasOwnProperty('__file');
      if (aIsDir && !bIsDir) return -1;
      if (!aIsDir && bIsDir) return 1;
      return a.localeCompare(b);
    });

    sortedKeys.forEach(key => {
      const isFile = node[key].hasOwnProperty('__file');
      const nodeEl = document.createElement('div');
      nodeEl.className = 'tree-node';
      
      const rowEl = document.createElement('div');
      rowEl.className = `tree-row ${isFile ? 'file' : 'directory'}`;
      if (isFile) {
        rowEl.setAttribute('data-path', node[key].__file);
        
        const fileBugs = state.bugs.filter(b => b.file === node[key].__file);
        const bugIndicator = fileBugs.length > 0 ? ` <span style="color:var(--color-critical); font-size:0.75rem;">(● ${fileBugs.length})</span>` : '';
        
        rowEl.innerHTML = `
          <svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          <span>${key}</span>${bugIndicator}
        `;
        
        rowEl.addEventListener('click', () => {
          document.querySelectorAll('.tree-row.file').forEach(r => r.classList.remove('selected'));
          rowEl.classList.add('selected');
          state.selectedFile = node[key].__file;
          logConsole(`Selected file: ${state.selectedFile}`, 'info');
        });
      } else {
        rowEl.innerHTML = `
          <svg viewBox="0 0 24 24"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
          <span><strong>${key}</strong></span>
        `;
      }
      
      nodeEl.appendChild(rowEl);
      
      if (!isFile) {
        const subContainer = document.createElement('div');
        subContainer.style.marginLeft = '12px';
        buildTreeHTML(node[key], subContainer, depth + 1);
        nodeEl.appendChild(subContainer);
      }
      
      container.appendChild(nodeEl);
    });
  }

  buildTreeHTML(root, el.fileTreeRoot);
}

// Clear Console
el.btnClearConsole.addEventListener('click', () => {
  el.consoleLog.innerHTML = '';
  logConsole('Console cleared.', 'info');
});

// Call Gemini API to analyze files or screenshots
async function callGeminiAPI(prompt, fileContent = '', base64Image = '') {
  if (!state.apiKey) {
    throw new Error("Gemini API key is not configured. Please enter it in Settings.");
  }
  
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${state.model}:generateContent?key=${state.apiKey}`;
  
  const parts = [];
  
  // If we have text context or prompt
  parts.push({ text: prompt + (fileContent ? `\n\nContext Data:\n${fileContent}` : '') });
  
  // If we have an image parameter (Web Visual Testing)
  if (base64Image) {
    parts.push({
      inlineData: {
        mimeType: "image/jpeg",
        data: base64Image
      }
    });
  }
  
  const payload = {
    contents: [
      {
        parts: parts
      }
    ],
    generationConfig: {
      temperature: 0.1,
      responseMimeType: "application/json"
    }
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errText = await response.text();
    let errMsg = "API call failed";
    try {
      const parsedErr = JSON.parse(errText);
      errMsg = parsedErr.error.message || errMsg;
    } catch(e) {}
    throw new Error(errMsg);
  }

  const result = await response.json();
  
  if (!result.candidates || result.candidates.length === 0) {
    throw new Error("No responses returned from Gemini.");
  }

  return result.candidates[0].content.parts[0].text;
}

// Full Project Code Scan
el.btnStartScan.addEventListener('click', async () => {
  if (!state.apiKey) {
    alert("Please set your Gemini API Key in Settings first.");
    switchView('settings');
    return;
  }

  const filePaths = Object.keys(state.files);
  if (filePaths.length === 0) {
    alert("No project files loaded to scan.");
    return;
  }

  state.bugs = [];
  el.valTotalBugs.textContent = '0';
  el.valHealthScore.textContent = '100%';
  
  el.folderPickerPanel.style.display = 'none';
  el.scannerStatusPanel.style.display = 'block';
  el.btnStartScan.setAttribute('disabled', 'true');
  state.isScanning = true;
  
  let currentFileIndex = 0;
  
  for (const filePath of filePaths) {
    if (!state.isScanning) {
      logConsole("Scan cancelled by user.", "warn");
      break;
    }
    
    currentFileIndex++;
    const progress = Math.round((currentFileIndex / filePaths.length) * 100);
    el.scanProgressFill.style.width = `${progress}%`;
    el.scanHeading.textContent = `Analyzing Code... (${progress}%)`;
    el.scanSubtext.textContent = `Scanning: ${filePath}`;
    
    logConsole(`Analyzing: ${filePath}...`, 'info');
    
    try {
      const fileEntry = state.files[filePath];
      const file = await fileEntry.handle.getFile();
      const content = await file.text();
      fileEntry.content = content;
      
      const systemPrompt = `
You are Aegis, an expert software developer and security auditor.
Analyze the following source code file carefully. Identify any bugs, security vulnerabilities, logical flaws, memory leaks, performance bottlenecks, or code smells.

File path: ${filePath}

Return your findings ONLY as a JSON array. If no bugs or issues are found, return an empty array [].
Do NOT include markdown wrapping (like \`\`\`json). Just return raw JSON.

Each object in the array MUST contain the following fields:
1. "bug": A short, descriptive title of the issue.
2. "line": The 1-based line number where the issue starts.
3. "severity": One of: "critical" (security flaws, crashes, major logic bugs), "warning" (potential issues, memory leaks, performance bottlenecks), "info" (best practices, lint issues, formatting).
4. "description": A clear explanation of what the issue is, why it occurs, and how to fix it.
5. "originalCode": The exact block of code from the file that needs to be replaced.
6. "fixedCode": The complete replacement block of code that resolves the issue.
`;

      const responseText = await callGeminiAPI(systemPrompt, content);
      
      let findings = [];
      try {
        let cleanedJson = responseText.trim();
        if (cleanedJson.startsWith("```json")) {
          cleanedJson = cleanedJson.substring(7);
        }
        if (cleanedJson.startsWith("```")) {
          cleanedJson = cleanedJson.substring(3);
        }
        if (cleanedJson.endsWith("```")) {
          cleanedJson = cleanedJson.substring(0, cleanedJson.length - 3);
        }
        cleanedJson = cleanedJson.trim();
        
        findings = JSON.parse(cleanedJson);
      } catch (err) {
        logConsole(`Error parsing JSON findings for ${filePath}: ${err.message}`, 'warn');
      }
      
      if (Array.isArray(findings) && findings.length > 0) {
        logConsole(`Found ${findings.length} issues in ${filePath}!`, 'warn');
        findings.forEach(issue => {
          const bugId = 'bug_' + Math.random().toString(36).substr(2, 9);
          state.bugs.push({
            id: bugId,
            file: filePath,
            line: issue.line || 1,
            bug: issue.bug || "Logic Issue",
            severity: issue.severity || "warning",
            description: issue.description || "No description provided.",
            originalCode: issue.originalCode || "",
            fixedCode: issue.fixedCode || ""
          });
        });
        
        el.valTotalBugs.textContent = state.bugs.length;
        
        let penalty = 0;
        state.bugs.forEach(b => {
          if (b.severity === 'critical') penalty += 20;
          else if (b.severity === 'warning') penalty += 8;
          else penalty += 2;
        });
        const score = Math.max(0, 100 - penalty);
        el.valHealthScore.textContent = `${score}%`;
      }
      
      if (currentFileIndex < filePaths.length) {
        await new Promise(resolve => setTimeout(resolve, 2500));
      }
      
    } catch (err) {
      logConsole(`Failed to scan file ${filePath}: ${err.message}`, 'error');
    }
  }
  
  el.folderPickerPanel.style.display = 'block';
  el.scannerStatusPanel.style.display = 'none';
  el.btnStartScan.removeAttribute('disabled');
  state.isScanning = false;
  
  logConsole(`Full scan completed! Found ${state.bugs.length} total bugs.`, 'success');
  renderFileTree();
  
  if (state.bugs.length > 0) {
    switchView('bug-hunter');
  } else {
    alert("Scan complete! No bugs were found. Excellent code quality!");
  }
});

// Cancel Scan
el.btnCancelScan.addEventListener('click', () => {
  state.isScanning = false;
  logConsole("Cancelling scan request...", "warn");
});

// Render Bug Hunter Panels
function renderBugHunterView() {
  el.bugFilesList.innerHTML = '';
  el.bugDetailsList.innerHTML = '';
  el.bugStatsBadge.textContent = `${state.bugs.length} Issues Found`;
  
  if (state.bugs.length === 0) {
    el.bugFilesList.innerHTML = `
      <div class="empty-state" style="padding:30px 10px;">
        <p style="font-size:0.85rem;">No bugs found yet. Run a project scan first.</p>
      </div>
    `;
    el.bugDetailsList.innerHTML = `
      <div class="empty-state">
        <svg viewBox="0 0 24 24"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
        <p style="font-size: 0.9rem;">Run a code scan to detect bugs, code smells, and vulnerabilities in your project files.</p>
      </div>
    `;
    return;
  }

  const buggedFiles = [...new Set(state.bugs.map(b => b.file))];
  
  buggedFiles.forEach(filePath => {
    const fileBugs = state.bugs.filter(b => b.file === filePath);
    
    const item = document.createElement('div');
    item.className = 'tree-row file';
    item.innerHTML = `
      <svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
      <span style="flex-grow:1; word-break: break-all;">${filePath.split('/').pop()}</span>
      <span class="bug-badge critical" style="padding: 1px 6px; font-size: 0.7rem; border-radius: 10px;">${fileBugs.length}</span>
    `;
    
    item.addEventListener('click', () => {
      document.querySelectorAll('#bug-files-list .tree-row').forEach(r => r.classList.remove('selected'));
      item.classList.add('selected');
      renderBugsForFile(filePath);
    });
    
    el.bugFilesList.appendChild(item);
  });
  
  if (buggedFiles.length > 0) {
    el.bugFilesList.firstChild.click();
  }
}

// Render Bug Detail Cards for a selected file
function renderBugsForFile(filePath) {
  el.bugDetailsList.innerHTML = '';
  const fileBugs = state.bugs.filter(b => b.file === filePath);
  
  fileBugs.forEach(bug => {
    const card = document.createElement('div');
    card.className = 'bug-card';
    card.id = `card_${bug.id}`;
    
    card.innerHTML = `
      <div class="bug-card-header">
        <div class="bug-card-title-group">
          <span class="bug-badge ${bug.severity}">${bug.severity}</span>
          <div>
            <div class="bug-title">${bug.bug}</div>
            <div class="bug-file-path">Line ${bug.line} in ${bug.file.split('/').pop()}</div>
          </div>
        </div>
        <svg class="bug-chevron" viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none"><polyline points="6 9 12 15 18 9"/></svg>
      </div>
      <div class="bug-card-body">
        <div class="bug-description">${bug.description}</div>
        
        ${bug.originalCode && bug.fixedCode ? `
        <div class="diff-container">
          <div class="diff-header">
            <span>Proposed Fix</span>
            <span style="font-size: 0.75rem;">Line ${bug.line}</span>
          </div>
          <div class="diff-body">
            <div class="diff-line deletion">
              <span class="diff-prefix">-</span>
              <span class="diff-content">${escapeHTML(bug.originalCode)}</span>
            </div>
            <div class="diff-line addition">
              <span class="diff-prefix">+</span>
              <span class="diff-content">${escapeHTML(bug.fixedCode)}</span>
            </div>
          </div>
        </div>
        
        <div class="diff-actions">
          <button class="btn btn-primary btn-apply-fix" data-id="${bug.id}">Apply Fix</button>
          <button class="btn btn-secondary btn-copy-fix" data-id="${bug.id}">Copy Code</button>
        </div>
        ` : ''}
      </div>
    `;
    
    card.querySelector('.bug-card-header').addEventListener('click', () => {
      card.classList.toggle('expanded');
    });
    
    if (bug.fixedCode) {
      card.querySelector('.btn-copy-fix').addEventListener('click', (e) => {
        e.stopPropagation();
        navigator.clipboard.writeText(bug.fixedCode);
        logConsole(`Copied suggested fix for: "${bug.bug}"`, 'info');
        alert("Code copied to clipboard!");
      });
      
      card.querySelector('.btn-apply-fix').addEventListener('click', async (e) => {
        e.stopPropagation();
        const btn = e.target;
        btn.setAttribute('disabled', 'true');
        btn.textContent = "Applying...";
        
        try {
          const success = await applyBugFix(bug);
          if (success) {
            btn.textContent = "Applied!";
            btn.style.backgroundColor = "var(--color-success)";
            logConsole(`Bug fix applied to file: ${bug.file} at line ${bug.line}`, 'success');
            
            state.bugs = state.bugs.filter(b => b.id !== bug.id);
            
            setTimeout(() => {
              renderBugHunterView();
            }, 1000);
          } else {
            btn.removeAttribute('disabled');
            btn.textContent = "Apply Fix";
          }
        } catch (err) {
          logConsole(`Failed to apply bug fix: ${err.message}`, 'error');
          btn.removeAttribute('disabled');
          btn.textContent = "Apply Fix";
        }
      });
    }
    
    el.bugDetailsList.appendChild(card);
  });
}

// Function to write fixed code directly back to local file
async function applyBugFix(bug) {
  try {
    const fileEntry = state.files[bug.file];
    if (!fileEntry) {
      throw new Error(`File details not found for ${bug.file}`);
    }

    const options = { mode: 'readwrite' };
    if ((await fileEntry.handle.queryPermission(options)) !== 'granted') {
      logConsole(`Requesting write permissions for file: ${bug.file}...`, 'info');
      if ((await fileEntry.handle.requestPermission(options)) !== 'granted') {
        throw new Error("Write permission denied by user.");
      }
    }

    const file = await fileEntry.handle.getFile();
    let content = await file.text();
    
    const normalizedOriginal = bug.originalCode.replace(/\r\n/g, '\n').trim();
    const normalizedFixed = bug.fixedCode.replace(/\r\n/g, '\n');
    const normalizedContent = content.replace(/\r\n/g, '\n');
    
    if (!normalizedContent.includes(normalizedOriginal)) {
      logConsole(`Exact block match failed. Attempting line replace...`, 'warn');
      const lines = normalizedContent.split('\n');
      const index = bug.line - 1;
      
      if (index >= 0 && index < lines.length) {
        logConsole(`Target line contents: "${lines[index]}"`, 'info');
        lines[index] = normalizedFixed;
        content = lines.join('\n');
      } else {
        throw new Error("Could not locate target code inside file. Please apply manually.");
      }
    } else {
      content = normalizedContent.replace(normalizedOriginal, normalizedFixed);
    }
    
    const writable = await fileEntry.handle.createWritable();
    await writable.write(content);
    await writable.close();
    
    fileEntry.content = content;
    return true;
  } catch (err) {
    alert(`Could not write to file: ${err.message}`);
    return false;
  }
}

// HTML Escaping Utility
function escapeHTML(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Test Writer Files list
function renderTestWriterFiles() {
  el.testFilesList.innerHTML = '';
  const filePaths = Object.keys(state.files);
  
  if (filePaths.length === 0) {
    el.testFilesList.innerHTML = `
      <div class="empty-state" style="padding: 30px 10px;">
        <p style="font-size: 0.85rem;">No project loaded. Load a folder first.</p>
      </div>
    `;
    return;
  }

  filePaths.forEach(filePath => {
    const item = document.createElement('div');
    item.className = 'tree-row file';
    if (state.testWriterSelectedFile === filePath) {
      item.classList.add('selected');
    }
    item.innerHTML = `
      <svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
      <span style="word-break: break-all;">${filePath.split('/').pop()}</span>
    `;
    
    item.addEventListener('click', () => {
      document.querySelectorAll('#test-files-list .tree-row').forEach(r => r.classList.remove('selected'));
      item.classList.add('selected');
      selectFileForTestWriter(filePath);
    });
    
    el.testFilesList.appendChild(item);
  });
}

function selectFileForTestWriter(filePath) {
  state.testWriterSelectedFile = filePath;
  el.testWriterSelectedFileLabel.textContent = `Selected File: ${filePath.split('/').pop()}`;
  el.testWriterEmptyState.style.display = 'none';
  el.testWriterWorkspace.style.display = 'flex';
  el.testCodeBlock.textContent = '// Ready to generate tests. Click the button below.';
  el.btnSaveTest.style.display = 'none';
}

// Generate Unit Tests
el.btnGenerateTest.addEventListener('click', async () => {
  if (!state.testWriterSelectedFile) return;
  if (!state.apiKey) {
    alert("Please set your Gemini API Key in Settings first.");
    switchView('settings');
    return;
  }

  el.btnGenerateTest.setAttribute('disabled', 'true');
  el.btnGenerateTest.textContent = 'Generating...';
  el.testCodeBlock.textContent = '// Querying Gemini API, creating test cases...';
  
  try {
    const fileEntry = state.files[state.testWriterSelectedFile];
    const file = await fileEntry.handle.getFile();
    const content = await file.text();
    
    const framework = el.testFramework.value;
    const systemPrompt = `
You are Aegis, an expert software developer.
Write comprehensive unit tests for the following source code file using the "${framework}" framework (or automatic appropriate framework if "auto").
Write robust tests covering happy paths, edge cases, error conditions, and null/empty parameters.

File Name: ${state.testWriterSelectedFile.split('/').pop()}
File Path: ${state.testWriterSelectedFile}

Return ONLY the code contents of the unit test file. Do NOT include markdown styling like \`\`\`javascript or \`\`\`. Do not write explaining intro/outro. Just raw code.
`;

    const generatedCode = await callGeminiAPI(systemPrompt, content);
    
    let cleanedCode = generatedCode.trim();
    if (cleanedCode.startsWith("```")) {
      const firstLineBreak = cleanedCode.indexOf('\n');
      if (firstLineBreak !== -1) {
        cleanedCode = cleanedCode.substring(firstLineBreak + 1);
      }
      if (cleanedCode.endsWith("```")) {
        cleanedCode = cleanedCode.substring(0, cleanedCode.length - 3);
      }
    }
    cleanedCode = cleanedCode.trim();

    el.testCodeBlock.textContent = cleanedCode;
    el.btnSaveTest.style.display = 'block';
    logConsole(`Generated unit tests for ${state.testWriterSelectedFile}`, 'success');
  } catch (err) {
    el.testCodeBlock.textContent = `// Generation failed: ${err.message}`;
    logConsole(`Failed to generate tests: ${err.message}`, 'error');
  } finally {
    el.btnGenerateTest.removeAttribute('disabled');
    el.btnGenerateTest.textContent = 'Generate Tests';
  }
});

// Copy Test Code
el.btnCopyTest.addEventListener('click', () => {
  const codeText = el.testCodeBlock.textContent;
  navigator.clipboard.writeText(codeText);
  alert("Test code copied to clipboard!");
});

// Save Test Code to local directory
el.btnSaveTest.addEventListener('click', async () => {
  if (!state.testWriterSelectedFile) return;
  
  try {
    const parts = state.testWriterSelectedFile.split('/');
    const originalName = parts.pop();
    const nameParts = originalName.split('.');
    const ext = nameParts.pop();
    const base = nameParts.join('.');
    
    let testFileName = '';
    if (ext === 'py') {
      testFileName = `test_${base}.${ext}`;
    } else if (['js', 'jsx', 'ts', 'tsx'].includes(ext)) {
      testFileName = `${base}.test.${ext}`;
    } else {
      testFileName = `${base}Test.${ext}`;
    }
    
    logConsole(`Requesting to save test file: ${testFileName}...`, 'info');
    
    let targetHandle;
    try {
      let currentDir = state.directoryHandle;
      for (let i = 0; i < parts.length; i++) {
        currentDir = await currentDir.getDirectoryHandle(parts[i]);
      }
      targetHandle = await currentDir.getFileHandle(testFileName, { create: true });
    } catch (e) {
      logConsole("Could not locate parent subdirectory. Saving to project root...", "warn");
      targetHandle = await state.directoryHandle.getFileHandle(testFileName, { create: true });
    }
    
    const writable = await targetHandle.createWritable();
    await writable.write(el.testCodeBlock.textContent);
    await writable.close();
    
    logConsole(`Saved test file successfully as ${testFileName}`, 'success');
    alert(`File saved successfully as: ${testFileName}`);
    
    await scanProjectDirectory();
    
  } catch (err) {
    logConsole(`Could not save test file: ${err.message}`, 'error');
    alert(`Error saving test file: ${err.message}`);
  }
});

// Code Chat Files Context rendering
function renderChatFiles() {
  el.chatContextFiles.innerHTML = '';
  const filePaths = Object.keys(state.files);
  
  const generalItem = document.createElement('div');
  generalItem.className = 'tree-row file';
  if (!state.chatSelectedFile) {
    generalItem.classList.add('selected');
  }
  generalItem.innerHTML = `
    <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
    <span>General QA Agent</span>
  `;
  generalItem.addEventListener('click', () => {
    document.querySelectorAll('#chat-context-files .tree-row').forEach(r => r.classList.remove('selected'));
    generalItem.classList.add('selected');
    selectFileForChat(null);
  });
  el.chatContextFiles.appendChild(generalItem);

  if (filePaths.length === 0) {
    return;
  }

  filePaths.forEach(filePath => {
    const item = document.createElement('div');
    item.className = 'tree-row file';
    if (state.chatSelectedFile === filePath) {
      item.classList.add('selected');
    }
    item.innerHTML = `
      <svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
      <span style="word-break: break-all;">${filePath.split('/').pop()}</span>
    `;
    
    item.addEventListener('click', () => {
      document.querySelectorAll('#chat-context-files .tree-row').forEach(r => r.classList.remove('selected'));
      item.classList.add('selected');
      selectFileForChat(filePath);
    });
    
    el.chatContextFiles.appendChild(item);
  });
}

function selectFileForChat(filePath) {
  state.chatSelectedFile = filePath;
  
  if (filePath) {
    el.chatContextIndicator.textContent = `Context: ${filePath.split('/').pop()}`;
    el.chatUserInput.placeholder = `Ask about ${filePath.split('/').pop()}...`;
  } else {
    el.chatContextIndicator.textContent = `Context: General Agent (No File Selected)`;
    el.chatUserInput.placeholder = `Ask anything about coding or system designs...`;
  }
}

// Enable chat inputs when API key is ready
function updateChatState() {
  if (state.apiKey) {
    el.chatUserInput.removeAttribute('disabled');
    el.btnSendChat.removeAttribute('disabled');
  } else {
    el.chatUserInput.setAttribute('disabled', 'true');
    el.btnSendChat.setAttribute('disabled', 'true');
  }
}

// Reset Chat
el.btnResetChat.addEventListener('click', () => {
  state.chatHistory = [];
  el.chatMessagesContainer.innerHTML = `
    <div class="chat-message assistant">
      Hello! I'm Aegis, your AI testing agent. Select a file on the left side to load it into my context, and ask me to explain it, find bugs, optimize it, or explain how to write integrations for it!
    </div>
  `;
  logConsole('Chat history cleared.', 'info');
});

// Send Chat Message
async function sendChatMessage() {
  const query = el.chatUserInput.value.trim();
  if (!query) return;

  appendChatMessage(query, 'user');
  el.chatUserInput.value = '';
  
  const typingEl = document.createElement('div');
  typingEl.className = 'chat-message assistant';
  typingEl.textContent = 'Typing...';
  el.chatMessagesContainer.appendChild(typingEl);
  el.chatMessagesContainer.scrollTop = el.chatMessagesContainer.scrollHeight;

  try {
    let fileContent = '';
    let systemContext = '';
    
    if (state.chatSelectedFile) {
      const fileEntry = state.files[state.chatSelectedFile];
      const file = await fileEntry.handle.getFile();
      fileContent = await file.text();
      
      systemContext = `
You are Aegis, a software development assistant. You have access to the file content of: ${state.chatSelectedFile}.
Below is the content of this file. Use it to answer the user's questions. Be precise, helpful, and provide code examples where relevant.
`;
    } else {
      systemContext = `
You are Aegis, an expert software developer and system architect. Answer the user's software engineering questions.
`;
    }

    let chatPrompt = `${systemContext}\n\n`;
    if (state.chatHistory.length > 0) {
      chatPrompt += `Conversation History:\n`;
      state.chatHistory.forEach(msg => {
        chatPrompt += `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.text}\n`;
      });
    }
    chatPrompt += `\nUser: ${query}\nAssistant:`;

    const assistantResponse = await callGeminiAPI(chatPrompt, fileContent);
    
    typingEl.remove();
    
    appendChatMessage(assistantResponse, 'assistant');
    
    state.chatHistory.push({ role: 'user', text: query });
    state.chatHistory.push({ role: 'assistant', text: assistantResponse });
    
  } catch (err) {
    typingEl.remove();
    appendChatMessage(`Error: ${err.message}`, 'assistant');
    logConsole(`Chat failed: ${err.message}`, 'error');
  }
}

function appendChatMessage(text, role) {
  const msgEl = document.createElement('div');
  msgEl.className = `chat-message ${role}`;
  
  if (role === 'assistant') {
    let formattedText = escapeHTML(text)
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/`(.*?)`/g, '<code style="background-color:hsla(217,100%,80%,0.15); padding: 2px 6px; border-radius: 4px; font-family:var(--font-mono); font-size:0.85em;">$1</code>')
      .replace(/\n/g, '<br>');
      
    msgEl.innerHTML = formattedText;
  } else {
    msgEl.textContent = text;
  }
  
  el.chatMessagesContainer.appendChild(msgEl);
  el.chatMessagesContainer.scrollTop = el.chatMessagesContainer.scrollHeight;
}

el.btnSendChat.addEventListener('click', sendChatMessage);
el.chatUserInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    sendChatMessage();
  }
});


// ==========================================
//          AUTONOMOUS WEB TESTER
// ==========================================

// Check if Edge debugging port 9222 is alive
async function checkBrowserConnection() {
  try {
    const res = await fetch('/browser-api/json/list', {
      method: 'GET'
    });
    
    if (res.ok) {
      state.isBrowserConnected = true;
      el.browserStatusDot.className = 'status-dot connected';
      el.browserStatusText.textContent = 'Browser Connected';
      
      el.webDisconnectedAlert.style.display = 'none';
      el.webTesterWorkspace.style.display = 'grid';
    } else {
      throw new Error();
    }
  } catch (e) {
    state.isBrowserConnected = false;
    el.browserStatusDot.className = 'status-dot';
    el.browserStatusText.textContent = 'Browser Disconnected';
    
    el.webDisconnectedAlert.style.display = 'block';
    el.webTesterWorkspace.style.display = 'none';
  }
}

el.btnRetryBrowserConn.addEventListener('click', checkBrowserConnection);

// Helper to write to Web Tester Console/Timeline
function logWebTimeline(message, type = 'info') {
  const line = document.createElement('div');
  line.className = `web-timeline-item ${type}`;
  
  const time = document.createElement('div');
  time.className = 'web-timeline-time';
  time.textContent = new Date().toLocaleTimeString();
  
  const text = document.createElement('div');
  text.className = 'web-timeline-text';
  text.textContent = message;
  
  line.appendChild(time);
  line.appendChild(text);
  
  el.webAgentTimeline.appendChild(line);
  el.webAgentTimeline.scrollTop = el.webAgentTimeline.scrollHeight;
}

function logWebPageConsole(message, type = 'info') {
  const line = document.createElement('div');
  line.className = `console-line ${type}`;
  const timestamp = new Date().toLocaleTimeString();
  line.textContent = `[${timestamp}] ${message}`;
  el.webPageConsole.appendChild(line);
  el.webPageConsole.scrollTop = el.webPageConsole.scrollHeight;
}

// Send command over Chrome DevTools Protocol WebSocket
function sendCDPCommand(ws, method, params = {}) {
  const id = state.webCdpId++;
  const payload = {
    id,
    method,
    params
  };
  
  return new Promise((resolve, reject) => {
    state.webCdpPromises[id] = { resolve, reject };
    ws.send(JSON.stringify(payload));
  });
}

// Web Tester Agent Action Loop
el.btnStartWebTest.addEventListener('click', async () => {
  if (!state.apiKey) {
    alert("Please set your Gemini API Key in Settings first.");
    switchView('settings');
    return;
  }

  const url = el.webTargetUrlInput.value.trim();
  const goal = el.webTestGoalInput.value.trim();
  
  if (!url) {
    alert("Please enter a website link to test.");
    return;
  }

  state.isWebTesting = true;
  el.btnStartWebTest.setAttribute('disabled', 'true');
  el.btnStopWebTest.removeAttribute('disabled');
  el.webAgentTimeline.innerHTML = '';
  el.webPageConsole.innerHTML = '';
  el.webAgentBugsList.innerHTML = '';
  state.webConsoleLogs = [];
  state.webBugs = [];
  state.webTimelineEvents = [];
  
  el.browserScreenEmpty.style.display = 'none';
  el.browserScreenshot.style.display = 'block';
  el.browserScreenshot.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><rect width="800" height="600" fill="%230c0f16"/><text x="50%" y="50%" fill="white" font-family="sans-serif" font-size="20" text-anchor="middle">Connecting to Browser Sandbox...</text></svg>';
  
  logWebTimeline(`Target URL: ${url}`, 'info');
  logWebTimeline(`Objective: "${goal}"`, 'info');
  
  let ws = null;
  
  try {
    // 1. Fetch available tabs or open a new one
    logWebTimeline("Opening a new debug tab in Microsoft Edge...", "info");
    const tabRes = await fetch('/browser-api/json/new', { method: 'PUT' });
    if (!tabRes.ok) {
      throw new Error("Could not open a new debug tab. Ensure start_edge.ps1 is running.");
    }
    const tabData = await tabRes.json();
    state.webSessionTabId = tabData.id;
    
    const wsUrl = tabData.webSocketDebuggerUrl.replace('localhost:9222', '127.0.0.1:9222');
    logWebTimeline(`Connecting to WebSocket: ${wsUrl}`, "info");
    
    // 2. Open WebSocket connection
    ws = new WebSocket(wsUrl);
    state.webWs = ws;
    
    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      
      // Handle CDP response callbacks
      if (msg.id && state.webCdpPromises[msg.id]) {
        if (msg.error) {
          state.webCdpPromises[msg.id].reject(new Error(msg.error.message));
        } else {
          state.webCdpPromises[msg.id].resolve(msg.result);
        }
        delete state.webCdpPromises[msg.id];
      }
      
      // Capture console API calls
      if (msg.method === 'Runtime.consoleAPICalled') {
        const args = msg.params.args.map(a => a.value !== undefined ? a.value : a.description).join(' ');
        const logType = msg.params.type;
        const msgStr = `[Console ${logType}] ${args}`;
        state.webConsoleLogs.push(msgStr);
        logWebPageConsole(args, logType === 'error' ? 'error' : logType === 'warning' ? 'warn' : 'info');
      }
      
      // Capture script exceptions
      if (msg.method === 'Runtime.exceptionThrown') {
        const exception = msg.params.exceptionDetails.exception.description || msg.params.exceptionDetails.text;
        const msgStr = `[Exception] ${exception}`;
        state.webConsoleLogs.push(msgStr);
        logWebPageConsole(`Unhandled Exception: ${exception}`, 'error');
      }
    };

    ws.onclose = () => {
      logWebTimeline("Browser connection closed.", "warn");
    };

    // Wait for WebSocket open
    await new Promise((resolve, reject) => {
      ws.onopen = resolve;
      ws.onerror = (err) => {
        reject(new Error("WebSocket handshake failed. Edge might be blocking the connection or closed."));
      };
      setTimeout(() => reject(new Error("WebSocket connection timeout (5s)")), 5000);
    });

    logWebTimeline("DevTools session established. Configuring target sandbox...", "success");
    
    // Enable necessary CDP domains
    await sendCDPCommand(ws, 'Page.enable');
    await sendCDPCommand(ws, 'Runtime.enable');
    
    // Navigate to target URL
    logWebTimeline(`Navigating Edge sandbox to: ${url}`, 'action');
    await sendCDPCommand(ws, 'Page.navigate', { url });
    
    // Wait for navigation and load
    await new Promise(resolve => setTimeout(resolve, 4000));
    
    let step = 1;
    const maxSteps = 8;
    
    while (state.isWebTesting && step <= maxSteps) {
      logWebTimeline(`[Step ${step}] Analyzing page view...`, 'info');
      
      // A. Capture page details
      // Get Screenshot
      const screenshotData = await sendCDPCommand(ws, 'Page.captureScreenshot', {
        format: 'jpeg',
        quality: 60
      });
      const base64Img = screenshotData.data;
      el.browserScreenshot.src = `data:image/jpeg;base64,${base64Img}`;
      
      // Get DOM coordinates of interactive elements & title & URL
      const pageEvaluation = await sendCDPCommand(ws, 'Runtime.evaluate', {
        expression: `
          (() => {
            const interactive = [];
            const elList = document.querySelectorAll('button, a, input, select, textarea, [role="button"]');
            
            elList.forEach((el, idx) => {
              const rect = el.getBoundingClientRect();
              if (rect.width > 0 && rect.height > 0) {
                // Get a simple selector
                let selector = el.tagName.toLowerCase();
                if (el.id) {
                  selector = "#" + el.id;
                } else if (el.className) {
                  const classes = Array.from(el.classList).filter(c => !c.includes(':')).join('.');
                  if (classes) selector += "." + classes;
                }
                
                // Get inner details
                interactive.push({
                  id: idx,
                  tag: el.tagName.toLowerCase(),
                  text: el.innerText ? el.innerText.trim().substring(0, 30) : (el.value || el.placeholder || ''),
                  selector: selector,
                  x: Math.round(rect.left + rect.width/2),
                  y: Math.round(rect.top + rect.height/2)
                });
              }
            });
            
            return {
              url: window.location.href,
              title: document.title,
              elements: interactive.slice(0, 35)
            };
          })()
        `,
        returnByValue: true
      });
      
      const pageInfo = pageEvaluation.result.value;
      el.browserViewTabTitle.textContent = pageInfo.title || "Target Sandbox Page";
      
      // B. Query Gemini E2E Auditor
      const systemPrompt = `
You are Aegis AI Web Tester, an autonomous browser QA agent.
Your objective: "${goal}"
Current Page URL: ${pageInfo.url}
Current Page Title: ${pageInfo.title}

Interactive elements found on screen:
${JSON.stringify(pageInfo.elements)}

Captured console logs:
${state.webConsoleLogs.slice(-20).join('\n')}

Review the visual screenshot and elements. Your tasks:
1. Identify any bugs (broken layouts, unrendered images, forms missing, bad texts, console exceptions).
2. Propose the next action to achieve the goal. Select from the elements list, navigate, wait, or stop if done.

Return your response strictly in a JSON object format. Do NOT wrap in markdown backticks. Just raw JSON.
Format:
{
  "bugs": [
    { "title": "Brief title", "description": "Details...", "severity": "critical" | "warning" | "info" }
  ],
  "reasoning": "Explain why you are choosing the next step...",
  "action": {
    "type": "click" | "type" | "navigate" | "wait" | "stop",
    "selector": "CSS selector to target",
    "text": "text to type (if action type is 'type')",
    "url": "URL to navigate to (if action type is 'navigate')",
    "ms": 2000 // duration to wait (if action type is 'wait')
  }
}
`;

      logWebTimeline("Gemini analyzing visual page...", "info");
      const agentResponseText = await callGeminiAPI(systemPrompt, '', base64Img);
      
      // Parse Gemini response
      let result = null;
      try {
        let cleanedJson = agentResponseText.trim();
        if (cleanedJson.startsWith("```json")) cleanedJson = cleanedJson.substring(7);
        if (cleanedJson.startsWith("```")) cleanedJson = cleanedJson.substring(3);
        if (cleanedJson.endsWith("```")) cleanedJson = cleanedJson.substring(0, cleanedJson.length - 3);
        cleanedJson = cleanedJson.trim();
        
        result = JSON.parse(cleanedJson);
      } catch (err) {
        logWebTimeline("Error parsing agent decision JSON.", "error");
        console.error("Gemini failed decision parsing:", agentResponseText);
        break;
      }
      
      // Log reasoning
      logWebTimeline(`Agent Thought: ${result.reasoning}`, "info");
      
      // Log new bugs
      if (Array.isArray(result.bugs) && result.bugs.length > 0) {
        result.bugs.forEach(bug => {
          const isNew = !state.webBugs.some(b => b.title === bug.title);
          if (isNew) {
            state.webBugs.push(bug);
            logWebTimeline(`⚠️ BUG FOUND: [${bug.severity.toUpperCase()}] ${bug.title}`, "error");
            appendWebBugItem(bug, base64Img);
          }
        });
      }
      
      // Handle action
      const act = result.action;
      if (!act || act.type === 'stop') {
        logWebTimeline("Testing objective complete. Agent stopped.", "success");
        break;
      }
      
      if (act.type === 'wait') {
        const ms = act.ms || 2000;
        logWebTimeline(`Waiting for ${ms}ms...`, "info");
        await new Promise(resolve => setTimeout(resolve, ms));
      } else if (act.type === 'navigate') {
        logWebTimeline(`Navigating browser to: ${act.url}`, "action");
        await sendCDPCommand(ws, 'Page.navigate', { url: act.url });
        await new Promise(resolve => setTimeout(resolve, 3500));
      } else if (act.type === 'click') {
        logWebTimeline(`Clicking element: "${act.selector}"`, "action");
        
        // Find click coordinates to render overlay marker
        const matchingEl = pageInfo.elements.find(e => e.selector === act.selector || act.selector.includes(e.selector));
        if (matchingEl) {
          drawClickMarker(matchingEl.x, matchingEl.y);
        }
        
        const evalClick = await sendCDPCommand(ws, 'Runtime.evaluate', {
          expression: `
            (() => {
              const el = document.querySelector(\`${act.selector}\`);
              if (el) {
                el.scrollIntoView({ behavior: 'instant', block: 'center' });
                el.click();
                // Dispatch event also
                el.dispatchEvent(new MouseEvent('click', {bubbles: true}));
                return true;
              }
              return false;
            })()
          `
        });
        
        if (!evalClick.result.value) {
          logWebTimeline(`Failed to click element: "${act.selector}" (Not found on page)`, "error");
        }
        
        await new Promise(resolve => setTimeout(resolve, 2500));
      } else if (act.type === 'type') {
        logWebTimeline(`Typing "${act.text}" in: "${act.selector}"`, "action");
        
        const evalType = await sendCDPCommand(ws, 'Runtime.evaluate', {
          expression: `
            (() => {
              const el = document.querySelector(\`${act.selector}\`);
              if (el) {
                el.scrollIntoView({ behavior: 'instant', block: 'center' });
                el.focus();
                el.value = \`${act.text}\`;
                el.dispatchEvent(new Event('input', { bubbles: true }));
                el.dispatchEvent(new Event('change', { bubbles: true }));
                el.blur();
                return true;
              }
              return false;
            })()
          `
        });
        
        if (!evalType.result.value) {
          logWebTimeline(`Failed to locate type target: "${act.selector}"`, "error");
        }
        
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      step++;
      
      // Delay to avoid hitting API rate limits
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
    
    logWebTimeline("Autonomous web testing completed successfully!", "success");
    
  } catch (err) {
    logWebTimeline(`Web Tester failed: ${err.message}`, 'error');
  } finally {
    // 3. Cleanup WebSocket session
    if (ws) {
      ws.close();
    }
    
    // Keep the browser tab open for inspection after the run completes
    
    state.isWebTesting = false;
    el.btnStartWebTest.removeAttribute('disabled');
    el.btnStopWebTest.setAttribute('disabled', 'true');
  }
});

// Stop Web Testing Agent
el.btnStopWebTest.addEventListener('click', () => {
  state.isWebTesting = false;
  logWebTimeline("Stopping agent execution loop...", "warn");
});

// Append Web Bug card item
function appendWebBugItem(bug, base64Img) {
  if (state.webBugs.length === 1) {
    el.webAgentBugsList.innerHTML = '';
  }
  
  const card = document.createElement('div');
  card.className = 'bug-card';
  card.innerHTML = `
    <div class="bug-card-header">
      <div class="bug-card-title-group">
        <span class="bug-badge ${bug.severity}">${bug.severity}</span>
        <span class="bug-title">${bug.title}</span>
      </div>
      <svg class="bug-chevron" viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none"><polyline points="6 9 12 15 18 9"/></svg>
    </div>
    <div class="bug-card-body">
      <div class="bug-description" style="margin-bottom: 12px;">${bug.description}</div>
      <div style="border: 1px solid var(--border-color); border-radius: 8px; overflow: hidden; width: 100%; max-height: 180px; background-color: #000;">
        <img src="data:image/jpeg;base64,${base64Img}" style="width: 100%; height: 100%; object-fit: contain;" alt="Bug Context Screenshot">
      </div>
    </div>
  `;
  
  card.querySelector('.bug-card-header').addEventListener('click', () => {
    card.classList.toggle('expanded');
  });
  
  el.webAgentBugsList.appendChild(card);
}

// Click marker UI drawer
function drawClickMarker(x, y) {
  const container = el.browserScreenshot.parentElement;
  
  // Calculate relative positions on UI img container
  const imgWidth = el.browserScreenshot.clientWidth;
  const imgHeight = el.browserScreenshot.clientHeight;
  
  // Default values assuming 1920x1080 capture, let's map coordinates
  // standard remote debug is usually 1024x768 inside WebView or tab
  // Let's overlay it
  const marker = document.createElement('div');
  marker.className = 'click-marker';
  
  // Estimate mapping
  const percentX = (x / 1024) * 100;
  const percentY = (y / 768) * 100;
  
  marker.style.left = `${percentX}%`;
  marker.style.top = `${percentY}%`;
  
  el.browserCanvasOverlay.appendChild(marker);
  
  setTimeout(() => {
    marker.remove();
  }, 1200);
}


// App Startup Initializations
function startup() {
  initSettings();
  updateChatState();
  
  // Check browser status on launch
  checkBrowserConnection();
  
  // Set background check for Edge port 9222 every 10 seconds
  setInterval(checkBrowserConnection, 10000);
}

el.btnSaveSettings.addEventListener('click', updateChatState);
el.btnRemoveKey.addEventListener('click', updateChatState);

// Run startup
startup();
