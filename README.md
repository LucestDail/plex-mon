# 뭔 내용이지 — AI 웹 페이지 요약 확장 프로그램

> 웹 페이지 본문이나 사용자가 입력한 텍스트를 Google Gemini AI로 간결하게 요약하는 Chrome 확장 프로그램입니다.

## 주요 기능

- **자동 인식 요약** — 현재 탭의 본문을 자동 추출 후 Gemini로 전처리 → 요약
- **직접 선택 요약** — 페이지 내 원하는 영역을 다중 선택하여 해당 부분만 요약
- **직접 입력 요약** — 텍스트 또는 URL을 직접 입력하여 요약
- **사이드 패널 UI** — Chrome Side Panel API를 활용한 깔끔한 인터페이스
- **요약 이력** — 최대 50건의 요약 이력 자동 저장
- **한국어/영어 지원** — `chrome.i18n` 기반 다국어 UI

## 기술 스택

| 구분 | 기술 |
|------|------|
| 플랫폼 | Chrome Extension Manifest V3 |
| UI | Vanilla JavaScript, HTML/CSS, Side Panel API |
| AI | Google Gemini 2.5 Flash (REST) |
| 저장소 | `chrome.storage.local` |
| i18n | `_locales/ko`, `_locales/en` |
| 빌드 | Node.js `build.js` → `whatsthis.zip` |

## 프로젝트 구조

```
plex-mon/
├── manifest.json          # MV3 매니페스트
├── background.js          # 서비스 워커 (사이드 패널 제어)
├── sidepanel.html/js      # 메인 UI (요약, Gemini 호출, 이력)
├── content.js             # 본문 텍스트 추출 (최대 5만 자)
├── content-select.js      # 직접 선택 모드
├── popup.html/js          # 팝업 UI
├── styles.css             # 스타일
├── _locales/              # 한국어(ko), 영어(en)
├── icons/                 # icon16/48/128.png
├── privacy-policy.html    # 개인정보처리방침
├── build.js               # 배포 zip 빌드 스크립트
├── server-example.js      # Express 테스트 서버 (선택)
└── DEPLOYMENT_GUIDE.md    # 스토어 배포 가이드
```

## 설치

### Chrome에 직접 로드
1. `chrome://extensions/` → 개발자 모드 → **압축해제된 확장 프로그램을 로드합니다** → 이 폴더 선택

### 배포용 빌드
```bash
npm install
npm run build    # whatsthis.zip 생성
```

## 설정

| 항목 | 설명 |
|------|------|
| Gemini API 키 | [Google AI Studio](https://aistudio.google.com/api-keys)에서 발급 후 사이드 패널에 입력 |
| 요약 모드 | 자동 인식 / 직접 선택 / 직접 입력 |

## 라이선스

MIT
