const display = document.getElementById('display');
const operatorButtons = document.querySelectorAll('[data-operator]');

const MAX_LENGTH = 12;   // 한 숫자에 입력할 수 있는 최대 자릿수
const ERROR = '오류';    // 0으로 나눴을 때 화면에 보여줄 글자

let currentNumber = '0';     // 지금 화면에 보이는 숫자(문자열)
let firstNumber = null;      // 연산자를 누르기 전에 입력한 첫 번째 숫자
let selectedOperator = null; // 선택한 연산자 (+, -, *, /)
let startNewNumber = true;   // true면 다음 숫자 버튼부터 새 숫자를 시작

// 연산자 기호별 계산 방법
const operations = {
  '+': (a, b) => a + b,
  '-': (a, b) => a - b,
  '*': (a, b) => a * b,
  '/': (a, b) => a / b,
};

// 버튼별로 읽어 줄 말
const SPOKEN_WORDS = {
  0: '영', 1: '일', 2: '이', 3: '삼', 4: '사', 5: '오', 6: '육', 7: '칠', 8: '팔', 9: '구',
  '+': '더하기', '-': '빼기', '*': '곱하기', '/': '나누기', clear: '지우기',
};

// 글자를 한국어 음성으로 읽어 준다 (브라우저에 들어 있는 Web Speech API 사용)
function speak(text) {
  if (!('speechSynthesis' in window)) return; // 음성을 지원하지 않는 브라우저면 소리 없이 넘어간다
  speechSynthesis.cancel(); // 빠르게 연달아 누르면 앞 소리는 끊고 새 소리를 바로 낸다
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'ko-KR';
  speechSynthesis.speak(utterance);
}

// 두 숫자를 계산해서 화면에 보여줄 문자열로 돌려준다
function calculate(a, b, operator) {
  const result = operations[operator](a, b);
  if (!isFinite(result)) return ERROR; // 0으로 나누면 Infinity/NaN이 나오므로 오류 처리
  return String(parseFloat(result.toPrecision(12))); // 0.1 * 3 = 0.30000000000000004 같은 소수점 오차 정리
}

// 화면 숫자와 선택된 연산자 표시를 새로 그린다
function updateDisplay() {
  display.textContent = currentNumber;
  operatorButtons.forEach((button) => {
    button.classList.toggle('active', startNewNumber && button.dataset.operator === selectedOperator);
  });
}

// 모든 값을 초기화하고 displayText를 화면에 보여준다 (C 버튼, 계산 결과 표시에 사용)
function resetCalculator(displayText = '0') {
  currentNumber = displayText;
  firstNumber = null;
  selectedOperator = null;
  startNewNumber = true;
  updateDisplay();
}

// 숫자 버튼: 새 숫자를 시작하거나 화면 숫자 뒤에 이어 붙인다
function inputNumber(digit) {
  if (startNewNumber || currentNumber === '0') {
    currentNumber = digit; // 앞자리 0은 없애고 새로 시작
    startNewNumber = false;
  } else if (currentNumber.length < MAX_LENGTH) {
    currentNumber += digit;
  }
  updateDisplay();
}

// 연산자 버튼: 첫 번째 숫자와 연산자를 기억한다
function inputOperator(operator) {
  // "2 + 3" 까지 입력된 상태면 먼저 계산하고 이어간다 (2 + 3 + → 화면에 5)
  if (selectedOperator && !startNewNumber) {
    currentNumber = calculate(firstNumber, Number(currentNumber), selectedOperator);
  }
  if (currentNumber === ERROR) return resetCalculator(ERROR);

  firstNumber = Number(currentNumber);
  selectedOperator = operator; // 연산자를 연달아 누르면 마지막 것으로 바뀐다
  startNewNumber = true;
  updateDisplay();
}

// = 버튼: 계산 결과만 화면에 남기고 나머지는 초기화한다
function inputEquals() {
  if (!selectedOperator || startNewNumber) return; // 두 번째 숫자가 아직 없으면 무시
  resetCalculator(calculate(firstNumber, Number(currentNumber), selectedOperator));
}

// 버튼판 전체에 클릭 이벤트를 한 번만 걸고, 누른 버튼의 data 값으로 할 일을 나눈다
document.querySelector('.buttons').addEventListener('click', (event) => {
  const button = event.target.closest('button');
  if (!button) return; // 버튼 사이 빈 곳을 누르면 무시

  const { number, operator, action } = button.dataset;
  if (number) inputNumber(number);
  else if (operator) inputOperator(operator);
  else if (action === 'equals') inputEquals();
  else if (action === 'clear') resetCalculator();

  // = 버튼은 계산 결과를, 나머지 버튼은 버튼 이름을 읽어 준다
  speak(action === 'equals' ? currentNumber : SPOKEN_WORDS[number || operator || action]);
});
