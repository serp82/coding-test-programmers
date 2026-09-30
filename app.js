(() => {
  "use strict";

  const STORAGE_KEY = "coding-test-revision-tracker-v1";
  const FIRST_ROUND_STORAGE_KEY = "coding-test-revision-tracker-first-round-v1";
  const DEPLOY_SETTINGS_KEY = "coding-test-revision-tracker-deploy-settings-v1";
  const BACKUP_FORMAT = "coding-test-revision-tracker-backup";
  const FIRST_ROUND_FORMAT = "coding-test-revision-tracker-first-round";
  const FILTERS = ["all", "incomplete", "review", "new"];
  const FILTER_LABELS = {
    all: "전체",
    incomplete: "미완료",
    review: "복습",
    new: "신규",
  };

  const DAY_DATA = [
    {
      id: 1,
      title: "그리디",
      goals: ["정렬", "현재 시점의 최선 선택", "투 포인터", "스택 기반 그리디"],
      problems: [
        { id: "gym-clothes", title: "체육복", type: "review", level: "Lv.1" },
        { id: "lifeboat", title: "구명보트", type: "review", level: "Lv.2" },
        { id: "make-big-number", title: "큰 수 만들기", type: "review", level: "Lv.2" },
        { id: "joystick", title: "조이스틱", type: "new", level: "Lv.2" },
      ],
    },
    {
      id: 2,
      title: "BFS",
      goals: ["queue", "현재 상태 → 다음 상태", "방문 조건", "방문 처리", "거리 계산", "최단거리"],
      problems: [
        { id: "game-map-shortest", title: "게임 맵 최단거리", type: "review", level: "Lv.2" },
        { id: "maze-escape", title: "미로 탈출", type: "new", level: "Lv.2" },
        { id: "ricochet-robot", title: "리코쳇 로봇", type: "new", level: "Lv.2" },
      ],
    },
    {
      id: 3,
      title: "스택 / 큐",
      goals: ["stack / queue 선택", "FIFO / LIFO", "시간 흐름 시뮬레이션", "현재 값과 이전 상태 비교", "deque"],
      problems: [
        { id: "feature-development", title: "기능개발", type: "review", level: "Lv.2" },
        { id: "truck-bridge", title: "다리를 지나는 트럭", type: "review", level: "Lv.2" },
        { id: "stock-price", title: "주식가격", type: "new", level: "Lv.2" },
      ],
    },
    {
      id: 4,
      title: "해시",
      goals: ["dict", "set", "Counter", "빈도 저장", "중복 제거", "빠른 조회"],
      problems: [
        { id: "camouflage", title: "의상", type: "review", level: "Lv.2" },
        { id: "report-results", title: "신고 결과 받기", type: "review", level: "Lv.1" },
        { id: "roll-cake", title: "롤케이크 자르기", type: "new", level: "Lv.2" },
      ],
    },
    {
      id: 5,
      title: "완전탐색",
      goals: ["모든 경우 탐색", "combinations", "permutations", "product", "경우 생성과 평가 분리"],
      problems: [
        { id: "fatigue", title: "피로도", type: "review", level: "Lv.2" },
        { id: "find-prime", title: "소수 찾기", type: "review", level: "Lv.2" },
        { id: "split-power-grid", title: "전력망을 둘로 나누기", type: "new", level: "Lv.2" },
      ],
    },
    {
      id: 6,
      title: "구현",
      goals: ["문제 조건 그대로 구현", "문자열 parsing", "상태 관리", "예외 처리", "날짜/시간 계산"],
      problems: [
        { id: "privacy-period", title: "개인정보 수집 유효기간", type: "review", level: "Lv.1" },
        { id: "open-chat", title: "오픈채팅방", type: "review", level: "Lv.2" },
        { id: "parking-fee", title: "주차 요금 계산", type: "new", level: "Lv.2" },
      ],
    },
    {
      id: 7,
      title: "DFS",
      goals: ["상태 정의", "선택", "재귀 호출", "종료 조건", "visited", "그래프 탐색"],
      problems: [
        { id: "target-number", title: "타겟 넘버", type: "review", level: "Lv.2" },
        { id: "network", title: "네트워크", type: "new", level: "Lv.3" },
      ],
    },
  ];

  const ALL_PROBLEMS = DAY_DATA.flatMap((day) =>
    day.problems.map((problem) => ({ ...problem, dayId: day.id, dayTitle: day.title }))
  );
  const PROBLEM_BY_ID = Object.fromEntries(ALL_PROBLEMS.map((problem) => [problem.id, problem]));
  const TOTAL_COUNT = ALL_PROBLEMS.length;
  const PROGRAMMERS_LESSON_IDS = {
    "gym-clothes": "42862",
    lifeboat: "42885",
    "make-big-number": "42883",
    joystick: "42860",
    "game-map-shortest": "1844",
    "maze-escape": "159993",
    "ricochet-robot": "169199",
    "feature-development": "42586",
    "truck-bridge": "42583",
    "stock-price": "42584",
    camouflage: "42578",
    "report-results": "92334",
    "roll-cake": "132265",
    fatigue: "87946",
    "find-prime": "42839",
    "split-power-grid": "86971",
    "privacy-period": "150370",
    "open-chat": "42888",
    "parking-fee": "92341",
    "target-number": "43165",
    network: "43162",
  };

  let state = loadState();
  let toastTimer;
  let lastReport = "";
  const savedFirstRound = loadFirstRoundState();
  let firstRoundRecords = savedFirstRound.records;
  let firstRoundLoaded = savedFirstRound.loaded;

  const elements = {
    completedValue: document.getElementById("completedValue"),
    remainingValue: document.getElementById("remainingValue"),
    timeValue: document.getElementById("timeValue"),
    progressValue: document.getElementById("progressValue"),
    unresolvedValue: document.getElementById("unresolvedValue"),
    answerCount: document.getElementById("answerCount"),
    progressFill: document.getElementById("progressFill"),
    nextCard: document.getElementById("nextCard"),
    nextProblemTitle: document.getElementById("nextProblemTitle"),
    nextProblemMeta: document.getElementById("nextProblemMeta"),
    nextProblemButton: document.getElementById("nextProblemButton"),
    dayTabs: document.getElementById("dayTabs"),
    dayPanel: document.getElementById("dayPanel"),
    reportPanel: document.getElementById("reportPanel"),
    reportOutput: document.getElementById("reportOutput"),
    toast: document.getElementById("toast"),
    backupInput: document.getElementById("backupInput"),
    repositoryLocation: document.getElementById("repositoryLocation"),
    pagesSourceLocation: document.getElementById("pagesSourceLocation"),
    pagesUrlLocation: document.getElementById("pagesUrlLocation"),
  };

  let deploymentSettings = loadDeploymentSettings();

  function normalizeDeploymentSettings(value) {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      return { repositoryUrl: "", pagesSource: "", pagesUrl: "" };
    }
    return {
      repositoryUrl: typeof value.repositoryUrl === "string" ? value.repositoryUrl.slice(0, 300) : "",
      pagesSource: typeof value.pagesSource === "string" ? value.pagesSource.slice(0, 160) : "",
      pagesUrl: typeof value.pagesUrl === "string" ? value.pagesUrl.slice(0, 300) : "",
    };
  }

  function loadDeploymentSettings() {
    try {
      return normalizeDeploymentSettings(JSON.parse(localStorage.getItem(DEPLOY_SETTINGS_KEY) || "null"));
    } catch {
      return normalizeDeploymentSettings(null);
    }
  }

  function populateDeploymentSettings() {
    elements.repositoryLocation.value = deploymentSettings.repositoryUrl;
    elements.pagesSourceLocation.value = deploymentSettings.pagesSource;
    elements.pagesUrlLocation.value = deploymentSettings.pagesUrl;
  }

  function saveDeploymentSettings() {
    if (!elements.repositoryLocation.checkValidity() || !elements.pagesUrlLocation.checkValidity()) {
      showToast("저장소와 페이지 주소를 URL 형식으로 입력해주세요.", true);
      return;
    }

    deploymentSettings = normalizeDeploymentSettings({
      repositoryUrl: elements.repositoryLocation.value.trim(),
      pagesSource: elements.pagesSourceLocation.value.trim(),
      pagesUrl: elements.pagesUrlLocation.value.trim(),
    });
    try {
      localStorage.setItem(DEPLOY_SETTINGS_KEY, JSON.stringify(deploymentSettings));
      showToast("게시 위치 설정을 이 브라우저에 저장했습니다.");
    } catch {
      showToast("브라우저 저장이 제한되어 설정을 저장하지 못했습니다.", true);
    }
  }

  function createEmptyProgress() {
    return {
      done: false,
      minutes: "",
      hints: 0,
      answer: false,
      unresolved: false,
      memo: "",
    };
  }

  function createInitialState() {
    return {
      selectedDay: 1,
      filter: "all",
      problems: Object.fromEntries(ALL_PROBLEMS.map((problem) => [problem.id, createEmptyProgress()])),
    };
  }

  function loadState() {
    const initial = createInitialState();

    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      if (!stored || typeof stored !== "object") return initial;
      return normalizeStateSnapshot(stored);
    } catch {
      return initial;
    }
  }

  function normalizeStateSnapshot(stored) {
    const initial = createInitialState();
    if (!stored || typeof stored !== "object") return initial;
    const selectedDay = Number(stored.selectedDay);
    const problems = { ...initial.problems };

    for (const problem of ALL_PROBLEMS) {
      const saved = stored.problems?.[problem.id];
      if (!saved || typeof saved !== "object") continue;
      problems[problem.id] = {
        done: saved.done === true,
        minutes: normalizeMinutes(saved.minutes),
        hints: normalizeInteger(saved.hints),
        answer: saved.answer === true,
        unresolved: saved.unresolved === true,
        memo: typeof saved.memo === "string" ? saved.memo.slice(0, 160) : "",
      };
    }

    return {
      selectedDay: DAY_DATA.some((day) => day.id === selectedDay) ? selectedDay : 1,
      filter: FILTERS.includes(stored.filter) ? stored.filter : "all",
      problems,
    };
  }

  function normalizeInteger(value) {
    const number = Number(value);
    return Number.isFinite(number) && number > 0 ? Math.floor(number) : 0;
  }

  function normalizeMinutes(value) {
    if (value === "" || value === null || typeof value === "undefined") return "";
    const number = Number(value);
    return Number.isFinite(number) && number >= 0 ? String(Math.floor(number)) : "";
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Private browsing or a restricted browser can disable storage. The UI remains usable.
    }
  }

  function normalizeFirstRoundRecords(records) {
    if (!records || typeof records !== "object" || Array.isArray(records)) return {};
    return Object.fromEntries(Object.entries(records)
      .filter(([problemId, record]) => Boolean(PROBLEM_BY_ID[problemId]) && record && typeof record === "object")
      .map(([problemId, record]) => {
        const minutes = normalizeMinutes(record.minutes);
        return [problemId, {
          minutes: minutes === "" ? null : Number(minutes),
          hints: normalizeInteger(record.hints),
          answer: record.answer === true,
          note: typeof record.note === "string" ? record.note.slice(0, 240) : "",
        }];
      }));
  }

  function loadFirstRoundState() {
    try {
      const stored = JSON.parse(localStorage.getItem(FIRST_ROUND_STORAGE_KEY) || "null");
      if (!stored || typeof stored !== "object") return { records: {}, loaded: false };
      return {
        records: normalizeFirstRoundRecords(stored.records),
        loaded: stored.loaded === true,
      };
    } catch {
      return { records: {}, loaded: false };
    }
  }

  function saveFirstRoundState() {
    try {
      localStorage.setItem(FIRST_ROUND_STORAGE_KEY, JSON.stringify({
        records: firstRoundRecords,
        loaded: firstRoundLoaded,
      }));
    } catch {
      // The records remain available for this session when storage is unavailable.
    }
  }

  function getDay(dayId = state.selectedDay) {
    return DAY_DATA.find((day) => day.id === Number(dayId));
  }

  function getProgress(problemId) {
    return state.problems[problemId] || createEmptyProgress();
  }

  function getFilteredProblems(day, filter = state.filter) {
    return day.problems.filter((problem) => {
      if (filter === "incomplete") return !getProgress(problem.id).done;
      if (filter === "review" || filter === "new") return problem.type === filter;
      return true;
    });
  }

  function getFilterCount(day, filter) {
    return getFilteredProblems(day, filter).length;
  }

  function getSummary() {
    const progress = ALL_PROBLEMS.map((problem) => getProgress(problem.id));
    const completed = progress.filter((item) => item.done).length;
    const unresolved = progress.filter((item) => item.unresolved).length;
    const answers = progress.filter((item) => item.answer).length;
    const minutes = progress.reduce((sum, item) => sum + (Number(item.minutes) || 0), 0);
    const percent = Math.round((completed / TOTAL_COUNT) * 100);
    return { completed, unresolved, answers, minutes, percent, remaining: TOTAL_COUNT - completed };
  }

  function getNextProblem() {
    return ALL_PROBLEMS.find((problem) => !getProgress(problem.id).done) || null;
  }

  function render() {
    renderStats();
    renderNextProblem();
    renderDayTabs();
    renderDayPanel();
  }

  function renderStats() {
    const summary = getSummary();
    elements.completedValue.textContent = `${summary.completed}/${TOTAL_COUNT}`;
    elements.remainingValue.textContent = String(summary.remaining);
    elements.timeValue.textContent = `${summary.minutes}분`;
    elements.progressValue.textContent = `${summary.percent}%`;
    elements.unresolvedValue.textContent = `${summary.unresolved}개`;
    elements.answerCount.textContent = `답지 확인 ${summary.answers}개`;
    elements.progressFill.style.width = `${summary.percent}%`;
  }

  function renderNextProblem() {
    const next = getNextProblem();
    const isComplete = !next;
    elements.nextCard.classList.toggle("is-complete", isComplete);

    if (isComplete) {
      elements.nextProblemTitle.textContent = "🎉 2회차 완료";
      elements.nextProblemMeta.textContent = `${TOTAL_COUNT}/${TOTAL_COUNT} · 모든 문제를 완료했습니다.`;
      elements.nextProblemButton.disabled = true;
      elements.nextProblemButton.textContent = "전체 완료";
      return;
    }

    elements.nextProblemTitle.textContent = next.title;
    elements.nextProblemMeta.textContent = `Day ${next.dayId} · ${next.dayTitle} · ${next.level} · ${next.type === "review" ? "복습" : "신규"}`;
    elements.nextProblemButton.disabled = false;
    elements.nextProblemButton.innerHTML = '프로그래머스에서 풀기 <span aria-hidden="true">↗</span>';
  }

  function renderDayTabs() {
    elements.dayTabs.innerHTML = DAY_DATA.map((day) => {
      const completed = day.problems.filter((problem) => getProgress(problem.id).done).length;
      return `
        <button class="day-tab ${day.id === state.selectedDay ? "is-active" : ""}" type="button" data-day="${day.id}" aria-pressed="${day.id === state.selectedDay}">
          <span class="day-tab-label">DAY ${day.id}</span>
          <span class="day-tab-title">${escapeHtml(day.title)}</span>
          <span class="day-tab-count">${completed}/${day.problems.length} 완료</span>
        </button>
      `;
    }).join("");
  }

  function renderDayPanel() {
    const day = getDay();
    const completed = day.problems.filter((problem) => getProgress(problem.id).done).length;
    const filtered = getFilteredProblems(day);
    const filterControls = FILTERS.map((filter) => `
      <button class="filter-tab ${filter === state.filter ? "is-active" : ""}" type="button" data-filter="${filter}" aria-pressed="${filter === state.filter}">
        <span>${FILTER_LABELS[filter]}</span>
        <span class="filter-count">${getFilterCount(day, filter)}</span>
      </button>
    `).join("");
    const rows = filtered.length
      ? filtered.map((problem) => renderProblemRow(problem)).join("")
      : `
        <tr>
          <td class="empty-row" colspan="9">
            <strong>이 필터에 해당하는 문제가 없습니다.</strong>
            <span>다른 필터를 선택하거나 다음 Day로 이동해보세요.</span>
          </td>
        </tr>
      `;

    elements.dayPanel.innerHTML = `
      <div class="day-panel">
        <div class="day-panel-heading">
          <div>
            <span class="section-kicker">DAY ${day.id}</span>
            <h2 class="day-panel-title">${escapeHtml(day.title)} <span class="day-panel-count">(${completed}/${day.problems.length})</span></h2>
            <div class="day-goal-line">
              <span class="goal-label">이번 Day 목표</span>
              ${day.goals.map((goal) => `<span class="goal-chip">${escapeHtml(goal)}</span>`).join("")}
            </div>
          </div>
          <span class="storage-status">${filtered.length}개 표시 중</span>
        </div>

        <div class="filter-tabs" aria-label="문제 필터">
          ${filterControls}
        </div>

        <div class="table-scroll">
          <table class="problem-table">
            <caption class="sr-only">Day ${day.id} 문제 기록표</caption>
            <thead>
              <tr>
                <th scope="col">완료</th>
                <th scope="col">문제</th>
                <th scope="col">구분</th>
                <th scope="col">레벨</th>
                <th scope="col">풀이 시간</th>
                <th scope="col">힌트</th>
                <th scope="col">답지</th>
                <th scope="col">못 풂</th>
                <th scope="col">메모</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>

        <div class="day-navigation">
          <button class="nav-button" type="button" data-action="previous-day" ${day.id === 1 ? "disabled" : ""}>← 이전 Day</button>
          <button class="nav-button" type="button" data-action="next-day" ${day.id === DAY_DATA.length ? "disabled" : ""}>다음 Day →</button>
        </div>
      </div>
    `;
  }

  function renderProblemRow(problem) {
    const progress = getProgress(problem.id);
    const typeLabel = problem.type === "review" ? "복습" : "신규";
    const first = firstRoundRecords[problem.id] || null;
    const firstRecord = first
      ? `1회차: ${first.minutes === null ? "미기록" : `${first.minutes}분`} / 힌트 ${first.hints} / 답지 ${first.answer ? "O" : "X"}${first.note ? ` · ${first.note}` : ""}`
      : firstRoundLoaded ? "1회차 기록 없음" : "개인 1회차 백업을 불러오면 표시됩니다";

    return `
      <tr data-problem-id="${problem.id}" class="${progress.done ? "is-done" : ""}">
        <td>
          <label class="check-control" title="${escapeAttribute(`${problem.title} 완료 처리`)}">
            <input type="checkbox" data-action="done" data-problem-id="${problem.id}" ${progress.done ? "checked" : ""} aria-label="${escapeAttribute(`${problem.title} 완료`)}" />
            <span class="checkbox-mark" aria-hidden="true"></span>
          </label>
        </td>
        <td>
          <a class="problem-name problem-name-link" href="${getProgrammersUrl(problem.id)}" target="_blank" rel="noopener noreferrer" title="${escapeAttribute(`${problem.title} · 프로그래머스 문제 열기`)}">${escapeHtml(problem.title)}<span class="external-mark" aria-hidden="true">↗</span></a>
          <div class="problem-subline ${first ? "previous-record" : firstRoundLoaded ? "no-record" : "record-locked"}" title="${escapeAttribute(firstRecord)}">${escapeHtml(firstRecord)}</div>
        </td>
        <td><span class="type-badge ${problem.type === "review" ? "type-review" : "type-new"}">${typeLabel}</span></td>
        <td><span class="level-badge">${escapeHtml(problem.level)}</span></td>
        <td>
          <label class="time-control">
            <input class="time-input" type="number" min="0" step="1" inputmode="numeric" placeholder="0" value="${escapeAttribute(progress.minutes)}" data-action="minutes" data-problem-id="${problem.id}" aria-label="${escapeAttribute(`${problem.title} 풀이 시간`)}" />
            <span class="time-unit">분</span>
          </label>
        </td>
        <td>
          <div class="hint-stepper" aria-label="${escapeAttribute(`${problem.title} 힌트 횟수`)}">
            <button class="hint-button" type="button" data-action="hint-down" data-problem-id="${problem.id}" aria-label="힌트 1회 줄이기">−</button>
            <output class="hint-value" data-hint-value="${problem.id}">${progress.hints}</output>
            <button class="hint-button" type="button" data-action="hint-up" data-problem-id="${problem.id}" aria-label="힌트 1회 늘리기">+</button>
          </div>
        </td>
        <td>
          <label class="toggle-control">
            <input type="checkbox" data-action="answer" data-problem-id="${problem.id}" ${progress.answer ? "checked" : ""} aria-label="${escapeAttribute(`${problem.title} 답지 확인`)}" />
            <span class="toggle-track" aria-hidden="true"></span>
            <span class="toggle-label">${progress.answer ? "확인" : "미확인"}</span>
          </label>
        </td>
        <td>
          <label class="check-control">
            <input type="checkbox" data-action="unresolved" data-problem-id="${problem.id}" ${progress.unresolved ? "checked" : ""} aria-label="${escapeAttribute(`${problem.title} 못 풂 표시`)}" />
            <span class="checkbox-mark" aria-hidden="true"></span>
            <span class="unresolved-label">${progress.unresolved ? "예" : "아니요"}</span>
          </label>
        </td>
        <td>
          <input class="memo-input" type="text" maxlength="160" placeholder="메모 입력" value="${escapeAttribute(progress.memo)}" data-action="memo" data-problem-id="${problem.id}" aria-label="${escapeAttribute(`${problem.title} 메모`)}" />
        </td>
      </tr>
    `;
  }

  function refreshLiveSummary() {
    renderStats();
    renderNextProblem();
    renderDayTabs();
    updateDayMeta();
  }

  function updateDayMeta() {
    const day = getDay();
    const completed = day.problems.filter((problem) => getProgress(problem.id).done).length;
    const titleCount = elements.dayPanel.querySelector(".day-panel-count");
    const shownCount = elements.dayPanel.querySelector(".day-panel-heading .storage-status");
    if (titleCount) titleCount.textContent = `(${completed}/${day.problems.length})`;
    if (shownCount) shownCount.textContent = `${getFilteredProblems(day).length}개 표시 중`;

    elements.dayPanel.querySelectorAll(".filter-tab").forEach((button) => {
      const filter = button.dataset.filter;
      const count = button.querySelector(".filter-count");
      if (count) count.textContent = String(getFilterCount(day, filter));
    });
  }

  function setView({ dayId = state.selectedDay, filter = state.filter } = {}) {
    state.selectedDay = Number(dayId);
    state.filter = FILTERS.includes(filter) ? filter : "all";
    saveState();
    render();
  }

  function handleClick(event) {
    const dayButton = event.target.closest("[data-day]");
    if (dayButton) {
      setView({ dayId: Number(dayButton.dataset.day), filter: "all" });
      return;
    }

    const filterButton = event.target.closest("[data-filter]");
    if (filterButton) {
      setView({ filter: filterButton.dataset.filter });
      return;
    }

    const actionElement = event.target.closest("[data-action]");
    if (!actionElement) return;
    const action = actionElement.dataset.action;
    const problemId = actionElement.dataset.problemId;

    if (action === "hint-up" || action === "hint-down") {
      const progress = getProgress(problemId);
      progress.hints = Math.max(0, progress.hints + (action === "hint-up" ? 1 : -1));
      state.problems[problemId] = progress;
      const value = elements.dayPanel.querySelector(`[data-hint-value="${problemId}"]`);
      if (value) value.textContent = String(progress.hints);
      saveState();
      refreshLiveSummary();
      return;
    }

    if (action === "open-next") {
      openNextProblem();
      return;
    }

    if (action === "previous-day" || action === "next-day") {
      const offset = action === "previous-day" ? -1 : 1;
      const nextDayId = Math.min(DAY_DATA.length, Math.max(1, state.selectedDay + offset));
      setView({ dayId: nextDayId, filter: "all" });
      elements.dayPanel.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    if (action === "copy-current") {
      copyReport(buildCurrentReport(), "현재 진행 상황을 복사했습니다.");
      return;
    }

    if (action === "copy-full" || action === "copy-report") {
      copyReport(action === "copy-full" ? buildFullReport() : lastReport, "전체 기록을 복사했습니다.");
      return;
    }

    if (action === "backup-export") {
      downloadBackup();
      return;
    }

    if (action === "backup-import") {
      elements.backupInput.click();
      return;
    }

    if (action === "save-deploy-settings") {
      saveDeploymentSettings();
      return;
    }

    if (action === "reset") {
      resetProgress();
    }
  }

  function handleChange(event) {
    const input = event.target.closest("[data-action]");
    if (!input) return;
    if (input.dataset.action === "restore-file") {
      const file = input.files?.[0];
      if (file) {
        void importBackupFile(file).finally(() => {
          input.value = "";
        });
      }
      return;
    }

    const problemId = input.dataset.problemId;
    if (!problemId) return;
    const progress = getProgress(problemId);

    if (input.dataset.action === "done") progress.done = input.checked;
    if (input.dataset.action === "answer") progress.answer = input.checked;
    if (input.dataset.action === "unresolved") progress.unresolved = input.checked;
    state.problems[problemId] = progress;
    saveState();

    if (input.dataset.action === "answer") {
      const label = input.parentElement.querySelector(".toggle-label");
      if (label) label.textContent = input.checked ? "확인" : "미확인";
    }
    if (input.dataset.action === "unresolved") {
      const label = input.parentElement.querySelector(".unresolved-label");
      if (label) label.textContent = input.checked ? "예" : "아니요";
    }

    if (input.dataset.action === "done") {
      const row = input.closest("tr");
      if (row) row.classList.toggle("is-done", input.checked);
    }
    refreshLiveSummary();
  }

  function handleInput(event) {
    const input = event.target.closest("[data-action]");
    if (!input) return;
    const problemId = input.dataset.problemId;
    if (!problemId) return;
    const progress = getProgress(problemId);

    if (input.dataset.action === "minutes") {
      progress.minutes = normalizeMinutes(input.value);
      if (input.value !== "" && input.value !== progress.minutes) input.value = progress.minutes;
    }
    if (input.dataset.action === "memo") progress.memo = input.value;
    state.problems[problemId] = progress;
    saveState();
    renderStats();
  }

  function handleBlur(event) {
    const input = event.target.closest('[data-action="minutes"]');
    if (!input) return;
    const progress = getProgress(input.dataset.problemId);
    input.value = progress.minutes;
  }

  function getProgrammersUrl(problemId) {
    const lessonId = PROGRAMMERS_LESSON_IDS[problemId];
    return `https://school.programmers.co.kr/learn/courses/30/lessons/${lessonId}`;
  }

  function openNextProblem() {
    const next = getNextProblem();
    if (!next) return;
    window.open(getProgrammersUrl(next.id), "_blank", "noopener,noreferrer");
  }

  function buildLine(day, problem) {
    const progress = getProgress(problem.id);
    const time = progress.minutes === "" ? "미기록" : `${progress.minutes}분`;
    const memo = progress.memo.trim();
    return `Day ${day.id} | ${problem.title} | ${problem.type === "review" ? "복습" : "신규"} | ${problem.level} | ${progress.done ? "완료" : "미완료"} | 풀이시간: ${time} | 힌트: ${progress.hints}회 | 답지: ${progress.answer ? "확인" : "미확인"} | 못 풀었음: ${progress.unresolved ? "예" : "아니요"} | 메모: ${memo}`;
  }

  function buildHeader() {
    const summary = getSummary();
    const next = getNextProblem();
    return [
      "2회차 코딩테스트 진행 상황을 아래 기록으로 갱신해줘.",
      `선택 Day: ${state.selectedDay}`,
      `전체 진행률: ${summary.completed}/${TOTAL_COUNT} (${summary.percent}%)`,
      `기록된 풀이 시간: ${summary.minutes}분`,
      `미해결 표시: ${summary.unresolved}개`,
      `다음 문제: ${next ? next.title : "🎉 2회차 완료"}`,
    ].join("\n");
  }

  function buildCurrentReport() {
    const day = getDay();
    return `${buildHeader()}\n\n${day.problems.map((problem) => buildLine(day, problem)).join("\n")}`;
  }

  function buildFullReport() {
    return `${buildHeader()}\n\n${DAY_DATA.flatMap((day) => day.problems.map((problem) => buildLine(day, problem))).join("\n")}`;
  }

  async function copyReport(report, message) {
    if (!report) return;
    lastReport = report;
    elements.reportOutput.value = report;
    elements.reportPanel.hidden = false;

    let copied = false;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(report);
        copied = true;
      }
    } catch {
      copied = false;
    }

    if (!copied) {
      elements.reportOutput.focus();
      elements.reportOutput.select();
      try {
        copied = document.execCommand("copy");
      } catch {
        copied = false;
      }
      elements.reportOutput.setSelectionRange(0, 0);
    }

    showToast(copied ? message : "기록을 만들었습니다. 아래 텍스트를 직접 복사해주세요.", !copied);
  }

  function resetProgress() {
    const confirmed = window.confirm("2회차의 모든 기록을 초기 상태로 되돌릴까요?");
    if (!confirmed) return;
    state = createInitialState();
    lastReport = "";
    saveState();
    elements.reportPanel.hidden = true;
    render();
    showToast("모든 기록을 초기화했습니다.");
  }

  function showToast(message, isError = false) {
    window.clearTimeout(toastTimer);
    elements.toast.textContent = message;
    elements.toast.classList.toggle("is-error", isError);
    elements.toast.classList.add("is-visible");
    toastTimer = window.setTimeout(() => elements.toast.classList.remove("is-visible"), 2600);
  }

  function downloadBackup() {
    const backup = {
      format: BACKUP_FORMAT,
      version: 1,
      exportedAt: new Date().toISOString(),
      state,
      firstRoundLoaded,
      firstRoundRecords,
      deploymentSettings,
    };
    const contents = JSON.stringify(backup, null, 2);
    const blob = new Blob([contents], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `coding-test-revision-tracker-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    showToast("개인 백업 파일을 저장했습니다.");
  }

  async function importBackupFile(file) {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      showToast("백업 파일이 너무 큽니다. 5MB 이하 파일을 선택해주세요.", true);
      return;
    }

    let imported;
    try {
      imported = JSON.parse(await file.text());
    } catch {
      showToast("JSON 백업 파일을 읽지 못했습니다.", true);
      return;
    }

    if (imported?.version !== 1) {
      showToast("지원하지 않는 백업 파일 형식입니다.", true);
      return;
    }

    if (imported.format === FIRST_ROUND_FORMAT) {
      const records = normalizeFirstRoundRecords(imported.records);
      if (!Object.keys(records).length) {
        showToast("파일에서 1회차 기록을 찾지 못했습니다.", true);
        return;
      }
      if (firstRoundLoaded && !window.confirm("이 브라우저의 기존 1회차 기록을 선택한 파일의 내용으로 바꿀까요?")) return;
      firstRoundRecords = records;
      firstRoundLoaded = true;
      saveFirstRoundState();
      render();
      showToast("1회차 개인 기록을 불러왔습니다.");
      return;
    }

    if (imported.format !== BACKUP_FORMAT || !imported.state || typeof imported.state !== "object") {
      showToast("올바른 학습표 백업 파일이 아닙니다.", true);
      return;
    }

    if (!window.confirm("현재 브라우저의 2회차 기록과 1회차 기록을 이 백업 파일 내용으로 바꿀까요?")) return;
    state = normalizeStateSnapshot(imported.state);
    firstRoundRecords = normalizeFirstRoundRecords(imported.firstRoundRecords);
    firstRoundLoaded = imported.firstRoundLoaded === true || Object.keys(firstRoundRecords).length > 0;
    if (Object.prototype.hasOwnProperty.call(imported, "deploymentSettings")) {
      deploymentSettings = normalizeDeploymentSettings(imported.deploymentSettings);
      try {
        localStorage.setItem(DEPLOY_SETTINGS_KEY, JSON.stringify(deploymentSettings));
      } catch {
        // Existing settings remain usable for this session when storage is unavailable.
      }
      populateDeploymentSettings();
    }
    lastReport = "";
    saveState();
    saveFirstRoundState();
    elements.reportPanel.hidden = true;
    render();
    showToast("백업 기록을 이 브라우저에 복원했습니다.");
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function escapeAttribute(value) {
    return escapeHtml(value);
  }

  document.addEventListener("click", handleClick);
  document.addEventListener("change", handleChange);
  document.addEventListener("input", handleInput);
  document.addEventListener("focusout", handleBlur);

  populateDeploymentSettings();
  render();
})();

