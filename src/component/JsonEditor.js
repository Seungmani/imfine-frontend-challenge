// JsonEditor.js
class JsonEditor {
  constructor(containerSelector, dataManager) {
    this.container = document.querySelector(containerSelector);
    this.dataManager = dataManager;
    this.init();
    this.dataManager.subscribe(this.update.bind(this));
    this.errorLineTimeout = null;
  }

  init() {
    document.getElementById('json-apply-btn').addEventListener('click', this.applyJson.bind(this));
    const jsonEditor = document.getElementById('json-editor');
    jsonEditor.addEventListener('input', this.updateLineHighlight.bind(this));
    
    // Tab 키 처리를 위한 이벤트 리스너 추가
    jsonEditor.addEventListener('keydown', this.handleTabKey.bind(this));
    
    this.update(this.dataManager.getData());
  }

  // Tab 키 처리
  handleTabKey(e) {
    if (e.key === 'Tab') {
      e.preventDefault(); // 기본 탭 동작 방지
      
      const textarea = e.target;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      
      // 선택된 영역이 있는 경우
      if (start !== end) {
        const selectedText = textarea.value.substring(start, end);
        const lines = selectedText.split('\n');
        
        // 여러 줄이 선택된 경우 각 줄 앞에 들여쓰기 추가/제거
        if (lines.length > 1) {
          let newText;
          
          if (e.shiftKey) {
            // 들여쓰기 제거 (Shift+Tab)
            newText = lines.map(line => line.startsWith('  ') ? line.substring(2) : line).join('\n');
          } else {
            // 들여쓰기 추가 (Tab)
            newText = lines.map(line => '  ' + line).join('\n');
          }
          
          textarea.value = 
            textarea.value.substring(0, start) + 
            newText + 
            textarea.value.substring(end);
          
          // 선택 영역 유지
          textarea.selectionStart = start;
          textarea.selectionEnd = start + newText.length;
        } else {
          // 단일 줄 선택 - 탭 문자 삽입
          const newText = '  '; // 2칸 들여쓰기
          textarea.value = 
            textarea.value.substring(0, start) + 
            newText + 
            textarea.value.substring(end);
          
          // 커서 위치 조정
          textarea.selectionStart = textarea.selectionEnd = start + newText.length;
        }
      } else {
        // 선택된 영역이 없는 경우 - 현재 커서 위치에 탭 문자 삽입
        const newText = '  '; // 2칸 들여쓰기
        textarea.value = 
          textarea.value.substring(0, start) + 
          newText + 
          textarea.value.substring(end);
        
        // 커서 위치 조정
        textarea.selectionStart = textarea.selectionEnd = start + newText.length;
      }
      
      // 에디터 내용이 변경되었음을 알림 (input 이벤트 발생)
      const event = new Event('input', { bubbles: true });
      textarea.dispatchEvent(event);
    }
  }

  // JSON 내용 업데이트 시 호출
  update(data) {
    document.getElementById('json-editor').value = JSON.stringify(data, null, 2);
    this.hideError();
  }

  // 텍스트 영역에서 특정 줄 하이라이트 표시
  highlightLine(lineNumber) {
    const textarea = document.getElementById('json-editor');
    const lines = textarea.value.split('\n');

    if (lineNumber < 1 || lineNumber > lines.length) return; // 유효하지 않은 줄 번호
    
    // 커서 위치 계산
    let position = 0;
    for (let i = 0; i < lineNumber - 1; i++) {
      position += lines[i].length + 1; // +1은 줄바꿈 문자
    }
    
    // 해당 줄의 끝 위치 계산
    const endPosition = position + lines[lineNumber - 1].length;
    
    // 텍스트 영역에 포커스를 주고 해당 줄 선택
    textarea.focus();
    textarea.setSelectionRange(position, endPosition);
    
    // 스크롤하여 해당 줄이 보이게 함
    const lineHeight = parseInt(getComputedStyle(textarea).lineHeight) || 18;
    textarea.scrollTop = (lineNumber - 2) * lineHeight; // 선택한 줄이 상단에 보이도록 약간 위로 스크롤
    
    // 에러 발생 시 에디터에 오류 스타일 추가
    textarea.classList.add('error-line');

    // 이전 타임아웃 취소
    if (this.errorLineTimeout) {
      clearTimeout(this.errorLineTimeout);
    }
    
    // 몇 초 후에 하이라이트 스타일은 제거하되, 선택 상태는 유지
    this.errorLineTimeout = setTimeout(() => {
      textarea.classList.remove('error-line');
      this.errorLineTimeout = null;
    }, 5000);
  }

  // 오류 메시지로부터 줄 번호 추출
  extractLineNumber(errorMessage) {
    // 라인과 컬럼 정보가 직접 포함된 경우 (Chrome, Firefox)
    const lineColMatch = errorMessage.match(/line (\d+) column (\d+)/i);
    if (lineColMatch && lineColMatch[1]) {
      const lineNumber = parseInt(lineColMatch[1]);
      return lineNumber;
    }
    
    // 줄 번호만 명시적으로 포함된 경우
    const lineMatch = errorMessage.match(/at line (\d+)/i) || errorMessage.match(/line (\d+)/i);
    if (lineMatch && lineMatch[1]) {
      const lineNumber = parseInt(lineMatch[1]);
      return lineNumber;
    }
    
    // 위치 번호로부터 줄 번호 계산
    const posMatch = errorMessage.match(/position (\d+)/i);
    if (posMatch && posMatch[1]) {
      const position = parseInt(posMatch[1]);
      const jsonText = document.getElementById('json-editor').value;
      
      // 위치 번호로부터 줄 번호 계산
      let charCount = 0;
      const lines = jsonText.split('\n');
      for (let i = 0; i < lines.length; i++) {
        charCount += lines[i].length + 1; // +1은 줄바꿈 문자
        if (charCount >= position) {
          return i + 1;
        }
      }
    }
    
    return null;
  }

  // 사용자 정의 유효성 검사 오류에서 줄 번호 찾기
  findLineNumberForObject(jsonText, targetProperty, targetValue) {
    const lines = jsonText.split('\n');
    
    // 간단한 휴리스틱: ID나 특정 속성을 찾음
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // 특정 속성과 값 조합 찾기
      if (targetProperty && targetValue !== undefined) {
        let pattern;
        
        // 값이 문자열인 경우 - 따옴표로 둘러싸인 형태로 검색
        if (typeof targetValue === 'string') {
          pattern = new RegExp(`"${targetProperty}"\\s*:\\s*"${targetValue.replace(/"/g, '\\"')}"`);
          if (pattern.test(line)) {
            return i + 1;
          }
        }
        // 값이 문자열이 아닌 경우 (숫자, boolean 등)
        else {
          pattern = new RegExp(`"${targetProperty}"\\s*:\\s*${targetValue}`);
          if (pattern.test(line)) {
            return i + 1;
          }
          
          // 문자열화된 숫자 형태도 검색 (예: value: "20")
          if (typeof targetValue === 'number') {
            pattern = new RegExp(`"${targetProperty}"\\s*:\\s*"${targetValue}"`);
            if (pattern.test(line)) {
              return i + 1;
            }
          }
        }
      }
      
      // ID 찾기 (객체의 시작점 찾기)
      if (line.includes('"id":') && targetProperty === 'id') {
        const idMatch = line.match(/"id"\s*:\s*(\d+)/);
        if (idMatch && idMatch[1] === String(targetValue)) {
          return i + 1;
        }
      }
    }
    
    // 객체 단위로 찾기 - 미리 파싱된 데이터를 사용할 수 없는 경우
    if (targetProperty === 'value' && typeof targetValue === 'string') {
      // 값이 문자열인데 숫자처럼 보이는 경우 (예: "value": "20")
      // 숫자로 변환하여 동일한 값을 가진 객체를 찾아봄
      try {
        const numericValue = Number(targetValue);
        if (!isNaN(numericValue)) {
          const numericPattern = new RegExp(`"value"\\s*:\\s*${numericValue}(?!["\d])`);
          for (let i = 0; i < lines.length; i++) {
            if (numericPattern.test(lines[i])) {
              return i + 1;
            }
          }
        }
      } catch (e) {
      }
    }
    
    return null;
  }

  // 중복 ID 위치 찾기
  findDuplicateIdLine(jsonText, duplicateId) {
    const pattern = new RegExp(`"id"\\s*:\\s*${duplicateId}`, 'g');
    const matches = [...jsonText.matchAll(pattern)];
    
    if (matches.length >= 2) {
      // 두 번째 발생 위치 찾기 (첫 번째는 원본)
      const secondPos = matches[1].index;
      const textBeforePos = jsonText.substring(0, secondPos);
      return textBeforePos.split('\n').length;
    }
    
    return null;
  }

  // 줄 하이라이트 업데이트
  updateLineHighlight() {
    // 에러 메시지가 표시되어 있지 않을 때만 하이라이트 제거
    if (this.container.querySelector('#json-error').style.display === 'none') {
      // 에디터에서 에러 스타일 제거
      const textarea = document.getElementById('json-editor');
      textarea.classList.remove('error-line');
      
      // 타임아웃 취소
      if (this.errorLineTimeout) {
        clearTimeout(this.errorLineTimeout);
        this.errorLineTimeout = null;
      }
    }
  }

  applyJson() {
    const jsonInput = document.getElementById('json-editor').value;
    
    try {
      let parsedData;
      try {
        parsedData = JSON.parse(jsonInput);
      } catch (parseError) {
        // JSON 파싱 오류
        const lineNumber = this.extractLineNumber(parseError.message);
        let errorMsg = `JSON 구문 오류: ${parseError.message}`;
        
        if (lineNumber) {
          errorMsg += `\n문제 발생 위치: ${lineNumber - 2}번째 줄`;
          this.highlightLine(lineNumber - 2);
        }
        
        throw new Error(errorMsg);
      }
      
      // 데이터 유효성 검사
      if (!Array.isArray(parsedData)) {
        // 배열이 아니면 첫 번째 줄을 하이라이트
        const firstLine = 1;
        this.highlightLine(firstLine);
        throw new Error('JSON은 배열 형태여야 합니다.');
      }
      
      // 각 항목 검증
      parsedData.forEach((item, index) => {
        const itemLineNum = this.findLineNumberForObject(jsonInput, 'id', item.id);
        const itemPosition = index + 1;  // 1-based 인덱스
        
        if (typeof item !== 'object' || item === null) {
          const errorMsg = `항목 #${itemPosition}은 객체여야 합니다.${itemLineNum ? ' (약 ' + itemLineNum + '번째 줄)' : ''}`;
          if (itemLineNum) this.highlightLine(itemLineNum);
          throw new Error(errorMsg);
        }
        
        if (!('id' in item) || !('value' in item)) {
          const errorMsg = `항목 #${itemPosition}에 필수 속성(id, value)이 누락되었습니다.${itemLineNum ? ' (약 ' + itemLineNum + '번째 줄)' : ''}`;
          if (itemLineNum) this.highlightLine(itemLineNum);
          throw new Error(errorMsg);
        }
        
        if (typeof item.id !== 'number') {
          const lineNum = this.findLineNumberForObject(jsonInput, 'id', item.id);
          const errorMsg = `항목 #${itemPosition}의 id는 숫자여야 합니다.${lineNum ? ' (약 ' + lineNum + '번째 줄)' : ''}`;
          if (lineNum) this.highlightLine(lineNum);
          throw new Error(errorMsg);
        }

        // ID가 음수인지 검사
        if (item.id < 0) {
          const lineNum = this.findLineNumberForObject(jsonInput, 'id', item.id);
          const errorMsg = `항목 #${itemPosition}의 id는 음수가 될 수 없습니다.${lineNum ? ' (약 ' + lineNum + '번째 줄)' : ''}`;
          if (lineNum) this.highlightLine(lineNum);
          throw new Error(errorMsg);
        }
        
        // value가 숫자가 아닐 때
        if (typeof item.value !== 'number') {
          // 문자열로 된 숫자인 경우 강조하고, 아닌 경우 해당 객체의 라인을 찾아서 강조
          let lineNum;
          if (typeof item.value === 'string') {
            // 먼저 정확한 값 매칭 시도
            lineNum = this.findLineNumberForObject(jsonInput, 'value', item.value);
            
            if (!lineNum) {
              // ID로 객체 위치 찾기 시도
              lineNum = this.findLineNumberForObject(jsonInput, 'id', item.id);
            }
          } else {
            // 문자열이 아닌 경우 ID로 객체 위치 찾기
            lineNum = this.findLineNumberForObject(jsonInput, 'id', item.id);
          }
          
          const errorMsg = `항목 #${itemPosition}의 value는 숫자여야 합니다.${lineNum ? ' (약 ' + lineNum + '번째 줄)' : ''}`;
          if (lineNum) {
            this.highlightLine(lineNum);
          }
          throw new Error(errorMsg);
        }

        // value가 음수인지 검사
        if (item.value < 0) {
          const lineNum = this.findLineNumberForObject(jsonInput, 'value', item.value);
          const errorMsg = `항목 #${itemPosition}의 value는 음수가 될 수 없습니다.${lineNum ? ' (약 ' + lineNum + '번째 줄)' : ''}`;
          if (lineNum) this.highlightLine(lineNum);
          throw new Error(errorMsg);
        }
        
        // 추가 필드 검사
        const validKeys = ['id', 'value'];
        const extraKeys = Object.keys(item).filter(key => !validKeys.includes(key));
        if (extraKeys.length > 0) {
          const errorMsg = `항목 #${item.id || itemPosition}에 허용되지 않은 속성이 있습니다: ${extraKeys.join(', ')}${itemLineNum ? ' (약 ' + itemLineNum + '번째 줄)' : ''}`;
          if (itemLineNum) this.highlightLine(itemLineNum);
          throw new Error(errorMsg);
        }
      });
      
      // 중복 ID 검사
      const idSet = new Set();
      for (const item of parsedData) {
        if (idSet.has(item.id)) {
          const lineNum = this.findDuplicateIdLine(jsonInput, item.id);
          const errorMsg = `중복된 ID가 있습니다: ${item.id}${lineNum ? ' (약 ' + lineNum + '번째 줄)' : ''}`;
          if (lineNum) this.highlightLine(lineNum);
          throw new Error(errorMsg);
        }
        idSet.add(item.id);
      }
      
      // 데이터 업데이트
      this.dataManager.setData(parsedData);
      this.hideError();
      
    } catch (error) {
      this.showError(error.message);
    }
  }

  showError(message) {
    const errorElement = this.container.querySelector('#json-error');
    errorElement.textContent = message;
    errorElement.style.display = 'block';
  }

  hideError() {
    const errorElement = this.container.querySelector('#json-error');
    errorElement.textContent = '';
    errorElement.style.display = 'none';

    // 에러 메시지를 숨길 때 하이라이트도 제거
    const textarea = document.getElementById('json-editor');
    textarea.classList.remove('error-line');
    
    if (this.errorLineTimeout) {
      clearTimeout(this.errorLineTimeout);
      this.errorLineTimeout = null;
    }
  }
}

window.JsonEditor = JsonEditor;