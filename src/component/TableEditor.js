class TableEditor {
	constructor(tableSelector, dataManager) {
		this.table = document.querySelector(tableSelector);
		this.container = this.table.closest('.edit-section');
		this.dataManager = dataManager;
    this.sortField = 'id';
    this.sortOrder = 'asc';
    this.initialItemsToShow = 10; // 처음에 표시할 항목 수
    this.batchSize = 10; // 한 번에 추가로 로드할 항목 수
    this.currentItemsShown = 0; // 현재 표시된 항목 수
    this.isLoading = false; // 데이터 로딩 중인지 여부
    this.scrollContainer = null; // 스크롤 컨테이너
    this.loadingIndicator = null; // 로딩 인디케이터
    this.headerTable = null; // 고정 헤더 테이블
    this.tableWrapper = null; // 테이블 래퍼
		this.#init();
    this.dataManager.subscribe(this.#update.bind(this));
	}

	#init() {
    // 테이블 구조 재구성 (고정 헤더 + 스크롤 바디)
    this.#setupFixedHeaderAndScrollBody();
    
    // 로딩 인디케이터 생성
    this.#createLoadingIndicator();
    
		document.getElementById('table-apply-btn').addEventListener('click', this.#applyChanges.bind(this));
    this.#loadInitialData();
    this.#bindSortEvents();
    
    // 스크롤 이벤트 연결
    this.scrollContainer.addEventListener('scroll', this.#handleScroll.bind(this));
	}
  
  #setupFixedHeaderAndScrollBody() {
    // 1. 원본 테이블 구조 추출
    const originalThead = this.table.querySelector('thead');
    const originalTheadHtml = originalThead.outerHTML;
    
    // 2. 테이블 컨테이너 및 래퍼 생성
    this.tableWrapper = document.createElement('div');
    this.tableWrapper.className = 'table-wrapper';
    this.tableWrapper.style.position = 'relative';
    
    // 3. 헤더 테이블 생성 (고정 위치)
    this.headerTable = document.createElement('table');
    this.headerTable.id = 'header-table';
    this.headerTable.className = this.table.className; // 원본 테이블의 클래스 복사
    this.headerTable.setAttribute('aria-hidden', 'true'); // 스크린 리더에서 중복 헤더 숨김
    this.headerTable.style.tableLayout = 'fixed';
    this.headerTable.style.width = '100%';
    this.headerTable.style.margin = '0';
    this.headerTable.style.borderCollapse = 'collapse';
    this.headerTable.innerHTML = originalTheadHtml;
    
    // 4. 헤더 컨테이너 생성
    const headerContainer = document.createElement('div');
    headerContainer.className = 'table-header-container';
    headerContainer.style.overflow = 'hidden';
    headerContainer.appendChild(this.headerTable);
    
    // 5. 바디 테이블 설정
    originalThead.remove(); // 원본 테이블에서 헤더 제거
    this.table.style.tableLayout = 'fixed';
    this.table.style.width = '100%';
    this.table.style.margin = '0';
    this.table.style.borderCollapse = 'collapse';
    
    // 6. 스크롤 컨테이너 생성
    this.scrollContainer = document.createElement('div');
    this.scrollContainer.className = 'table-scroll-container';
    this.scrollContainer.style.height = '300px';
    this.scrollContainer.style.overflowY = 'auto';
    this.scrollContainer.style.overflowX = 'hidden'; // 가로 스크롤 방지
    this.scrollContainer.style.position = 'relative';
    this.scrollContainer.style.borderTop = 'none';
    
    // 7. 기존 테이블 위치에 래퍼 삽입
    this.table.parentNode.insertBefore(this.tableWrapper, this.table);
    
    // 8. 모든 요소 조립
    this.tableWrapper.appendChild(headerContainer);
    this.tableWrapper.appendChild(this.scrollContainer);
    this.scrollContainer.appendChild(this.table);
    
    // 9. 헤더와 바디 열 너비 동기화
    this.#synchronizeColumnWidths();
    
    // 10. 스타일 추가
    this.#addCustomStyles();
  }
  
  #synchronizeColumnWidths() {
    // 헤더의 각 셀 너비를 계산하고 바디의 셀에 적용
    const headerCells = this.headerTable.querySelectorAll('th');
    
    // 각 열의 특성에 맞게 너비 설정
    const widths = ['15%', '70%', '15%']; // 실제 컬럼 구성에 맞게 설정
    
    headerCells.forEach((cell, index) => {
      cell.style.width = widths[index];
      
      // 바디 테이블의 첫 번째 행 셀에도 같은 너비 적용 (행이 있을 경우)
      const bodyCells = this.table.querySelectorAll('tbody tr:first-child td');
      if (bodyCells && bodyCells[index]) {
        bodyCells[index].style.width = widths[index];
      }
    });
    
    // 스크롤바 너비를 고려하여 헤더 테이블 너비 조정
    setTimeout(() => {
      const scrollbarWidth = this.scrollContainer.offsetWidth - this.table.offsetWidth;
      if (scrollbarWidth > 0) {
        this.headerTable.style.width = `calc(100% - ${scrollbarWidth}px)`;
      }
    }, 0);
  }
  
  #createLoadingIndicator() {
    // 로딩 인디케이터 생성
    this.loadingIndicator = document.createElement('div');
    this.loadingIndicator.className = 'loading-indicator';
    this.loadingIndicator.style.display = 'none';
    this.loadingIndicator.style.textAlign = 'center';
    this.loadingIndicator.style.padding = '10px';
    this.loadingIndicator.style.borderTop = '1px solid #eee';
    this.loadingIndicator.textContent = '로딩 중...';
    this.loadingIndicator.setAttribute('aria-live', 'polite'); // 스크린 리더 지원
    
    // 스크롤 컨테이너 끝에 추가
    this.scrollContainer.appendChild(this.loadingIndicator);
  }
  
  #addCustomStyles() {
    // 추가 스타일을 동적으로 적용
    const style = document.createElement('style');
    style.textContent = `
      .table-wrapper {
        border: 1px solid #ddd;
        margin-bottom: 10px;
      }
      
      .table-header-container {
        background-color: #f8f8f8;
        border-bottom: 2px solid #ddd;
      }
      
      .table-header-container th {
        position: sticky;
        top: 0;
        background-color: #f8f8f8;
        z-index: 10;
      }
      
      .table-scroll-container table {
        border-top: none;
      }
      
      tr.marked-for-deletion {
        background-color: #ffeeee;
      }
      
      button.marked {
        background-color: #d9534f;
        color: white;
      }
    `;
    document.head.appendChild(style);
  }
  
  #handleScroll() {
    // 이미 로딩 중이면 다시 요청하지 않음
    if (this.isLoading) return;
    
    const { scrollTop, scrollHeight, clientHeight } = this.scrollContainer;
    
    // 스크롤이 하단에서 50px 이내에 도달했을 때 추가 데이터 로드
    if (scrollHeight - scrollTop - clientHeight < 50) {
      this.#loadMoreData();
    }
  }
  
  #loadInitialData() {
    // 처음 데이터 로드 (초기 개수만큼)
    const data = this.dataManager.getData();
    this.currentItemsShown = Math.min(this.initialItemsToShow, data.length);
    const initialData = data.slice(0, this.currentItemsShown);
    this.#renderTable(initialData);
  }
  
  #loadMoreData() {
    this.isLoading = true;
    this.loadingIndicator.style.display = 'block';
    
    // 비동기 처리를 시뮬레이션하기 위해 setTimeout 사용
    setTimeout(() => {
      const data = this.dataManager.getData();
      const dataToShow = data.slice(0, this.currentItemsShown + this.batchSize);
      
      // 새로운 데이터가 있는 경우에만 추가
      if (dataToShow.length > this.currentItemsShown) {
        this.currentItemsShown = dataToShow.length;
        this.#renderTable(dataToShow);
      }
      
      // 모든 데이터를 다 보여준 경우 로딩 인디케이터 숨김
      if (this.currentItemsShown >= data.length) {
        this.loadingIndicator.style.display = 'none';
      }
      
      this.isLoading = false;
    }, 300); // 로딩 시뮬레이션 (300ms)
  }
  
  #bindSortEvents() {
    // 헤더 테이블의 정렬 가능한 헤더에 이벤트 연결
    this.headerTable.querySelectorAll('th.sortable').forEach(th => {
      // 커서 포인터 추가
      th.style.cursor = 'pointer';
      
      th.addEventListener('click', () => {
        const field = th.dataset.sort;
        if (!field) return;
        this.#sortTable(field);
        
        // 정렬 아이콘 업데이트
        this.headerTable.querySelectorAll('.sort-icon').forEach(icon => {
          icon.textContent = '';
        });
        const icon = th.querySelector('.sort-icon');
        icon.textContent = this.sortOrder === 'asc' ? '↓' :'↑';
      });
    });
  }

  #sortTable(field) {
    if (this.sortField === field) {
      this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortOrder = 'asc';
    }
    
    // 데이터 정렬
    const data = this.dataManager.getData();
    const sortedData = [...data].sort((a, b) => {
      const fieldA = field === 'id' ? a.id : a.value;
      const fieldB = field === 'id' ? b.id : b.value;
      
      // 숫자 비교를 위해 변환
      const valueA = isNaN(Number(fieldA)) ? fieldA : Number(fieldA);
      const valueB = isNaN(Number(fieldB)) ? fieldB : Number(fieldB);

      if (this.sortOrder === 'asc') return valueA < valueB ? -1 : valueA > valueB ? 1 : 0;
      else return valueA < valueB ? 1 : valueA > valueB ? -1 : 0;
    });

    // 정렬 후 처음부터 다시 표시
    this.currentItemsShown = Math.min(this.initialItemsToShow, sortedData.length);
    const dataToShow = sortedData.slice(0, this.currentItemsShown);
    this.#renderTable(dataToShow);
    
    // 스크롤 상단으로 이동
    this.scrollContainer.scrollTop = 0;
  }

  #update(data) {
    // 데이터 변경 시 처음부터 다시 표시
    this.currentItemsShown = Math.min(this.initialItemsToShow, data.length);
    const dataToShow = data.slice(0, this.currentItemsShown);
    this.#renderTable(dataToShow);
    
    // 스크롤 상단으로 이동
    this.scrollContainer.scrollTop = 0;
  }

  #renderTable(data) {
    const tbody = document.getElementById('table-body');
    tbody.innerHTML = ''; 

    const fragment = document.createDocumentFragment();
    
    data.forEach(item => {
      const tr = document.createElement('tr');
      tr.dataset.id = item.id;
      tr.innerHTML = `
        <td>${item.id}</td>
        <td><input type="number" value="${item.value}" class="value-input" tabindex="0"
        aria-label="ID ${item.id}의 값"
        ></td>
        <td><button class="delete-btn">삭제</button></td>
      `;
      
      fragment.appendChild(tr);
    });

    tbody.appendChild(fragment);
    // 삭제 버튼 이벤트 바인딩
    document.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', this.#markForDeletion.bind(this));
    });
    
    // 열 너비 동기화
    this.#synchronizeColumnWidths();
  }

  #markForDeletion(e) {
    const button = e.target;
    const row = button.closest('tr');
    const input = row.querySelector('td:nth-child(2) input'); // 두 번째 셀의 입력 필드
    const isMarked = row.classList.contains('marked-for-deletion');
  
    // 토글 상태 설정
    row.classList.toggle('marked-for-deletion');
    button.textContent = isMarked ? '삭제' : '삭제 취소';
    button.classList.toggle('marked'); // CSS로 색상 관리
    input.tabIndex = isMarked ? 0 : -1;
    input.disabled = !isMarked;
  }

  #applyChanges() {
    const allData = this.dataManager.getData();
    const updatedData = [...allData]; // 모든 데이터의 복사본 생성
    const deletedIds = new Set();
    let hasError = false;
    
    // 현재 테이블에서 변경된 항목들 처리
    const rows = document.querySelectorAll('#table-body tr');
    
    rows.forEach(row => {
      const id = parseInt(row.dataset.id);
      const isMarkedForDeletion = row.classList.contains('marked-for-deletion');
      
      if (isMarkedForDeletion) {
        deletedIds.add(id);
      } else {
        const valueInput = row.querySelector('.value-input');
        const value = parseInt(valueInput.value);
        
        // 유효성 검사
        if (isNaN(value)) {
          this.#showError('값은 숫자여야 합니다.');
          hasError = true;
          return;
        }

        if (value < 0) {
          this.#showError('음수는 Value로 저장할 수 없습니다.');
          hasError = true;
          return;
        }
        
        // 기존 데이터에서 해당 id의 아이템 찾아서 값 업데이트
        const itemIndex = updatedData.findIndex(item => item.id === id);
        if (itemIndex !== -1) {
          updatedData[itemIndex].value = value;
        }
      }
    });
    
    // 에러가 있으면 처리 중단
    if (hasError) {
      return;
    }
    
    // 삭제 표시된 항목 제거
    const filteredData = updatedData.filter(item => !deletedIds.has(item.id));
    
    // 데이터 업데이트
    this.dataManager.setData(filteredData);
    this.#hideError();
  }

  #showError(message) {
    const errorElement = document.querySelector('#table-error');
    errorElement.textContent = message;
    errorElement.style.display = 'block';
  }
  
  #hideError() {
    const errorElement = document.querySelector('#table-error');
    errorElement.textContent = '';
    errorElement.style.display = 'none';
  }
}

window.TableEditor = TableEditor;