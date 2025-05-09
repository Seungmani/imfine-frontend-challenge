# 아이엠파인 SD팀 프론트엔드 사전 과제

## 📋 프로젝트 개요

이 프로젝트는 순수 JavaScript, HTML, CSS를 사용하여 데이터 시각화 및 관리 기능을 구현한 웹 애플리케이션입니다. 
사용자는 데이터를 추가, 편집, 삭제할 수 있으며, 그래프를 통해 시각적으로 확인할 수 있습니다.

## 🚀 주요 기능

1.**그래프 시각화**
   - ID별 값을 표시하는 세로 막대 그래프
   - 데이터 변경 적용 시 업데이트

2.**데이터 테이블 편집**
   - 표 형식으로 데이터 표시
   - 값 편집 및 행 삭제 기능
   - Apply 버튼을 통한 변경사항 적용

3.**데이터 추가**
   - ID와 Value 입력으로 새 데이터 추가
   - Add 버튼을 통한 변경사항 적용

4.**JSON 형식 고급 편집**
   - 전체 데이터를 JSON 형식으로 직접 편집
	 - Apply 버튼을 통한 변경사항 적용

## 🛠️ 기술 스택

- HTML5
- CSS3
- Vanilla JavaScript (ES6+)

## 📁 폴더 구조
``` text
project/
├── src/
│   ├── components/    # UI 컴포넌트
│   │   ├── README.md  # 컴포넌트 문서
│   │   ├── Chart.js   # 그래프 컴포넌트
│   │   ├── TableEditor.js  # 테이블 에디터 컴포넌트
│   │   ├── AddForm.js      # 데이터 추가 폼 컴포넌트
│   │   └── JsonEditor.js   # JSON 에디터 컴포넌트
│   ├── store/         # 데이터 저장소
│   │   ├── README.md  # 데이터 문서
│   │   └── DataManager.js  # 데이터 관리 클래스
│   ├── utils/         # 유틸리티 함수
│   │   ├── README.md  # 유틸리티 문서
│   │   └── ex.js      # 공통 함수 
│   └── main.js        # 메인 진입점
├── index.html         # HTML 엔트리 포인트
├── index.css          # 스타일시트
└── README.md          # 프로젝트 전체 문서
```

## 🔍 주요 설계 결정

### 1. 아키텍처

- **Flux 패턴 적용**: 중앙 집중식 데이터 관리와 단방향 데이터 흐름 구현
- **컴포넌트 기반 설계**: UI를 독립적인 컴포넌트로 분리하여 모듈화 및 재사용성 향상
- **발행-구독(Pub-Sub) 패턴**: 데이터 변경 시 모든 컴포넌트가 자동으로 업데이트되도록 구현
- **클래스 기반 컴포넌트**: 각 UI 요소를 클래스로 캡슐화하여 상태와 동작을 통합 관리

### 2. UX 개선 사항

- **실시간 유효성 검사**: 사용자 입력을 즉시 검증하고 피드백 제공
- **에러 메시지 시각화**: 명확한 에러 메시지와 시각적 피드백으로 사용자 경험 향상
- **반응형 디자인**: 다양한 디바이스에서 최적의 사용자 경험 제공
- **애니메이션 효과**: 부드러운 전환과 피드백을 위한 애니메이션 적용
- **접근성 고려**: 키보드 탐색 지원 및 ARIA 속성 적용

### 3. 코드 품질 관리

- **모듈화**: 관심사 분리 원칙에 따라 코드 구성
- **일관된 코딩 스타일**: ESLint 규칙을 준수한 일관된 코드 작성
- **명확한 주석**: 코드의 의도와 복잡한 로직에 대한 설명 추가
- **이벤트 위임**: 성능 최적화를 위한 이벤트 위임 패턴 적용
- **방어적 프로그래밍**: 예외 상황을 고려한 견고한 코드 작성

## 💻 실행 방법

1. 저장소 클론
```bash
   git clone https://github.com/Seungmani/imfine-frontend-task.git
   cd imfine-frontend-task
```
2. 웹 브라우저에서 열기
- Chrome 브라우저에서 `index.html` 파일을 직접 열거나
- VS Code의 Live Server 익스텐션 등을 활용하여 로컬 서버에서 실행


## 🧪 테스트 방법

- 기능 테스트
데이터 추가: 새로운 ID와 값을 입력한 후 Add 버튼 클릭
데이터 편집: 테이블에서 값 변경 후 Apply 버튼 클릭
데이터 삭제: 삭제할 행의 삭제 버튼 클릭 후 Apply 버튼 클릭
JSON 편집: JSON 편집기에서 데이터 구조 변경 후 Apply 버튼 클릭

## 후기
