#!/usr/bin/env node

/**
 * Chrome Extension Build Script (Node.js version)
 * 크로스 플랫폼 배포용 zip 패키지 생성 스크립트
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 설정
const OUTPUT_DIR = 'dist';
const ZIP_NAME = 'whatsthis.zip';

// 색상 코드
const colors = {
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  reset: '\x1b[0m'
};

// 포함할 파일 목록
const FILES_TO_INCLUDE = [
  'manifest.json',
  'background.js',
  'content.js',
  'content-select.js',
  'popup.html',
  'popup.js',
  'sidepanel.html',
  'sidepanel.js',
  'styles.css'
];

// 포함할 디렉토리 목록
const DIRS_TO_INCLUDE = [
  '_locales',
  'icons'
];

// 유틸리티 함수
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, total, message) {
  log(`[${step}/${total}] ${message}`, 'yellow');
}

function logSuccess(message) {
  log(`  ✓ ${message}`, 'green');
}

function logError(message) {
  log(`  ✗ ${message}`, 'red');
}

// 디렉토리 재귀 삭제
function removeDir(dirPath) {
  if (fs.existsSync(dirPath)) {
    fs.readdirSync(dirPath).forEach(file => {
      const filePath = path.join(dirPath, file);
      if (fs.lstatSync(filePath).isDirectory()) {
        removeDir(filePath);
      } else {
        fs.unlinkSync(filePath);
      }
    });
    fs.rmdirSync(dirPath);
  }
}

// 디렉토리 재귀 복사
function copyDir(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  
  const entries = fs.readdirSync(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    // .DS_Store 파일 제외
    if (entry.name === '.DS_Store') continue;
    
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// 파일 크기 포맷팅
function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

// 메인 빌드 함수
async function build() {
  log('================================', 'blue');
  log('Chrome Extension Build Script', 'blue');
  log('================================', 'blue');
  console.log('');

  try {
    // 1. 기존 빌드 정리
    logStep(1, 4, '기존 빌드 파일 정리 중...');
    
    if (fs.existsSync(ZIP_NAME)) {
      fs.unlinkSync(ZIP_NAME);
      logSuccess(`기존 ${ZIP_NAME} 삭제`);
    }
    
    if (fs.existsSync(OUTPUT_DIR)) {
      removeDir(OUTPUT_DIR);
      logSuccess(`기존 ${OUTPUT_DIR} 디렉토리 삭제`);
    }

    // 2. 임시 디렉토리 생성
    logStep(2, 4, '빌드 디렉토리 생성 중...');
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    logSuccess(`${OUTPUT_DIR} 디렉토리 생성`);

    // 3. 필요한 파일 복사
    logStep(3, 4, '필요한 파일 복사 중...');
    
    // 루트 파일들 복사
    FILES_TO_INCLUDE.forEach(file => {
      const srcPath = path.join(__dirname, file);
      const destPath = path.join(__dirname, OUTPUT_DIR, file);
      
      if (fs.existsSync(srcPath)) {
        fs.copyFileSync(srcPath, destPath);
        logSuccess(file);
      } else {
        logError(`${file} (파일을 찾을 수 없음)`);
      }
    });
    
    // 디렉토리들 복사
    DIRS_TO_INCLUDE.forEach(dir => {
      const srcPath = path.join(__dirname, dir);
      const destPath = path.join(__dirname, OUTPUT_DIR, dir);
      
      if (fs.existsSync(srcPath)) {
        copyDir(srcPath, destPath);
        logSuccess(`${dir}/`);
      } else {
        logError(`${dir}/ (디렉토리를 찾을 수 없음)`);
      }
    });

    // 4. ZIP 파일 생성
    logStep(4, 4, 'ZIP 패키지 생성 중...');
    
    // zip 명령어 확인 및 실행
    try {
      const platform = process.platform;
      let zipCommand;
      
      if (platform === 'win32') {
        // Windows: PowerShell의 Compress-Archive 사용
        zipCommand = `powershell -command "Compress-Archive -Path '${OUTPUT_DIR}\\*' -DestinationPath '${ZIP_NAME}' -Force"`;
      } else {
        // macOS, Linux: zip 명령어 사용
        zipCommand = `cd ${OUTPUT_DIR} && zip -r ../${ZIP_NAME} . -x "*.DS_Store" "__MACOSX/*"`;
      }
      
      execSync(zipCommand, { stdio: 'ignore' });
      logSuccess(`${ZIP_NAME} 생성 완료`);
    } catch (error) {
      throw new Error('ZIP 파일 생성 실패: ' + error.message);
    }

    // 빌드 정보 출력
    const stats = fs.statSync(ZIP_NAME);
    const fileSize = formatFileSize(stats.size);
    
    console.log('');
    log('================================', 'green');
    log('✓ 빌드 완료!', 'green');
    log('================================', 'green');
    console.log('');
    log(`📦 패키지 파일: ${ZIP_NAME}`, 'blue');
    log(`📊 파일 크기: ${fileSize}`, 'blue');
    console.log('');
    log('다음 단계:', 'yellow');
    console.log('1. Chrome Web Store Developer Dashboard 접속');
    console.log(`2. '${ZIP_NAME}' 파일 업로드`);
    console.log('3. 개인 정보 보호 관행 정보 입력');
    console.log('');

    // 5. 임시 디렉토리 정리
    if (fs.existsSync(OUTPUT_DIR)) {
      removeDir(OUTPUT_DIR);
      logSuccess('임시 디렉토리 삭제 완료');
    }

    console.log('');
    log('완료!', 'green');
    
  } catch (error) {
    console.error('');
    log('빌드 실패:', 'red');
    console.error(error.message);
    process.exit(1);
  }
}

// 스크립트 실행
if (require.main === module) {
  build();
}

module.exports = { build };

