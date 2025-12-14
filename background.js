// 확장 프로그램 아이콘 클릭 시 사이드 패널 열기
chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.open({ windowId: tab.windowId });
});

// 탭이 업데이트될 때마다 사이드 패널이 열려있도록 유지
chrome.tabs.onUpdated.addListener((tabId, info, tab) => {
  if (info.status === 'complete' && tab.url) {
    // 사이드 패널이 이미 열려있는지 확인하고 유지
    chrome.sidePanel.getOptions({ tabId: tabId }).catch(() => {
      // 사이드 패널이 열려있지 않으면 아무것도 하지 않음
    });
  }
});

// 탭이 변경될 때 선택 모드 초기화
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  try {
    // 현재 활성화된 모드 확인
    const result = await chrome.storage.local.get(['currentMode']);
    const currentMode = result.currentMode;
    
    // 직접 선택 모드가 아닌 경우에만 선택 초기화
    if (currentMode !== 'select') {
      // 모든 탭에서 선택 초기화
      const tabs = await chrome.tabs.query({});
      for (const tab of tabs) {
        if (tab.id && tab.url && 
            !tab.url.startsWith('chrome://') && 
            !tab.url.startsWith('chrome-extension://') && 
            !tab.url.startsWith('edge://') &&
            !tab.url.startsWith('about:')) {
          try {
            await chrome.tabs.sendMessage(tab.id, { action: 'clearSelection' });
          } catch (e) {
            // 탭이 접근 불가능한 경우 무시
          }
        }
      }
    }
  } catch (error) {
    console.error('Error clearing selections on tab change:', error);
  }
});

