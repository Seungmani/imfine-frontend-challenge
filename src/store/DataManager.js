class DataManager {
  constructor() {
    this.data = [];
    this.listeners = [];
  }

  // 데이터 조회
  getData() {
    return [...this.data]; // 데이터 복사본 반환
  }

  // 데이터 설정 (전체 교체)
  setData(newData) {
    this.data = newData;
    this.notifyListeners();
  }

  // 아이템 추가
  addItem(item) {
    this.data.push(item);
    this.notifyListeners();
  }

  // 아이템 업데이트
  updateItem(id, newValue) {
    const index = this.data.findIndex(item => item.id === id);
    if (index !== -1) {
      this.data[index].Value = newValue;
      this.notifyListeners();
    }
  }

  // 아이템 삭제
  deleteItem(id) {
    this.data = this.data.filter(item => item.id !== id);
    this.notifyListeners();
  }

  // 리스너 등록 (각 컴포넌트들이 등록)
  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  // 데이터 변경 알림
  notifyListeners() {
		console.log("변경", this.data)
    this.listeners.forEach(listener => listener(this.data));
  }
}

// 싱글톤 인스턴스 생성 및 내보내기
const dataManager = new DataManager();
export default dataManager;