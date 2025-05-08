import TableEditor from './components/TableEditor.js';
import dataManager from './utils/DataManager.js';

const initData = [
  {
    id: 0,
    value: 75,
  },
  {
    id: 1,
    value: 20,
  },
  {
    id: 2,
    value: 80,
  },
  {
    id: 3,
    value: 100,
  },
  {
    id: 4,
    value: 70,
  },
];

document.addEventListener("DOMContentLoaded", () => {
  dataManager.setData(initData);
  const tableEditor = new TableEditor('#data-table', dataManager);
});
