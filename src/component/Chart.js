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
    this.barPadding = 0.2;
    this.animationDuration = 500;
    this.visibleBars = 5;
    this.currentStartIndex = 0;
    this.isLoading = false;
    this.isDataUpdated = false;
    
    this.init();
    this.dataManager.subscribe(this.update.bind(this));
  }
  
  init() {
    this.container.style.position = 'relative';
    
    this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    this.svg.setAttribute('width', this.width);
    this.svg.setAttribute('height', this.height);
    this.svg.setAttribute('viewBox', `0 0 ${this.width} ${this.height}`);
    this.svg.setAttribute('aria-label', 'ID별 값을 보여주는 세로 막대 그래프');
    this.svg.setAttribute('role', 'img');
    
    this.container.appendChild(this.svg);
    
    this.chartGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    this.chartGroup.setAttribute('transform', `translate(${this.margin.left}, ${this.margin.top})`);
    this.svg.appendChild(this.chartGroup);
    
    this.xAxisGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    this.xAxisGroup.setAttribute('class', 'x-axis');
    this.xAxisGroup.setAttribute('transform', `translate(0, ${this.innerHeight})`);
    this.chartGroup.appendChild(this.xAxisGroup);
    
    this.yAxisGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    this.yAxisGroup.setAttribute('class', 'y-axis');
    this.chartGroup.appendChild(this.yAxisGroup);
    
    this.barsGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    this.barsGroup.setAttribute('class', 'bars');
    this.chartGroup.appendChild(this.barsGroup);
    
    this.labelsGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    this.labelsGroup.setAttribute('class', 'value-labels');
    this.chartGroup.appendChild(this.labelsGroup);
    
    this.createNavigationButtons();
    
    this.loadData();
  }
  
  createNavigationButtons() {
    const navContainer = document.createElement('div');
    navContainer.className = 'chart-navigation';
    navContainer.style.textAlign = 'center';
    navContainer.style.marginTop = '10px';
    
    this.prevButton = document.createElement('button');
    this.prevButton.textContent = '이전';
    this.prevButton.className = 'chart-nav-btn prev-btn';
    this.prevButton.style.padding = '5px 15px';
    this.prevButton.style.marginRight = '10px';
    this.prevButton.disabled = true;
    
    this.nextButton = document.createElement('button');
    this.nextButton.textContent = '다음';
    this.nextButton.className = 'chart-nav-btn next-btn';
    this.nextButton.style.padding = '5px 15px';
    
    this.pageInfo = document.createElement('span');
    this.pageInfo.className = 'chart-page-info';
    this.pageInfo.style.margin = '0 15px';
    
    this.prevButton.addEventListener('click', () => this.navigatePrev());
    this.nextButton.addEventListener('click', () => this.navigateNext());
    
    navContainer.appendChild(this.prevButton);
    navContainer.appendChild(this.pageInfo);
    navContainer.appendChild(this.nextButton);
    
    this.container.appendChild(navContainer);
  }
  
  loadData() {
    if (this.isLoading) return;
    this.isLoading = true;
    
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
    this.barsGroup.innerHTML = '';
    this.labelsGroup.innerHTML = '';
    this.xAxisGroup.innerHTML = '';
    this.yAxisGroup.innerHTML = '';
    
    if (!data || data.length === 0) return;
    
    const visibleData = data.slice(this.currentStartIndex, this.currentStartIndex + this.visibleBars);
    
    if (visibleData.length === 0) {
      this.currentStartIndex = Math.max(0, data.length - this.visibleBars);
      this.render(data);
      return;
    }
    
    const barAreaWidth = this.innerWidth;
    const barWidth = (barAreaWidth / this.visibleBars) * (1 - this.barPadding);
    const xScale = barAreaWidth / this.visibleBars;
    
    const maxValue = Math.max(...data.map(d => d.value));
    const yScale = this.innerHeight / maxValue;
    
    const yAxis = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    yAxis.setAttribute('d', `M 0,0 L 0,${this.innerHeight}`);
    yAxis.setAttribute('stroke', 'black');
    yAxis.setAttribute('stroke-width', '1');
    this.yAxisGroup.appendChild(yAxis);
    
    const maxLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    maxLabel.setAttribute('x', -5);
    maxLabel.setAttribute('y', 0);
    maxLabel.setAttribute('text-anchor', 'end');
    maxLabel.setAttribute('dominant-baseline', 'middle');
    maxLabel.setAttribute('fill', 'var(--color-axis-text)');
    maxLabel.setAttribute('font-size', '14px'); // 10px → 14px
    maxLabel.textContent = maxValue;
    this.yAxisGroup.appendChild(maxLabel);
    
    const xAxis = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    xAxis.setAttribute('d', `M 0,0 L ${barAreaWidth},0`);
    xAxis.setAttribute('stroke', 'black');
    xAxis.setAttribute('stroke-width', '1');
    this.xAxisGroup.appendChild(xAxis);
    
    visibleData.forEach((d, i) => {
      const x = i * xScale + (xScale - barWidth) / 2;
      const barHeight = d.value * yScale;
      const y = this.innerHeight - barHeight;
      
      const bar = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      bar.setAttribute('x', x);
      bar.setAttribute('y', y);
      bar.setAttribute('width', barWidth);
      bar.setAttribute('height', barHeight);
      bar.setAttribute('class', 'bar');
      bar.setAttribute('data-id', d.id);
      bar.setAttribute('data-value', d.value);
      
      bar.addEventListener('mouseover', () => {
        this.showTooltip(d.id, d.value, x, y);
      });
      
      bar.addEventListener('mouseout', () => {
        this.hideTooltip();
      });
      
      this.barsGroup.appendChild(bar);
      
      const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      label.setAttribute('x', x + barWidth / 2);
      label.setAttribute('y', y - 5);
      label.setAttribute('text-anchor', 'middle');
      label.setAttribute('fill', 'var(--color-semi-gray)');
      label.setAttribute('font-size', '14px'); // 10px → 14px
      label.textContent = d.value;
      this.labelsGroup.appendChild(label);
      
      const idLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      idLabel.setAttribute('x', x + barWidth / 2);
      idLabel.setAttribute('y', 20);
      idLabel.setAttribute('text-anchor', 'middle');
      idLabel.setAttribute('fill', 'var(--color-axis-text)');
      idLabel.setAttribute('font-size', '14px'); // 10px → 14px
      idLabel.textContent = d.id;
      this.xAxisGroup.appendChild(idLabel);
    });
    
    this.updateButtonStates(data);
    
    this.updatePageInfo(this.currentStartIndex, this.currentStartIndex + visibleData.length, data.length);
  }
  
  update(data) {
    if (this.isDataUpdated) {
      this.render(data);
    } else {
      this.currentStartIndex = 0;
      this.isDataUpdated = true;
      this.render(data);
    }
  }
  
  updateButtonStates(data) {
    this.prevButton.disabled = this.currentStartIndex <= 0;
    const maxStartIndex = Math.max(0, data.length - this.visibleBars);
    this.nextButton.disabled = this.currentStartIndex >= maxStartIndex;
  }
  
  updatePageInfo(start, end, total) {
    this.pageInfo.textContent = `${start + 1}-${end} / ${total}`;
  }
  
  showTooltip(id, value, x, y) {
    this.hideTooltip();
    
    const tooltip = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    tooltip.setAttribute('class', 'tooltip');
    tooltip.setAttribute('role', 'tooltip'); // 접근성: 툴팁 역할 명시
    tooltip.setAttribute('aria-label', `ID: ${id}, 값: ${value}`); // 스크린 리더 지원
    
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
    text.setAttribute('font-size', '14px'); // 10px → 14px
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