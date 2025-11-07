// 웹 페이지에서 텍스트 추출
function extractTextFromPage() {
  // body 요소 가져오기
  const body = document.body;
  
  if (!body) {
    return '';
  }

  // body의 복사본 생성 (원본에 영향 없도록)
  const clone = body.cloneNode(true);
  
  // script, style, noscript 태그 제거
  const elementsToRemove = clone.querySelectorAll('script, style, noscript, iframe, embed, object');
  elementsToRemove.forEach(el => el.remove());
  
  // 텍스트 추출
  let text = clone.innerText || clone.textContent || '';
  
  // 공백 정리 (여러 공백을 하나로, 줄바꿈 정리)
  text = text
    .replace(/\s+/g, ' ')  // 여러 공백을 하나로
    .replace(/\n\s*\n/g, '\n')  // 여러 줄바꿈을 하나로
    .trim();
  
  // 텍스트 길이 제한 (너무 긴 경우)
  const maxLength = 50000;
  if (text.length > maxLength) {
    text = text.substring(0, maxLength) + '...';
  }
  
  return text;
}

// 메시지 리스너
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'extractText') {
    try {
      const text = extractTextFromPage();
      sendResponse({ text: text });
    } catch (error) {
      sendResponse({ error: error.message });
    }
    return true; // 비동기 응답을 위해 true 반환
  }
});

