// i18n 초기화
function initI18n() {
  // HTML의 data-i18n 속성 처리
  document.querySelectorAll('[data-i18n]').forEach(element => {
    const messageKey = element.getAttribute('data-i18n');
    const message = chrome.i18n.getMessage(messageKey);
    if (message) {
      element.textContent = message;
    }
  });
  
  // data-i18n-placeholder 속성 처리
  document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
    const messageKey = element.getAttribute('data-i18n-placeholder');
    const message = chrome.i18n.getMessage(messageKey);
    if (message) {
      element.placeholder = message;
    }
  });
  
  // data-i18n-title 속성 처리
  document.querySelectorAll('[data-i18n-title]').forEach(element => {
    const messageKey = element.getAttribute('data-i18n-title');
    const message = chrome.i18n.getMessage(messageKey);
    if (message) {
      element.title = message;
    }
  });
  
  // data-i18n-args가 있는 경우 처리 (예: apiKeyHelp)
  document.querySelectorAll('[data-i18n-args]').forEach(element => {
    const messageKey = element.getAttribute('data-i18n');
    if (messageKey) {
      try {
        const args = JSON.parse(element.getAttribute('data-i18n-args'));
        let message = chrome.i18n.getMessage(messageKey, args);
        // 링크 처리
        if (messageKey === 'apiKeyHelp' && args && args[0]) {
          // $1을 링크로 교체 (i18n API가 이미 $1을 args[0]로 교체했으므로, args[0]를 링크로 교체)
          message = message.replace(args[0], `<a href="https://aistudio.google.com/api-keys" target="_blank" class="api-key-link">${args[0]}</a>`);
        }
        element.innerHTML = message;
      } catch (e) {
        const message = chrome.i18n.getMessage(messageKey);
        if (message) {
          element.textContent = message;
        }
      }
    }
  });
  
  // title 태그 처리
  const titleElement = document.querySelector('title[data-i18n]');
  if (titleElement) {
    const messageKey = titleElement.getAttribute('data-i18n');
    const message = chrome.i18n.getMessage(messageKey);
    if (message) {
      document.title = message;
    }
  }
}

// i18n 메시지 가져오기 헬퍼 함수
function i18n(key, substitutions) {
  return chrome.i18n.getMessage(key, substitutions);
}

// 브라우저 언어 감지
function getBrowserLanguage() {
  try {
    const uiLanguage = chrome.i18n.getUILanguage();
    // 'ko' 또는 'ko-KR' 등 한국어로 시작하는 경우
    if (uiLanguage.startsWith('ko')) {
      return 'ko';
    }
    // 기본값은 영어
    return 'en';
  } catch (e) {
    // 기본값은 영어
    return 'en';
  }
}

// 언어에 따른 프롬프트 언어 설정
function getPromptLanguage() {
  const lang = getBrowserLanguage();
  return lang === 'ko' ? '한국어' : 'English';
}

// 모드 전환
const manualBtn = document.getElementById('manualBtn');
const autoBtn = document.getElementById('autoBtn');
const selectBtn = document.getElementById('selectBtn');
const manualMode = document.getElementById('manualMode');
const autoMode = document.getElementById('autoMode');
const selectMode = document.getElementById('selectMode');

// 선택 모드 초기화 함수
async function resetSelectionMode() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (tab && tab.id) {
      // 선택 모드가 활성화되어 있으면 종료
      if (stopSelectionBtn.style.display !== 'none') {
        try {
          await chrome.tabs.sendMessage(tab.id, { action: 'stopSelection' });
        } catch (e) {
          // 탭이 닫혔거나 접근할 수 없는 경우 무시
          console.log('Could not stop selection mode:', e);
        }
      }
      
      // 선택 모드 상태와 관계없이 항상 선택 초기화
      try {
        await chrome.tabs.sendMessage(tab.id, { action: 'clearSelection' });
      } catch (e) {
        // 탭이 닫혔거나 접근할 수 없는 경우 무시
        console.log('Could not clear selection:', e);
      }
    }
    
    // UI 초기화
    selectedText = '';
    startSelectionBtn.style.display = 'block';
    clearSelectionBtn.style.display = 'none';
    stopSelectionBtn.style.display = 'none';
    submitSelectedBtn.style.display = 'none';
    submitSelectedBtn.disabled = true;
    selectionStatus.classList.add('hidden');
    
    // storage 초기화
    await chrome.storage.local.set({ 
      textSelected: false, 
      selectedText: '', 
      selectedCount: 0 
    });
  } catch (error) {
    console.error('Error resetting selection mode:', error);
  }
}

function switchMode(activeBtn, activeMode) {
  // 다른 모드로 전환 시 선택 모드 초기화
  if (activeMode !== selectMode) {
    resetSelectionMode();
  }
  
  [manualBtn, autoBtn, selectBtn].forEach(btn => btn.classList.remove('active'));
  [manualMode, autoMode, selectMode].forEach(mode => mode.classList.remove('active'));
  activeBtn.classList.add('active');
  activeMode.classList.add('active');
  
  // 현재 모드를 storage에 저장
  let modeName = 'auto';
  if (activeMode === selectMode) {
    modeName = 'select';
  } else if (activeMode === manualMode) {
    modeName = 'manual';
  }
  chrome.storage.local.set({ currentMode: modeName });
}

manualBtn.addEventListener('click', () => switchMode(manualBtn, manualMode));
autoBtn.addEventListener('click', () => switchMode(autoBtn, autoMode));
selectBtn.addEventListener('click', () => switchMode(selectBtn, selectMode));

// Gemini API 키 가져오기/저장하기
function getGeminiApiKey() {
  const input = document.getElementById('geminiApiKey');
  return input.value.trim();
}

async function loadGeminiApiKey() {
  try {
    const result = await chrome.storage.local.get(['geminiApiKey']);
    const input = document.getElementById('geminiApiKey');
    if (result.geminiApiKey) {
      input.value = result.geminiApiKey;
    }
  } catch (error) {
    console.error('API key load error:', error);
  }
}

async function saveGeminiApiKey() {
  try {
    const input = document.getElementById('geminiApiKey');
    const apiKey = input.value.trim();
    await chrome.storage.local.set({ geminiApiKey: apiKey });
  } catch (error) {
    console.error('API key save error:', error);
  }
}

// API 키 표시/숨기기 토글
document.getElementById('toggleApiKeyVisibility').addEventListener('click', () => {
  const input = document.getElementById('geminiApiKey');
  const toggleBtn = document.getElementById('toggleApiKeyVisibility');
  
  if (input.type === 'password') {
    input.type = 'text';
    toggleBtn.textContent = '🙈';
    toggleBtn.title = i18n('showHide');
  } else {
    input.type = 'password';
    toggleBtn.textContent = '👁️';
    toggleBtn.title = i18n('showHide');
  }
});

// 에러 표시
function showError(message) {
  const errorDiv = document.getElementById('error');
  errorDiv.textContent = message;
  errorDiv.classList.remove('hidden');
  setTimeout(() => {
    errorDiv.classList.add('hidden');
  }, 5000);
}

// 로딩 상태 단계 (일반)
const loadingSteps = [
  { text: i18n('checkingData'), progress: 15 },
  { text: i18n('connectingServer'), progress: 30 },
  { text: i18n('generatingSummary'), progress: 50 },
  { text: i18n('preparingOutput'), progress: 70 },
  { text: i18n('ready'), progress: 100 }
];

// 로딩 상태 단계 (자동 인식 - 더 많은 단계, 30초에 맞춤)
const autoLoadingSteps = [
  { text: i18n('analyzingPage'), progress: 8 },
  { text: i18n('extractingContent'), progress: 16 },
  { text: i18n('removingElements'), progress: 24 },
  { text: i18n('interpretingContent'), progress: 32 },
  { text: i18n('extractingKeyInfo'), progress: 40 },
  { text: i18n('refiningData'), progress: 48 },
  { text: i18n('generatingSummary'), progress: 56 },
  { text: i18n('structuringContent'), progress: 64 },
  { text: i18n('optimizingContent'), progress: 72 },
  { text: i18n('finalReview'), progress: 80 },
  { text: i18n('qualityCheck'), progress: 88 },
  { text: i18n('ready'), progress: 100 }
];

let loadingInterval = null;
let currentStepIndex = 0;

// 로딩 표시 (단계별)
function showLoadingWithSteps(isAuto = false) {
  const loadingDiv = document.getElementById('loading');
  const loadingText = document.getElementById('loadingText');
  const progressFill = document.getElementById('progressFill');
  
  loadingDiv.classList.remove('hidden');
  document.getElementById('result').classList.add('hidden');
  document.getElementById('error').classList.add('hidden');
  
  const steps = isAuto ? autoLoadingSteps : loadingSteps;
  currentStepIndex = 0;
  updateLoadingStep(steps);
  
  // 자동 인식은 약 2.5초마다 (30초에 12단계), 일반은 3초마다 단계 변경
  const interval = isAuto ? 2500 : 3000;
  loadingInterval = setInterval(() => {
    if (currentStepIndex < steps.length - 1) {
      currentStepIndex++;
      updateLoadingStep(steps);
    }
  }, interval);
}

function updateLoadingStep(steps = loadingSteps) {
  const step = steps[currentStepIndex];
  const loadingText = document.getElementById('loadingText');
  const progressFill = document.getElementById('progressFill');
  
  loadingText.textContent = step.text;
  progressFill.style.width = step.progress + '%';
}

function hideLoading() {
  if (loadingInterval) {
    clearInterval(loadingInterval);
    loadingInterval = null;
  }
  document.getElementById('loading').classList.add('hidden');
}

// 마크다운 렌더링 (개선된 버전)
function renderMarkdown(element, text) {
  let html = text;
  
  // 코드 블록 먼저 처리 (백틱 3개 이상)
  html = html.replace(/```[\s\S]*?```/g, (match) => {
    const code = match.replace(/```/g, '').trim();
    return `<pre><code>${escapeHtml(code)}</code></pre>`;
  });
  
  // 인라인 코드
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
  
  // 헤더 (줄 시작에서만)
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
  
  // 볼드 (이미 코드로 변환된 부분 제외)
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/__([^_]+)__/g, '<strong>$1</strong>');
  
  // 이탤릭 (볼드가 아닌 경우)
  html = html.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>');
  html = html.replace(/(?<!_)_([^_]+)_(?!_)/g, '<em>$1</em>');
  
  // 번호 리스트
  html = html.replace(/^(\d+)\.\s+(.*)$/gim, '<li>$2</li>');
  
  // 불릿 리스트
  html = html.replace(/^[-*]\s+(.*)$/gim, '<li>$1</li>');
  
  // 리스트 그룹화
  html = html.replace(/(<li>.*?<\/li>\n?)+/g, (match) => {
    return '<ul>' + match + '</ul>';
  });
  
  // 블록쿼트
  html = html.replace(/^>\s+(.*)$/gim, '<blockquote>$1</blockquote>');
  
  // 줄바꿈 (리스트나 헤더가 아닌 경우)
  html = html.replace(/\n(?![<])/g, '<br>');
  
  // 연속된 <br> 정리
  html = html.replace(/(<br>\s*){3,}/g, '<br><br>');
  
  element.innerHTML = html;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// 결과 표시
let currentSummary = '';

function showResult(summary) {
  currentSummary = summary;
  hideLoading();
  
  const resultDiv = document.getElementById('result');
  const summaryText = document.getElementById('summaryText');
  
  resultDiv.classList.remove('hidden');
  
  // 제목 제거 (Summary, Key Summary 등)
  let cleanedSummary = summary;
  cleanedSummary = cleanedSummary.replace(/^#+\s*(Key\s*)?Summary\s*\n*/gim, '');
  cleanedSummary = cleanedSummary.replace(/^###\s*Key\s*Summary\s*\n*/gim, '');
  cleanedSummary = cleanedSummary.replace(/^##\s*Key\s*Summary\s*\n*/gim, '');
  cleanedSummary = cleanedSummary.replace(/^#\s*Key\s*Summary\s*\n*/gim, '');
  cleanedSummary = cleanedSummary.trim();
  
  // 마크다운 렌더링 후 바로 표시
  renderMarkdown(summaryText, cleanedSummary);
  
  // 요약 이력에 자동 저장 (원본 저장)
  saveSummaryToHistory(summary).catch(err => {
    console.error('Auto save failed:', err);
  });
}

// Gemini API 호출 헬퍼 함수
async function callGeminiAPI(prompt) {
  const apiKey = getGeminiApiKey();
  
  if (!apiKey) {
    throw new Error(i18n('pleaseEnterApiKey'));
  }

  const apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';
  
  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }]
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      if (response.status === 400 && errorData.error) {
        throw new Error(i18n('apiError', [errorData.error.message || i18n('invalidRequest')]));
      }
      throw new Error(i18n('apiError', [`${response.status} ${response.statusText}`]));
    }

    const data = await response.json();
    
    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
      return data.candidates[0].content.parts[0].text.trim();
    }
    
    throw new Error(i18n('invalidResponseFormat'));
  } catch (error) {
    console.error('Gemini API call error:', error);
    throw error;
  }
}

// 웹 페이지 텍스트 전처리
async function preprocessWebPageText(rawText) {
  const promptLang = getPromptLanguage();
  const lang = getBrowserLanguage();
  
  let prompt;
  if (lang === 'ko') {
    prompt = `다음은 웹 페이지에서 추출한 원시 텍스트입니다. 광고, 네비게이션 메뉴, 푸터, 사이드바, 쿠키 동의 버튼, 공유 버튼 등 불필요한 요소를 제거하고 실제 본문 내용만 추출해주세요.

언어: ${promptLang}
${promptLang}로 응답해주세요.

요구사항:
- 불필요한 UI 요소나 반복적인 텍스트를 제거하면서 본문의 핵심 내용을 유지하세요
- 너무 단순하게 요약하지 말고, 본문의 주요 내용과 맥락을 충분히 포함하세요
- 문장의 흐름과 구조를 유지하세요
- 원본의 중요한 정보를 최대한 보존하세요

원본 텍스트:
${rawText}

전처리된 본문 내용:`;
  } else {
    prompt = `The following is the raw text extracted from a web page. Please remove unnecessary elements such as advertisements, navigation menus, footers, sidebars, cookie consent buttons, share buttons, etc., and extract only the actual main content.

Language: ${promptLang}
Please respond in ${promptLang}.

Requirements:
- Maintain the core content of the main text while removing unnecessary UI elements or repetitive text
- Do not summarize too simply; include the main content and context of the text sufficiently
- Maintain the flow and structure of sentences
- Preserve as much important information from the original as possible

Original text:
${rawText}

Preprocessed main content:`;
  }
  
  return await callGeminiAPI(prompt);
}

// 개선된 요약 프롬프트
async function requestSummary(text) {
  const promptLang = getPromptLanguage();
  const lang = getBrowserLanguage();
  
  let prompt;
  if (lang === 'ko') {
    prompt = `다음 텍스트를 간결하게 요약해주세요.

언어: ${promptLang}
${promptLang}로 응답해주세요.

## 요구사항:
1. **간결함**: 핵심만 간단명료하게 작성하세요 (전체 200자 이내 권장)
2. **핵심 포인트**: 가장 중요한 2-3가지 포인트만 제시하세요
3. **간단한 설명**: 각 포인트는 1-2문장으로 간단히 설명하세요
4. **마크다운 형식**: 불릿 포인트나 번호를 사용하세요
5. **제목 없음**: "요약" 같은 제목 없이 내용만 작성하세요

## 출력 형식 예시:
- **핵심 포인트 1**: 간단한 설명
- **핵심 포인트 2**: 간단한 설명
- **핵심 포인트 3**: 간단한 설명

## 원본 텍스트:
${text}

위 형식을 따라 간결한 요약을 작성해주세요:`;
  } else {
    prompt = `Please summarize the following text concisely.

Language: ${promptLang}
Please respond in ${promptLang}.

## Requirements:
1. **Conciseness**: Write only the essentials briefly (recommended within 200 characters total)
2. **Key points**: Present only 2-3 most important points
3. **Brief explanation**: Explain each point in 1-2 sentences
4. **Markdown format**: Use bullet points or numbers
5. **No title**: Write only the content without titles like "Summary"

## Output format example:
- **Key point 1**: Brief explanation
- **Key point 2**: Brief explanation
- **Key point 3**: Brief explanation

## Original text:
${text}

Please write a concise summary following the format above:`;
  }
  
  return await callGeminiAPI(prompt);
}

// 직접 입력 모드 - 텍스트/링크 토글
let manualInputType = 'text'; // 'text' 또는 'link'

const inputTypeTextBtn = document.getElementById('inputTypeText');
const inputTypeLinkBtn = document.getElementById('inputTypeLink');
const textInputArea = document.getElementById('textInputArea');
const linkInputArea = document.getElementById('linkInputArea');

inputTypeTextBtn.addEventListener('click', () => {
  manualInputType = 'text';
  inputTypeTextBtn.classList.add('active');
  inputTypeLinkBtn.classList.remove('active');
  textInputArea.classList.remove('hidden');
  linkInputArea.classList.add('hidden');
});

inputTypeLinkBtn.addEventListener('click', () => {
  manualInputType = 'link';
  inputTypeLinkBtn.classList.add('active');
  inputTypeTextBtn.classList.remove('active');
  linkInputArea.classList.remove('hidden');
  textInputArea.classList.add('hidden');
});

// URL 유효성 검사
function isValidUrl(string) {
  try {
    const url = new URL(string);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch (_) {
    return false;
  }
}

// 링크에서 텍스트 추출 (백그라운드에서 fetch)
async function fetchAndExtractText(url) {
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    }
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} ${response.statusText}`);
  }

  const html = await response.text();
  
  // DOMParser로 HTML 파싱 (메모리 내, 화면 변화 없음)
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  
  // 불필요한 요소 제거
  const elementsToRemove = doc.querySelectorAll(
    'script, style, noscript, iframe, embed, object, nav, footer, header, aside, ' +
    '[role="navigation"], [role="banner"], [role="contentinfo"], ' +
    '.nav, .navbar, .footer, .header, .sidebar, .menu, .ad, .ads, .advertisement'
  );
  elementsToRemove.forEach(el => el.remove());
  
  // 텍스트 추출
  let text = (doc.body?.innerText || doc.body?.textContent || '').trim();
  
  // 공백 정리
  text = text
    .replace(/\s+/g, ' ')
    .replace(/\n\s*\n/g, '\n')
    .trim();
  
  // 최대 길이 제한
  const maxLength = 50000;
  if (text.length > maxLength) {
    text = text.substring(0, maxLength) + '...';
  }
  
  return text;
}

// 직접 입력 모드 - 요약하기 버튼
document.getElementById('submitManual').addEventListener('click', async () => {
  if (manualInputType === 'text') {
    // 텍스트 모드 (기존 로직)
    const textInput = document.getElementById('textInput');
    const text = textInput.value.trim();

    if (!text) {
      showError(i18n('pleaseEnterText'));
      return;
    }

    showLoadingWithSteps();
    try {
      const summary = await requestSummary(text);
      showResult(summary);
    } catch (error) {
      hideLoading();
      showError(i18n('summaryFailed', [error.message]));
    }
  } else {
    // 링크 모드
    const linkInput = document.getElementById('linkInput');
    const url = linkInput.value.trim();

    if (!url) {
      showError(i18n('pleaseEnterLink'));
      return;
    }

    if (!isValidUrl(url)) {
      showError(i18n('invalidUrl'));
      return;
    }

    showLoadingWithSteps(true); // 자동 인식과 동일한 긴 로딩 단계 사용
    try {
      // 1단계: 링크에서 텍스트 가져오기
      const extractedText = await fetchAndExtractText(url);

      if (!extractedText || extractedText.length === 0) {
        throw new Error(i18n('linkNoContent'));
      }

      // 2단계: 전처리 (광고, 네비게이션 등 제거)
      const preprocessedText = await preprocessWebPageText(extractedText);

      if (!preprocessedText || preprocessedText.trim().length === 0) {
        throw new Error(i18n('noPreprocessedText'));
      }

      // 3단계: 요약
      const summary = await requestSummary(preprocessedText);
      showResult(summary);
    } catch (error) {
      hideLoading();
      if (error.message.includes('HTTP') || error.message.includes('fetch') || error.message.includes('Failed')) {
        showError(i18n('linkFetchFailed', [error.message]));
      } else {
        showError(i18n('summaryFailed', [error.message]));
      }
    }
  }
});

// 웹 페이지에서 텍스트 추출하는 코드
const extractTextCode = () => {
  const body = document.body;
  if (!body) {
    return '';
  }

  const clone = body.cloneNode(true);
  const elementsToRemove = clone.querySelectorAll('script, style, noscript, iframe, embed, object');
  elementsToRemove.forEach(el => el.remove());
  
  let text = clone.innerText || clone.textContent || '';
  text = text
    .replace(/\s+/g, ' ')
    .replace(/\n\s*\n/g, '\n')
    .trim();
  
  const maxLength = 50000;
  if (text.length > maxLength) {
    text = text.substring(0, maxLength) + '...';
  }
  
  return text;
};

// 자동 인식 모드
document.getElementById('submitAuto').addEventListener('click', async () => {
  showLoadingWithSteps(true); // 자동 인식 모드
  
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab || !tab.id) {
      throw new Error(i18n('unableToGetTabInfo'));
    }
    
    if (tab.url && (
        tab.url.startsWith('chrome://') || 
        tab.url.startsWith('chrome-extension://') || 
        tab.url.startsWith('edge://') ||
        tab.url.startsWith('about:'))) {
      throw new Error('Text cannot be extracted from this page.');
    }
    
    let extractedText = '';
    try {
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: extractTextCode
      });
      
      if (results && results[0] && results[0].result) {
        extractedText = results[0].result.trim();
      }
    } catch (scriptError) {
      try {
        const response = await chrome.tabs.sendMessage(tab.id, { action: 'extractText' });
        if (response && response.text) {
          extractedText = response.text.trim();
        } else if (response && response.error) {
          throw new Error(response.error);
        }
      } catch (messageError) {
        throw new Error(i18n('unableToAccessPage'));
      }
    }
    
    if (!extractedText) {
      throw new Error(i18n('noTextExtracted'));
    }

    const preprocessedText = await preprocessWebPageText(extractedText);
    
    if (!preprocessedText || preprocessedText.trim().length === 0) {
      throw new Error(i18n('noPreprocessedText'));
    }

    const summary = await requestSummary(preprocessedText);
    showResult(summary);
  } catch (error) {
    hideLoading();
    showError(i18n('autoSummaryFailed', [error.message]));
  }
});

// 요약 기록 저장
async function saveSummaryToHistory(summary) {
  try {
    const result = await chrome.storage.local.get(['summaryHistory']);
    const history = result.summaryHistory || [];
    
    const newEntry = {
      id: Date.now(),
      summary: summary,
      date: new Date().toLocaleString('en-US'),
      timestamp: Date.now()
    };
    
    history.unshift(newEntry);
    
    // 최대 50개까지만 저장
    if (history.length > 50) {
      history.pop();
    }
    
    await chrome.storage.local.set({ summaryHistory: history });
    return true;
  } catch (error) {
    console.error('History save error:', error);
    return false;
  }
}

// 요약 기록 로드
async function loadSummaryHistory() {
  try {
    const result = await chrome.storage.local.get(['summaryHistory']);
    return result.summaryHistory || [];
  } catch (error) {
    console.error('History load error:', error);
    return [];
  }
}

// 요약 기록 삭제
async function deleteSummaryFromHistory(id) {
  try {
    const result = await chrome.storage.local.get(['summaryHistory']);
    const history = result.summaryHistory || [];
    const filtered = history.filter(item => item.id !== id);
    await chrome.storage.local.set({ summaryHistory: filtered });
    return true;
  } catch (error) {
    console.error('History delete error:', error);
    return false;
  }
}

// 요약 기록 표시 (표 형태)
async function displayHistory() {
  const history = await loadSummaryHistory();
  const historyTableBody = document.getElementById('historyTableBody');
  const historyDiv = document.getElementById('history');
  const showHistoryBtn = document.getElementById('showHistory').parentElement;
  
  // 요약 이력 버튼 숨기기
  showHistoryBtn.classList.add('hidden');
  
  if (history.length === 0) {
    historyTableBody.innerHTML = `<tr><td colspan="3" style="text-align: center; color: #888; padding: 20px;">${i18n('noHistory')}</td></tr>`;
  } else {
    historyTableBody.innerHTML = history.map(item => {
      // HTML 태그 제거하고 텍스트만 추출
      const textOnly = item.summary.replace(/<[^>]*>/g, '').trim();
      const preview = textOnly.substring(0, 50) + (textOnly.length > 50 ? '...' : '');
      
      // 날짜를 년월일과 시분초로 분리
      let datePart = '';
      let timePart = '';
      if (item.date) {
        // "1/1/2024, 3:30:00 PM" 또는 "1/1/2024, 3:30:00 PM" 형식 파싱
        // 먼저 쉼표로 분리 시도
        const commaIndex = item.date.indexOf(',');
        if (commaIndex > 0) {
          datePart = item.date.substring(0, commaIndex).trim();
          timePart = item.date.substring(commaIndex + 1).trim();
        } else {
          // 다른 형식일 경우 공백으로 분리 시도
          const spaceParts = item.date.split(/\s+/);
          if (spaceParts.length >= 4) {
            datePart = spaceParts.slice(0, 3).join(' ');
            timePart = spaceParts.slice(3).join(' ');
          } else {
            datePart = item.date;
          }
        }
      }
      
      return `
      <tr>
        <td class="history-date">
          <div class="history-date-line">${datePart}</div>
          <div class="history-time-line">${timePart}</div>
        </td>
        <td>
          <div class="history-content" data-full="${escapeHtml(textOnly)}" title="${escapeHtml(textOnly)}">${escapeHtml(preview)}</div>
        </td>
        <td>
          <div class="history-actions">
            <button class="history-copy-btn" data-text="${escapeHtml(textOnly)}" data-i18n-title="copy" title="${i18n('copy')}">📋</button>
            <button class="history-delete-btn" data-id="${item.id}" data-i18n-title="close" title="${i18n('close')}">🗑️</button>
          </div>
        </td>
      </tr>
    `;
    }).join('');
    
    // 내용 호버 시 툴팁 표시 (클릭 이벤트는 제거)
    historyTableBody.querySelectorAll('.history-content').forEach(content => {
      // 툴팁은 title 속성으로 자동 표시됨
    });
    
    // 복사 버튼 이벤트
    historyTableBody.querySelectorAll('.history-copy-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const text = btn.dataset.text;
        try {
          await navigator.clipboard.writeText(text);
          btn.textContent = '✓';
          btn.style.color = '#9C27B0';
          setTimeout(() => {
            btn.textContent = '📋';
            btn.style.color = '';
          }, 2000);
        } catch (error) {
          console.error('Copy failed:', error);
          showError(i18n('copyFailed'));
        }
      });
    });
    
    // 삭제 버튼 이벤트
    historyTableBody.querySelectorAll('.history-delete-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const id = parseInt(btn.dataset.id);
        if (await deleteSummaryFromHistory(id)) {
          displayHistory();
        }
      });
    });
  }
  
  historyDiv.classList.remove('hidden');
}

// 기록 보기 버튼 (토글)
document.getElementById('showHistory').addEventListener('click', () => {
  const historyDiv = document.getElementById('history');
  if (historyDiv.classList.contains('hidden')) {
    displayHistory();
  } else {
    historyDiv.classList.add('hidden');
  }
});

// 기록 닫기 (토글)
document.getElementById('closeHistory').addEventListener('click', () => {
  const historyDiv = document.getElementById('history');
  const showHistoryBtn = document.getElementById('showHistory').parentElement;
  
  historyDiv.classList.add('hidden');
  // 요약 이력 버튼 다시 보이기
  showHistoryBtn.classList.remove('hidden');
});

// 결과 복사 버튼
document.getElementById('saveResult').addEventListener('click', async () => {
  if (currentSummary) {
    try {
      // HTML 태그 제거하고 텍스트만 복사
      let textOnly = currentSummary.replace(/<[^>]*>/g, '').trim();
      // 제목 제거
      textOnly = textOnly.replace(/^#+\s*(Key\s*)?Summary\s*\n*/gim, '');
      textOnly = textOnly.trim();
      
      await navigator.clipboard.writeText(textOnly);
      
      const saveBtn = document.getElementById('saveResult');
      saveBtn.classList.add('saved');
      saveBtn.textContent = `✓ ${i18n('copied')}`;
      setTimeout(() => {
        saveBtn.classList.remove('saved');
        saveBtn.textContent = `📋 ${i18n('copy')}`;
      }, 2000);
    } catch (error) {
      console.error('Copy failed:', error);
      showError(i18n('copyFailed'));
    }
  }
});

// 결과 닫기 (토글)
document.getElementById('closeResult').addEventListener('click', () => {
  const resultDiv = document.getElementById('result');
  if (!resultDiv.classList.contains('hidden')) {
    resultDiv.classList.add('hidden');
    currentSummary = '';
    const saveBtn = document.getElementById('saveResult');
    saveBtn.classList.remove('saved');
    saveBtn.textContent = `📋 ${i18n('copy')}`;
  }
});

// 직접 선택 모드
const startSelectionBtn = document.getElementById('startSelection');
const stopSelectionBtn = document.getElementById('stopSelection');
const clearSelectionBtn = document.getElementById('clearSelection');
const submitSelectedBtn = document.getElementById('submitSelected');
const selectionStatus = document.getElementById('selectionStatus');
let selectedText = '';

// 콘텐츠 스크립트가 로드되었는지 확인하고, 없으면 주입
async function ensureContentScripts(tabId) {
  try {
    // 먼저 콘텐츠 스크립트에 ping을 보내서 로드 여부 확인
    await chrome.tabs.sendMessage(tabId, { action: 'ping' });
  } catch (e) {
    // 콘텐츠 스크립트가 없으면 주입
    await chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: ['content.js', 'content-select.js']
    });
  }
}

// 선택 모드 시작
startSelectionBtn.addEventListener('click', async () => {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab || !tab.id) {
      showError(i18n('unableToGetTabInfo'));
      return;
    }
    
    if (tab.url && (
        tab.url.startsWith('chrome://') || 
        tab.url.startsWith('chrome-extension://') || 
        tab.url.startsWith('edge://') ||
        tab.url.startsWith('about:'))) {
      showError(i18n('selectionModeCannotUse'));
      return;
    }
    
    // 콘텐츠 스크립트 로드 확인 및 주입
    await ensureContentScripts(tab.id);
    
    // 선택 모드 시작
    await chrome.tabs.sendMessage(tab.id, { action: 'startSelection' });
    
    // 선택된 텍스트 초기화
    selectedText = '';
    
    // UI 업데이트
    startSelectionBtn.style.display = 'none';
    clearSelectionBtn.style.display = 'block';
    stopSelectionBtn.style.display = 'block';
    submitSelectedBtn.style.display = 'none';
    selectionStatus.classList.remove('hidden');
    selectionStatus.textContent = i18n('clickToSelect');
    selectionStatus.style.color = '#9C27B0';
  } catch (error) {
    console.error('Failed to start selection mode:', error);
    showError(i18n('unableToStartSelection'));
  }
});

// 초기화 버튼
clearSelectionBtn.addEventListener('click', async () => {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab || !tab.id) {
      showError(i18n('unableToGetTabInfo'));
      return;
    }
    
    await chrome.tabs.sendMessage(tab.id, { action: 'clearSelection' });
    
    // 선택된 텍스트 초기화
    selectedText = '';
    
    // UI 업데이트
    submitSelectedBtn.style.display = 'none';
    submitSelectedBtn.disabled = true;
    selectionStatus.classList.remove('hidden');
    selectionStatus.textContent = i18n('selectionCleared');
    selectionStatus.style.color = '#888';
  } catch (error) {
    console.error('Clear failed:', error);
    showError(i18n('clearFailed'));
  }
});

// 선택 모드 종료
stopSelectionBtn.addEventListener('click', async () => {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab || !tab.id) {
      showError(i18n('unableToGetTabInfo'));
      return;
    }
    
    await chrome.tabs.sendMessage(tab.id, { action: 'stopSelection' });
    
    // 선택된 텍스트 확인
    const result = await chrome.storage.local.get(['selectedText', 'textSelected', 'selectedCount']);
    selectedText = result.selectedText || '';
    const selectedCount = result.selectedCount || 0;
    
    // UI 업데이트
    startSelectionBtn.style.display = 'block';
    clearSelectionBtn.style.display = 'none';
    stopSelectionBtn.style.display = 'none';
    
    if (selectedText && selectedText.length > 0) {
      // 선택된 텍스트가 있으면 요약하기 버튼 활성화
      submitSelectedBtn.style.display = 'block';
      submitSelectedBtn.disabled = false;
      selectionStatus.classList.remove('hidden');
      const countText = selectedCount > 1 ? i18n('selectedCount', [selectedCount]) : '';
      selectionStatus.textContent = i18n('textSelected', [countText]);
      selectionStatus.style.color = '#4CAF50';
    } else {
      // 선택된 텍스트가 없으면 요약하기 버튼 비활성화
      submitSelectedBtn.style.display = 'none';
      submitSelectedBtn.disabled = true;
      selectionStatus.classList.remove('hidden');
      selectionStatus.textContent = i18n('noTextSelected');
      selectionStatus.style.color = '#888';
    }
  } catch (error) {
    console.error('Failed to stop selection mode:', error);
    showError(i18n('stopSelectionFailed'));
  }
});

// 선택된 텍스트로 요약하기
submitSelectedBtn.addEventListener('click', async () => {
  if (!selectedText || selectedText.length === 0) {
    // storage에서 다시 가져오기
    const result = await chrome.storage.local.get(['selectedText']);
    selectedText = result.selectedText || '';
  }
  
  if (!selectedText || selectedText.length === 0) {
    showError(i18n('noTextSelected'));
    return;
  }
  
  showLoadingWithSteps();
  try {
    const summary = await requestSummary(selectedText);
    showResult(summary);
    selectionStatus.classList.add('hidden');
  } catch (error) {
    hideLoading();
    showError(i18n('summaryFailed', [error.message]));
  }
});

// 선택된 텍스트 감지 (선택 모드 중일 때만 상태 업데이트)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'textSelected') {
    // 선택 모드가 활성화되어 있을 때만 상태 표시
    if (stopSelectionBtn.style.display !== 'none') {
      selectionStatus.classList.remove('hidden');
      const count = request.count || 0;
      const countText = count > 1 ? i18n('selectedCount', [count]) : '';
      selectionStatus.textContent = i18n('textSelectedInMode', [countText]);
      selectionStatus.style.color = '#4CAF50';
    }
  } else if (request.action === 'selectionsCleared') {
    // 선택 초기화 시
    if (stopSelectionBtn.style.display !== 'none') {
      selectionStatus.classList.remove('hidden');
      selectionStatus.textContent = i18n('selectionCleared');
      selectionStatus.style.color = '#888';
    }
    selectedText = '';
    submitSelectedBtn.style.display = 'none';
    submitSelectedBtn.disabled = true;
  } else if (request.action === 'selectionCancelled') {
    // 선택 취소 시 (ESC 키)
    if (stopSelectionBtn.style.display !== 'none') {
      selectionStatus.classList.remove('hidden');
      selectionStatus.textContent = i18n('selectionCancelled');
      selectionStatus.style.color = '#888';
    }
  }
});

// 초기화
async function initialize() {
  // i18n 초기화
  initI18n();
  
  await loadGeminiApiKey();
  
  const apiKeyInput = document.getElementById('geminiApiKey');
  apiKeyInput.addEventListener('input', saveGeminiApiKey);
  apiKeyInput.addEventListener('change', saveGeminiApiKey);
  apiKeyInput.addEventListener('paste', () => {
    setTimeout(saveGeminiApiKey, 10);
  });
  
  // 초기 모드 저장 (기본값: auto)
  const activeMode = document.querySelector('.mode-content.active');
  if (activeMode === selectMode) {
    chrome.storage.local.set({ currentMode: 'select' });
  } else if (activeMode === manualMode) {
    chrome.storage.local.set({ currentMode: 'manual' });
  } else {
    chrome.storage.local.set({ currentMode: 'auto' });
  }
  
  // 창이 닫히거나 숨겨질 때 선택 모드 초기화
  window.addEventListener('beforeunload', () => {
    resetSelectionMode();
  });
  
  // visibilitychange 이벤트로 창이 숨겨질 때도 초기화
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      resetSelectionMode();
    }
  });
}

initialize();

