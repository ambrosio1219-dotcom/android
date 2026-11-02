/* =========================================================
   로또 번호 생성기 - 번호 뽑기와 페이지 시작 담당 파일
   흐름: 버튼 클릭 → (고른 방식으로) 번호 6개 뽑기 → 오름차순 정렬 → 공으로 그리기 → 생성 횟수 +1

   이 파일보다 먼저 읽히는 파일 (lotto.html의 <script> 순서)
     lotto-data.js  : 역대 당첨번호 LOTTO_DRAWS
     lotto-stats.js : 출현 횟수 계산 함수(analyzeDraws)와 분석 카드 그리기 함수(renderStats)
   ========================================================= */


/* ---------------------------------------------------------
   1. 상수 (프로그램이 도는 동안 절대 바뀌지 않는 값)
   --------------------------------------------------------- */

/** 뽑을 수 있는 가장 작은 번호 */
const MIN_NUMBER = 1;

/** 뽑을 수 있는 가장 큰 번호 */
const MAX_NUMBER = 45;

/** 한 번에 뽑는 번호의 개수 */
const PICK_COUNT = 6;

/** 공이 하나씩 나올 때, 앞 공보다 몇 초 늦게 나올지 (0.12초 간격) */
const BALL_DELAY_SECONDS = 0.12;


/* ---------------------------------------------------------
   2. 화면 요소 (lotto.html에서 id로 찾아 둔 태그들)
   --------------------------------------------------------- */

/** 공 6개가 들어가는 상자 <div id="balls"> */
const ballsBox = document.getElementById('balls');

/** 생성 횟수 숫자가 적히는 <strong id="count"> */
const countText = document.getElementById('count');

/** "번호 뽑기" 버튼 */
const drawBtn = document.getElementById('drawBtn');

/** "초기화" 버튼 */
const resetBtn = document.getElementById('resetBtn');

/** 뽑기 방식 라디오 버튼 2개 ("많이 나온 번호 위주" / "완전 무작위") */
const modeInputs = document.querySelectorAll('input[name="mode"]');

/** 고른 뽑기 방식을 설명하는 한 줄 <p id="modeHelp"> */
const modeHelp = document.getElementById('modeHelp');


/* ---------------------------------------------------------
   3. 상태와 분석 결과
   --------------------------------------------------------- */

/** 지금까지 "번호 뽑기"를 누른 횟수. 초기화하면 0으로 돌아감 */
let drawCount = 0;

/**
 * 역대 당첨번호 분석 결과 (lotto-stats.js의 analyzeDraws()가 계산)
 * stats.counts[n] = n번이 역대 당첨번호로 나온 횟수 → "많이 나온 번호 위주" 뽑기의 가중치로 씀
 */
const stats = analyzeDraws(LOTTO_DRAWS);


/* ---------------------------------------------------------
   4. 번호 뽑기
   --------------------------------------------------------- */

/**
 * 1~45가 차례로 들어 있는 새 "후보 상자" 배열을 만든다.
 * 두 가지 뽑기 방식이 모두 이 상자에서 번호를 하나씩 꺼내 간다.
 * @returns {number[]} [1, 2, 3, ..., 45]
 */
function createNumberPool() {
  /** 후보 번호들 */
  const pool = [];
  for (let n = MIN_NUMBER; n <= MAX_NUMBER; n++) {
    pool.push(n);
  }
  return pool;
}

/**
 * [완전 무작위] 1~45 중 서로 다른 번호 6개를 똑같은 확률로 뽑아 오름차순으로 돌려준다.
 *
 * 방법: 후보 상자에서 무작위로 하나를 꺼낸 뒤 상자에서 빼 버린다.
 *       꺼낸 번호는 상자에 다시 없으므로 중복이 절대 생기지 않는다.
 *       (실제 로또 추첨기에서 공을 하나씩 꺼내는 것과 같은 방식)
 *
 * @returns {number[]} 예) [3, 11, 17, 25, 38, 44]
 */
function pickRandomNumbers() {
  /** 아직 뽑히지 않은 번호들. 처음엔 [1, 2, ..., 45] */
  const pool = createNumberPool();

  /** 뽑힌 번호를 차례로 모아 두는 배열 */
  const picked = [];

  for (let i = 0; i < PICK_COUNT; i++) {
    /**
     * 후보 상자 안에서 꺼낼 위치(0 ~ pool.length-1).
     * Math.random()은 0 이상 1 미만의 소수이므로,
     * 상자 크기를 곱하고 소수점을 버리면 올바른 위치 번호가 나온다.
     */
    const index = Math.floor(Math.random() * pool.length);

    // splice(index, 1): 그 위치의 번호 1개를 상자에서 빼내고, 빼낸 값을 배열로 돌려줌
    picked.push(pool.splice(index, 1)[0]);
  }

  // 오름차순 정렬.
  // 주의: 그냥 sort()만 쓰면 숫자를 글자로 비교해서 [10, 9]가 "1" < "9" 때문에 그대로 남는다.
  // (a, b) => a - b 를 넣어야 숫자 크기대로 작은 수 → 큰 수 순서가 된다.
  picked.sort((a, b) => a - b);

  return picked;
}

/**
 * [많이 나온 번호 위주] 역대 출현 횟수를 "가중치"로 써서 서로 다른 번호 6개를 뽑는다.
 *
 * 가중치 뽑기란? 번호마다 자기 출현 횟수만큼의 길이를 가진 줄자를 떠올리면 된다.
 *     | 1번 171칸 | 2번 157칸 | 3번 172칸 | ... | 45번 176칸 |
 *   줄자 위 아무 곳이나 무작위로 한 점을 찍으면,
 *   칸이 긴(=많이 나온) 번호에 찍힐 가능성이 그만큼 크다.
 * 뽑힌 번호는 후보 상자에서 빼므로 중복은 생기지 않는다.
 *
 * @param {number[]} counts counts[n] = n번이 나온 횟수 (가중치)
 * @returns {number[]} 오름차순으로 정렬된 번호 6개
 */
function pickWeightedNumbers(counts) {
  /** 아직 뽑히지 않은 번호들 */
  const pool = createNumberPool();

  /** 뽑힌 번호를 차례로 모아 두는 배열 */
  const picked = [];

  for (let i = 0; i < PICK_COUNT; i++) {
    /** 남은 후보들의 출현 횟수를 모두 더한 값 = 줄자의 전체 길이 */
    let total = 0;
    pool.forEach(function (n) {
      total = total + counts[n];
    });

    /** 줄자 위에서 무작위로 찍은 위치 (0 이상 total 미만) */
    let point = Math.random() * total;

    /** 찍은 위치가 속한 번호의 자리 (pool 안에서 몇 번째인지) */
    let index = 0;

    // 앞 번호의 칸 길이를 하나씩 빼 나가다가, 남은 길이가 지금 칸보다 짧아지면 그 칸에 찍힌 것.
    // (index < pool.length - 1 은 소수 계산 오차로 마지막 칸을 넘어가는 일을 막는 안전장치)
    while (index < pool.length - 1 && point >= counts[pool[index]]) {
      point = point - counts[pool[index]];
      index++;
    }

    picked.push(pool.splice(index, 1)[0]);
  }

  picked.sort((a, b) => a - b); // 오름차순 정렬 (pickRandomNumbers()의 설명 참고)

  return picked;
}

/**
 * 지금 선택된 뽑기 방식을 알려 준다.
 * @returns {string} 'weighted'(많이 나온 번호 위주) 또는 'random'(완전 무작위)
 */
function getSelectedMode() {
  return document.querySelector('input[name="mode"]:checked').value;
}


/* ---------------------------------------------------------
   5. 공 그리기
   --------------------------------------------------------- */

/**
 * 번호에 맞는 공 색 이름을 돌려준다. (실제 로또 용지와 같은 색 규칙)
 * 돌려준 이름은 lotto.css의 .ball.yellow, .ball.blue ... 클래스와 짝이다.
 *
 * @param {number} number 공에 적힐 번호 (1~45)
 * @returns {string} 'yellow' | 'blue' | 'red' | 'gray' | 'green'
 */
function getBallColor(number) {
  if (number <= 10) return 'yellow'; //  1 ~ 10
  if (number <= 20) return 'blue';   // 11 ~ 20
  if (number <= 30) return 'red';    // 21 ~ 30
  if (number <= 40) return 'gray';   // 31 ~ 40
  return 'green';                    // 41 ~ 45
}

/**
 * 공 하나와 그 아래 작은 글씨(예: "187회")를 묶은 칸 <div class="ball-slot">을 만들어 돌려준다.
 * 번호 생성기와 분석 카드(많이/적게 나온 번호)에서 똑같이 쓴다. 화면에 붙이는 건 부른 쪽이 한다.
 *
 * @param {number|null} number 공에 적을 번호. null이면 아직 안 뽑힌 "?" 공
 * @param {object} [options] 추가 설정 (없어도 됨)
 * @param {number} [options.order]   몇 번째 공인지(0부터). 주면 굴러 나오는 애니메이션을 그 순서만큼 늦게 재생
 * @param {string} [options.caption] 공 아래에 적을 글씨
 * @returns {HTMLDivElement} 완성된 공 칸
 */
function createBallSlot(number, options = {}) {
  /** 공과 아래 글씨를 세로로 묶는 칸 */
  const slot = document.createElement('div');
  slot.className = 'ball-slot';

  /** 동그란 공 */
  const ball = document.createElement('span');
  if (number === null) {
    ball.className = 'ball empty';
    ball.textContent = '?';
  } else {
    // 'ball' = 기본 동그라미 모양, 색 이름 = 번호대별 색
    ball.className = 'ball ' + getBallColor(number);
    ball.textContent = number;
  }

  /** 공 아래 작은 글씨. 비어 있어도 자리는 차지해서, 글씨가 생길 때 화면이 들썩이지 않음 */
  const caption = document.createElement('span');
  caption.className = 'ball-caption';
  caption.textContent = options.caption || '';

  if (options.order !== undefined) {
    // 'drawn' = 굴러 들어오는 애니메이션 켜기 (lotto.css 참고)
    slot.classList.add('drawn');
    // 첫 공은 0초, 두 번째는 0.12초, 세 번째는 0.24초 ... 늦게 나오게 해서 하나씩 굴러 나오는 느낌을 줌
    slot.style.setProperty('--delay', (options.order * BALL_DELAY_SECONDS) + 's');
  }

  slot.append(ball, caption);
  return slot;
}

/**
 * 뽑힌 번호들로 공을 그려 번호 생성기의 공 상자를 채운다.
 * 이전에 있던 공은 모두 지우고 새로 그린다. (새로 만든 공이라 애니메이션도 다시 재생됨)
 * 공 아래에는 그 번호가 역대 당첨번호로 나온 횟수를 적는다.
 *
 * @param {number[]} numbers 정렬된 번호 배열 (길이 6)
 */
function renderBalls(numbers) {
  ballsBox.innerHTML = ''; // 이전 공 모두 지우기

  numbers.forEach(function (number, order) {
    ballsBox.appendChild(createBallSlot(number, { order: order, caption: stats.counts[number] + '회' }));
  });
}

/**
 * 아직 번호를 뽑지 않은 상태로 공 상자를 채운다. ("?" 가 적힌 회색 공 6개)
 * 페이지를 처음 열었을 때와 초기화했을 때 사용한다.
 */
function renderEmpty() {
  ballsBox.innerHTML = '';

  for (let i = 0; i < PICK_COUNT; i++) {
    ballsBox.appendChild(createBallSlot(null));
  }
}


/* ---------------------------------------------------------
   6. 화면 갱신과 버튼 동작
   --------------------------------------------------------- */

/**
 * 생성 횟수를 화면에 반영하고,
 * 초기화할 게 없을 때(횟수 0)는 초기화 버튼을 비활성화한다.
 */
function updateCount() {
  countText.textContent = drawCount;
  resetBtn.disabled = (drawCount === 0);
}

/**
 * 선택한 뽑기 방식에 맞는 설명 한 줄을 적는다. 방식을 바꿀 때마다 다시 부른다.
 * "많이 나온 번호 위주"일 때는 가장 많이/적게 나온 번호가 몇 배 차이로 뽑히는지 알려 준다.
 */
function updateModeHelp() {
  if (getSelectedMode() === 'weighted') {
    /** 역대 가장 많이 / 가장 적게 나온 번호 */
    const most = stats.ranking[0];
    const least = stats.ranking[stats.ranking.length - 1];
    /** 두 번호가 뽑힐 가능성의 비율 = 출현 횟수의 비율 */
    const ratio = stats.counts[most] / stats.counts[least];

    modeHelp.textContent =
      '역대 출현 횟수에 비례해 뽑아요. 가장 많이 나온 ' + most + '번(' + stats.counts[most] + '회)이 ' +
      '가장 적게 나온 ' + least + '번(' + stats.counts[least] + '회)보다 약 ' + ratio.toFixed(1) + '배 잘 뽑혀요.';
  } else {
    modeHelp.textContent = MAX_NUMBER + '개 번호가 모두 똑같은 확률로 뽑혀요.';
  }
}

/**
 * "번호 뽑기" 버튼을 눌렀을 때 실행된다.
 * 고른 방식으로 번호 6개 뽑기 → 공 그리기 → 생성 횟수 1 증가
 */
function handleDraw() {
  /** 이번에 뽑힌 번호 6개 (이미 오름차순 정렬됨) */
  const numbers = (getSelectedMode() === 'weighted')
    ? pickWeightedNumbers(stats.counts)
    : pickRandomNumbers();

  renderBalls(numbers);

  drawCount = drawCount + 1;
  updateCount();
}

/**
 * "초기화" 버튼을 눌렀을 때 실행된다.
 * 공을 "?" 상태로 되돌리고 생성 횟수를 0으로 만든다. (뽑기 방식은 그대로 둠)
 */
function handleReset() {
  renderEmpty();

  drawCount = 0;
  updateCount();
}


/* ---------------------------------------------------------
   7. 시작
   --------------------------------------------------------- */

// 버튼과 함수를 연결: 클릭하면 해당 함수가 실행된다
drawBtn.addEventListener('click', handleDraw);
resetBtn.addEventListener('click', handleReset);

// 뽑기 방식을 바꾸면 설명 문장도 바꾼다
modeInputs.forEach(function (input) {
  input.addEventListener('change', updateModeHelp);
});

// 페이지를 처음 열었을 때의 화면: "?" 공 6개, 생성 횟수 0, 초기화 버튼 비활성, 방식 설명
renderEmpty();
updateCount();
updateModeHelp();

// 아래쪽 "역대 당첨번호 분석" 카드 채우기 (lotto-stats.js)
renderStats(stats);
