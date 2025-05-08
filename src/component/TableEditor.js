class TableEditor {
	constructor(container, dataManager) {
		this.container = document.querySelector(container);
		this.dataManager = dataManager;
		this.#init();
    this.dataManager.subscribe(this.update.bind(this));
	}

	#init() {
		document.getElementById('table-apply-btn').addEventListener('click', this.applyChanges.bind(this));
    this.update(this.dataManager.getData());
	}

  update(data) {
		const tableBody = document.getElementById('table-body');
    const fragment = document.createDocumentFragment();
    tableBody.innerHTML = '';
    
    data.forEach(item => {
      const row = document.createElement('tr');
      row.dataset.id = item.id;
      
      row.innerHTML = `
        <td>${item.id}</td>
        <td><input type="number" value="${item.value}" class="value-input" tabindex="0"
				aria-label="ID ${item.id}의 값"
				></td>
        <td><button class="delete-btn">삭제</button></td>
      `;
      
      fragment.appendChild(row);
    });

		tableBody.appendChild(fragment);
		// 삭제 버튼 이벤트 바인딩
		document.querySelectorAll('.delete-btn').forEach(btn => {
			btn.addEventListener('click', this.markForDeletion.bind(this));
		});
	}

  markForDeletion(e) {
    const row = e.target.closest('tr');
    row.classList.toggle('marked-for-deletion');
  }

	applyChanges() {
		const updatedData = [];
    const rows = document.querySelectorAll('#table-body tr:not(.marked-for-deletion)');
    
    rows.forEach(row => {
      const id = parseInt(row.dataset.id);
      const value = parseInt(row.querySelector('.value-input').value);
      
      // 유효성 검사
      if (isNaN(value)) {
        this.showError('값은 숫자여야 합니다.');
        return;
      }
      
      updatedData.push({ id, value });
    });
    
    // 데이터 업데이트
    this.dataManager.setData(updatedData);
    this.hideError();
	}

	showError(message) {
    const errorElement = document.querySelector('#table-error');
    errorElement.textContent = message;
    errorElement.style.display = 'block';
  }
  
  hideError() {
    const errorElement = document.querySelector('#table-error');
    errorElement.textContent = '';
    errorElement.style.display = 'none';
  }
}

window.TableEditor = TableEditor;