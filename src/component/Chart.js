class Chart {
  constructor(containerSelector, dataManager) {
    this.container = document.querySelector(containerSelector);
    this.svg = null;
    this.dataManager = dataManager;
    this.margin = { top: 20, right: 30, bottom: 40, left: 60 };
    this.width = 1200;
    this.height = 400;
    this.innerWidth = this.width - this.margin.left - this.margin.right;
    this.innerHeight = this.height - this.margin.top - this.margin.bottom;
    this.barPadding = 0.2; // 막대 사이 간격 비율
    this.animationDuration = 500; // 애니메이션 시간 (밀리초)
    this.visibleBars = 5; // 한 번에 보여줄 데이터 수
    this.currentStartIndex = 0; // 현재 시작 인덱스
    this.isLoading = false; // 데이터 로딩 상태
    this.isDataUpdated = false; // 데이터 업데이트 여부
    
    this.init();
    this.dataManager.subscribe(this.update.bind(this));
  }
  
  init() {
    // 컨테이너 스타일 설정
    this.container.style.position = 'relative';
    
    // SVG 요소 생성
    this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    this.svg.setAttribute('width', this.width);
    this.svg.setAttribute('height', this.height);
    this.svg.setAttribute('viewBox', `0 0 ${this.width} ${this.height}`);
    this.svg.setAttribute('aria-label', 'ID별 값을 보여주는 세로 막대 그래프');
    this.svg.setAttribute('role', 'img');
    
    this.container.appendChild(this.svg);
    
    // 축과 그래프를 그릴 그룹 요소 생성
    this.chartGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    this.chartGroup.setAttribute('transform', `translate(${this.margin.left}, ${this.margin.top})`);
    this.svg.appendChild(this.chartGroup);
    
    // x축 그룹
    this.xAxisGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    this.xAxisGroup.setAttribute('class', 'x-axis');
    this.xAxisGroup.setAttribute('transform', `translate(0, ${this.innerHeight})`);
    this.chartGroup.appendChild(this.xAxisGroup);
    
    // y축 그룹
    this.yAxisGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    this.yAxisGroup.setAttribute('class', 'y-axis');
    this.chartGroup.appendChild(this.yAxisGroup);
    
    // 막대 그룹
    this.barsGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    this.barsGroup.setAttribute('class', 'bars');
    this.chartGroup.appendChild(this.barsGroup);
    
    // 값 레이블 그룹
    this.labelsGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    this.labelsGroup.setAttribute('class', 'value-labels');
    this.chartGroup.appendChild(this.labelsGroup);
    
    // 네비게이션 버튼 생성
    this.createNavigationButtons();
    
    // 첫 데이터 로드
    this.loadData();
  }
  
  createNavigationButtons() {
    // 네비게이션 컨테이너 생성
    const navContainer = document.createElement('div');
    navContainer.className = 'chart-navigation';
    navContainer.style.textAlign = 'center';
    navContainer.style.marginTop = '10px';
    
    // 이전 버튼
    this.prevButton = document.createElement('button');
    this.prevButton.textContent = '이전';
    this.prevButton.className = 'chart-nav-btn prev-btn';
    this.prevButton.style.padding = '5px 15px';
    this.prevButton.style.marginRight = '10px';
    this.prevButton.disabled = true; // 처음에는 비활성화
    
    // 다음 버튼
    this.nextButton = document.createElement('button');
    this.nextButton.textContent = '다음';
    this.nextButton.className = 'chart-nav-btn next-btn';
    this.nextButton.style.padding = '5px 15px';
    
    // 페이지 정보 표시 요소
    this.pageInfo = document.createElement('span');
    this.pageInfo.className = 'chart-page-info';
    this.pageInfo.style.margin = '0 15px';
    
    // 이벤트 리스너 추가
    this.prevButton.addEventListener('click', () => this.navigatePrev());
    this.nextButton.addEventListener('click', () => this.navigateNext());
    
    // 요소 추가
    navContainer.appendChild(this.prevButton);
    navContainer.appendChild(this.pageInfo);
    navContainer.appendChild(this.nextButton);
    
    // 컨테이너에 네비게이션 추가
    this.container.appendChild(navContainer);
  }
  
  loadData() {
    if (this.isLoading) return;
    this.isLoading = true;
    
    // 현재 표시할 데이터 요청
    const currentData = this.dataManager.getData();
    this.render(currentData);
    this.isLoading = false;
  }
  
  navigatePrev() {
    if (this.currentStartIndex > 0) {
      this.currentStartIndex = Math.max(0, this.currentStartIndex - this.visibleBars);
      this.loadData();
    }
  }
  
  navigateNext() {
    const data = this.dataManager.getData();
    const maxStartIndex = Math.max(0, data.length - this.visibleBars);
    
    if (this.currentStartIndex < maxStartIndex) {
      this.currentStartIndex = Math.min(maxStartIndex, this.currentStartIndex + this.visibleBars);
      this.loadData();
    }
  }
  
  render(data) {
    // SVG 요소 초기화
    this.barsGroup.innerHTML = '';
    this.labelsGroup.innerHTML = '';
    this.xAxisGroup.innerHTML = '';
    this.yAxisGroup.innerHTML = '';
    
    if (!data || data.length === 0) return;
    
    // 현재 인덱스부터 visibleBars 수만큼 데이터 추출
    const visibleData = data.slice(this.currentStartIndex, this.currentStartIndex + this.visibleBars);
    
    if (visibleData.length === 0) {
      this.currentStartIndex = Math.max(0, data.length - this.visibleBars);
      this.render(data);
      return;
    }
    
    // 바 너비 계산
    const barAreaWidth = this.innerWidth;
    const barWidth = (barAreaWidth / this.visibleBars) * (1 - this.barPadding);
    const xScale = barAreaWidth / this.visibleBars;
    
    // Y축 스케일 계산 (최댓값 기준)
    const maxValue = Math.max(...data.map(d => d.value)); // 전체 데이터 중 최댓값 사용
    const yScale = this.innerHeight / maxValue;
    
    // Y축 그리기
    const yAxis = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    yAxis.setAttribute('d', `M 0,0 L 0,${this.innerHeight}`);
    yAxis.setAttribute('stroke', 'black');
    yAxis.setAttribute('stroke-width', '1');
    this.yAxisGroup.appendChild(yAxis);
    
    // Y축 최댓값 레이블
    const maxLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    maxLabel.setAttribute('x', -5);
    maxLabel.setAttribute('y', 0);
    maxLabel.setAttribute('text-anchor', 'end');
    maxLabel.setAttribute('dominant-baseline', 'middle');
    maxLabel.setAttribute('fill', 'var(--color-axis-text)');
    maxLabel.textContent = maxValue;
    this.yAxisGroup.appendChild(maxLabel);
    
    // X축 그리기
    const xAxis = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    xAxis.setAttribute('d', `M 0,0 L ${barAreaWidth},0`);
    xAxis.setAttribute('stroke', 'black');
    xAxis.setAttribute('stroke-width', '1');
    this.xAxisGroup.appendChild(xAxis);
    
    // 막대 그리기
    visibleData.forEach((d, i) => {
      // 막대 위치와 크기 계산
      const x = i * xScale + (xScale - barWidth) / 2;
      const barHeight = d.value * yScale;
      const y = this.innerHeight - barHeight;
      
      // 막대 생성
      const bar = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      bar.setAttribute('x', x);
      bar.setAttribute('y', y);
      bar.setAttribute('width', barWidth);
      bar.setAttribute('height', barHeight);
      bar.setAttribute('class', 'bar');
      bar.setAttribute('data-id', d.id);
      bar.setAttribute('data-value', d.value);
      
      // 막대에 호버 시 값 표시
      bar.addEventListener('mouseover', () => {
        this.showTooltip(d.id, d.value, x, y);
      });
      
      bar.addEventListener('mouseout', () => {
        this.hideTooltip();
      });
      
      this.barsGroup.appendChild(bar);
      
      // 값 레이블 생성
      const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      label.setAttribute('x', x + barWidth / 2);
      label.setAttribute('y', y - 5);
      label.setAttribute('text-anchor', 'middle');
      label.setAttribute('fill', 'var(--color-semi-gray)');
      label.setAttribute('font-size', '10px');
      label.textContent = d.value;
      this.labelsGroup.appendChild(label);
      
      // X축 레이블 (ID)
      const idLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      idLabel.setAttribute('x', x + barWidth / 2);
      idLabel.setAttribute('y', 20);
      idLabel.setAttribute('text-anchor', 'middle');
      idLabel.setAttribute('fill', 'var(--color-axis-text)');
      idLabel.setAttribute('font-size', '10px');
      idLabel.textContent = d.id;
      this.xAxisGroup.appendChild(idLabel);
    });
    
    // 버튼 상태 업데이트
    this.updateButtonStates(data);
    
    // 페이지 정보 업데이트
    this.updatePageInfo(this.currentStartIndex, this.currentStartIndex + visibleData.length, data.length);
  }
  
  update(data) {
    // 첫 로드가 아니면서 데이터가 변경된 경우
    if (this.isDataUpdated) {
      // 현재 인덱스 유지하면서 데이터 업데이트
      this.render(data);
    } else {
      // 첫 로드이거나 데이터가 완전히 새로운 경우
      this.currentStartIndex = 0; // 처음 인덱스로 리셋
      this.isDataUpdated = true;
      this.render(data);
    }
  }
  
  updateButtonStates(data) {
    // 이전 버튼 상태 업데이트
    this.prevButton.disabled = this.currentStartIndex <= 0;
    
    // 다음 버튼 상태 업데이트
    const maxStartIndex = Math.max(0, data.length - this.visibleBars);
    this.nextButton.disabled = this.currentStartIndex >= maxStartIndex;
  }
  
  updatePageInfo(start, end, total) {
    // 페이지 정보 업데이트
    this.pageInfo.textContent = `${start + 1}-${end} / ${total}`;
  }
  
  showTooltip(id, value, x, y) {
    // 이미 툴팁이 있으면 제거
    this.hideTooltip();
    
    const tooltip = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    tooltip.setAttribute('class', 'tooltip');
    
    const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    bg.setAttribute('x', x - 20);
    bg.setAttribute('y', y - 35);
    bg.setAttribute('width', 80);
    bg.setAttribute('height', 25);
    bg.setAttribute('fill', 'rgba(0,0,0,0.7)');
    bg.setAttribute('rx', 5);
    
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', x + 20);
    text.setAttribute('y', y - 20);
    text.setAttribute('fill', 'white');
    text.setAttribute('text-anchor', 'middle');
    text.textContent = `ID: ${id}, 값: ${value}`;
    
    tooltip.appendChild(bg);
    tooltip.appendChild(text);
    this.chartGroup.appendChild(tooltip);
  }
  
  hideTooltip() {
    const tooltip = this.chartGroup.querySelector('.tooltip');
    if (tooltip) {
      tooltip.remove();
    }
  }
}

window.Chart = Chart;