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
  window.dataManager.setData(initData);
  new window.TableEditor('#data-table', dataManager);
  new window.AddForm('#add-data-form', dataManager);
});
