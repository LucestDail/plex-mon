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

