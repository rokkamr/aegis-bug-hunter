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
  webSessionTabId: null,
  
  // Test Case Manager State
  testCases: JSON.parse(localStorage.getItem('aegis_test_cases') || '[]'),
  
  // API Tester State
  apiHistory: JSON.parse(localStorage.getItem('aegis_api_history') || '[]'),
  apiActiveTab: 'headers',
  
  // Accessibility Checker State
  a11yResults: null,
  
  // Performance Analyzer State
  perfResults: null
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
  btnRemoveKey: document.getElementById('btn-remove-key'),
  
  // Test Case Manager
  btnCreateTestCase: document.getElementById('btn-create-test-case'),
  btnAiGenerateCases: document.getElementById('btn-ai-generate-cases'),
  testCaseStoryInput: document.getElementById('test-case-story-input'),
  testCaseListContainer: document.getElementById('test-case-list-container'),
  testCaseFormModal: document.getElementById('test-case-form-modal'),
  tcFormTitle: document.getElementById('tc-form-title'),
  tcFormDescription: document.getElementById('tc-form-description'),
  tcFormSteps: document.getElementById('tc-form-steps'),
  tcFormExpected: document.getElementById('tc-form-expected'),
  tcFormPriority: document.getElementById('tc-form-priority'),
  tcFormCategory: document.getElementById('tc-form-category'),
  btnTcFormSave: document.getElementById('btn-tc-form-save'),
  btnTcFormCancel: document.getElementById('btn-tc-form-cancel'),
  btnExportCsv: document.getElementById('btn-export-csv'),
  btnExportJson: document.getElementById('btn-export-json'),
  tcStatsTotal: document.getElementById('tc-stats-total'),
  tcStatsPass: document.getElementById('tc-stats-pass'),
  tcStatsFail: document.getElementById('tc-stats-fail'),
  tcStatsPending: document.getElementById('tc-stats-pending'),
  
  // API Tester
  apiMethodSelect: document.getElementById('api-method-select'),
  apiUrlInput: document.getElementById('api-url-input'),
  btnSendApi: document.getElementById('btn-send-api'),
  apiHeadersContainer: document.getElementById('api-headers-container'),
  btnAddHeader: document.getElementById('btn-add-header'),
  apiAuthType: document.getElementById('api-auth-type'),
  apiAuthToken: document.getElementById('api-auth-token'),
  apiAuthUsername: document.getElementById('api-auth-username'),
  apiAuthPassword: document.getElementById('api-auth-password'),
  apiBodyEditor: document.getElementById('api-body-editor'),
  apiResponseStatus: document.getElementById('api-response-status'),
  apiResponseTime: document.getElementById('api-response-time'),
  apiResponseBody: document.getElementById('api-response-body'),
  apiResponseHeaders: document.getElementById('api-response-headers'),
  btnAiAnalyzeApi: document.getElementById('btn-ai-analyze-api'),
  apiAiAnalysis: document.getElementById('api-ai-analysis'),
  apiHistoryList: document.getElementById('api-history-list'),
  apiTabsRequest: document.getElementById('api-tabs-request'),
  apiTabsResponse: document.getElementById('api-tabs-response'),
  apiTabsHistory: document.getElementById('api-tabs-history'),
  
  // Accessibility Checker
  a11yInputHtml: document.getElementById('a11y-input-html'),
  a11yInputUrl: document.getElementById('a11y-input-url'),
  btnRunA11yAudit: document.getElementById('btn-run-a11y-audit'),
  a11yScoreDisplay: document.getElementById('a11y-score-display'),
  a11yScoreLabel: document.getElementById('a11y-score-label'),
  a11yIssuesList: document.getElementById('a11y-issues-list'),
  a11ySummaryCritical: document.getElementById('a11y-summary-critical'),
  a11ySummaryWarning: document.getElementById('a11y-summary-warning'),
  a11ySummaryInfo: document.getElementById('a11y-summary-info'),
  
  // Performance Analyzer
  perfUrlInput: document.getElementById('perf-url-input'),
  perfHtmlInput: document.getElementById('perf-html-input'),
  btnRunPerfAudit: document.getElementById('btn-run-perf-audit'),
  perfOverallScore: document.getElementById('perf-overall-score'),
  perfScorePerformance: document.getElementById('perf-score-performance'),
  perfScoreSeo: document.getElementById('perf-score-seo'),
  perfScoreBestpractices: document.getElementById('perf-score-bestpractices'),
  perfChecklistContainer: document.getElementById('perf-checklist-container'),
  perfDetailsContainer: document.getElementById('perf-details-container')
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
  } else if (viewName === 'test-cases') {
    renderTestCases();
    updateTestCaseStats();
  } else if (viewName === 'api-tester') {
    renderApiHistory();
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


// ==========================================
//          SHARED HELPERS
// ==========================================

// Show a loading spinner inside a container
function showModuleLoading(container) {
  if (!container) return;
  const spinner = document.createElement('div');
  spinner.className = 'module-loading-spinner';
  spinner.innerHTML = `
    <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; padding:40px; gap:12px;">
      <div style="width:36px; height:36px; border:3px solid var(--border-color); border-top-color:var(--color-primary); border-radius:50%; animation: spin 0.8s linear infinite;"></div>
      <span style="color:var(--text-secondary); font-size:0.85rem;">Analyzing with AI...</span>
    </div>
  `;
  container.appendChild(spinner);
}

// Remove loading spinner from a container
function hideModuleLoading(container) {
  if (!container) return;
  const spinner = container.querySelector('.module-loading-spinner');
  if (spinner) spinner.remove();
}

// Generic file download helper using Blob + URL.createObjectURL
function downloadFile(filename, content, type) {
  try {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    logConsole(`Downloaded file: ${filename}`, 'success');
  } catch (err) {
    logConsole(`Failed to download file: ${err.message}`, 'error');
  }
}

// Returns human-readable time like '2 min ago', '1 hour ago'
function formatTimeAgo(dateString) {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHr = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHr / 24);

    if (diffSec < 5) return 'just now';
    if (diffSec < 60) return `${diffSec} sec ago`;
    if (diffMin < 60) return `${diffMin} min ago`;
    if (diffHr < 24) return `${diffHr} hour${diffHr > 1 ? 's' : ''} ago`;
    return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
  } catch (err) {
    return 'unknown';
  }
}

// Clean JSON from Gemini response (strips markdown fences)
function cleanGeminiJson(text) {
  let cleaned = text.trim();
  if (cleaned.startsWith('```json')) cleaned = cleaned.substring(7);
  if (cleaned.startsWith('```')) cleaned = cleaned.substring(3);
  if (cleaned.endsWith('```')) cleaned = cleaned.substring(0, cleaned.length - 3);
  return cleaned.trim();
}


// ==========================================
//      MODULE: TEST CASE MANAGER
// ==========================================

// Currently editing test case ID (null = creating new)
let editingTestCaseId = null;

function renderTestCases() {
  if (!el.testCaseListContainer) return;
  el.testCaseListContainer.innerHTML = '';

  if (state.testCases.length === 0) {
    el.testCaseListContainer.innerHTML = `
      <div class="empty-state" style="padding:40px 20px;">
        <svg viewBox="0 0 24 24" width="48" height="48" stroke="currentColor" fill="none" stroke-width="1.5"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
        <p style="font-size:0.9rem; margin-top:12px;">No test cases yet. Create one manually or generate from a user story with AI.</p>
      </div>
    `;
    return;
  }

  state.testCases.forEach(tc => {
    const card = document.createElement('div');
    card.className = 'test-case-card';
    card.setAttribute('data-id', tc.id);

    const priorityColors = {
      critical: 'var(--color-critical)',
      high: 'hsl(30, 90%, 55%)',
      medium: 'hsl(45, 90%, 55%)',
      low: 'hsl(142, 70%, 45%)'
    };

    const statusColors = {
      pass: 'hsl(142, 70%, 45%)',
      fail: 'var(--color-critical)',
      blocked: 'hsl(30, 90%, 55%)',
      skipped: 'hsl(220, 15%, 55%)',
      pending: 'hsl(220, 15%, 45%)'
    };

    const statusLabels = {
      pass: '✓ Passed',
      fail: '✗ Failed',
      blocked: '⊘ Blocked',
      skipped: '⊖ Skipped',
      pending: '◌ Pending'
    };

    const truncatedDesc = tc.description && tc.description.length > 100
      ? tc.description.substring(0, 100) + '...'
      : (tc.description || 'No description');

    card.innerHTML = `
      <div style="display:flex; align-items:flex-start; justify-content:space-between; gap:12px; margin-bottom:10px;">
        <div style="flex:1; min-width:0;">
          <div style="font-weight:600; font-size:0.95rem; color:var(--text-primary); margin-bottom:4px;">${escapeHTML(tc.title)}</div>
          <div style="font-size:0.8rem; color:var(--text-secondary); line-height:1.4;">${escapeHTML(truncatedDesc)}</div>
        </div>
        <div style="display:flex; gap:6px; flex-shrink:0; flex-wrap:wrap; justify-content:flex-end;">
          <span class="tc-priority-badge" style="background:${priorityColors[tc.priority] || priorityColors.medium}; color:#fff; padding:2px 8px; border-radius:10px; font-size:0.7rem; font-weight:600; text-transform:uppercase;">${escapeHTML(tc.priority)}</span>
          <span class="tc-status-badge" style="background:${statusColors[tc.status] || statusColors.pending}; color:#fff; padding:2px 8px; border-radius:10px; font-size:0.7rem; font-weight:600;">${statusLabels[tc.status] || statusLabels.pending}</span>
        </div>
      </div>
      ${tc.category ? `<div style="margin-bottom:10px;"><span style="background:hsla(270, 70%, 60%, 0.15); color:hsl(270, 70%, 70%); padding:2px 8px; border-radius:10px; font-size:0.7rem; font-weight:500;">${escapeHTML(tc.category)}</span></div>` : ''}
      <div style="display:flex; gap:6px; flex-wrap:wrap; border-top:1px solid var(--border-color); padding-top:10px;">
        <button class="btn btn-secondary tc-btn-edit" data-id="${tc.id}" style="font-size:0.75rem; padding:4px 10px;">Edit</button>
        <button class="btn btn-secondary tc-btn-delete" data-id="${tc.id}" style="font-size:0.75rem; padding:4px 10px; color:var(--color-critical);">Delete</button>
        <div style="flex:1;"></div>
        <button class="btn btn-secondary tc-btn-status" data-id="${tc.id}" data-status="pass" style="font-size:0.7rem; padding:3px 8px; color:hsl(142,70%,45%);">Pass</button>
        <button class="btn btn-secondary tc-btn-status" data-id="${tc.id}" data-status="fail" style="font-size:0.7rem; padding:3px 8px; color:var(--color-critical);">Fail</button>
        <button class="btn btn-secondary tc-btn-status" data-id="${tc.id}" data-status="blocked" style="font-size:0.7rem; padding:3px 8px; color:hsl(30,90%,55%);">Blocked</button>
        <button class="btn btn-secondary tc-btn-status" data-id="${tc.id}" data-status="skipped" style="font-size:0.7rem; padding:3px 8px; color:hsl(220,15%,55%);">Skip</button>
      </div>
    `;

    // Edit button
    card.querySelector('.tc-btn-edit').addEventListener('click', (e) => {
      e.stopPropagation();
      openTestCaseForm(tc);
    });

    // Delete button
    card.querySelector('.tc-btn-delete').addEventListener('click', (e) => {
      e.stopPropagation();
      if (confirm(`Delete test case "${tc.title}"?`)) {
        deleteTestCase(tc.id);
      }
    });

    // Status change buttons
    card.querySelectorAll('.tc-btn-status').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        updateTestCaseStatus(btn.getAttribute('data-id'), btn.getAttribute('data-status'));
      });
    });

    el.testCaseListContainer.appendChild(card);
  });
}

function updateTestCaseStats() {
  if (!el.tcStatsTotal) return;
  const total = state.testCases.length;
  const pass = state.testCases.filter(tc => tc.status === 'pass').length;
  const fail = state.testCases.filter(tc => tc.status === 'fail').length;
  const pending = state.testCases.filter(tc => tc.status === 'pending' || !tc.status).length;

  el.tcStatsTotal.textContent = total;
  el.tcStatsPass.textContent = pass;
  el.tcStatsFail.textContent = fail;
  el.tcStatsPending.textContent = pending;
}

function openTestCaseForm(existingCase = null) {
  if (!el.testCaseFormModal) return;

  if (existingCase) {
    editingTestCaseId = existingCase.id;
    if (el.tcFormTitle) el.tcFormTitle.value = existingCase.title || '';
    if (el.tcFormDescription) el.tcFormDescription.value = existingCase.description || '';
    if (el.tcFormSteps) el.tcFormSteps.value = existingCase.steps || '';
    if (el.tcFormExpected) el.tcFormExpected.value = existingCase.expectedResult || '';
    if (el.tcFormPriority) el.tcFormPriority.value = existingCase.priority || 'medium';
    if (el.tcFormCategory) el.tcFormCategory.value = existingCase.category || '';
  } else {
    editingTestCaseId = null;
    if (el.tcFormTitle) el.tcFormTitle.value = '';
    if (el.tcFormDescription) el.tcFormDescription.value = '';
    if (el.tcFormSteps) el.tcFormSteps.value = '';
    if (el.tcFormExpected) el.tcFormExpected.value = '';
    if (el.tcFormPriority) el.tcFormPriority.value = 'medium';
    if (el.tcFormCategory) el.tcFormCategory.value = '';
  }

  el.testCaseFormModal.classList.add('active');
}

function closeTestCaseForm() {
  if (!el.testCaseFormModal) return;
  el.testCaseFormModal.classList.remove('active');
  editingTestCaseId = null;
  if (el.tcFormTitle) el.tcFormTitle.value = '';
  if (el.tcFormDescription) el.tcFormDescription.value = '';
  if (el.tcFormSteps) el.tcFormSteps.value = '';
  if (el.tcFormExpected) el.tcFormExpected.value = '';
  if (el.tcFormPriority) el.tcFormPriority.value = 'medium';
  if (el.tcFormCategory) el.tcFormCategory.value = '';
}

function saveTestCase() {
  const title = el.tcFormTitle ? el.tcFormTitle.value.trim() : '';
  if (!title) {
    alert('Please enter a test case title.');
    return;
  }

  const tcData = {
    title: title,
    description: el.tcFormDescription ? el.tcFormDescription.value.trim() : '',
    steps: el.tcFormSteps ? el.tcFormSteps.value.trim() : '',
    expectedResult: el.tcFormExpected ? el.tcFormExpected.value.trim() : '',
    priority: el.tcFormPriority ? el.tcFormPriority.value : 'medium',
    category: el.tcFormCategory ? el.tcFormCategory.value.trim() : ''
  };

  if (editingTestCaseId) {
    // Update existing
    const idx = state.testCases.findIndex(tc => tc.id === editingTestCaseId);
    if (idx !== -1) {
      state.testCases[idx] = { ...state.testCases[idx], ...tcData };
      logConsole(`Updated test case: "${title}"`, 'success');
    }
  } else {
    // Create new
    const newCase = {
      id: 'tc_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      ...tcData,
      status: 'pending',
      createdAt: new Date().toISOString(),
      executedAt: null,
      notes: ''
    };
    state.testCases.push(newCase);
    logConsole(`Created test case: "${title}"`, 'success');
  }

  localStorage.setItem('aegis_test_cases', JSON.stringify(state.testCases));
  closeTestCaseForm();
  renderTestCases();
  updateTestCaseStats();
}

function deleteTestCase(id) {
  state.testCases = state.testCases.filter(tc => tc.id !== id);
  localStorage.setItem('aegis_test_cases', JSON.stringify(state.testCases));
  renderTestCases();
  updateTestCaseStats();
  logConsole(`Deleted test case: ${id}`, 'info');
}

function updateTestCaseStatus(id, newStatus) {
  const tc = state.testCases.find(tc => tc.id === id);
  if (tc) {
    tc.status = newStatus;
    tc.executedAt = new Date().toISOString();
    localStorage.setItem('aegis_test_cases', JSON.stringify(state.testCases));
    renderTestCases();
    updateTestCaseStats();
    logConsole(`Test case "${tc.title}" marked as ${newStatus}`, 'info');
  }
}

async function aiGenerateTestCases() {
  const userStory = el.testCaseStoryInput ? el.testCaseStoryInput.value.trim() : '';
  if (!userStory) {
    alert('Please enter a user story or feature description to generate test cases from.');
    return;
  }
  if (!state.apiKey) {
    alert('Please set your Gemini API Key in Settings first.');
    switchView('settings');
    return;
  }

  if (el.btnAiGenerateCases) {
    el.btnAiGenerateCases.setAttribute('disabled', 'true');
    el.btnAiGenerateCases.textContent = 'Generating...';
  }
  showModuleLoading(el.testCaseListContainer);

  try {
    const prompt = `Generate manual test cases for the following user story/feature. Return ONLY a JSON array where each object has: title, description, steps (numbered string), expectedResult, priority (critical/high/medium/low), category. User story: ${userStory}`;
    const responseText = await callGeminiAPI(prompt);
    const cleaned = cleanGeminiJson(responseText);
    const generated = JSON.parse(cleaned);

    if (Array.isArray(generated) && generated.length > 0) {
      generated.forEach(item => {
        const newCase = {
          id: 'tc_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
          title: item.title || 'Untitled Test Case',
          description: item.description || '',
          steps: item.steps || '',
          expectedResult: item.expectedResult || '',
          priority: item.priority || 'medium',
          category: item.category || '',
          status: 'pending',
          createdAt: new Date().toISOString(),
          executedAt: null,
          notes: ''
        };
        state.testCases.push(newCase);
      });

      localStorage.setItem('aegis_test_cases', JSON.stringify(state.testCases));
      logConsole(`AI generated ${generated.length} test cases from user story.`, 'success');
    } else {
      logConsole('AI returned no test cases. Try a more detailed user story.', 'warn');
    }
  } catch (err) {
    logConsole(`AI test case generation failed: ${err.message}`, 'error');
  } finally {
    hideModuleLoading(el.testCaseListContainer);
    if (el.btnAiGenerateCases) {
      el.btnAiGenerateCases.removeAttribute('disabled');
      el.btnAiGenerateCases.textContent = 'AI Generate';
    }
    renderTestCases();
    updateTestCaseStats();
  }
}

function exportTestCasesCSV() {
  if (state.testCases.length === 0) {
    alert('No test cases to export.');
    return;
  }

  const headers = ['ID', 'Title', 'Description', 'Steps', 'Expected Result', 'Priority', 'Category', 'Status', 'Created At', 'Executed At'];
  const csvRows = [headers.join(',')];

  state.testCases.forEach(tc => {
    const row = [
      tc.id,
      `"${(tc.title || '').replace(/"/g, '""')}"`,
      `"${(tc.description || '').replace(/"/g, '""')}"`,
      `"${(tc.steps || '').replace(/"/g, '""').replace(/\n/g, ' | ')}"`,
      `"${(tc.expectedResult || '').replace(/"/g, '""')}"`,
      tc.priority || '',
      `"${(tc.category || '').replace(/"/g, '""')}"`,
      tc.status || 'pending',
      tc.createdAt || '',
      tc.executedAt || ''
    ];
    csvRows.push(row.join(','));
  });

  downloadFile('aegis_test_cases.csv', csvRows.join('\n'), 'text/csv');
}

function exportTestCasesJSON() {
  if (state.testCases.length === 0) {
    alert('No test cases to export.');
    return;
  }
  downloadFile('aegis_test_cases.json', JSON.stringify(state.testCases, null, 2), 'application/json');
}

function initTestCaseManager() {
  // Wire up event listeners (with null checks)
  if (el.btnCreateTestCase) {
    el.btnCreateTestCase.addEventListener('click', () => openTestCaseForm(null));
  }
  if (el.btnAiGenerateCases) {
    el.btnAiGenerateCases.addEventListener('click', aiGenerateTestCases);
  }
  if (el.btnTcFormSave) {
    el.btnTcFormSave.addEventListener('click', saveTestCase);
  }
  if (el.btnTcFormCancel) {
    el.btnTcFormCancel.addEventListener('click', closeTestCaseForm);
  }
  if (el.btnExportCsv) {
    el.btnExportCsv.addEventListener('click', exportTestCasesCSV);
  }
  if (el.btnExportJson) {
    el.btnExportJson.addEventListener('click', exportTestCasesJSON);
  }

  // Close modal when clicking on the overlay background
  if (el.testCaseFormModal) {
    el.testCaseFormModal.addEventListener('click', (e) => {
      if (e.target === el.testCaseFormModal) {
        closeTestCaseForm();
      }
    });
  }

  // Initial render
  renderTestCases();
  updateTestCaseStats();
}


// ==========================================
//      MODULE: API TESTER
// ==========================================

// Store last request/response for AI analysis
let lastApiRequest = null;
let lastApiResponse = null;

function addHeaderRow(key = '', value = '') {
  if (!el.apiHeadersContainer) return;

  const row = document.createElement('div');
  row.className = 'api-header-row';
  row.style.cssText = 'display:flex; gap:8px; margin-bottom:6px; align-items:center;';

  row.innerHTML = `
    <input type="text" class="form-input api-header-key" placeholder="Header name" value="${escapeHTML(key)}" style="flex:1; font-size:0.85rem; padding:6px 10px;">
    <input type="text" class="form-input api-header-value" placeholder="Value" value="${escapeHTML(value)}" style="flex:1; font-size:0.85rem; padding:6px 10px;">
    <button class="btn btn-secondary api-header-remove" style="padding:4px 8px; font-size:0.8rem; color:var(--color-critical); flex-shrink:0;">✕</button>
  `;

  row.querySelector('.api-header-remove').addEventListener('click', () => {
    removeHeaderRow(row);
  });

  el.apiHeadersContainer.appendChild(row);
}

function removeHeaderRow(rowEl) {
  if (rowEl && rowEl.parentElement) {
    rowEl.remove();
  }
}

function toggleAuthFields() {
  if (!el.apiAuthType) return;
  const authType = el.apiAuthType.value;

  // Hide all auth fields first
  if (el.apiAuthToken) el.apiAuthToken.style.display = 'none';
  if (el.apiAuthUsername) el.apiAuthUsername.style.display = 'none';
  if (el.apiAuthPassword) el.apiAuthPassword.style.display = 'none';

  if (authType === 'bearer' || authType === 'apikey') {
    if (el.apiAuthToken) el.apiAuthToken.style.display = 'block';
  } else if (authType === 'basic') {
    if (el.apiAuthUsername) el.apiAuthUsername.style.display = 'block';
    if (el.apiAuthPassword) el.apiAuthPassword.style.display = 'block';
  }
  // 'none' — everything stays hidden
}

async function sendApiRequest() {
  if (!el.apiMethodSelect || !el.apiUrlInput) return;

  const method = el.apiMethodSelect.value || 'GET';
  const url = el.apiUrlInput.value.trim();

  if (!url) {
    alert('Please enter a request URL.');
    return;
  }

  // Collect headers from rows
  const headers = {};
  if (el.apiHeadersContainer) {
    el.apiHeadersContainer.querySelectorAll('.api-header-row').forEach(row => {
      const key = row.querySelector('.api-header-key')?.value?.trim();
      const value = row.querySelector('.api-header-value')?.value?.trim();
      if (key) headers[key] = value || '';
    });
  }

  // Add auth headers
  if (el.apiAuthType) {
    const authType = el.apiAuthType.value;
    if (authType === 'bearer') {
      const token = el.apiAuthToken ? el.apiAuthToken.value.trim() : '';
      if (token) headers['Authorization'] = `Bearer ${token}`;
    } else if (authType === 'basic') {
      const username = el.apiAuthUsername ? el.apiAuthUsername.value.trim() : '';
      const password = el.apiAuthPassword ? el.apiAuthPassword.value.trim() : '';
      if (username) headers['Authorization'] = `Basic ${btoa(username + ':' + password)}`;
    } else if (authType === 'apikey') {
      const token = el.apiAuthToken ? el.apiAuthToken.value.trim() : '';
      if (token) headers['X-API-Key'] = token;
    }
  }

  // Get body
  const body = el.apiBodyEditor ? el.apiBodyEditor.value.trim() : '';

  // Build fetch options
  const fetchOptions = { method, headers };
  if (['POST', 'PUT', 'PATCH'].includes(method) && body) {
    fetchOptions.body = body;
  }

  // UI feedback
  if (el.btnSendApi) {
    el.btnSendApi.setAttribute('disabled', 'true');
    el.btnSendApi.textContent = 'Sending...';
  }
  if (el.apiResponseStatus) el.apiResponseStatus.textContent = '...';
  if (el.apiResponseTime) el.apiResponseTime.textContent = '...';
  if (el.apiResponseBody) el.apiResponseBody.textContent = 'Waiting for response...';
  if (el.apiResponseHeaders) el.apiResponseHeaders.textContent = '';

  const startTime = performance.now();

  try {
    const response = await fetch(url, fetchOptions);
    const endTime = performance.now();
    const responseTime = Math.round(endTime - startTime);

    const statusCode = response.status;
    const statusText = response.statusText;
    let responseBody = '';

    try {
      responseBody = await response.text();
    } catch (e) {
      responseBody = '[Could not read response body]';
    }

    // Format response body (try pretty-print JSON)
    let formattedBody = responseBody;
    try {
      const parsed = JSON.parse(responseBody);
      formattedBody = JSON.stringify(parsed, null, 2);
    } catch (e) {
      // Not JSON, display as-is
    }

    // Collect response headers
    const responseHeaders = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });
    const headersText = Object.entries(responseHeaders).map(([k, v]) => `${k}: ${v}`).join('\n');

    // Display results
    if (el.apiResponseStatus) {
      let statusColor = 'hsl(142, 70%, 45%)'; // green for 2xx
      if (statusCode >= 300 && statusCode < 400) statusColor = 'hsl(45, 90%, 55%)';
      if (statusCode >= 400) statusColor = 'var(--color-critical)';
      el.apiResponseStatus.innerHTML = `<span class="api-status-badge" style="background:${statusColor}; color:#fff; padding:2px 10px; border-radius:10px; font-weight:600; font-size:0.85rem;">${statusCode} ${statusText}</span>`;
    }
    if (el.apiResponseTime) {
      el.apiResponseTime.textContent = `${responseTime}ms`;
    }
    if (el.apiResponseBody) {
      el.apiResponseBody.textContent = formattedBody;
    }
    if (el.apiResponseHeaders) {
      el.apiResponseHeaders.textContent = headersText || 'No headers captured (CORS may restrict access)';
    }

    // Store for AI analysis
    lastApiRequest = { method, url, headers, body };
    lastApiResponse = { status: statusCode, statusText, body: formattedBody, headers: responseHeaders, responseTime };

    // Add to history
    const historyEntry = {
      id: 'api_' + Date.now(),
      method,
      url,
      headers,
      body,
      status: statusCode,
      responseTime,
      responseBody: formattedBody.substring(0, 2000), // limit storage
      timestamp: new Date().toISOString()
    };
    state.apiHistory.unshift(historyEntry);
    if (state.apiHistory.length > 50) state.apiHistory = state.apiHistory.slice(0, 50);
    localStorage.setItem('aegis_api_history', JSON.stringify(state.apiHistory));
    renderApiHistory();

    logConsole(`API Request: ${method} ${url} → ${statusCode} (${responseTime}ms)`, 'success');

  } catch (err) {
    const endTime = performance.now();
    const responseTime = Math.round(endTime - startTime);

    // Handle CORS errors and network errors gracefully
    if (el.apiResponseStatus) {
      el.apiResponseStatus.innerHTML = `<span class="api-status-badge" style="background:var(--color-critical); color:#fff; padding:2px 10px; border-radius:10px; font-weight:600; font-size:0.85rem;">Error</span>`;
    }
    if (el.apiResponseTime) {
      el.apiResponseTime.textContent = `${responseTime}ms`;
    }
    if (el.apiResponseBody) {
      el.apiResponseBody.textContent = `Request failed: ${err.message}\n\nThis is likely a CORS error. The target server does not allow cross-origin requests from this domain.\n\nTo resolve:\n1. Use a CORS proxy (e.g., cors-anywhere)\n2. Test APIs that have CORS enabled\n3. Use a browser extension to disable CORS for testing`;
    }

    lastApiRequest = { method, url, headers, body };
    lastApiResponse = { status: 0, statusText: 'Network Error', body: err.message, headers: {}, responseTime };

    logConsole(`API Request failed: ${method} ${url} — ${err.message}`, 'error');
  } finally {
    if (el.btnSendApi) {
      el.btnSendApi.removeAttribute('disabled');
      el.btnSendApi.textContent = 'Send';
    }
  }
}

function renderApiHistory() {
  if (!el.apiHistoryList) return;
  el.apiHistoryList.innerHTML = '';

  if (state.apiHistory.length === 0) {
    el.apiHistoryList.innerHTML = `
      <div class="empty-state" style="padding:30px 10px;">
        <p style="font-size:0.85rem;">No request history yet. Send a request to get started.</p>
      </div>
    `;
    return;
  }

  state.apiHistory.forEach(entry => {
    const item = document.createElement('div');
    item.className = 'api-history-item';
    item.style.cssText = 'display:flex; align-items:center; gap:10px; padding:10px 12px; border-bottom:1px solid var(--border-color); cursor:pointer; transition:background 0.2s;';

    const methodColors = {
      GET: 'hsl(142, 70%, 45%)',
      POST: 'hsl(217, 90%, 60%)',
      PUT: 'hsl(30, 90%, 55%)',
      PATCH: 'hsl(45, 90%, 55%)',
      DELETE: 'var(--color-critical)'
    };

    let statusColor = 'hsl(142, 70%, 45%)';
    if (entry.status >= 300 && entry.status < 400) statusColor = 'hsl(45, 90%, 55%)';
    if (entry.status >= 400 || entry.status === 0) statusColor = 'var(--color-critical)';

    const truncatedUrl = entry.url.length > 50 ? entry.url.substring(0, 50) + '...' : entry.url;

    item.innerHTML = `
      <span class="api-method-badge" style="background:${methodColors[entry.method] || 'var(--text-secondary)'}; color:#fff; padding:2px 6px; border-radius:4px; font-size:0.7rem; font-weight:700; min-width:42px; text-align:center;">${entry.method}</span>
      <span style="flex:1; font-size:0.8rem; color:var(--text-secondary); overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${escapeHTML(entry.url)}">${escapeHTML(truncatedUrl)}</span>
      <span style="color:${statusColor}; font-size:0.75rem; font-weight:600;">${entry.status || 'ERR'}</span>
      <span style="color:var(--text-secondary); font-size:0.7rem;">${formatTimeAgo(entry.timestamp)}</span>
    `;

    // Clicking replays the request config
    item.addEventListener('click', () => {
      if (el.apiMethodSelect) el.apiMethodSelect.value = entry.method;
      if (el.apiUrlInput) el.apiUrlInput.value = entry.url;
      if (el.apiBodyEditor) el.apiBodyEditor.value = entry.body || '';

      // Clear existing headers and add from history
      if (el.apiHeadersContainer) el.apiHeadersContainer.innerHTML = '';
      if (entry.headers && typeof entry.headers === 'object') {
        Object.entries(entry.headers).forEach(([k, v]) => addHeaderRow(k, v));
      }
      if (Object.keys(entry.headers || {}).length === 0) {
        addHeaderRow('', '');
      }

      logConsole(`Loaded request from history: ${entry.method} ${entry.url}`, 'info');
    });

    item.addEventListener('mouseenter', () => { item.style.background = 'hsla(217, 100%, 80%, 0.05)'; });
    item.addEventListener('mouseleave', () => { item.style.background = 'transparent'; });

    el.apiHistoryList.appendChild(item);
  });
}

async function aiAnalyzeApiResponse() {
  if (!lastApiRequest || !lastApiResponse) {
    alert('Send a request first before running AI analysis.');
    return;
  }
  if (!state.apiKey) {
    alert('Please set your Gemini API Key in Settings first.');
    switchView('settings');
    return;
  }

  if (el.btnAiAnalyzeApi) {
    el.btnAiAnalyzeApi.setAttribute('disabled', 'true');
    el.btnAiAnalyzeApi.textContent = 'Analyzing...';
  }
  if (el.apiAiAnalysis) {
    el.apiAiAnalysis.innerHTML = '';
    showModuleLoading(el.apiAiAnalysis);
  }

  try {
    const prompt = `Analyze this API request and response for issues. Check for: incorrect status codes, missing security headers, data validation issues, error handling, rate limiting headers, CORS configuration. Request: ${lastApiRequest.method} ${lastApiRequest.url} Headers: ${JSON.stringify(lastApiRequest.headers)} Body: ${lastApiRequest.body || 'None'} Response Status: ${lastApiResponse.status} Response: ${lastApiResponse.body ? lastApiResponse.body.substring(0, 3000) : 'Empty'}. Provide a detailed analysis with severity ratings. Return the analysis as a JSON object with: summary (string), issues (array of objects with severity [critical/warning/info], title, description, recommendation).`;

    const responseText = await callGeminiAPI(prompt);
    const cleaned = cleanGeminiJson(responseText);

    hideModuleLoading(el.apiAiAnalysis);

    let analysis;
    try {
      analysis = JSON.parse(cleaned);
    } catch (e) {
      // If JSON parsing fails, display as formatted text
      if (el.apiAiAnalysis) {
        el.apiAiAnalysis.innerHTML = `<div style="padding:16px; font-size:0.85rem; color:var(--text-secondary); line-height:1.6; white-space:pre-wrap;">${escapeHTML(cleaned)}</div>`;
      }
      return;
    }

    if (el.apiAiAnalysis) {
      let html = '';

      if (analysis.summary) {
        html += `<div style="padding:12px 16px; background:hsla(217, 100%, 80%, 0.05); border-radius:8px; margin-bottom:12px; font-size:0.85rem; color:var(--text-primary); line-height:1.5;">${escapeHTML(analysis.summary)}</div>`;
      }

      if (Array.isArray(analysis.issues)) {
        analysis.issues.forEach(issue => {
          const sevColors = { critical: 'var(--color-critical)', warning: 'hsl(45, 90%, 55%)', info: 'hsl(217, 90%, 60%)' };
          html += `
            <div style="padding:12px 16px; border-left:3px solid ${sevColors[issue.severity] || sevColors.info}; background:hsla(217, 100%, 80%, 0.03); border-radius:0 8px 8px 0; margin-bottom:8px;">
              <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;">
                <span style="background:${sevColors[issue.severity] || sevColors.info}; color:#fff; padding:1px 6px; border-radius:8px; font-size:0.7rem; font-weight:600; text-transform:uppercase;">${escapeHTML(issue.severity)}</span>
                <span style="font-weight:600; font-size:0.85rem; color:var(--text-primary);">${escapeHTML(issue.title)}</span>
              </div>
              <div style="font-size:0.8rem; color:var(--text-secondary); line-height:1.4; margin-bottom:4px;">${escapeHTML(issue.description)}</div>
              ${issue.recommendation ? `<div style="font-size:0.78rem; color:hsl(142, 70%, 55%); font-style:italic;">💡 ${escapeHTML(issue.recommendation)}</div>` : ''}
            </div>
          `;
        });
      }

      el.apiAiAnalysis.innerHTML = html || '<div style="padding:16px; color:var(--text-secondary); font-size:0.85rem;">No issues found.</div>';
    }

    logConsole('AI API analysis completed.', 'success');
  } catch (err) {
    hideModuleLoading(el.apiAiAnalysis);
    if (el.apiAiAnalysis) {
      el.apiAiAnalysis.innerHTML = `<div style="padding:16px; color:var(--color-critical); font-size:0.85rem;">Analysis failed: ${escapeHTML(err.message)}</div>`;
    }
    logConsole(`AI API analysis failed: ${err.message}`, 'error');
  } finally {
    if (el.btnAiAnalyzeApi) {
      el.btnAiAnalyzeApi.removeAttribute('disabled');
      el.btnAiAnalyzeApi.textContent = 'AI Analyze';
    }
  }
}

function initApiTester() {
  // Send request button
  if (el.btnSendApi) {
    el.btnSendApi.addEventListener('click', sendApiRequest);
  }

  // Add header row button
  if (el.btnAddHeader) {
    el.btnAddHeader.addEventListener('click', () => addHeaderRow());
  }

  // AI analyze button
  if (el.btnAiAnalyzeApi) {
    el.btnAiAnalyzeApi.addEventListener('click', aiAnalyzeApiResponse);
  }

  // Auth type change
  if (el.apiAuthType) {
    el.apiAuthType.addEventListener('change', toggleAuthFields);
    toggleAuthFields(); // Set initial state
  }

  // Tab switching
  const apiTabs = document.querySelectorAll('.api-tab');
  const apiTabContents = document.querySelectorAll('.api-tab-content');
  apiTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      apiTabs.forEach(t => t.classList.remove('active'));
      apiTabContents.forEach(c => c.classList.remove('active'));
      tab.classList.add('active');
      const targetId = tab.getAttribute('data-tab');
      if (targetId) {
        const targetContent = document.getElementById(targetId);
        if (targetContent) targetContent.classList.add('active');
      }
    });
  });

  // Add one default header row
  addHeaderRow('Content-Type', 'application/json');

  // Render history on load
  renderApiHistory();
}


// ==========================================
//      MODULE: ACCESSIBILITY CHECKER
// ==========================================

async function runAccessibilityAudit() {
  let html = el.a11yInputHtml ? el.a11yInputHtml.value.trim() : '';
  const urlInput = el.a11yInputUrl ? el.a11yInputUrl.value.trim() : '';

  if (!html && !urlInput) {
    alert('Please enter HTML code or a URL to analyze.');
    return;
  }

  if (!html && urlInput) {
    // Attempt to fetch HTML from URL
    try {
      const res = await fetch(urlInput);
      html = await res.text();
    } catch (err) {
      alert(`Could not fetch HTML from URL: ${err.message}. This may be due to CORS restrictions. Try pasting the HTML directly.`);
      logConsole(`Failed to fetch URL for accessibility audit: ${err.message}`, 'error');
      return;
    }
  }

  if (!state.apiKey) {
    alert('Please set your Gemini API Key in Settings first.');
    switchView('settings');
    return;
  }

  if (el.btnRunA11yAudit) {
    el.btnRunA11yAudit.setAttribute('disabled', 'true');
    el.btnRunA11yAudit.textContent = 'Auditing...';
  }

  // Clear previous results and show loading
  if (el.a11yIssuesList) {
    el.a11yIssuesList.innerHTML = '';
    showModuleLoading(el.a11yIssuesList);
  }

  try {
    // Limit HTML to avoid token limits
    const truncatedHtml = html.length > 15000 ? html.substring(0, 15000) + '\n<!-- truncated -->' : html;

    const prompt = `You are a WCAG 2.1 accessibility expert. Analyze this HTML for accessibility issues. Return ONLY a JSON object with: score (0-100 integer), issues (array of objects with: severity [critical/warning/info], title, description, wcagRef [e.g. WCAG 1.1.1], element [the problematic HTML snippet], suggestion). Be thorough and check: alt text, ARIA labels, form labels, heading hierarchy, color contrast hints, keyboard navigation, semantic HTML, lang attribute, skip links, focus management. HTML: ${truncatedHtml}`;

    const responseText = await callGeminiAPI(prompt);
    const cleaned = cleanGeminiJson(responseText);
    const data = JSON.parse(cleaned);

    state.a11yResults = data;
    hideModuleLoading(el.a11yIssuesList);
    renderA11yResults(data);

    logConsole(`Accessibility audit completed. Score: ${data.score}/100, Issues: ${data.issues ? data.issues.length : 0}`, 'success');
  } catch (err) {
    hideModuleLoading(el.a11yIssuesList);
    if (el.a11yIssuesList) {
      el.a11yIssuesList.innerHTML = `<div style="padding:20px; color:var(--color-critical); font-size:0.85rem;">Audit failed: ${escapeHTML(err.message)}</div>`;
    }
    logConsole(`Accessibility audit failed: ${err.message}`, 'error');
  } finally {
    if (el.btnRunA11yAudit) {
      el.btnRunA11yAudit.removeAttribute('disabled');
      el.btnRunA11yAudit.textContent = 'Run Audit';
    }
  }
}

function renderA11yResults(data) {
  const score = typeof data.score === 'number' ? data.score : 0;
  const issues = Array.isArray(data.issues) ? data.issues : [];

  // Determine score color
  let scoreColor = 'hsl(142, 70%, 45%)'; // good
  if (score < 90) scoreColor = 'hsl(38, 90%, 50%)'; // average
  if (score < 50) scoreColor = 'hsl(0, 84%, 60%)'; // poor

  // Update score gauge
  if (el.a11yScoreDisplay) {
    el.a11yScoreDisplay.style.background = `conic-gradient(${scoreColor} ${score * 3.6}deg, hsla(220, 15%, 25%, 0.5) ${score * 3.6}deg)`;
    el.a11yScoreDisplay.innerHTML = `<span style="font-size:1.8rem; font-weight:700; color:${scoreColor};">${score}</span>`;
  }
  if (el.a11yScoreLabel) {
    const label = score >= 90 ? 'Excellent' : score >= 70 ? 'Good' : score >= 50 ? 'Needs Work' : 'Poor';
    el.a11yScoreLabel.textContent = label;
    el.a11yScoreLabel.style.color = scoreColor;
  }

  // Update summary counts
  const criticalCount = issues.filter(i => i.severity === 'critical').length;
  const warningCount = issues.filter(i => i.severity === 'warning').length;
  const infoCount = issues.filter(i => i.severity === 'info').length;

  if (el.a11ySummaryCritical) el.a11ySummaryCritical.textContent = criticalCount;
  if (el.a11ySummaryWarning) el.a11ySummaryWarning.textContent = warningCount;
  if (el.a11ySummaryInfo) el.a11ySummaryInfo.textContent = infoCount;

  // Render issue cards (sorted by severity: critical first)
  if (!el.a11yIssuesList) return;
  el.a11yIssuesList.innerHTML = '';

  if (issues.length === 0) {
    el.a11yIssuesList.innerHTML = `
      <div class="empty-state" style="padding:30px 20px;">
        <p style="font-size:0.9rem; color:hsl(142, 70%, 55%);">🎉 No accessibility issues found! Great work.</p>
      </div>
    `;
    return;
  }

  const severityOrder = { critical: 0, warning: 1, info: 2 };
  const sortedIssues = [...issues].sort((a, b) => (severityOrder[a.severity] || 2) - (severityOrder[b.severity] || 2));

  sortedIssues.forEach(issue => {
    const sevColors = {
      critical: { bg: 'hsla(0, 84%, 60%, 0.1)', border: 'hsl(0, 84%, 60%)', text: 'hsl(0, 84%, 70%)' },
      warning: { bg: 'hsla(38, 90%, 50%, 0.1)', border: 'hsl(38, 90%, 50%)', text: 'hsl(38, 90%, 65%)' },
      info: { bg: 'hsla(217, 90%, 60%, 0.1)', border: 'hsl(217, 90%, 60%)', text: 'hsl(217, 90%, 70%)' }
    };
    const colors = sevColors[issue.severity] || sevColors.info;

    const card = document.createElement('div');
    card.className = `a11y-issue-card a11y-severity-${issue.severity}`;
    card.style.cssText = `padding:14px 16px; border-left:3px solid ${colors.border}; background:${colors.bg}; border-radius:0 8px 8px 0; margin-bottom:10px;`;

    card.innerHTML = `
      <div style="display:flex; align-items:center; gap:8px; margin-bottom:6px;">
        <span style="background:${colors.border}; color:#fff; padding:1px 8px; border-radius:8px; font-size:0.7rem; font-weight:600; text-transform:uppercase;">${escapeHTML(issue.severity)}</span>
        <span style="font-weight:600; font-size:0.88rem; color:var(--text-primary);">${escapeHTML(issue.title)}</span>
        ${issue.wcagRef ? `<span style="color:${colors.text}; font-size:0.7rem; font-weight:500; margin-left:auto;">${escapeHTML(issue.wcagRef)}</span>` : ''}
      </div>
      <div style="font-size:0.8rem; color:var(--text-secondary); line-height:1.5; margin-bottom:8px;">${escapeHTML(issue.description)}</div>
      ${issue.element ? `<div style="background:hsla(220, 15%, 10%, 0.5); padding:6px 10px; border-radius:6px; font-family:var(--font-mono); font-size:0.75rem; color:var(--text-secondary); margin-bottom:8px; overflow-x:auto; white-space:pre;">${escapeHTML(issue.element)}</div>` : ''}
      ${issue.suggestion ? `<div style="font-size:0.78rem; color:hsl(142, 70%, 55%); line-height:1.4;">💡 ${escapeHTML(issue.suggestion)}</div>` : ''}
    `;

    el.a11yIssuesList.appendChild(card);
  });
}

function initAccessibilityChecker() {
  if (el.btnRunA11yAudit) {
    el.btnRunA11yAudit.addEventListener('click', runAccessibilityAudit);
  }
}


// ==========================================
//      MODULE: PERFORMANCE ANALYZER
// ==========================================

async function runPerformanceAudit() {
  const urlInput = el.perfUrlInput ? el.perfUrlInput.value.trim() : '';
  const htmlInput = el.perfHtmlInput ? el.perfHtmlInput.value.trim() : '';

  let input = '';
  if (urlInput) {
    input = `URL: ${urlInput}`;
    // Attempt to fetch HTML for deeper analysis
    try {
      const res = await fetch(urlInput);
      const fetchedHtml = await res.text();
      input += `\n\nFetched HTML (first 12000 chars):\n${fetchedHtml.substring(0, 12000)}`;
    } catch (err) {
      input += `\n\n(Could not fetch URL due to CORS/network restrictions. Analyzing based on URL only.)`;
      logConsole(`Could not fetch URL for performance audit: ${err.message}`, 'warn');
    }
  } else if (htmlInput) {
    input = htmlInput.length > 15000 ? htmlInput.substring(0, 15000) : htmlInput;
  } else {
    alert('Please enter a URL or paste HTML to analyze.');
    return;
  }

  if (!state.apiKey) {
    alert('Please set your Gemini API Key in Settings first.');
    switchView('settings');
    return;
  }

  if (el.btnRunPerfAudit) {
    el.btnRunPerfAudit.setAttribute('disabled', 'true');
    el.btnRunPerfAudit.textContent = 'Auditing...';
  }

  // Show loading in details container
  if (el.perfDetailsContainer) {
    el.perfDetailsContainer.innerHTML = '';
    showModuleLoading(el.perfDetailsContainer);
  }

  try {
    const prompt = `You are a web performance expert. Analyze this web page for performance issues. Return ONLY a JSON object with: overallScore (0-100), performance (0-100), seo (0-100), bestPractices (0-100), checklist (array of objects with: title, description, status [pass/fail], category [Performance/SEO/Best Practices]), details (array of objects with: title, description, impact [high/medium/low], recommendation). Analyze: image optimization, caching headers, lazy loading, bundle size, minification, compression, render-blocking resources, meta tags, heading structure, mobile responsiveness, HTTPS, structured data. Input: ${input}`;

    const responseText = await callGeminiAPI(prompt);
    const cleaned = cleanGeminiJson(responseText);
    const data = JSON.parse(cleaned);

    state.perfResults = data;
    hideModuleLoading(el.perfDetailsContainer);
    renderPerfResults(data);

    logConsole(`Performance audit completed. Overall score: ${data.overallScore}/100`, 'success');
  } catch (err) {
    hideModuleLoading(el.perfDetailsContainer);
    if (el.perfDetailsContainer) {
      el.perfDetailsContainer.innerHTML = `<div style="padding:20px; color:var(--color-critical); font-size:0.85rem;">Audit failed: ${escapeHTML(err.message)}</div>`;
    }
    logConsole(`Performance audit failed: ${err.message}`, 'error');
  } finally {
    if (el.btnRunPerfAudit) {
      el.btnRunPerfAudit.removeAttribute('disabled');
      el.btnRunPerfAudit.textContent = 'Run Audit';
    }
  }
}

function updateScoreCircle(element, score) {
  if (!element) return;

  const numScore = typeof score === 'number' ? score : 0;
  let colorClass = 'perf-score-good';
  let color = 'hsl(142, 70%, 45%)';

  if (numScore < 90) {
    colorClass = 'perf-score-average';
    color = 'hsl(38, 90%, 50%)';
  }
  if (numScore < 50) {
    colorClass = 'perf-score-poor';
    color = 'hsl(0, 84%, 60%)';
  }

  element.style.background = `conic-gradient(${color} ${numScore * 3.6}deg, hsla(220, 15%, 25%, 0.5) ${numScore * 3.6}deg)`;
  element.className = element.className.replace(/perf-score-(good|average|poor)/g, '').trim();
  element.classList.add(colorClass);
  element.innerHTML = `<span style="font-size:1.4rem; font-weight:700; color:${color};">${numScore}</span>`;
}

function renderPerfResults(data) {
  // Update all 4 score circles
  updateScoreCircle(el.perfOverallScore, data.overallScore);
  updateScoreCircle(el.perfScorePerformance, data.performance);
  updateScoreCircle(el.perfScoreSeo, data.seo);
  updateScoreCircle(el.perfScoreBestpractices, data.bestPractices);

  // Render checklist
  if (el.perfChecklistContainer) {
    el.perfChecklistContainer.innerHTML = '';

    if (Array.isArray(data.checklist) && data.checklist.length > 0) {
      data.checklist.forEach(item => {
        const checkItem = document.createElement('div');
        checkItem.className = 'perf-checklist-item';
        checkItem.style.cssText = 'display:flex; align-items:flex-start; gap:10px; padding:10px 14px; border-bottom:1px solid var(--border-color);';

        const icon = item.status === 'pass'
          ? `<span style="color:hsl(142, 70%, 45%); font-size:1.1rem; flex-shrink:0;">✓</span>`
          : `<span style="color:var(--color-critical); font-size:1.1rem; flex-shrink:0;">✗</span>`;

        checkItem.innerHTML = `
          ${icon}
          <div style="flex:1;">
            <div style="font-size:0.85rem; font-weight:600; color:var(--text-primary); margin-bottom:2px;">${escapeHTML(item.title)}</div>
            <div style="font-size:0.78rem; color:var(--text-secondary); line-height:1.4;">${escapeHTML(item.description)}</div>
            ${item.category ? `<span style="font-size:0.68rem; color:hsl(45, 90%, 55%); margin-top:4px; display:inline-block;">${escapeHTML(item.category)}</span>` : ''}
          </div>
        `;

        el.perfChecklistContainer.appendChild(checkItem);
      });
    } else {
      el.perfChecklistContainer.innerHTML = '<div style="padding:16px; color:var(--text-secondary); font-size:0.85rem;">No checklist items generated.</div>';
    }
  }

  // Render detail cards
  if (el.perfDetailsContainer) {
    el.perfDetailsContainer.innerHTML = '';

    if (Array.isArray(data.details) && data.details.length > 0) {
      data.details.forEach(detail => {
        const impactColors = {
          high: { bg: 'hsla(0, 84%, 60%, 0.1)', border: 'hsl(0, 84%, 60%)' },
          medium: { bg: 'hsla(38, 90%, 50%, 0.1)', border: 'hsl(38, 90%, 50%)' },
          low: { bg: 'hsla(217, 90%, 60%, 0.1)', border: 'hsl(217, 90%, 60%)' }
        };
        const colors = impactColors[detail.impact] || impactColors.medium;

        const card = document.createElement('div');
        card.className = 'perf-details-card';
        card.style.cssText = `padding:14px 16px; border-left:3px solid ${colors.border}; background:${colors.bg}; border-radius:0 8px 8px 0; margin-bottom:10px;`;

        card.innerHTML = `
          <div style="display:flex; align-items:center; gap:8px; margin-bottom:6px;">
            <span style="background:${colors.border}; color:#fff; padding:1px 8px; border-radius:8px; font-size:0.7rem; font-weight:600; text-transform:uppercase;">${escapeHTML(detail.impact)} impact</span>
            <span style="font-weight:600; font-size:0.88rem; color:var(--text-primary);">${escapeHTML(detail.title)}</span>
          </div>
          <div style="font-size:0.8rem; color:var(--text-secondary); line-height:1.5; margin-bottom:8px;">${escapeHTML(detail.description)}</div>
          ${detail.recommendation ? `<div style="font-size:0.78rem; color:hsl(142, 70%, 55%); line-height:1.4;">💡 ${escapeHTML(detail.recommendation)}</div>` : ''}
        `;

        el.perfDetailsContainer.appendChild(card);
      });
    } else {
      el.perfDetailsContainer.innerHTML = '<div style="padding:16px; color:var(--text-secondary); font-size:0.85rem;">No detail recommendations generated.</div>';
    }
  }
}

function initPerformanceAnalyzer() {
  if (el.btnRunPerfAudit) {
    el.btnRunPerfAudit.addEventListener('click', runPerformanceAudit);
  }
}


// App Startup Initializations
function startup() {
  initSettings();
  updateChatState();
  
  // Check browser status on launch
  checkBrowserConnection();
  
  // Set background check for Edge port 9222 every 10 seconds
  setInterval(checkBrowserConnection, 10000);
  
  // Initialize new modules
  initTestCaseManager();
  initApiTester();
  initAccessibilityChecker();
  initPerformanceAnalyzer();
}

el.btnSaveSettings.addEventListener('click', updateChatState);
el.btnRemoveKey.addEventListener('click', updateChatState);

// Run startup
startup();
