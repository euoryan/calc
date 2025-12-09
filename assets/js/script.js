const HISTORY_STORAGE_KEY = 'calc_history';
const THEME_STORAGE_KEY = 'theme_preference';
const MAX_HISTORY_ITEMS = 50;

const elements = {
  themeToggle: document.getElementById('themeToggle'),
  calcFormula: document.getElementById('calcFormula'),
  calcResult: document.getElementById('calcResult'),
  historyList: document.getElementById('historyList'),
  clearButton: document.getElementById('clearButton'),
  privacyToggle: document.getElementById('privacyToggle'),
  privacyIcon: document.getElementById('privacyIcon')
};

let state = {
  privacyMode: false
};

function getStoredTheme() {
  return localStorage.getItem(THEME_STORAGE_KEY) || 'dark';
}

function setStoredTheme(theme) {
  localStorage.setItem(THEME_STORAGE_KEY, theme);
}

function setTheme(theme) {
  document.body.setAttribute('data-theme', theme);
  setStoredTheme(theme);
  updateThemeToggleLabel(theme);
}

function updateThemeToggleLabel(theme) {
  const label = document.getElementById('themeToggleLabel');
  if (label) {
    label.textContent = theme === 'dark' ? 'Dark mode' : 'Light mode';
  }
}

function toggleTheme() {
  const currentTheme = document.body.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  setTheme(newTheme);
}

function initializeTheme() {
  const savedTheme = getStoredTheme();
  setTheme(savedTheme);
  updateThemeToggleLabel(savedTheme);
}

function getStoredHistory() {
  try {
    const stored = localStorage.getItem(HISTORY_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    return [];
  }
}

function setStoredHistory(history) {
  localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function updateResult() {
  if (state.privacyMode) {
    elements.calcResult.textContent = '***';
    return;
  }
  
  const formula = elements.calcFormula.value.trim();
  
  if (!formula || formula === '0') {
    elements.calcResult.textContent = '0';
    return;
  }
  
  const result = evaluateExpression(formula);
  if (result !== null) {
    elements.calcResult.textContent = formatNumber(result);
  } else {
    const lastNumber = getLastNumber(formula);
    if (lastNumber !== null) {
      elements.calcResult.textContent = lastNumber;
    } else {
      elements.calcResult.textContent = '0';
    }
  }
}

function getLastNumber(formula) {
  const matches = formula.match(/(\d+\.?\d*)$/);
  return matches ? matches[1] : null;
}

function evaluateExpression(expression) {
  try {
    if (!expression || typeof expression !== 'string') {
      return null;
    }
    
    let cleanExpression = expression
      .replace(/×/g, '*')
      .replace(/÷/g, '/')
      .replace(/−/g, '-')
      .replace(/\s+/g, '')
      .trim();
    
    if (/[+\-*/]$/.test(cleanExpression)) {
      cleanExpression = cleanExpression.slice(0, -1);
    }
    
    if (cleanExpression === '' || cleanExpression === '0') {
      return 0;
    }
    
    if (!/^[0-9+\-*/().]+$/.test(cleanExpression)) {
      return null;
    }
    
    let openParens = 0;
    for (let char of cleanExpression) {
      if (char === '(') openParens++;
      if (char === ')') openParens--;
      if (openParens < 0) return null;
    }
    if (openParens !== 0) return null;
    
    const result = Function('"use strict"; return (' + cleanExpression + ')')();
    
    if (typeof result !== 'number' || !isFinite(result)) {
      return null;
    }
    
    return result;
  } catch (error) {
    return null;
  }
}

function formatNumber(num) {
  if (num % 1 !== 0) {
    return parseFloat(num.toFixed(10)).toString();
  }
  return num.toString();
}

function getOperatorSymbol(op) {
  const symbols = {
    '+': '+',
    '-': '−',
    '*': '×',
    '/': '÷'
  };
  return symbols[op] || op;
}

function insertAtCursor(text) {
  const input = elements.calcFormula;
  const start = input.selectionStart;
  const end = input.selectionEnd;
  const value = input.value;
  
  input.value = value.substring(0, start) + text + value.substring(end);
  input.setSelectionRange(start + text.length, start + text.length);
  input.focus();
  updateResult();
}

function inputNumber(number) {
  const input = elements.calcFormula;
  
  if (input === document.activeElement) {
    insertAtCursor(number);
  } else {
    if (input.value === '0' || input.value === '') {
      input.value = number;
    } else {
      input.value += number;
    }
    input.focus();
    updateResult();
  }
}

function inputDecimal() {
  const input = elements.calcFormula;
  
  if (input === document.activeElement) {
    insertAtCursor('.');
  } else {
    const lastNumber = getLastNumber(input.value);
    if (lastNumber && lastNumber.indexOf('.') === -1) {
      input.value += '.';
    } else if (!lastNumber) {
      input.value += '0.';
    }
    input.focus();
    updateResult();
  }
}

function handleOperator(operator) {
  const input = elements.calcFormula;
  const operatorSymbol = getOperatorSymbol(operator);
  const operatorText = ' ' + operatorSymbol + ' ';
  
  if (input === document.activeElement) {
    insertAtCursor(operatorText);
  } else {
    let value = input.value.trim();
    const lastChar = value.slice(-1);
    if (['+', '-', '*', '/', '×', '÷', '−'].includes(lastChar)) {
      value = value.slice(0, -1).trim();
    }
    
    input.value = value + operatorText;
    input.focus();
    updateResult();
  }
}

function performCalculation() {
  const formula = elements.calcFormula.value.trim();
  
  if (!formula || formula === '0') {
    return;
  }
  
  let formulaToCalculate = formula.trim();
  if (/[+\-*/×÷−]$/.test(formulaToCalculate)) {
    formulaToCalculate = formulaToCalculate.slice(0, -1).trim();
  }
  
  const result = evaluateExpression(formulaToCalculate);
  
  if (result !== null) {
    const formattedResult = formatNumber(result);
    addToHistory(formulaToCalculate, formattedResult);
    elements.calcFormula.value = formattedResult;
    updateResult();
  } else {
    elements.calcResult.textContent = 'Erro';
    setTimeout(() => {
      updateResult();
    }, 1000);
  }
}

function clear() {
  elements.calcFormula.value = '0';
  elements.calcFormula.focus();
  updateResult();
}

function clearEntry() {
  const input = elements.calcFormula;
  if (input === document.activeElement) {
    return;
  }
  
  let value = input.value.trim();
  if (value.length > 1) {
    value = value.slice(0, -1).trim();
    if (value === '') {
      value = '0';
    }
    input.value = value;
  } else {
    input.value = '0';
  }
  input.focus();
  updateResult();
}

function backspace() {
  const input = elements.calcFormula;
  
  if (input === document.activeElement) {
    setTimeout(() => {
      updateResult();
    }, 0);
    return;
  }
  
  let value = input.value.trim();
  if (value.length > 1) {
    value = value.slice(0, -1).trim();
    if (value === '') {
      value = '0';
    }
    input.value = value;
  } else {
    input.value = '0';
  }
  input.focus();
  updateResult();
}

function loadFromHistory(expression, result) {
  if (state.privacyMode) return;
  
  elements.calcFormula.value = expression;
  elements.calcFormula.focus();
  updateResult();
}

function addToHistory(expression, result) {
  const history = getStoredHistory();
  
  const historyItem = {
    id: generateId(),
    expression: expression,
    result: result,
    createdAt: new Date().toISOString()
  };
  
  history.unshift(historyItem);
  
  if (history.length > MAX_HISTORY_ITEMS) {
    history.splice(MAX_HISTORY_ITEMS);
  }
  
  setStoredHistory(history);
  renderHistory();
}

function renderHistory() {
  const history = getStoredHistory();
  const historyList = elements.historyList;
  
  if (history.length === 0) {
    historyList.innerHTML = '<div class="history-empty">Nenhum cálculo realizado ainda</div>';
    return;
  }
  
  historyList.innerHTML = '';
  
  history.forEach(item => {
    const historyItem = createHistoryItemElement(item);
    historyList.appendChild(historyItem);
  });
}

function createHistoryItemElement(item) {
  const div = document.createElement('div');
  div.className = 'history-item';
  div.setAttribute('data-history-id', item.id);
  
  const expressionDisplay = state.privacyMode ? '***' : escapeHtml(item.expression);
  const resultDisplay = state.privacyMode ? '***' : escapeHtml(item.result);
  
  div.innerHTML = `
    <div class="history-item-content">
      <div class="history-item-main" data-expression="${escapeHtml(item.expression)}" data-result="${escapeHtml(item.result)}">
        <span class="history-expression">${expressionDisplay}</span>
        <span class="history-separator">=</span>
        <span class="history-result">${resultDisplay}</span>
      </div>
      <div class="history-actions">
        <button class="history-action-button history-copy-button" title="Copiar resultado" aria-label="Copiar resultado" data-result="${escapeHtml(item.result)}">
          Copiar
        </button>
        <button class="history-action-button history-delete-button" title="Excluir" aria-label="Excluir">
          🗑️
        </button>
      </div>
    </div>
  `;
  
  addHistoryItemListeners(div, item);
  
  return div;
}

function addHistoryItemListeners(element, item) {
  const mainItem = element.querySelector('.history-item-main');
  mainItem.addEventListener('click', (e) => {
    e.stopPropagation();
    if (!state.privacyMode) {
      const expression = mainItem.getAttribute('data-expression');
      const result = mainItem.getAttribute('data-result');
      loadFromHistory(expression, result);
    }
  });
  mainItem.style.cursor = 'pointer';
  
  const copyButton = element.querySelector('.history-copy-button');
  copyButton.addEventListener('click', async (e) => {
    e.stopPropagation();
    const result = copyButton.getAttribute('data-result');
    if (result && result !== '***' && !state.privacyMode) {
      await copyToClipboard(result);
      copyButton.classList.add('copied');
      const originalText = copyButton.textContent;
      copyButton.textContent = 'Copiado!';
      
      setTimeout(() => {
        copyButton.classList.remove('copied');
        copyButton.textContent = originalText;
      }, 2000);
    }
  });
  
  const deleteButton = element.querySelector('.history-delete-button');
  deleteButton.addEventListener('click', (e) => {
    e.stopPropagation();
    deleteHistoryItem(item.id);
  });
}

async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      return true;
    } catch (err) {
      return false;
    }
  }
}

function deleteHistoryItem(id) {
  let history = getStoredHistory();
  history = history.filter(item => item.id !== id);
  setStoredHistory(history);
  renderHistory();
}

function clearAllHistory() {
  if (!confirm('Tem certeza que deseja limpar todo o histórico?')) return;
  
  setStoredHistory([]);
  renderHistory();
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function togglePrivacyMode() {
  state.privacyMode = !state.privacyMode;
  
  if (elements.privacyIcon) {
    if (state.privacyMode) {
      elements.privacyIcon.setAttribute('viewBox', '0 0 16 16');
      elements.privacyIcon.innerHTML = '<path d="M13.359 11.238C15.06 9.72 16 8 16 8s-3-5.5-8-5.5a7 7 0 0 0-2.79.588l.77.771A6 6 0 0 1 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13 13 0 0 1 14.828 8q-.086.13-.195.288c-.335.48-.83 1.12-1.465 1.755q-.247.248-.517.486z"/><path d="M11.297 9.176a3.5 3.5 0 0 0-4.474-4.474l.823.823a2.5 2.5 0 0 1 2.829 2.829zm-2.943 1.299.822.822a3.5 3.5 0 0 1-4.474-4.474l.823.823a2.5 2.5 0 0 0 2.829 2.829"/><path d="M3.35 5.47q-.27.24-.518.487A13 13 0 0 0 1.172 8l.195.288c.335.48.83 1.12 1.465 1.755C4.121 11.332 5.881 12.5 8 12.5c.716 0 1.39-.133 2.02-.36l.77.772A7 7 0 0 1 8 13.5C3 13.5 0 8 0 8s.939-1.721 2.641-3.238l.708.709zm10.296 8.884-12-12 .708-.708 12 12z"/>';
      elements.privacyToggle.setAttribute('title', 'Mostrar resultados');
    } else {
      elements.privacyIcon.setAttribute('viewBox', '0 0 16 16');
      elements.privacyIcon.innerHTML = '<path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8M1.173 8a13 13 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5s3.879 1.168 5.168 2.457A13 13 0 0 1 14.828 8q-.086.13-.195.288c-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5s-3.879-1.168-5.168-2.457A13 13 0 0 1 1.172 8z"/><path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5M4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0"/>';
      elements.privacyToggle.setAttribute('title', 'Ocultar resultados');
    }
  }
  
  if (state.privacyMode) {
    elements.calcFormula.value = '***';
    elements.calcResult.textContent = '***';
  } else {
    elements.calcFormula.value = '0';
    updateResult();
  }
  
  renderHistory();
}

function addEventListeners() {
  elements.themeToggle.addEventListener('click', toggleTheme);
  
  elements.clearButton.addEventListener('click', clearAllHistory);
  
  if (elements.privacyToggle) {
    elements.privacyToggle.addEventListener('click', togglePrivacyMode);
  }
  
  if (elements.calcFormula) {
    elements.calcFormula.addEventListener('input', function() {
      if (!state.privacyMode) {
        updateResult();
      }
    });
    
    elements.calcFormula.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' || e.key === '=') {
        e.preventDefault();
        performCalculation();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        clear();
      }
    });
  }
  
  document.querySelectorAll('.calc-button-number').forEach(button => {
    button.addEventListener('click', () => {
      const number = button.getAttribute('data-number');
      if (number === '.') {
        inputDecimal();
      } else {
        inputNumber(number);
      }
    });
  });
  
  document.querySelectorAll('.calc-button-operator').forEach(button => {
    button.addEventListener('click', () => {
      const operator = button.getAttribute('data-operator');
      if (operator) {
        handleOperator(operator);
      } else {
        backspace();
      }
    });
  });
  
  document.querySelectorAll('[data-action]').forEach(button => {
    button.addEventListener('click', () => {
      const action = button.getAttribute('data-action');
      switch (action) {
        case 'clear':
          clear();
          break;
        case 'clearEntry':
          clearEntry();
          break;
        case 'backspace':
          backspace();
          break;
        case 'equals':
          performCalculation();
          break;
      }
    });
  });
  
  document.addEventListener('keydown', handleKeyboard);
}

function handleKeyboard(e) {
  if (document.activeElement === elements.calcFormula) {
    return;
  }
  
  if (e.key >= '0' && e.key <= '9') {
    e.preventDefault();
    inputNumber(e.key);
  } else if (e.key === '.') {
    e.preventDefault();
    inputDecimal();
  } else if (e.key === '+' || e.key === '-') {
    e.preventDefault();
    handleOperator(e.key);
  } else if (e.key === '*') {
    e.preventDefault();
    handleOperator('*');
  } else if (e.key === '/') {
    e.preventDefault();
    handleOperator('/');
  } else if (e.key === 'Enter' || e.key === '=') {
    e.preventDefault();
    performCalculation();
  } else if (e.key === 'Escape') {
    e.preventDefault();
    clear();
  } else if (e.key === 'Backspace') {
    e.preventDefault();
    backspace();
  }
}

function initialize() {
  initializeTheme();
  addEventListeners();
  renderHistory();
  updateResult();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}
