#!/bin/bash

# Chrome Extension Build Script
# 배포용 zip 패키지를 생성하는 스크립트

# 색상 정의
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 출력 디렉토리
OUTPUT_DIR="dist"
ZIP_NAME="whatsthis.zip"

echo -e "${BLUE}================================${NC}"
echo -e "${BLUE}Chrome Extension Build Script${NC}"
echo -e "${BLUE}================================${NC}"
echo ""

# 1. 기존 빌드 정리
echo -e "${YELLOW}[1/4]${NC} 기존 빌드 파일 정리 중..."
if [ -f "$ZIP_NAME" ]; then
    rm "$ZIP_NAME"
    echo "  ✓ 기존 $ZIP_NAME 삭제"
fi

if [ -d "$OUTPUT_DIR" ]; then
    rm -rf "$OUTPUT_DIR"
    echo "  ✓ 기존 $OUTPUT_DIR 디렉토리 삭제"
fi

# 2. 임시 디렉토리 생성
echo -e "${YELLOW}[2/4]${NC} 빌드 디렉토리 생성 중..."
mkdir -p "$OUTPUT_DIR"
echo "  ✓ $OUTPUT_DIR 디렉토리 생성"

# 3. 필요한 파일만 복사
echo -e "${YELLOW}[3/4]${NC} 필요한 파일 복사 중..."

# 루트 파일들
FILES=(
    "manifest.json"
    "background.js"
    "content.js"
    "content-select.js"
    "popup.html"
    "popup.js"
    "sidepanel.html"
    "sidepanel.js"
    "styles.css"
)

for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        cp "$file" "$OUTPUT_DIR/"
        echo "  ✓ $file"
    else
        echo -e "  ${RED}✗ $file (파일을 찾을 수 없음)${NC}"
    fi
done

# 디렉토리들
DIRS=(
    "_locales"
    "icons"
)

for dir in "${DIRS[@]}"; do
    if [ -d "$dir" ]; then
        cp -r "$dir" "$OUTPUT_DIR/"
        echo "  ✓ $dir/"
    else
        echo -e "  ${RED}✗ $dir/ (디렉토리를 찾을 수 없음)${NC}"
    fi
done

# 4. ZIP 파일 생성
echo -e "${YELLOW}[4/4]${NC} ZIP 패키지 생성 중..."
cd "$OUTPUT_DIR"
zip -r "../$ZIP_NAME" . -x "*.DS_Store" "__MACOSX/*" > /dev/null 2>&1
cd ..

# 빌드 정보 출력
FILE_SIZE=$(du -h "$ZIP_NAME" | cut -f1)
FILE_COUNT=$(unzip -l "$ZIP_NAME" | tail -1 | awk '{print $2}')

echo ""
echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}✓ 빌드 완료!${NC}"
echo -e "${GREEN}================================${NC}"
echo ""
echo -e "📦 패키지 파일: ${BLUE}$ZIP_NAME${NC}"
echo -e "📊 파일 크기: ${BLUE}$FILE_SIZE${NC}"
echo -e "📁 포함된 파일 수: ${BLUE}$FILE_COUNT${NC}"
echo ""
echo -e "${YELLOW}다음 단계:${NC}"
echo "1. Chrome Web Store Developer Dashboard 접속"
echo "2. '$ZIP_NAME' 파일 업로드"
echo "3. 개인 정보 보호 관행 정보 입력"
echo ""

# 5. 임시 디렉토리 정리 (선택사항)
read -p "임시 빌드 디렉토리($OUTPUT_DIR)를 삭제하시겠습니까? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    rm -rf "$OUTPUT_DIR"
    echo -e "${GREEN}✓ 임시 디렉토리 삭제 완료${NC}"
fi

echo ""
echo -e "${GREEN}완료!${NC}"

