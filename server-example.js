// 간단한 Node.js Express 서버 예제
// 테스트용으로 사용할 수 있습니다.
// 
// 사용 방법:
// 1. npm install express
// 2. node server-example.js
// 3. 확장 프로그램에서 서버 URL을 http://localhost:3000/api/summarize 로 설정

const express = require('express');
const app = express();
const PORT = 3000;

app.use(express.json());

// CORS 허용 (확장 프로그램에서 접근 가능하도록)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// 간단한 3줄 요약 함수 (실제로는 LLM API를 호출해야 함)
function summarizeText(text) {
  // 실제 구현에서는 OpenAI, Claude, 또는 다른 LLM API를 호출해야 합니다.
  // 여기서는 간단한 예제로 텍스트를 3줄로 나눕니다.
  
  const sentences = text.split(/[.!?]\s+/).filter(s => s.trim().length > 0);
  const chunkSize = Math.ceil(sentences.length / 3);
  
  const summary = [];
  for (let i = 0; i < 3 && i * chunkSize < sentences.length; i++) {
    const chunk = sentences.slice(i * chunkSize, (i + 1) * chunkSize);
    summary.push(`${i + 1}. ${chunk.join('. ')}`);
  }
  
  return summary.join('\n');
}

app.post('/api/summarize', (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ 
        error: '텍스트가 필요합니다.',
        summary: '요약할 텍스트를 제공해주세요.' 
      });
    }
    
    if (text.trim().length === 0) {
      return res.status(400).json({ 
        error: '텍스트가 비어있습니다.',
        summary: '텍스트를 입력해주세요.' 
      });
    }
    
    // 실제로는 여기서 LLM API를 호출해야 합니다
    // 예: OpenAI, Claude, 또는 자체 LLM 서버
    const summary = summarizeText(text);
    
    res.json({ 
      summary: summary,
      originalLength: text.length,
      summaryLength: summary.length
    });
  } catch (error) {
    console.error('요약 오류:', error);
    res.status(500).json({ 
      error: '요약 처리 중 오류가 발생했습니다.',
      summary: '요약을 생성할 수 없습니다. 다시 시도해주세요.' 
    });
  }
});

app.get('/', (req, res) => {
  res.json({ 
    message: '3줄 요약 서버가 실행 중입니다.',
    endpoint: '/api/summarize',
    method: 'POST',
    body: { text: '요약할 텍스트' }
  });
});

app.listen(PORT, () => {
  console.log(`서버가 http://localhost:${PORT} 에서 실행 중입니다.`);
  console.log(`요약 엔드포인트: http://localhost:${PORT}/api/summarize`);
});

