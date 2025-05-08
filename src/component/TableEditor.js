class TableEditor {
	constructor(container, dataManager) {
		this.container = document.querySelector(container);
		this.dataManager = dataManager;
    this.sortField = 'id';
    this.sortOrder = 'asc';
		this.#init();
    this.dataManager.subscribe(this.#update.bind(this));
	}

	#init() {
		document.getElementById('table-apply-btn').addEventListener('click', this.#applyChanges.bind(this));
    this.#update(this.dataManager.getData());
    this.#bindSortEvents();
	}
  
  #bindSortEvents() {
    document.querySelectorAll('th.sortable').forEach(th => {
      th.addEventListener('click', () => {
        const field = th.dataset.sort;
        if (!field) return;
        this.#sortTable(field);
        
        // 정렬 아이콘 업데이트
        document.querySelectorAll('.sort-icon').forEach(icon => {
          icon.textContent = '';
        });
        const icon = th.querySelector('.sort-icon');
        icon.textContent = this.sortOrder === 'asc' ? '↓' :'↑' ;
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
    
    // 데이터 정렬해서 다시 그리기
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

    this.#update(sortedData);
  }

  #update(data) {
		const tbody = document.getElementById('table-body');
    tbody.innerHTML = ''; 

    const fragment = document.createDocumentFragment();
    
    data.forEach(item => {
      const tr = document.createElement('tr');
      tr.dataset.id = item.id;
      console.log("item", item.id, item.value)
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
		const updatedData = [];
    const rows = document.querySelectorAll('#table-body tr:not(.marked-for-deletion)');
    
    rows.forEach(row => {
      const id = parseInt(row.dataset.id);
      const value = parseInt(row.querySelector('.value-input').value);
      
      // 유효성 검사
      if (isNaN(value)) {
        this.#showError('값은 숫자여야 합니다.');
        return;
      }

      if (value < 0) {
        this.#showError('음수는 Value로 저장할 수 없습니다.');
        return;
      }
      
      updatedData.push({ id, value });
    });
    
    // 데이터 업데이트
    this.dataManager.setData(updatedData);
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