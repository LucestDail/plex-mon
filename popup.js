// 모드 전환
const manualBtn = document.getElementById('manualBtn');
const autoBtn = document.getElementById('autoBtn');
const manualMode = document.getElementById('manualMode');
const autoMode = document.getElementById('autoMode');

function switchMode(activeBtn, activeMode) {
  [manualBtn, autoBtn].forEach(btn => btn.classList.remove('active'));
  [manualMode, autoMode].forEach(mode => mode.classList.remove('active'));
  activeBtn.classList.add('active');
  activeMode.classList.add('active');
}

manualBtn.addEventListener('click', () => switchMode(manualBtn, manualMode));
autoBtn.addEventListener('click', () => switchMode(autoBtn, autoMode));

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
    console.error('API 키 로드 오류:', error);
  }
}

async function saveGeminiApiKey() {
  try {
    const input = document.getElementById('geminiApiKey');
    const apiKey = input.value.trim();
    await chrome.storage.local.set({ geminiApiKey: apiKey });
  } catch (error) {
    console.error('API 키 저장 오류:', error);
  }
}

// API 키 표시/숨기기 토글
document.getElementById('toggleApiKeyVisibility').addEventListener('click', () => {
  const input = document.getElementById('geminiApiKey');
  const toggleBtn = document.getElementById('toggleApiKeyVisibility');
  
  if (input.type === 'password') {
    input.type = 'text';
    toggleBtn.textContent = '🙈';
    toggleBtn.title = '숨기기';
  } else {
    input.type = 'password';
    toggleBtn.textContent = '👁️';
    toggleBtn.title = '표시하기';
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
  { text: '데이터 확인 중...', progress: 15 },
  { text: '서버 연결 중...', progress: 30 },
  { text: '요약 생성 중...', progress: 50 },
  { text: '출력 준비 중...', progress: 70 },
  { text: '출력 준비 완료', progress: 100 }
];

// 로딩 상태 단계 (자동 인식 - 더 많은 단계, 30초에 맞춤)
const autoLoadingSteps = [
  { text: '웹 페이지 분석 중...', progress: 8 },
  { text: '콘텐츠 추출 중...', progress: 16 },
  { text: '불필요한 요소 제거 중...', progress: 24 },
  { text: '본문 내용 해석 중...', progress: 32 },
  { text: '핵심 정보 추출 중...', progress: 40 },
  { text: '데이터 정제 중...', progress: 48 },
  { text: '요약 생성 중...', progress: 56 },
  { text: '구조화 처리 중...', progress: 64 },
  { text: '내용 최적화 중...', progress: 72 },
  { text: '최종 검토 중...', progress: 80 },
  { text: '품질 확인 중...', progress: 88 },
  { text: '출력 준비 완료', progress: 100 }
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

// 마크다운 렌더링만 수행 (스트림 효과 제거)

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
  
  // 제목 제거 (핵심 요약, 요약 등)
  let cleanedSummary = summary;
  cleanedSummary = cleanedSummary.replace(/^#+\s*(핵심\s*)?요약\s*\n*/gim, '');
  cleanedSummary = cleanedSummary.replace(/^###\s*핵심\s*요약\s*\n*/gim, '');
  cleanedSummary = cleanedSummary.replace(/^##\s*핵심\s*요약\s*\n*/gim, '');
  cleanedSummary = cleanedSummary.replace(/^#\s*핵심\s*요약\s*\n*/gim, '');
  cleanedSummary = cleanedSummary.trim();
  
  // 마크다운 렌더링 후 바로 표시
  renderMarkdown(summaryText, cleanedSummary);
  
  // 요약 이력에 자동 저장 (원본 저장)
  saveSummaryToHistory(summary).catch(err => {
    console.error('자동 저장 실패:', err);
  });
  
  // 팝업 크기 동적 조절
  setTimeout(() => {
    adjustPopupSize();
  }, 100);
}

// 팝업 크기 동적 조절
function adjustPopupSize() {
  const container = document.querySelector('.container');
  if (container) {
    const height = container.scrollHeight;
    document.body.style.height = height + 40 + 'px';
  }
}

// Gemini API 호출 헬퍼 함수
async function callGeminiAPI(prompt) {
  const apiKey = getGeminiApiKey();
  
  if (!apiKey) {
    throw new Error('Gemini API 키를 입력해주세요.');
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
        throw new Error(`API 오류: ${errorData.error.message || '잘못된 요청입니다.'}`);
      }
      throw new Error(`API 오류: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
      return data.candidates[0].content.parts[0].text.trim();
    }
    
    throw new Error('응답 형식이 올바르지 않습니다.');
  } catch (error) {
    console.error('Gemini API 호출 오류:', error);
    throw error;
  }
}

// 웹 페이지 텍스트 전처리
async function preprocessWebPageText(rawText) {
  const prompt = `다음은 웹 페이지에서 추출한 원본 텍스트입니다. 이 텍스트에서 광고, 네비게이션 메뉴, 푸터, 사이드바, 쿠키 동의 버튼, 공유 버튼 등 불필요한 요소들을 제거하고, 실제 본문 내용만 추출해주세요.

요구사항:
- 본문의 핵심 내용을 유지하되, 불필요한 UI 요소나 반복되는 텍스트는 제거
- 너무 간단하게 요약하지 말고, 본문의 주요 내용과 맥락을 충분히 포함
- 문장의 흐름과 구조를 유지
- 원본의 중요한 정보를 최대한 보존

원본 텍스트:
${rawText}

전처리된 본문 내용:`;
  
  return await callGeminiAPI(prompt);
}

// 개선된 요약 프롬프트
async function requestSummary(text) {
  const prompt = `다음 텍스트를 분석하여 핵심 내용을 마크다운 형식으로 구조화하여 요약해주세요.

## 요구사항:
1. **구조화된 형식**: 마크다운 문법을 사용하여 제목, 목록, 강조 등을 활용
2. **핵심 내용 중심**: 가장 중요한 3가지 포인트를 명확하게 제시
3. **상세한 설명**: 각 포인트에 대해 구체적이고 풍부한 설명 포함
4. **가독성**: 번호나 불릿 포인트를 사용하여 읽기 쉽게 구성
5. **완전한 문장**: 단순 나열이 아닌 완전한 문장으로 작성
6. **제목 없이**: "핵심 요약", "요약" 같은 제목 없이 바로 내용만 작성

## 출력 형식 예시:
1. **첫 번째 핵심 내용**
   - 상세한 설명과 배경 정보
   - 관련된 중요한 세부사항

2. **두 번째 핵심 내용**
   - 구체적인 설명과 맥락
   - 추가적인 관련 정보

3. **세 번째 핵심 내용**
   - 중요한 세부사항과 설명
   - 마무리 및 결론

## 원본 텍스트:
${text}

위 형식을 참고하여 제목 없이 바로 내용만 마크다운으로 구조화된 요약을 작성해주세요:`;
  
  return await callGeminiAPI(prompt);
}

// 직접 입력 모드
document.getElementById('submitManual').addEventListener('click', async () => {
  const textInput = document.getElementById('textInput');
  const text = textInput.value.trim();

  if (!text) {
    showError('텍스트를 입력해주세요.');
    return;
  }

  showLoadingWithSteps();
  try {
    const summary = await requestSummary(text);
    showResult(summary);
  } catch (error) {
    hideLoading();
    showError(`요약 실패: ${error.message}`);
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
    
    if (tab.url.startsWith('chrome://') || 
        tab.url.startsWith('chrome-extension://') || 
        tab.url.startsWith('edge://') ||
        tab.url.startsWith('about:')) {
      throw new Error('이 페이지에서는 텍스트를 추출할 수 없습니다.');
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
        throw new Error('페이지에 접근할 수 없습니다. 페이지를 새로고침한 후 다시 시도해주세요.');
      }
    }
    
    if (!extractedText) {
      throw new Error('추출된 텍스트가 없습니다.');
    }

    const preprocessedText = await preprocessWebPageText(extractedText);
    
    if (!preprocessedText || preprocessedText.trim().length === 0) {
      throw new Error('전처리된 텍스트가 없습니다.');
    }

    const summary = await requestSummary(preprocessedText);
    showResult(summary);
  } catch (error) {
    hideLoading();
    showError(`자동 요약 실패: ${error.message}`);
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
      date: new Date().toLocaleString('ko-KR'),
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
    console.error('기록 저장 오류:', error);
    return false;
  }
}

// 요약 기록 로드
async function loadSummaryHistory() {
  try {
    const result = await chrome.storage.local.get(['summaryHistory']);
    return result.summaryHistory || [];
  } catch (error) {
    console.error('기록 로드 오류:', error);
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
    console.error('기록 삭제 오류:', error);
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
    historyTableBody.innerHTML = '<tr><td colspan="3" style="text-align: center; color: #888; padding: 20px;">저장된 요약 이력이 없습니다.</td></tr>';
  } else {
    historyTableBody.innerHTML = history.map(item => {
      // HTML 태그 제거하고 텍스트만 추출
      const textOnly = item.summary.replace(/<[^>]*>/g, '').trim();
      const preview = textOnly.substring(0, 100) + (textOnly.length > 100 ? '...' : '');
      
      return `
      <tr>
        <td class="history-date">${item.date}</td>
        <td>
          <div class="history-content" data-full="${escapeHtml(textOnly)}">${escapeHtml(preview)}</div>
        </td>
        <td>
          <div class="history-actions">
            <button class="history-copy-btn" data-text="${escapeHtml(textOnly)}" title="복사">📋</button>
            <button class="history-delete-btn" data-id="${item.id}" title="삭제">🗑️</button>
          </div>
        </td>
      </tr>
    `;
    }).join('');
    
    // 내용 클릭 이벤트 (확장/축소)
    historyTableBody.querySelectorAll('.history-content').forEach(content => {
      content.addEventListener('click', () => {
        if (content.classList.contains('expanded')) {
          const full = content.dataset.full;
          const preview = full.substring(0, 100) + (full.length > 100 ? '...' : '');
          content.textContent = preview;
          content.classList.remove('expanded');
        } else {
          content.textContent = content.dataset.full;
          content.classList.add('expanded');
        }
        adjustPopupSize();
      });
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
          console.error('복사 실패:', error);
          showError('복사에 실패했습니다.');
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
  adjustPopupSize();
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
  adjustPopupSize();
});

// 결과 복사 버튼
document.getElementById('saveResult').addEventListener('click', async () => {
  if (currentSummary) {
    try {
      // HTML 태그 제거하고 텍스트만 복사
      let textOnly = currentSummary.replace(/<[^>]*>/g, '').trim();
      // 제목 제거
      textOnly = textOnly.replace(/^#+\s*(핵심\s*)?요약\s*\n*/gim, '');
      textOnly = textOnly.trim();
      
      await navigator.clipboard.writeText(textOnly);
      
      const saveBtn = document.getElementById('saveResult');
      saveBtn.classList.add('saved');
      saveBtn.textContent = '✓ 복사 완료';
      setTimeout(() => {
        saveBtn.classList.remove('saved');
        saveBtn.textContent = '📋 복사하기';
      }, 2000);
    } catch (error) {
      console.error('복사 실패:', error);
      showError('복사에 실패했습니다.');
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
    saveBtn.textContent = '📋 복사하기';
  }
});

// 사이드 패널 열기
document.getElementById('openSidePanel').addEventListener('click', async () => {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    await chrome.sidePanel.open({ windowId: tab.windowId });
    window.close(); // 팝업 닫기
  } catch (error) {
    console.error('사이드 패널 열기 실패:', error);
    showError('사이드 패널을 열 수 없습니다.');
  }
});

// 초기화
async function initialize() {
  await loadGeminiApiKey();
  
  const apiKeyInput = document.getElementById('geminiApiKey');
  apiKeyInput.addEventListener('input', saveGeminiApiKey);
  apiKeyInput.addEventListener('change', saveGeminiApiKey);
  apiKeyInput.addEventListener('paste', () => {
    setTimeout(saveGeminiApiKey, 10);
  });
}

initialize();
