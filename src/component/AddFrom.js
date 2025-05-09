class AddForm {
  constructor(containerSelector, dataManager) {
    this.container = document.querySelector(containerSelector);
    this.dataManager = dataManager;
    this.#init();
  }
  
  #init() {
    document.getElementById('add-btn').addEventListener('click', this.#addItem.bind(this));
		document.getElementById('id-input').value = this.dataManager.getData().at(-1).id + 1;
    console.log("addForm init")
  }
  
  #addItem() {
    const idInput = document.getElementById('id-input');
    const valueInput = document.getElementById('value-input');
    
    const id = parseInt(idInput.value);
    const value = parseInt(valueInput.value);
    
    // 유효성 검사
    if (isNaN(id) || isNaN(value)) {
      this.#showError('ID와 Value는 모두 숫자여야 합니다.');
      return;
    }
    
    // ID 중복 검사
    const existingData = this.dataManager.getData();
    if (existingData.some(item => item.id === id)) {
      this.#showError('이미 존재하는 ID입니다.');
      return;
    }

		// 음수 값 방지
    if (value < 0 || id < 0) {
			this.#showError('음수는 ID와 Value로 저장할 수 없습니다.');
      return;
		}

    // 데이터 추가
    this.dataManager.addItem({ id, value });
    
    // 입력 필드 초기화
    idInput.value = this.dataManager.getData().at(-1).id + 1;
    valueInput.value = 0;
    this.#hideError();
  }
  
  #showError(message) {
    const errorElement = this.container.querySelector('.error-message');
    errorElement.textContent = message;
    errorElement.style.display = 'block';
  }
  
  #hideError() {
    const errorElement = this.container.querySelector('.error-message');
    errorElement.textContent = '';
    errorElement.style.display = 'none';
  }
}

window.AddForm = AddForm;