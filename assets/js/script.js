const HISTORY_STORAGE_KEY = 'calc_history';
const THEME_STORAGE_KEY = 'theme_preference';
const AUTO_SAVE_KEY = 'calc_autosave';
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

function getSystemTheme() {
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function getStoredTheme() {
  return localStorage.getItem(THEME_STORAGE_KEY) || 'system';
}

function setStoredTheme(theme) {
  localStorage.setItem(THEME_STORAGE_KEY, theme);
}

function getEffectiveTheme() {
  const preference = getStoredTheme();
  if (preference === 'system') {
    return getSystemTheme();
  }
  return preference;
}

function setTheme(preference) {
  const effectiveTheme = preference === 'system' ? getSystemTheme() : preference;
  document.body.setAttribute('data-theme', effectiveTheme);
  setStoredTheme(preference);
  updateThemeIcon(effectiveTheme);
  updateThemeDropdown(preference);
}

function updateThemeIcon(effectiveTheme) {
  const preference = getStoredTheme();
  const sunIcon = document.querySelector('.theme-icon-sun');
  const moonIcon = document.querySelector('.theme-icon-moon');
  const systemIcon = document.querySelector('.theme-icon-system');
  
  if (sunIcon) {
    sunIcon.style.display = 'none';
    sunIcon.style.opacity = '0';
  }
  if (moonIcon) {
    moonIcon.style.display = 'none';
    moonIcon.style.opacity = '0';
  }
  if (systemIcon) {
    systemIcon.style.display = 'none';
    systemIcon.style.opacity = '0';
  }
  
  if (preference === 'system') {
    if (systemIcon) {
      systemIcon.style.display = 'block';
      systemIcon.style.opacity = '1';
    }
  } else if (preference === 'light') {
    if (sunIcon) {
      sunIcon.style.display = 'block';
      sunIcon.style.opacity = '1';
    }
  } else if (preference === 'dark') {
    if (moonIcon) {
      moonIcon.style.display = 'block';
      moonIcon.style.opacity = '1';
    }
  }
}

function updateThemeDropdown(preference) {
  const options = document.querySelectorAll('.theme-option');
  options.forEach(option => {
    if (option.dataset.theme === preference) {
      option.classList.add('active');
    } else {
      option.classList.remove('active');
    }
  });
}

function toggleThemeDropdown() {
  const dropdown = document.getElementById('themeDropdown');
  if (dropdown) {
    dropdown.classList.toggle('active');
  }
}

function closeThemeDropdown() {
  const dropdown = document.getElementById('themeDropdown');
  if (dropdown) {
    dropdown.classList.remove('active');
  }
}

function selectTheme(themePreference) {
  setTheme(themePreference);
  closeThemeDropdown();
}

function initializeTheme() {
  const savedPreference = getStoredTheme();
  setTheme(savedPreference);
  
  if (window.matchMedia) {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', (e) => {
      if (getStoredTheme() === 'system') {
        const newTheme = e.matches ? 'dark' : 'light';
        document.body.setAttribute('data-theme', newTheme);
        updateThemeIcon(newTheme);
      }
    });
  }
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
  // Manter foco apenas se já estava focado (para não abrir teclado no mobile)
  if (input === document.activeElement) {
    input.focus();
  }
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
    // Não focar o input para evitar abrir teclado no mobile
    // input.focus();
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
    // Não focar o input para evitar abrir teclado no mobile
    // input.focus();
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
    // Não focar o input para evitar abrir teclado no mobile
    // input.focus();
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
  // Não focar o input para evitar abrir teclado no mobile
  // elements.calcFormula.focus();
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
  // Não focar o input para evitar abrir teclado no mobile
  // input.focus();
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
  // Não focar o input para evitar abrir teclado no mobile
  // input.focus();
  updateResult();
}

function loadFromHistory(expression, result) {
  if (state.privacyMode) return;
  
  elements.calcFormula.value = expression;
  // Não focar o input para evitar abrir teclado no mobile
  // elements.calcFormula.focus();
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
  
  if (elements.privacyToggle) {
    elements.privacyToggle.classList.toggle('active', state.privacyMode);
    elements.privacyToggle.setAttribute('title', state.privacyMode ? 'Mostrar resultados' : 'Ocultar resultados');
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

// Reset Page Function
function resetPage() {
  if (confirm('Tem certeza que deseja descarregar todos os dados? Isso irá limpar todo o histórico e dados salvos, resetando a página para o estado padrão.')) {
    // Limpar todos os dados do localStorage
    localStorage.removeItem(HISTORY_STORAGE_KEY);
    localStorage.removeItem(AUTO_SAVE_KEY);
    
    // Recarregar a página para resetar tudo
    window.location.reload();
  }
}

function addEventListeners() {
  elements.themeToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleThemeDropdown();
  });
  
  document.querySelectorAll('.theme-option').forEach(option => {
    option.addEventListener('click', (e) => {
      e.stopPropagation();
      selectTheme(option.dataset.theme);
    });
  });
  
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.theme-dropdown-wrapper')) {
      closeThemeDropdown();
    }
  });
  
  // Reset button
  const resetButton = document.getElementById('resetButton');
  if (resetButton) {
    resetButton.addEventListener('click', resetPage);
  }
  
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

// Auto-save Functions
function saveFormData() {
  const formData = {
    formula: elements.calcFormula?.value || '0'
  };
  
  try {
    localStorage.setItem(AUTO_SAVE_KEY, JSON.stringify(formData));
  } catch (error) {
    console.error('Erro ao salvar dados:', error);
  }
}

function loadFormData() {
  try {
    const saved = localStorage.getItem(AUTO_SAVE_KEY);
    if (!saved) return;
    
    const formData = JSON.parse(saved);
    
    if (elements.calcFormula && formData.formula && formData.formula !== '0') {
      elements.calcFormula.value = formData.formula;
      updateResult();
    }
  } catch (error) {
    console.error('Erro ao carregar dados salvos:', error);
  }
}

function setupAutoSave() {
  if (elements.calcFormula) {
    elements.calcFormula.addEventListener('input', () => {
      if (!state.privacyMode) {
        saveFormData();
      }
    });
  }
}

function initialize() {
  initializeTheme();
  addEventListeners();
  setupAutoSave();
  loadFormData();
  renderHistory();
  updateResult();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}
