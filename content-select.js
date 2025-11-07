// 직접 선택 모드를 위한 content script
let isSelectionMode = false;
let hoveredElement = null;
let selectedElements = new Set(); // 복수 선택을 위한 Set 사용

// 선택 모드 시작
function startSelectionMode() {
  isSelectionMode = true;
  document.body.style.cursor = 'crosshair';
  
  // 모든 요소에 마우스 이벤트 추가
  document.addEventListener('mouseover', handleMouseOver, true);
  document.addEventListener('mouseout', handleMouseOut, true);
  document.addEventListener('click', handleClick, true);
  
  // ESC 키로 취소
  document.addEventListener('keydown', handleEscape);
  
  // 선택 모드 스타일 주입
  injectSelectionStyles();
}

// 선택 초기화
function clearAllSelections() {
  // 모든 선택된 요소의 클래스 제거
  selectedElements.forEach(element => {
    element.classList.remove('plex-selection-selected');
  });
  selectedElements.clear();
  
  // storage 초기화
  chrome.storage.local.set({ textSelected: false, selectedText: '' });
  
  // 메시지 전송
  chrome.runtime.sendMessage({ action: 'selectionsCleared' });
}

// 선택 모드 종료
function stopSelectionMode() {
  isSelectionMode = false;
  document.body.style.cursor = '';
  
  // 모든 이벤트 리스너 제거
  document.removeEventListener('mouseover', handleMouseOver, true);
  document.removeEventListener('mouseout', handleMouseOut, true);
  document.removeEventListener('click', handleClick, true);
  document.removeEventListener('keydown', handleEscape);
  
  // 모든 하이라이트 제거 (선택된 요소는 유지)
  document.querySelectorAll('.plex-selection-highlight').forEach(el => {
    el.classList.remove('plex-selection-highlight');
  });
  
  // 선택된 요소의 음영은 유지 (사용자가 확인할 수 있도록)
  // 선택 모드가 종료되어도 선택된 요소는 보이도록 함
  
  hoveredElement = null;
  // selectedElement는 유지 (선택 모드 종료 후에도 선택된 요소를 볼 수 있도록)
}

// 선택 모드 스타일 주입
function injectSelectionStyles() {
  if (document.getElementById('plex-selection-styles')) return;
  
  const style = document.createElement('style');
  style.id = 'plex-selection-styles';
  style.textContent = `
    .plex-selection-highlight {
      background-color: rgba(156, 39, 176, 0.2) !important;
      border: 2px dashed #9C27B0 !important;
      cursor: pointer !important;
      transition: all 0.2s ease !important;
      outline: none !important;
    }
    
    .plex-selection-highlight:hover {
      background-color: rgba(156, 39, 176, 0.3) !important;
      border-color: #7B1FA2 !important;
    }
    
    .plex-selection-selected {
      background-color: rgba(156, 39, 176, 0.4) !important;
      border: 2px solid #9C27B0 !important;
      cursor: pointer !important;
      outline: none !important;
    }
  `;
  document.head.appendChild(style);
}

// 마우스 오버 처리
function handleMouseOver(e) {
  if (!isSelectionMode) return;
  
  const element = e.target;
  
  // script, style 등은 제외
  if (element.tagName === 'SCRIPT' || 
      element.tagName === 'STYLE' || 
      element.tagName === 'NOSCRIPT' ||
      element.closest('script, style, noscript')) {
    return;
  }
  
  // 이미 선택된 요소는 제외
  if (element.classList.contains('plex-selection-selected')) {
    return;
  }
  
  // 이전 하이라이트 제거
  if (hoveredElement && hoveredElement !== element) {
    hoveredElement.classList.remove('plex-selection-highlight');
  }
  
  // 현재 요소 하이라이트
  element.classList.add('plex-selection-highlight');
  hoveredElement = element;
}

// 마우스 아웃 처리
function handleMouseOut(e) {
  if (!isSelectionMode) return;
  
  const element = e.target;
  
  // 선택된 요소는 하이라이트 유지
  if (!element.classList.contains('plex-selection-selected')) {
    element.classList.remove('plex-selection-highlight');
  }
  
  if (hoveredElement === element) {
    hoveredElement = null;
  }
}

// 클릭 처리 (복수 선택 지원)
function handleClick(e) {
  if (!isSelectionMode) return;
  
  e.preventDefault();
  e.stopPropagation();
  
  const element = e.target;
  
  // script, style 등은 제외
  if (element.tagName === 'SCRIPT' || 
      element.tagName === 'STYLE' || 
      element.tagName === 'NOSCRIPT' ||
      element.closest('script, style, noscript')) {
    return;
  }
  
  // 이미 선택된 요소인지 확인
  if (selectedElements.has(element)) {
    // 이미 선택된 요소면 선택 해제
    element.classList.remove('plex-selection-selected');
    selectedElements.delete(element);
  } else {
    // 새로운 요소 선택
    element.classList.remove('plex-selection-highlight');
    element.classList.add('plex-selection-selected');
    selectedElements.add(element);
  }
  
  // 모든 선택된 요소의 텍스트 추출 및 합치기
  updateSelectedText();
}

// 선택된 모든 요소의 텍스트를 추출하고 합치기
function updateSelectedText() {
  const texts = [];
  
  selectedElements.forEach(element => {
    const clone = element.cloneNode(true);
    const elementsToRemove = clone.querySelectorAll('script, style, noscript, iframe, embed, object');
    elementsToRemove.forEach(el => el.remove());
    
    let text = (clone.innerText || clone.textContent || '').trim();
    
    // 공백 정리
    text = text.replace(/\s+/g, ' ').replace(/\n\s*\n/g, '\n').trim();
    
    if (text && text.length > 0) {
      texts.push(text);
    }
  });
  
  // 모든 텍스트를 합치기 (구분자: 두 줄바꿈)
  const combinedText = texts.join('\n\n');
  
  if (combinedText && combinedText.length > 0) {
    // storage에 저장
    chrome.storage.local.set({ 
      selectedText: combinedText,
      textSelected: true,
      selectedCount: selectedElements.size
    });
    
    // 메시지 전송
    chrome.runtime.sendMessage({ 
      action: 'textSelected', 
      text: combinedText,
      count: selectedElements.size
    });
  } else {
    // 선택된 텍스트가 없으면 초기화
    chrome.storage.local.set({ 
      selectedText: '',
      textSelected: false,
      selectedCount: 0
    });
    
    chrome.runtime.sendMessage({ 
      action: 'selectionsCleared'
    });
  }
}

// ESC 키 처리
function handleEscape(e) {
  if (e.key === 'Escape' && isSelectionMode) {
    // 선택 취소 (하지만 선택 모드는 유지)
    clearAllSelections();
  }
}

// 메시지 리스너
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'startSelection') {
    startSelectionMode();
    sendResponse({ success: true });
  } else if (request.action === 'stopSelection') {
    stopSelectionMode();
    sendResponse({ success: true });
  } else if (request.action === 'clearSelection') {
    clearAllSelections();
    sendResponse({ success: true });
  }
  return true;
});

