/* =========================================================
   역대 당첨번호 분석 - 계산과 "역대 당첨번호 분석" 카드 그리기 담당 파일
   lotto-data.js의 LOTTO_DRAWS를 읽어 번호별로 몇 번 나왔는지 세고, 그 결과를 화면에 그린다.

   이 파일에는 함수만 있고 바로 실행되는 코드는 없다.
   실제 실행은 lotto.js의 "시작" 부분에서 analyzeDraws()와 renderStats()를 부르면서 일어난다.
   (MAX_NUMBER, PICK_COUNT, createBallSlot() 같은 공용 값/함수는 lotto.js에 있음)
   ========================================================= */


/* ---------------------------------------------------------
   1. 상수
   --------------------------------------------------------- */

/** 분석 카드에 보여 줄 "많이 나온 번호"와 "적게 나온 번호"의 개수 */
const RANK_SHOW_COUNT = 6;

/** "많이 나온 번호가 나중에도 많이 나올까?" 검사에 쓸 상위 번호 개수 */
const HOT_CHECK_COUNT = 10;

/** 차트 세로축 눈금 간격 (0, 50, 100, 150, ...) */
const Y_TICK_STEP = 50;

/** 차트 가로축에 번호를 적어 줄 위치 (45개를 다 적으면 좁은 화면에서 글자가 겹침) */
const X_LABELS = [1, 5, 10, 15, 20, 25, 30, 35, 40, 45];


/* ---------------------------------------------------------
   2. 데이터 한 줄 읽기 도우미
   LOTTO_DRAWS의 한 줄 = [회차, '추첨일', 번호1, ..., 번호6, 보너스]
   --------------------------------------------------------- */

/**
 * 한 회차 데이터에서 당첨번호 6개만 꺼낸다. (회차, 날짜, 보너스는 뺌)
 * @param {Array} draw 예) [1248, '2026-10-31', 16, 18, 27, 36, 38, 42, 22]
 * @returns {number[]} 예) [16, 18, 27, 36, 38, 42]
 */
function getDrawNumbers(draw) {
  return draw.slice(2, 8); // 2번째 칸부터 7번째 칸까지 (8은 포함 안 됨)
}

/**
 * '2026-10-31' 모양의 날짜를 '2026.10.31' 모양으로 바꾼다.
 * @param {string} text
 * @returns {string}
 */
function formatDate(text) {
  return text.replace(/-/g, '.');
}

/**
 * 숫자에 천 단위 쉼표를 붙인다. 예) 1248 → '1,248'
 * @param {number} value
 * @returns {string}
 */
function formatNumber(value) {
  return value.toLocaleString('ko-KR');
}


/* ---------------------------------------------------------
   3. 계산
   --------------------------------------------------------- */

/**
 * 여러 회차에서 번호마다 몇 번 나왔는지 센다.
 *
 * @param {Array[]} draws LOTTO_DRAWS 전체 또는 그 일부
 * @returns {number[]} counts[n] = n번이 나온 횟수.
 *   번호와 칸 번호를 맞추려고 길이를 46으로 만들고 counts[0]은 쓰지 않는다.
 */
function countNumbers(draws) {
  /** 번호별 출현 횟수를 모으는 배열. 처음엔 전부 0 */
  const counts = new Array(MAX_NUMBER + 1).fill(0);

  draws.forEach(function (draw) {
    getDrawNumbers(draw).forEach(function (number) {
      counts[number] = counts[number] + 1;
    });
  });

  return counts;
}

/**
 * 번호 1~45를 "많이 나온 순서"로 줄 세운다.
 * 횟수가 같으면 작은 번호를 앞에 둔다. (그래야 새로고침해도 순서가 늘 같음)
 *
 * @param {number[]} counts countNumbers()의 결과
 * @returns {number[]} 예) [34, 13, 27, ...] (맨 앞이 가장 많이, 맨 뒤가 가장 적게 나온 번호)
 */
function rankNumbers(counts) {
  /** 1~45 번호 목록 */
  const numbers = [];
  for (let n = MIN_NUMBER; n <= MAX_NUMBER; n++) {
    numbers.push(n);
  }

  numbers.sort(function (a, b) {
    // 횟수가 다르면 큰 횟수가 앞으로 (b - a = 내림차순)
    if (counts[a] !== counts[b]) return counts[b] - counts[a];
    // 횟수가 같으면 작은 번호가 앞으로 (a - b = 오름차순)
    return a - b;
  });

  return numbers;
}

/**
 * 숫자 목록의 평균을 구한다.
 * @param {number[]} values
 * @returns {number}
 */
function getAverage(values) {
  /** 모든 값의 합 */
  let sum = 0;
  values.forEach(function (value) {
    sum = sum + value;
  });
  return sum / values.length;
}

/**
 * n개 중에서 순서 상관없이 k개를 고르는 방법의 수 (조합, nCk)를 구한다.
 * 로또 1등 확률의 분모가 바로 45C6 = 8,145,060 이다.
 *
 * 계산 방법: nCk = (n × (n-1) × ... × (n-k+1)) ÷ (1 × 2 × ... × k)
 * 곱하면서 바로바로 나누면 중간 값이 너무 커지지 않는다.
 *
 * @param {number} n 전체 개수 (45)
 * @param {number} k 고르는 개수 (6)
 * @returns {number}
 */
function combination(n, k) {
  /** 지금까지 계산한 값 */
  let result = 1;
  for (let i = 1; i <= k; i++) {
    result = result * (n - k + i) / i;
  }
  return Math.round(result); // 소수 계산 오차를 없애려고 반올림
}

/**
 * "과거에 많이 나온 번호가 앞으로도 많이 나올까?"를 실제 데이터로 확인한다.
 *
 * 방법: 전체 회차를 앞쪽 절반과 뒤쪽 절반으로 나눈다.
 *       앞쪽 절반에서 가장 많이 나온 번호 10개를 고른 뒤,
 *       그 10개가 뒤쪽 절반에서는 평균 몇 번씩 나왔는지 본다.
 *       이 값이 뒤쪽 절반 전체 평균보다 뚜렷하게 높지 않다면,
 *       "많이 나온 번호"로 다음 번호를 맞힐 수 없다는 뜻이다.
 *
 * @param {Array[]} draws LOTTO_DRAWS
 * @returns {{half: number, firstTop: number[], laterOfTop: number, laterAll: number}}
 *   half       : 앞쪽 절반의 회차 수 (예: 624)
 *   firstTop   : 앞쪽 절반에서 가장 많이 나온 번호 10개
 *   laterOfTop : 그 10개 번호가 뒤쪽 절반에서 나온 평균 횟수
 *   laterAll   : 뒤쪽 절반에서 번호 하나가 나온 평균 횟수 (비교 기준)
 */
function checkHotNumbersLater(draws) {
  /** 앞쪽 절반의 회차 수 */
  const half = Math.floor(draws.length / 2);

  /** 앞쪽 절반, 뒤쪽 절반 각각의 번호별 출현 횟수 */
  const firstCounts = countNumbers(draws.slice(0, half));
  const laterCounts = countNumbers(draws.slice(half));

  /** 앞쪽 절반에서 가장 많이 나온 번호 10개 */
  const firstTop = rankNumbers(firstCounts).slice(0, HOT_CHECK_COUNT);

  /** 그 10개가 뒤쪽 절반에서 나온 횟수의 평균 */
  const laterOfTop = getAverage(firstTop.map(function (n) { return laterCounts[n]; }));

  /** 뒤쪽 절반 전체 평균 = (뒤쪽 회차 수 × 6개) ÷ 45개 번호 */
  const laterAll = (draws.length - half) * PICK_COUNT / MAX_NUMBER;

  return { half: half, firstTop: firstTop, laterOfTop: laterOfTop, laterAll: laterAll };
}

/**
 * 역대 당첨번호 전체를 분석해 화면과 번호 뽑기에 필요한 값을 한꺼번에 만든다.
 *
 * @param {Array[]} draws LOTTO_DRAWS
 * @returns {object} 분석 결과
 *   counts     : 번호별 출현 횟수 (counts[n])
 *   ranking    : 많이 나온 순서로 줄 세운 번호 45개
 *   drawTotal  : 분석한 회차 수
 *   average    : 번호 하나가 나온 평균 횟수 (회차 수 × 6 ÷ 45)
 *   maxCount   : 가장 많이 나온 번호의 횟수
 *   minCount   : 가장 적게 나온 번호의 횟수
 *   firstDraw  : 첫 회차 데이터 한 줄
 *   lastDraw   : 마지막(최근) 회차 데이터 한 줄
 *   hotLater   : checkHotNumbersLater()의 결과
 *   totalCombos: 번호 6개를 고르는 모든 경우의 수 (45C6)
 */
function analyzeDraws(draws) {
  const counts = countNumbers(draws);
  const ranking = rankNumbers(counts);

  return {
    counts: counts,
    ranking: ranking,
    drawTotal: draws.length,
    average: draws.length * PICK_COUNT / MAX_NUMBER,
    maxCount: counts[ranking[0]],
    minCount: counts[ranking[ranking.length - 1]],
    firstDraw: draws[0],
    lastDraw: draws[draws.length - 1],
    hotLater: checkHotNumbersLater(draws),
    totalCombos: combination(MAX_NUMBER, PICK_COUNT)
  };
}


/* ---------------------------------------------------------
   4. 분석 카드 그리기
   --------------------------------------------------------- */

/**
 * "역대 당첨번호 분석" 카드 전체를 채운다. lotto.js의 시작 부분에서 한 번 부른다.
 * @param {object} stats analyzeDraws()의 결과
 */
function renderStats(stats) {
  // 분석 범위 한 줄 설명
  document.getElementById('statsRange').textContent =
    stats.firstDraw[0] + '회(' + formatDate(stats.firstDraw[1]) + ') ~ ' +
    stats.lastDraw[0] + '회(' + formatDate(stats.lastDraw[1]) + '), ' +
    '총 ' + formatNumber(stats.drawTotal) + '번 추첨의 당첨번호(보너스 제외)를 셌어요.';

  // 많이 나온 번호 6개 (많은 순), 적게 나온 번호 6개 (적은 순)
  renderRankBalls(document.getElementById('topBalls'), stats.ranking.slice(0, RANK_SHOW_COUNT), stats.counts);
  renderRankBalls(document.getElementById('bottomBalls'), stats.ranking.slice(-RANK_SHOW_COUNT).reverse(), stats.counts);

  // 차트 범례의 평균 값
  document.getElementById('legendAvg').textContent = '평균 ' + stats.average.toFixed(1) + '회';

  renderChart(stats);
  renderTable(stats);
  renderNote(stats);
}

/**
 * 번호 목록을 공 모양으로 한 줄 그린다. 공 아래에는 출현 횟수를 적는다.
 * @param {HTMLElement} box     공을 넣을 상자
 * @param {number[]}    numbers 그릴 번호들 (이 순서 그대로 그림)
 * @param {number[]}    counts  번호별 출현 횟수
 */
function renderRankBalls(box, numbers, counts) {
  box.innerHTML = '';
  numbers.forEach(function (number) {
    // createBallSlot()은 lotto.js에 있는 공 만들기 함수 (번호 생성기와 같은 공을 씀)
    box.appendChild(createBallSlot(number, { caption: counts[number] + '회' }));
  });
}

/**
 * 번호별 출현 횟수 표(차트와 같은 내용을 글자로)를 채운다.
 * 차트의 말풍선을 못 쓰는 환경(키보드, 화면 낭독기)에서도 모든 값을 볼 수 있게 하는 용도.
 * @param {object} stats
 */
function renderTable(stats) {
  /** 표의 본문 <tbody> */
  const body = document.getElementById('statsTable');
  body.innerHTML = '';

  for (let n = MIN_NUMBER; n <= MAX_NUMBER; n++) {
    /** 평균과의 차이 (양수면 평균보다 많이 나옴) */
    const diff = stats.counts[n] - stats.average;

    const row = document.createElement('tr');
    [n + '번', stats.counts[n] + '회', (diff > 0 ? '+' : '') + diff.toFixed(1)].forEach(function (text) {
      const cell = document.createElement('td');
      cell.textContent = text;
      row.appendChild(cell);
    });
    body.appendChild(row);
  }
}

/**
 * "알아 두세요" 상자에 분석 결과로 알 수 있는 사실을 적는다.
 * 숫자는 모두 데이터에서 계산한 값이라, 회차가 추가되면 문장도 따라 바뀐다.
 * @param {object} stats
 */
function renderNote(stats) {
  /** 가장 많이/적게 나온 번호 */
  const most = stats.ranking[0];
  const least = stats.ranking[stats.ranking.length - 1];
  /** 앞쪽·뒤쪽 절반 비교 결과 */
  const hot = stats.hotLater;

  /** 상자에 들어갈 문장들 (한 줄 = 한 항목) */
  const lines = [
    '번호마다 나온 횟수는 가장 적은 ' + least + '번 ' + stats.minCount + '회부터 가장 많은 ' +
      most + '번 ' + stats.maxCount + '회까지로, 평균 ' + stats.average.toFixed(1) + '회 근처에 고르게 모여 있어요.',

    '1~' + formatNumber(hot.half) + '회에서 가장 많이 나온 번호 ' + HOT_CHECK_COUNT + '개는 ' +
      formatNumber(hot.half + 1) + '~' + formatNumber(stats.drawTotal) + '회에서 평균 ' +
      hot.laterOfTop.toFixed(1) + '회 나왔어요. 같은 기간 전체 평균(' + hot.laterAll.toFixed(1) + '회)보다 ' +
      (hot.laterOfTop <= hot.laterAll ? '오히려 적어요.' : '조금 많았어요.'),

    '추첨은 매번 처음부터 새로 하기 때문에, 과거에 많이 나온 번호가 다음에 더 잘 나오지는 않아요. ' +
      '어떤 번호 6개를 골라도 1등 확률은 똑같이 ' + formatNumber(stats.totalCombos) + '분의 1이에요.'
  ];

  /** 문장을 담을 목록 <ul> */
  const list = document.getElementById('statsNote');
  list.innerHTML = '';
  lines.forEach(function (text) {
    const item = document.createElement('li');
    item.textContent = text;
    list.appendChild(item);
  });
}


/* ---------------------------------------------------------
   5. 번호별 출현 횟수 차트 (막대 45개)
   --------------------------------------------------------- */

/** 차트가 그리고 있는 분석 결과. 말풍선을 띄울 때 횟수를 찾으려고 보관해 둔다. */
let chartStats = null;

/** 지금 말풍선이 가리키고 있는 번호 (없으면 null) */
let activeNumber = null;

/**
 * 막대 차트를 그리고, 마우스/손가락/키보드로 막대를 짚으면 말풍선이 뜨게 연결한다.
 *
 * 구조 (lotto.html 참고)
 *   chartY    : 왼쪽 세로축 눈금 글씨 (0, 50, 100 ...)
 *   chartPlot : 막대가 그려지는 영역
 *     chartGrid : 가로 격자선
 *     chartBars : 막대 45개
 *     chartAvg  : 평균 가로선
 *     chartTip  : 말풍선
 *   chartX    : 아래 가로축 번호 글씨 (1, 5, 10 ...)
 *
 * @param {object} stats
 */
function renderChart(stats) {
  chartStats = stats;

  const yAxis = document.getElementById('chartY');
  const xAxis = document.getElementById('chartX');
  const plot = document.getElementById('chartPlot');
  const grid = document.getElementById('chartGrid');
  const bars = document.getElementById('chartBars');
  const avgLine = document.getElementById('chartAvg');

  /** 세로축의 맨 위 값. 가장 큰 횟수를 50 단위로 올림한다. (187 → 200) */
  const yMax = Math.ceil(stats.maxCount / Y_TICK_STEP) * Y_TICK_STEP;

  /** 많이 나온 TOP 6 번호 모음. 이 번호의 막대만 진한 색으로 칠한다. */
  const topSet = new Set(stats.ranking.slice(0, RANK_SHOW_COUNT));

  // (1) 세로축 눈금 글씨와 가로 격자선
  yAxis.innerHTML = '';
  grid.innerHTML = '';
  for (let value = 0; value <= yMax; value += Y_TICK_STEP) {
    /** 이 눈금이 바닥에서 몇 % 높이에 있는지 */
    const percent = value / yMax * 100;

    const label = document.createElement('span');
    label.textContent = value;
    label.style.bottom = percent + '%';
    yAxis.appendChild(label);

    // 0 자리에는 바닥 축선이 이미 있으므로 격자선을 따로 긋지 않는다
    if (value > 0) {
      const line = document.createElement('div');
      line.className = 'chart-gridline';
      line.style.bottom = percent + '%';
      grid.appendChild(line);
    }
  }

  // (2) 막대 45개. 높이 = 출현 횟수 ÷ 세로축 맨 위 값
  bars.innerHTML = '';
  for (let n = MIN_NUMBER; n <= MAX_NUMBER; n++) {
    const bar = document.createElement('div');
    bar.className = topSet.has(n) ? 'chart-bar top' : 'chart-bar';
    bar.style.height = (stats.counts[n] / yMax * 100) + '%';
    bars.appendChild(bar);
  }

  // (3) 평균 가로선
  avgLine.style.bottom = (stats.average / yMax * 100) + '%';

  // (4) 가로축 번호 글씨. 막대 한 칸의 가운데에 오도록 (번호 - 0.5) 칸 위치에 놓는다.
  xAxis.innerHTML = '';
  X_LABELS.forEach(function (n) {
    const label = document.createElement('span');
    label.textContent = n;
    label.style.left = ((n - 0.5) / MAX_NUMBER * 100) + '%';
    xAxis.appendChild(label);
  });

  // (5) 말풍선 연결
  // 마우스를 움직이거나 손가락으로 누르면 → 그 위치의 번호를 짚음
  plot.addEventListener('pointermove', function (event) { showChartTip(numberFromPointer(event)); });
  plot.addEventListener('pointerdown', function (event) { showChartTip(numberFromPointer(event)); });
  // 마우스가 차트 밖으로 나가면 말풍선을 닫음 (손가락은 뗀 뒤에도 값을 읽을 수 있게 남겨 둠)
  plot.addEventListener('pointerleave', function (event) {
    if (event.pointerType === 'mouse' && document.activeElement !== plot) hideChartTip();
  });
  // 키보드: Tab으로 차트에 들어오면 말풍선을 띄우고, 화살표로 번호를 옮긴다
  plot.addEventListener('focus', function () { showChartTip(activeNumber || MIN_NUMBER); });
  plot.addEventListener('blur', hideChartTip);
  plot.addEventListener('keydown', handleChartKey);
}

/**
 * 마우스/손가락이 차트의 어느 번호 위에 있는지 계산한다.
 * 차트 폭을 45칸으로 나눠, 포인터의 가로 위치가 몇 번째 칸인지 본다.
 * (막대가 아주 가늘어도 칸 전체가 짚는 범위라서 쉽게 짚을 수 있음)
 *
 * @param {PointerEvent} event
 * @returns {number} 1 ~ 45
 */
function numberFromPointer(event) {
  /** 차트 영역의 화면상 위치와 크기 */
  const rect = document.getElementById('chartPlot').getBoundingClientRect();
  /** 차트 왼쪽 끝에서 포인터까지의 거리(px) */
  const x = event.clientX - rect.left;
  /** 몇 번째 칸인지 (1부터) */
  const number = Math.floor(x / rect.width * MAX_NUMBER) + 1;

  // 차트 가장자리에서 1보다 작거나 45보다 커지는 것을 막음
  return Math.min(Math.max(number, MIN_NUMBER), MAX_NUMBER);
}

/**
 * 차트에서 키보드를 눌렀을 때: ← → 로 한 칸씩, Home/End로 맨 앞/맨 뒤, Esc로 닫기
 * @param {KeyboardEvent} event
 */
function handleChartKey(event) {
  /** 지금 가리키는 번호 (없으면 1번부터) */
  const current = activeNumber || MIN_NUMBER;
  /** 키에 따라 새로 가리킬 번호 */
  let next = null;

  if (event.key === 'ArrowLeft') next = Math.max(current - 1, MIN_NUMBER);
  else if (event.key === 'ArrowRight') next = Math.min(current + 1, MAX_NUMBER);
  else if (event.key === 'Home') next = MIN_NUMBER;
  else if (event.key === 'End') next = MAX_NUMBER;
  else if (event.key === 'Escape') { hideChartTip(); return; }
  else return; // 다른 키(Tab 등)는 원래 동작 그대로

  event.preventDefault(); // 화살표 키로 페이지가 스크롤되지 않게 막음
  showChartTip(next);
}

/**
 * 한 번호의 막대를 강조하고, 그 위에 "OO회 / O번 · 평균보다 +O" 말풍선을 띄운다.
 * @param {number} number 1 ~ 45
 */
function showChartTip(number) {
  const plot = document.getElementById('chartPlot');
  const bars = document.getElementById('chartBars');
  const tip = document.getElementById('chartTip');

  activeNumber = number;

  // 짚은 막대만 또렷하게, 나머지는 흐리게
  bars.classList.add('hovering');
  Array.from(bars.children).forEach(function (bar, index) {
    bar.classList.toggle('active', index + 1 === number);
  });

  /** 짚은 번호의 횟수와 평균과의 차이 */
  const count = chartStats.counts[number];
  const diff = count - chartStats.average;

  // 말풍선 내용: 값(굵게)이 먼저, 설명이 뒤에
  const value = document.createElement('strong');
  value.textContent = count + '회';
  const label = document.createElement('span');
  label.textContent = number + '번 · 평균보다 ' + (diff > 0 ? '+' : '') + diff.toFixed(1);
  tip.replaceChildren(value, label);
  tip.hidden = false;

  // 말풍선 위치: 막대 한가운데. 단, 차트 양 끝 밖으로 삐져나가지 않게 안쪽으로 당긴다.
  /** 차트 영역의 폭(px) */
  const width = plot.clientWidth;
  /** 막대 가운데의 가로 위치(px) */
  const center = (number - 0.5) / MAX_NUMBER * width;
  /** 말풍선 폭의 절반(px) */
  const half = tip.offsetWidth / 2;
  tip.style.left = Math.min(Math.max(center, half), width - half) + 'px';
}

/**
 * 말풍선을 닫고 막대 강조를 원래대로 돌린다.
 */
function hideChartTip() {
  const bars = document.getElementById('chartBars');
  activeNumber = null;
  bars.classList.remove('hovering');
  Array.from(bars.children).forEach(function (bar) { bar.classList.remove('active'); });
  document.getElementById('chartTip').hidden = true;
}
