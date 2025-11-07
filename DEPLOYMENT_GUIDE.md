# Chrome Web Store 배포 가이드
# Chrome Web Store Deployment Guide

Chrome Web Store에 확장 프로그램을 배포하기 위한 완벽한 가이드입니다.

---

## 📋 목차

1. [빌드 패키지 생성](#1-빌드-패키지-생성)
2. [권한 사용 이유 설명](#2-권한-사용-이유-설명)
3. [개인정보처리방침 호스팅](#3-개인정보처리방침-호스팅)
4. [Chrome Web Store 제출](#4-chrome-web-store-제출)

---

## 1. 빌드 패키지 생성

### 🚀 빠른 시작

```bash
npm run build
```

이 명령어 하나로 배포용 `whatsthis.zip` 패키지가 생성됩니다.

### 빌드 방법

#### 방법 1: npm 스크립트 (권장) ⭐
```bash
npm run build
```

#### 방법 2: Shell 스크립트 (macOS/Linux)
```bash
./build.sh
```

#### 방법 3: Node.js 스크립트 (모든 플랫폼)
```bash
node build.js
```

### 빌드 프로세스

빌드 스크립트는 다음 4단계로 진행됩니다:

**1단계: 기존 빌드 파일 정리**
- 기존 `whatsthis.zip` 파일 삭제
- 기존 `dist/` 디렉토리 삭제

**2단계: 빌드 디렉토리 생성**
- `dist/` 디렉토리 생성

**3단계: 필요한 파일 복사**
- `manifest.json` - 확장 프로그램 설정
- `background.js` - 백그라운드 서비스 워커
- `content.js`, `content-select.js` - 콘텐츠 스크립트
- `popup.html`, `popup.js` - 팝업 UI
- `sidepanel.html`, `sidepanel.js` - 사이드 패널
- `styles.css` - 스타일시트
- `_locales/` - 다국어 지원 파일
- `icons/` - 아이콘 파일들

**4단계: ZIP 패키지 생성**
- `dist/` 디렉토리의 내용을 `whatsthis.zip`으로 압축
- 불필요한 파일 자동 제외 (`.DS_Store`, `__MACOSX/` 등)
- `dist/` 임시 디렉토리 자동 삭제

### 제외되는 파일

배포 패키지에는 다음 파일들이 포함되지 않습니다:

```
❌ node_modules/          # Node.js 의존성
❌ package.json           # npm 설정 파일
❌ package-lock.json      # npm 잠금 파일
❌ build.sh, build.js     # 빌드 스크립트
❌ *.md                   # 문서 파일
❌ server-example.js      # 테스트용 서버
❌ .git/, .gitignore      # Git 파일
❌ .DS_Store, __MACOSX/   # 시스템 파일
❌ dist/, *.zip           # 빌드 산출물
```

### 빌드 결과

빌드가 성공하면 다음과 같은 출력을 볼 수 있습니다:

```
================================
✓ 빌드 완료!
================================

📦 패키지 파일: whatsthis.zip
📊 파일 크기: 958.22 KB
📁 포함된 파일 수: 22

다음 단계:
1. Chrome Web Store Developer Dashboard 접속
2. 'whatsthis.zip' 파일 업로드
3. 개인 정보 보호 관행 정보 입력
```

### 빌드 검증

생성된 zip 파일의 내용을 확인하려면:

```bash
# macOS / Linux
unzip -l whatsthis.zip

# Windows PowerShell
Expand-Archive -Path whatsthis.zip -DestinationPath temp -Force
dir temp
```

올바른 구조:
```
whatsthis.zip
 ├── manifest.json          (루트에 위치 ✅)
 ├── background.js
 ├── content.js
 ├── content-select.js
 ├── popup.html
 ├── popup.js
 ├── sidepanel.html
 ├── sidepanel.js
 ├── styles.css
 ├── _locales/
 │   ├── ko/messages.json
 │   └── en/messages.json
 └── icons/
     └── (아이콘 파일들)
```

---

## 2. 권한 사용 이유 설명

Chrome Web Store의 "개인 정보 보호 관행" 탭에 입력할 권한 사용 이유입니다.

### 권한 목록

1. **Host Permissions** - `https://generativelanguage.googleapis.com/*`
2. **activeTab** - 현재 활성 탭 접근
3. **scripting** - 동적 스크립트 주입
4. **sidePanel** - 사이드 패널 UI
5. **storage** - 로컬 데이터 저장

---

### 1️⃣ Host Permissions

**권한:** `https://generativelanguage.googleapis.com/*`

#### 🇰🇷 한국어

```
이 확장 프로그램은 웹 페이지와 텍스트 콘텐츠의 AI 기반 요약을 생성하기 위해 Google의 Gemini API 엔드포인트에 대한 액세스가 필요합니다. API 호출은 사용자가 명시적으로 요약을 요청할 때만 이루어지며, 외부 서버에 데이터가 저장되지 않습니다.
```

#### 🇺🇸 English (권장)

```
This extension requires access to Google's Gemini API endpoint to generate AI-powered summaries of web pages and text content. The API calls are made only when the user explicitly requests a summary, and no data is stored on external servers.
```

---

### 2️⃣ activeTab Permission

#### 🇰🇷 한국어

```
activeTab 권한은 사용자가 확장 프로그램 아이콘을 클릭할 때 현재 활성 탭의 콘텐츠에 액세스하는 데 필요합니다. 이를 통해 확장 프로그램이 요약을 위해 보이는 페이지에서 텍스트를 추출할 수 있습니다. 액세스는 활성 탭에만 부여되며 사용자가 작업을 시작할 때만 부여됩니다.
```

#### 🇺🇸 English (권장)

```
The activeTab permission is required to access the content of the currently active tab when the user clicks the extension icon. This allows the extension to extract text from the visible page for summarization. Access is granted only for the active tab and only when the user initiates an action.
```

---

### 3️⃣ scripting Permission

#### 🇰🇷 한국어

```
scripting 권한을 사용하면 확장 프로그램이 요약을 위해 텍스트 콘텐츠를 추출하기 위해 웹 페이지에 콘텐츠 스크립트를 주입할 수 있습니다. 스크립트는 사용자가 확장 프로그램의 기능(자동 감지 또는 수동 선택 모드)을 적극적으로 사용할 때만 주입됩니다. 이것은 페이지 콘텐츠를 읽고 처리하는 핵심 기능에 필수적입니다.
```

#### 🇺🇸 English (권장)

```
The scripting permission enables the extension to inject content scripts into web pages to extract text content for summarization. Scripts are only injected when the user actively uses the extension's features (auto-detect or manual selection modes). This is essential for the core functionality of reading and processing page content.
```

---

### 4️⃣ sidePanel Permission

#### 🇰🇷 한국어

```
sidePanel 권한은 Chrome의 사이드 패널에 확장 프로그램의 사용자 인터페이스를 표시하는 데 사용되며, 사용자가 현재 페이지를 떠나지 않고 요약 기능과 상호 작용하고, 결과를 보고, 요약 기록에 액세스할 수 있는 편리하고 방해가 되지 않는 방법을 제공합니다.
```

#### 🇺🇸 English (권장)

```
The sidePanel permission is used to display the extension's user interface in Chrome's side panel, providing a convenient and non-intrusive way for users to interact with summarization features, view results, and access their summary history without leaving their current page.
```

---

### 5️⃣ storage Permission

#### 🇰🇷 한국어

```
storage 권한은 사용자의 Gemini API 키를 로컬에 안전하게 저장하고 요약 기록을 저장하는 데 사용됩니다. 모든 데이터는 chrome.storage.local API를 사용하여 사용자의 기기에 로컬로 저장되며 제3자 서버로 전송되지 않습니다. 사용자는 언제든지 저장된 데이터를 삭제할 수 있습니다.
```

#### 🇺🇸 English (권장)

```
The storage permission is used to securely store the user's Gemini API key locally and save their summary history. All data is stored locally on the user's device using chrome.storage.local API and is never transmitted to any third-party servers. Users can delete their stored data at any time.
```

---

### 📋 권한 사용 요약

| 권한 | 사용 목적 | 데이터 처리 |
|------|-----------|-------------|
| Host Permissions | Gemini API 호출 | API 요청 시에만 전송 |
| activeTab | 현재 탭 텍스트 추출 | 로컬 처리만 |
| scripting | 페이지 콘텐츠 접근 | 로컬 처리만 |
| sidePanel | UI 표시 | 데이터 전송 없음 |
| storage | 설정 및 이력 저장 | 로컬 저장만 |

---

## 3. 개인정보처리방침 호스팅

Chrome Web Store에 입력할 개인정보처리방침 URL을 만드는 방법입니다.

### 🌟 추천 방법: GitHub Pages (무료)

#### 장점
- ✅ 완전 무료
- ✅ HTTPS 자동 지원
- ✅ 신뢰할 수 있는 도메인 (github.io)
- ✅ HTML 파일 그대로 표시
- ✅ 언제든지 업데이트 가능

#### 단계별 설정

**1단계: GitHub 저장소에 파일 push**

```bash
cd /Users/oseunghyeon/DevWorkSpace/chrome/plex-mon

# 개인정보처리방침 파일 추가
git add privacy-policy.html
git commit -m "Add privacy policy"
git push origin main
```

**2단계: GitHub Pages 활성화**

1. https://github.com/LucestDail/plex-mon 접속
2. **Settings** 탭 클릭
3. 왼쪽 메뉴에서 **Pages** 클릭
4. **Source** 섹션에서:
   - Branch: `main` 선택
   - Folder: `/ (root)` 선택
5. **Save** 버튼 클릭

**3단계: 배포 확인 (1-2분 후)**

생성된 URL로 접속하여 확인:

```
https://lucestdail.github.io/plex-mon/privacy-policy.html
```

**4단계: Chrome Web Store에 URL 입력**

위에서 생성된 URL을 복사해서 Chrome Web Store의 **"개인정보처리방침 URL"** 필드에 입력:

```
https://lucestdail.github.io/plex-mon/privacy-policy.html
```

### 🔄 즉시 사용 가능한 대안

GitHub Pages 활성화를 기다리는 동안 다음 URL도 사용 가능:

```
https://github.com/LucestDail/plex-mon/blob/main/privacy-policy.html
```

### URL 검증

개인정보처리방침 URL이 제대로 작동하는지 확인:

1. **브라우저에서 URL 열기**
   - HTML 페이지가 제대로 표시되는지 확인
   - 영어/한국어 언어 전환이 작동하는지 확인

2. **HTTPS 확인**
   - URL이 `https://`로 시작하는지 확인
   - Chrome Web Store는 HTTPS를 요구함

3. **접근 가능성 확인**
   - 시크릿 모드에서도 접근 가능한지 확인
   - 다른 브라우저에서도 접근 가능한지 확인

---

## 4. Chrome Web Store 제출

### 제출 전 체크리스트

- [ ] `whatsthis.zip` 빌드 완료
- [ ] GitHub Pages 활성화 완료
- [ ] 개인정보처리방침 URL 접속 확인
- [ ] 권한 사용 이유 설명 준비

### 제출 단계

#### 1단계: Chrome Web Store Developer Dashboard 접속

https://chrome.google.com/webstore/devconsole/

#### 2단계: 새 항목 만들기

1. "새 항목" 버튼 클릭
2. `whatsthis.zip` 파일 업로드
3. "업로드" 클릭

#### 3단계: 스토어 등록 정보 입력

**기본 정보:**
- **이름**: 뭔 내용이지 / What's this
- **설명**: 
  ```
  웹 페이지나 텍스트를 AI로 간결하게 요약하는 Chrome 확장 프로그램입니다.
  
  Google Gemini API를 활용하여 긴 기사, 블로그, 문서를 빠르게 요약합니다.
  
  주요 기능:
  • 자동 인식: 웹 페이지 본문 자동 추출 및 요약
  • 직접 선택: 원하는 영역만 선택하여 요약
  • 직접 입력: 텍스트를 직접 입력하여 요약
  • 요약 이력: 이전 요약 결과 저장 및 관리
  • 다국어 지원: 한국어/영어 자동 전환
  ```

- **카테고리**: Productivity
- **언어**: English, Korean

**스크린샷:**
- 최소 1개 (권장 3-5개)
- 크기: 1280x800 또는 640x400

**아이콘:**
- 128x128 이미지 (이미 manifest.json에 포함되어 있음)

#### 4단계: 개인 정보 보호 관행

**개인정보처리방침 URL:**
```
https://lucestdail.github.io/plex-mon/privacy-policy.html
```

**Single Purpose Description:**
```
Summarize web pages and text using Google Gemini AI
```

**권한 사용 이유:**

각 권한에 대해 위의 [2. 권한 사용 이유 설명](#2-권한-사용-이유-설명) 섹션의 **영어 버전**을 복사하여 입력합니다.

1. **Host Permissions** (`https://generativelanguage.googleapis.com/*`)
   - 위 섹션의 영어 설명 복사

2. **activeTab**
   - 위 섹션의 영어 설명 복사

3. **scripting**
   - 위 섹션의 영어 설명 복사

4. **sidePanel**
   - 위 섹션의 영어 설명 복사

5. **storage**
   - 위 섹션의 영어 설명 복사

**데이터 사용 공개:**
- ✅ 이 항목은 사용자 데이터를 수집합니다
- 수집 데이터: API keys, User activity
- 사용 목적: App functionality
- 데이터 처리: 데이터가 로컬에만 저장되고 전송되지 않음

#### 5단계: 심사 제출

1. 모든 필수 항목 입력 확인
2. "저장 초안" 클릭하여 저장
3. 검토 후 "심사 제출" 클릭

### 심사 기간

- **일반적인 심사 기간**: 1-3일
- **첫 제출**: 최대 7일까지 소요될 수 있음
- **거부 시**: 이유를 확인하고 수정 후 재제출

---

## 🐛 문제 해결

### 빌드 관련

**Q: "zip 명령을 찾을 수 없습니다" 오류**

A: 
```bash
# macOS (기본으로 설치되어 있음)
which zip

# Linux (Ubuntu/Debian)
sudo apt-get install zip

# Windows
npm run build  # Node.js 스크립트 사용 (PowerShell 자동 사용)
```

**Q: manifest.json이 루트에 없다는 오류**

A: 빌드 스크립트를 다시 실행하고 zip 구조 확인:
```bash
unzip -l whatsthis.zip | head -20
```

### GitHub Pages 관련

**Q: 404 오류 또는 페이지가 표시되지 않음**

A:
1. GitHub 저장소의 Settings > Pages에서 상태 확인
2. Branch와 Folder가 올바르게 설정되었는지 확인
3. 파일 이름이 `privacy-policy.html`인지 확인 (대소문자 구분)
4. 1-2분 기다린 후 다시 시도

**Q: 파일 업데이트가 반영되지 않음**

A:
```bash
# 1. GitHub에 push 확인
git push

# 2. 브라우저 캐시 삭제
# Ctrl+Shift+R (Windows/Linux)
# Cmd+Shift+R (macOS)

# 3. 5분 정도 기다리기
```

### Chrome Web Store 관련

**Q: "개인정보처리방침 URL이 유효하지 않습니다"**

A:
- HTTPS URL인지 확인
- URL이 실제로 접속 가능한지 확인
- 시크릿 모드에서도 접속 가능한지 확인

**Q: 권한 설명이 충분하지 않다는 거부**

A:
- 더 구체적인 설명 추가
- 데이터가 어떻게 사용되는지 명확히 설명
- 로컬 저장만 한다는 점 강조

**Q: 스크린샷 크기 오류**

A:
- 1280x800 또는 640x400 크기 사용
- PNG 또는 JPEG 형식 사용
- 최대 5MB 이하

---

## 📚 참고 자료

### 공식 문서
- [Chrome Web Store Developer Documentation](https://developer.chrome.com/docs/webstore/)
- [Chrome Extension Manifest V3](https://developer.chrome.com/docs/extensions/mv3/)
- [GitHub Pages Documentation](https://docs.github.com/pages)

### 유용한 링크
- [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole/)
- [Google AI Studio](https://makersuite.google.com/app/apikey)
- [Gemini API Documentation](https://ai.google.dev/docs)

---

## 🎯 빠른 참조

### 명령어 요약

```bash
# 빌드
npm run build

# Git 업로드
git add privacy-policy.html
git commit -m "Add privacy policy"
git push origin main

# 빌드 검증
unzip -l whatsthis.zip
```

### URL 요약

```
# 개인정보처리방침
https://lucestdail.github.io/plex-mon/privacy-policy.html

# GitHub 저장소
https://github.com/LucestDail/plex-mon

# Chrome Web Store Dashboard
https://chrome.google.com/webstore/devconsole/
```

---

## ✅ 최종 체크리스트

배포 전 모든 항목을 확인하세요:

### 빌드
- [ ] `npm run build` 실행 완료
- [ ] `whatsthis.zip` 파일 생성 확인
- [ ] zip 파일 구조 검증 (manifest.json이 루트에 있는지)

### GitHub
- [ ] `privacy-policy.html` 파일 push 완료
- [ ] GitHub Pages 활성화 완료
- [ ] URL 접속 테스트 완료 (`https://lucestdail.github.io/plex-mon/privacy-policy.html`)
- [ ] HTTPS 작동 확인
- [ ] 영어/한국어 전환 테스트 완료

### Chrome Web Store
- [ ] Developer Dashboard 접속
- [ ] `whatsthis.zip` 업로드 완료
- [ ] 스토어 등록 정보 입력 완료
- [ ] 개인정보처리방침 URL 입력 완료
- [ ] 권한 사용 이유 입력 완료 (5개 권한)
- [ ] 스크린샷 업로드 완료
- [ ] 심사 제출 완료

---

**모든 준비가 완료되었습니다! Chrome Web Store 심사를 기다리시면 됩니다.** 🎉

궁금한 점이 있으시면 언제든지 문의해주세요.

**작성자**: lucestdail@kakao.com
**GitHub**: https://github.com/LucestDail

