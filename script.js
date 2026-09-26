// script.js - Baseball Scorekeeper with Dynamic Themes, Share Menu & Smooth Animations

document.addEventListener('DOMContentLoaded', () => {
  // Game State
  let homeScoreVal = 4;
  let awayScoreVal = 0;
  let currentInning = 1;
  let isTopInning = true;
  let currentOuts = 0;
  let homeTeamName = 'Home';
  let awayTeamName = 'Away';
  let selectedShareFormat = 'basic';

  // Box Score & Match Stats State
  let inningRuns = {
    home: [4, 0, 0, 0, 0, 0, 0, 0, 0],
    away: [0, 0, 0, 0, 0, 0, 0, 0, 0]
  };
  let teamHits = { home: 0, away: 0 };
  let teamErrors = { home: 0, away: 0 };
  let isGameFinal = false;

  // Timer State
  let secondsElapsed = 0;
  let isTimerRunning = true;
  let timerInterval = null;

  // DOM Elements - Scores & Teams
  const homeScoreEl = document.getElementById('home-score');
  const awayScoreEl = document.getElementById('away-score');
  const homeLabelEl = document.getElementById('home-label');
  const awayLabelEl = document.getElementById('away-label');
  const teamLabelsContainer = document.getElementById('team-labels-container');
  const battingUnderline = document.getElementById('batting-underline');

  // DOM Elements - Compact Timer
  const timerDisplay = document.getElementById('timer-display');
  const timerEl = document.getElementById('timer');
  const timerIcon = document.getElementById('timer-icon');

  // DOM Elements - Inning & Half Arrows
  const inningValEl = document.getElementById('inning-val');
  const inningUpBtn = document.getElementById('inning-up');
  const inningDownBtn = document.getElementById('inning-down');
  const inningContainer = document.getElementById('inning-container');

  // DOM Elements - Outs Tracker
  const outsContainer = document.getElementById('outs-container');
  const outCircles = document.querySelectorAll('.out-circle');

  // DOM Elements - Settings Modal & Drawer
  const settingsBtn = document.getElementById('settings-btn');
  const settingsBackdrop = document.getElementById('settings-backdrop');
  const closeSettingsBtn = document.getElementById('close-settings-btn');
  const themeCards = document.querySelectorAll('.theme-card');
  const homeNameInput = document.getElementById('home-name-input');
  const awayNameInput = document.getElementById('away-name-input');
  const modalTimerToggleBtn = document.getElementById('modal-timer-toggle-btn');
  const modalTimerResetBtn = document.getElementById('modal-timer-reset-btn');
  const modalTimerIcon = document.getElementById('modal-timer-icon');
  const modalTimerText = document.getElementById('modal-timer-text');
  const clearRunsBtn = document.getElementById('clear-runs-btn');
  const resetGameBtn = document.getElementById('reset-game-btn');

  // DOM Elements - Share Modal & Drawer
  const shareBtn = document.getElementById('share-btn');
  const shareBackdrop = document.getElementById('share-backdrop');
  const closeShareBtn = document.getElementById('close-share-btn');
  const summaryCards = document.querySelectorAll('.summary-card');
  const sharePreviewText = document.getElementById('share-preview-text');
  const copyPreviewBtn = document.getElementById('copy-preview-btn');
  const shareNativeBtn = document.getElementById('share-native-btn');
  const shareSmsBtn = document.getElementById('share-sms-btn');
  const shareWhatsappBtn = document.getElementById('share-whatsapp-btn');
  const shareTwitterBtn = document.getElementById('share-twitter-btn');
  const shareEmailBtn = document.getElementById('share-email-btn');
  const shareCopyBtn = document.getElementById('share-copy-btn');

  // Timeouts
  let sideChangeTimeout = null;
  let toastHideTimeout = null;

  // --- Visual Feedback & Toast Utilities ---
  function triggerPop(element) {
    if (!element) return;
    element.classList.remove('pop-feedback');
    void element.offsetWidth; // Force DOM reflow
    element.classList.add('pop-feedback');
  }

  function showInningToast(badgeText, messageText) {
    const toast = document.getElementById('inning-toast');
    const toastBadge = document.getElementById('toast-badge');
    const toastText = document.getElementById('toast-message');

    if (!toast) return;

    if (toastBadge) toastBadge.textContent = badgeText;
    if (toastText) toastText.textContent = messageText;

    toast.classList.add('show');
    clearTimeout(toastHideTimeout);
    toastHideTimeout = setTimeout(() => {
      toast.classList.remove('show');
    }, 1700);
  }

  // --- Smooth Sliding Underline Positioner ---
  function updateUnderlinePosition() {
    if (!teamLabelsContainer || !battingUnderline || !awayLabelEl || !homeLabelEl) return;

    const targetLabel = isTopInning ? awayLabelEl : homeLabelEl;
    const containerRect = teamLabelsContainer.getBoundingClientRect();
    const labelRect = targetLabel.getBoundingClientRect();

    if (containerRect.width === 0 || labelRect.width === 0) return;

    const leftOffset = labelRect.left - containerRect.left;
    const labelWidth = labelRect.width;

    battingUnderline.style.width = `${labelWidth}px`;
    battingUnderline.style.transform = `translateX(${leftOffset}px)`;
  }

  window.addEventListener('resize', updateUnderlinePosition);
  setTimeout(updateUnderlinePosition, 100);
  setTimeout(updateUnderlinePosition, 400);

  // --- Automatic 3-Outs Side Change Logic ---
  function handleThreeOuts() {
    clearTimeout(sideChangeTimeout);

    currentOuts = 3;
    updateOutsDisplay();

    if (outsContainer) {
      outsContainer.classList.remove('flash-3outs');
      void outsContainer.offsetWidth;
      outsContainer.classList.add('flash-3outs');
    }

    showInningToast('3 OUTS', 'CHANGE SIDES');

    sideChangeTimeout = setTimeout(() => {
      currentOuts = 0;
      updateOutsDisplay();

      if (isTopInning) {
        isTopInning = false;
      } else {
        currentInning++;
        isTopInning = true;
      }

      updateInningDisplay();

      if (inningContainer) {
        inningContainer.classList.remove('pulse-transition');
        void inningContainer.offsetWidth;
        inningContainer.classList.add('pulse-transition');
      }
    }, 450);
  }

  // --- Inning & Top/Bottom Display Logic ---
  function updateInningDisplay() {
    if (inningValEl) {
      inningValEl.textContent = currentInning;
    }

    if (inningUpBtn) {
      inningUpBtn.classList.toggle('active', isTopInning);
      inningUpBtn.setAttribute('aria-pressed', isTopInning ? 'true' : 'false');
      inningUpBtn.title = isTopInning ? 'Top of Inning (active) - tap to +1 Inning' : 'Tap to set Top of Inning';
    }
    if (inningDownBtn) {
      inningDownBtn.classList.toggle('active', !isTopInning);
      inningDownBtn.setAttribute('aria-pressed', !isTopInning ? 'true' : 'false');
      inningDownBtn.title = !isTopInning ? 'Bottom of Inning (active) - tap to -1 Inning' : 'Tap to set Bottom of Inning';
    }

    if (awayLabelEl && homeLabelEl) {
      awayLabelEl.classList.toggle('batting', isTopInning);
      homeLabelEl.classList.toggle('batting', !isTopInning);
    }

    requestAnimationFrame(updateUnderlinePosition);
    updateSharePreview();
    if (typeof updateHitTeamUI === 'function') {
      hitTeam = isTopInning ? 'away' : 'home';
      updateHitTeamUI();
    }
    if (typeof updateRecapCard === 'function') {
      updateRecapCard();
    }
  }

  function incrementInning() {
    clearTimeout(sideChangeTimeout);
    currentInning++;
    triggerPop(inningValEl);
    updateInningDisplay();
  }

  function decrementInning() {
    clearTimeout(sideChangeTimeout);
    if (currentInning > 1) {
      currentInning--;
      triggerPop(inningValEl);
      updateInningDisplay();
    }
  }

  function toggleInningHalf() {
    clearTimeout(sideChangeTimeout);
    isTopInning = !isTopInning;
    triggerPop(isTopInning ? inningUpBtn : inningDownBtn);
    updateInningDisplay();
  }

  function setInningHalf(toTop) {
    clearTimeout(sideChangeTimeout);
    if (isTopInning === toTop) {
      if (toTop) {
        incrementInning();
      } else {
        decrementInning();
      }
    } else {
      isTopInning = toTop;
      triggerPop(toTop ? inningUpBtn : inningDownBtn);
      updateInningDisplay();
    }
  }

  if (inningUpBtn) {
    inningUpBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      setInningHalf(true);
    });
  }

  if (inningDownBtn) {
    inningDownBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      setInningHalf(false);
    });
  }

  if (homeLabelEl) {
    homeLabelEl.addEventListener('click', () => {
      setInningHalf(false);
    });
  }
  if (awayLabelEl) {
    awayLabelEl.addEventListener('click', () => {
      setInningHalf(true);
    });
  }

  // --- Runs (Score) Modification Logic ---
  function changeHomeScore(delta) {
    homeScoreVal = Math.max(0, homeScoreVal + delta);
    if (homeScoreEl) {
      homeScoreEl.textContent = homeScoreVal;
      triggerPop(homeScoreEl);
    }
    if (typeof updateInningRunsFromScore === 'function') {
      updateInningRunsFromScore('home', homeScoreVal);
    }
    updateSharePreview();
    if (typeof updateRecapCard === 'function') {
      updateRecapCard();
    }
  }

  function changeAwayScore(delta) {
    awayScoreVal = Math.max(0, awayScoreVal + delta);
    if (awayScoreEl) {
      awayScoreEl.textContent = awayScoreVal;
      triggerPop(awayScoreEl);
    }
    if (typeof updateInningRunsFromScore === 'function') {
      updateInningRunsFromScore('away', awayScoreVal);
    }
    updateSharePreview();
    if (typeof updateRecapCard === 'function') {
      updateRecapCard();
    }
  }

  if (homeScoreEl) {
    homeScoreEl.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      changeHomeScore(-1);
    });
  }

  if (awayScoreEl) {
    awayScoreEl.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      changeAwayScore(-1);
    });
  }

  if (inningValEl) {
    inningValEl.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      decrementInning();
    });
  }

  if (outsContainer) {
    outsContainer.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      changeOuts(-1);
    });
  }

  // --- Outs Tracker Logic ---
  function updateOutsDisplay() {
    outCircles.forEach((circle) => {
      const outNum = parseInt(circle.getAttribute('data-out'), 10);
      circle.classList.toggle('active', outNum <= currentOuts);
    });
    updateSharePreview();
  }

  function changeOuts(delta) {
    if (delta > 0) {
      if (currentOuts + 1 >= 3) {
        handleThreeOuts();
      } else {
        clearTimeout(sideChangeTimeout);
        currentOuts += delta;
        triggerPop(outsContainer);
        updateOutsDisplay();
      }
    } else {
      clearTimeout(sideChangeTimeout);
      currentOuts = Math.max(0, currentOuts + delta);
      triggerPop(outsContainer);
      updateOutsDisplay();
    }
  }

  outCircles.forEach((circle) => {
    circle.addEventListener('click', (e) => {
      e.stopPropagation();
      const clickedOut = parseInt(circle.getAttribute('data-out'), 10);
      if (currentOuts === clickedOut) {
        clearTimeout(sideChangeTimeout);
        currentOuts = clickedOut - 1;
        triggerPop(outsContainer);
        updateOutsDisplay();
      } else if (clickedOut === 3) {
        handleThreeOuts();
      } else {
        clearTimeout(sideChangeTimeout);
        currentOuts = clickedOut;
        triggerPop(outsContainer);
        updateOutsDisplay();
      }
    });
  });

  // --- Touch & Mouse Swipe Gesture Detector ---
  function setupSwipeGestures(element, { onSwipeUp, onSwipeDown, onSwipeLeft, onSwipeRight, onTap }) {
    if (!element) return;

    let startX = 0;
    let startY = 0;
    let isTracking = false;
    let moved = false;
    let startTime = 0;

    element.addEventListener('pointerdown', (e) => {
      if (e.button !== 0 && e.pointerType === 'mouse') return;
      startX = e.clientX;
      startY = e.clientY;
      startTime = Date.now();
      isTracking = true;
      moved = false;

      if (typeof element.setPointerCapture === 'function') {
        try {
          element.setPointerCapture(e.pointerId);
        } catch (_) {}
      }
    });

    element.addEventListener('pointermove', (e) => {
      if (!isTracking) return;
      const diffX = e.clientX - startX;
      const diffY = e.clientY - startY;
      if (Math.abs(diffX) > 8 || Math.abs(diffY) > 8) {
        moved = true;
      }
    });

    const handlePointerEnd = (e) => {
      if (!isTracking) return;
      isTracking = false;

      const diffX = e.clientX - startX;
      const diffY = e.clientY - startY;
      const elapsed = Date.now() - startTime;
      const threshold = 18;

      if (Math.abs(diffY) >= threshold && Math.abs(diffY) >= Math.abs(diffX)) {
        if (diffY < 0 && onSwipeUp) {
          onSwipeUp();
          return;
        } else if (diffY > 0 && onSwipeDown) {
          onSwipeDown();
          return;
        }
      } else if (Math.abs(diffX) >= threshold && Math.abs(diffX) >= Math.abs(diffY)) {
        if (diffX < 0 && onSwipeLeft) {
          onSwipeLeft();
          return;
        } else if (diffX > 0 && onSwipeRight) {
          onSwipeRight();
          return;
        }
      }

      if (!moved && elapsed < 400 && onTap) {
        onTap(e);
      }
    };

    element.addEventListener('pointerup', handlePointerEnd);
    element.addEventListener('pointercancel', () => {
      isTracking = false;
      moved = false;
    });
  }

  // Attach Gestures
  setupSwipeGestures(homeScoreEl, {
    onSwipeUp: () => changeHomeScore(+1),
    onSwipeDown: () => changeHomeScore(-1),
    onTap: () => changeHomeScore(+1),
  });

  setupSwipeGestures(awayScoreEl, {
    onSwipeUp: () => changeAwayScore(+1),
    onSwipeDown: () => changeAwayScore(-1),
    onTap: () => changeAwayScore(+1),
  });

  setupSwipeGestures(inningContainer, {
    onSwipeUp: () => incrementInning(),
    onSwipeDown: () => decrementInning(),
    onSwipeLeft: () => toggleInningHalf(),
    onSwipeRight: () => toggleInningHalf(),
    onTap: (e) => {
      if (!e.target.closest('.arrow-btn')) {
        incrementInning();
      }
    },
  });

  setupSwipeGestures(outsContainer, {
    onSwipeUp: () => changeOuts(+1),
    onSwipeRight: () => changeOuts(+1),
    onSwipeDown: () => changeOuts(-1),
    onSwipeLeft: () => changeOuts(-1),
    onTap: (e) => {
      if (!e.target.closest('.out-circle')) {
        changeOuts(+1);
      }
    },
  });

  // --- Stopwatch Timer Controls ---
  function formatTime(totalSeconds) {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    const pad = (num) => String(num).padStart(2, '0');
    return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
  }

  function startTimer() {
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
      if (isTimerRunning) {
        secondsElapsed++;
        if (timerEl) timerEl.textContent = formatTime(secondsElapsed);
      }
    }, 1000);
  }

  function updateTimerUI() {
    if (timerDisplay) {
      timerDisplay.classList.toggle('paused', !isTimerRunning);
    }
    if (timerIcon) {
      timerIcon.className = isTimerRunning ? 'fa-solid fa-play' : 'fa-solid fa-pause';
    }
    if (modalTimerIcon) {
      modalTimerIcon.className = isTimerRunning ? 'fa-solid fa-pause' : 'fa-solid fa-play';
    }
    if (modalTimerText) {
      modalTimerText.textContent = isTimerRunning ? 'Pause Clock' : 'Resume Clock';
    }
  }

  function toggleTimer() {
    isTimerRunning = !isTimerRunning;
    updateTimerUI();
    showInningToast('CLOCK', isTimerRunning ? 'RESUMED' : 'PAUSED');
  }

  function resetTimer() {
    secondsElapsed = 0;
    if (timerEl) {
      timerEl.textContent = formatTime(0);
      triggerPop(timerDisplay);
    }
    showInningToast('CLOCK', 'RESET (00:00:00)');
    updateSharePreview();
  }

  startTimer();

  // Tap on the timer pill pauses/resumes
  if (timerDisplay) {
    timerDisplay.addEventListener('click', () => {
      toggleTimer();
    });

    timerDisplay.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      resetTimer();
    });
  }

  // --- Settings Menu Management ---
  function openSettings() {
    if (!settingsBackdrop) return;
    settingsBackdrop.classList.add('open');
    settingsBackdrop.setAttribute('aria-hidden', 'false');
    if (settingsBtn) {
      settingsBtn.classList.add('spinning');
      setTimeout(() => settingsBtn.classList.remove('spinning'), 500);
    }
    updateTimerUI();
  }

  function closeSettings() {
    if (!settingsBackdrop) return;
    settingsBackdrop.classList.remove('open');
    settingsBackdrop.setAttribute('aria-hidden', 'true');
    setTimeout(updateUnderlinePosition, 100);
  }

  if (settingsBtn) {
    settingsBtn.addEventListener('click', openSettings);
  }

  if (closeSettingsBtn) {
    closeSettingsBtn.addEventListener('click', closeSettings);
  }

  if (settingsBackdrop) {
    settingsBackdrop.addEventListener('click', (e) => {
      if (e.target === settingsBackdrop) {
        closeSettings();
      }
    });
  }

  if (modalTimerToggleBtn) {
    modalTimerToggleBtn.addEventListener('click', () => {
      toggleTimer();
    });
  }

  if (modalTimerResetBtn) {
    modalTimerResetBtn.addEventListener('click', () => {
      resetTimer();
    });
  }

  // --- Theme Management ---
  function applyTheme(themeName) {
    document.body.setAttribute('data-theme', themeName);
    localStorage.setItem('baseball_theme', themeName);

    themeCards.forEach((card) => {
      const isCardActive = card.getAttribute('data-theme') === themeName;
      card.classList.toggle('active', isCardActive);
    });

    requestAnimationFrame(updateUnderlinePosition);
  }

  themeCards.forEach((card) => {
    card.addEventListener('click', () => {
      const theme = card.getAttribute('data-theme');
      if (theme) applyTheme(theme);
    });
  });

  const savedTheme = localStorage.getItem('baseball_theme') || 'light';
  applyTheme(savedTheme);

  // Team Names
  if (homeNameInput) {
    homeNameInput.addEventListener('input', (e) => {
      const val = e.target.value.trim() || 'Home';
      homeTeamName = val;
      if (homeLabelEl) homeLabelEl.textContent = val;
      updateUnderlinePosition();
      updateSharePreview();
      if (typeof updateBoxScoreTable === 'function') updateBoxScoreTable();
      if (typeof updatePitchDisplay === 'function') updatePitchDisplay();
      if (typeof updateHitTeamUI === 'function') updateHitTeamUI();
      if (typeof updateRecapCard === 'function') updateRecapCard();
    });
  }

  if (awayNameInput) {
    awayNameInput.addEventListener('input', (e) => {
      const val = e.target.value.trim() || 'Away';
      awayTeamName = val;
      if (awayLabelEl) awayLabelEl.textContent = val;
      updateUnderlinePosition();
      updateSharePreview();
      if (typeof updateBoxScoreTable === 'function') updateBoxScoreTable();
      if (typeof updatePitchDisplay === 'function') updatePitchDisplay();
      if (typeof updateHitTeamUI === 'function') updateHitTeamUI();
      if (typeof updateRecapCard === 'function') updateRecapCard();
    });
  }

  // Quick Reset Actions
  if (clearRunsBtn) {
    clearRunsBtn.addEventListener('click', () => {
      homeScoreVal = 0;
      awayScoreVal = 0;
      inningRuns.home = [0, 0, 0, 0, 0, 0, 0, 0, 0];
      inningRuns.away = [0, 0, 0, 0, 0, 0, 0, 0, 0];
      if (homeScoreEl) homeScoreEl.textContent = '0';
      if (awayScoreEl) awayScoreEl.textContent = '0';
      triggerPop(homeScoreEl);
      triggerPop(awayScoreEl);
      showInningToast('RUNS', 'RESET (0 - 0)');
      updateSharePreview();
      if (typeof updateBoxScoreTable === 'function') updateBoxScoreTable();
      if (typeof updateRecapCard === 'function') updateRecapCard();
      closeSettings();
    });
  }

  if (resetGameBtn) {
    resetGameBtn.addEventListener('click', () => {
      homeScoreVal = 0;
      awayScoreVal = 0;
      currentInning = 1;
      isTopInning = true;
      currentOuts = 0;
      secondsElapsed = 0;
      isGameFinal = false;

      inningRuns.home = [0, 0, 0, 0, 0, 0, 0, 0, 0];
      inningRuns.away = [0, 0, 0, 0, 0, 0, 0, 0, 0];
      teamHits.home = 0;
      teamHits.away = 0;
      teamErrors.home = 0;
      teamErrors.away = 0;

      if (typeof pitchData !== 'undefined') {
        pitchData.home = { total: 0, strikes: 0, balls: 0, fouls: 0, inplay: 0, history: [] };
        pitchData.away = { total: 0, strikes: 0, balls: 0, fouls: 0, inplay: 0, history: [] };
      }
      if (typeof hitLogEntries !== 'undefined') {
        hitLogEntries = [];
      }

      if (homeScoreEl) homeScoreEl.textContent = '0';
      if (awayScoreEl) awayScoreEl.textContent = '0';
      if (timerEl) timerEl.textContent = formatTime(0);

      clearTimeout(sideChangeTimeout);
      updateInningDisplay();
      updateOutsDisplay();

      if (typeof updatePitchDisplay === 'function') updatePitchDisplay();
      if (typeof renderHitLogList === 'function') renderHitLogList();
      if (typeof updateBoxScoreTable === 'function') updateBoxScoreTable();
      if (typeof updateRecapCard === 'function') updateRecapCard();

      showInningToast('GAME', 'NEW GAME STARTED');
      closeSettings();
    });
  }

  // --- Share Menu & Format Generation ---
  function getOrdinal(num) {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = num % 100;
    return s[(v - 20) % 10] || s[v] || s[0];
  }

  function generateShareMessage(format) {
    const half = isTopInning ? 'Top' : 'Bottom';
    const outsStr = `${currentOuts} ${currentOuts === 1 ? 'Out' : 'Outs'}`;
    const timeStr = formatTime(secondsElapsed);
    const battingTeam = isTopInning ? awayTeamName : homeTeamName;

    switch (format) {
      case 'basic':
        return `⚾ ${homeTeamName} ${homeScoreVal} - ${awayScoreVal} ${awayTeamName}`;

      case 'standard':
        return `⚾ ${homeTeamName} ${homeScoreVal} - ${awayScoreVal} ${awayTeamName} (${half} ${currentInning} • ${outsStr})`;

      case 'box':
        return [
          `⚾ BASEBALL SCOREBOARD`,
          `─────────────────────────`,
          `${homeTeamName}: ${homeScoreVal}`,
          `${awayTeamName}: ${awayScoreVal}`,
          `─────────────────────────`,
          `Inning:  ${half} ${currentInning}`,
          `Outs:    ${outsStr}`,
          `Time:    ${timeStr}`,
          `Batting: ${battingTeam}`
        ].join('\n');

      case 'broadcast':
        return `⚾ Live Score Update: ${homeTeamName} (${homeScoreVal}) vs ${awayTeamName} (${awayScoreVal}) in the ${half} of the ${currentInning}${getOrdinal(currentInning)} with ${outsStr}. Game clock: ${timeStr}.`;

      default:
        return `⚾ ${homeTeamName} ${homeScoreVal} - ${awayScoreVal} ${awayTeamName}`;
    }
  }

  function updateSharePreview() {
    if (!sharePreviewText) return;
    sharePreviewText.textContent = generateShareMessage(selectedShareFormat);
  }

  function openShareMenu() {
    if (!shareBackdrop) return;
    updateSharePreview();
    shareBackdrop.classList.add('open');
    shareBackdrop.setAttribute('aria-hidden', 'false');
  }

  function closeShareMenu() {
    if (!shareBackdrop) return;
    shareBackdrop.classList.remove('open');
    shareBackdrop.setAttribute('aria-hidden', 'true');
  }

  if (shareBtn) {
    shareBtn.addEventListener('click', openShareMenu);
  }

  if (closeShareBtn) {
    closeShareBtn.addEventListener('click', closeShareMenu);
  }

  if (shareBackdrop) {
    shareBackdrop.addEventListener('click', (e) => {
      if (e.target === shareBackdrop) {
        closeShareMenu();
      }
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (shareBackdrop && shareBackdrop.classList.contains('open')) closeShareMenu();
      if (settingsBackdrop && settingsBackdrop.classList.contains('open')) closeSettings();
    }
  });

  // Summary Format Cards Selection
  summaryCards.forEach((card) => {
    card.addEventListener('click', () => {
      const format = card.getAttribute('data-format');
      if (!format) return;
      selectedShareFormat = format;

      summaryCards.forEach((c) => c.classList.toggle('active', c === card));
      updateSharePreview();
      triggerPop(document.getElementById('share-preview-box'));
    });
  });

  // Copy Preview & General Copy Actions
  function copyTextToClipboard(text, btnElement) {
    const doFeedback = () => {
      showInningToast('COPIED', 'Message copied to clipboard');
      if (btnElement) {
        const originalContent = btnElement.innerHTML;
        btnElement.innerHTML = `<i class="fa-solid fa-check"></i> <span>Copied!</span>`;
        setTimeout(() => {
          btnElement.innerHTML = originalContent;
        }, 1500);
      }
    };

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(doFeedback).catch(() => {
        // Fallback for iframe restrictions
        legacyCopy(text);
        doFeedback();
      });
    } else {
      legacyCopy(text);
      doFeedback();
    }
  }

  function legacyCopy(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    try {
      document.execCommand('copy');
    } catch (_) {}
    document.body.removeChild(textarea);
  }

  if (copyPreviewBtn) {
    copyPreviewBtn.addEventListener('click', () => {
      copyTextToClipboard(generateShareMessage(selectedShareFormat), copyPreviewBtn);
    });
  }

  if (shareCopyBtn) {
    shareCopyBtn.addEventListener('click', () => {
      copyTextToClipboard(generateShareMessage(selectedShareFormat), shareCopyBtn);
    });
  }

  // Sharing Channels
  if (shareNativeBtn) {
    shareNativeBtn.addEventListener('click', () => {
      const message = generateShareMessage(selectedShareFormat);
      if (navigator.share) {
        navigator.share({
          title: `${homeTeamName} vs ${awayTeamName} - Baseball Score`,
          text: message,
        }).catch(() => {});
      } else {
        copyTextToClipboard(message, shareNativeBtn);
      }
    });
  }

  if (shareSmsBtn) {
    shareSmsBtn.addEventListener('click', () => {
      const message = generateShareMessage(selectedShareFormat);
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const delimiter = isIOS ? '&' : '?';
      const url = `sms:${delimiter}body=${encodeURIComponent(message)}`;
      window.open(url, '_blank');
      showInningToast('TEXT / SMS', 'Opening Messages...');
    });
  }

  if (shareWhatsappBtn) {
    shareWhatsappBtn.addEventListener('click', () => {
      const message = generateShareMessage(selectedShareFormat);
      const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
      window.open(url, '_blank');
      showInningToast('WHATSAPP', 'Opening WhatsApp...');
    });
  }

  if (shareTwitterBtn) {
    shareTwitterBtn.addEventListener('click', () => {
      const message = generateShareMessage(selectedShareFormat);
      const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}`;
      window.open(url, '_blank');
      showInningToast('X / POST', 'Opening X...');
    });
  }

  if (shareEmailBtn) {
    shareEmailBtn.addEventListener('click', () => {
      const message = generateShareMessage(selectedShareFormat);
      const subject = `Baseball Score: ${homeTeamName} vs ${awayTeamName}`;
      const url = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
      window.open(url, '_blank');
      showInningToast('EMAIL', 'Opening Email...');
    });
  }

  // =========================================================================
  // ADVANCED TOOLS CONTROLLER
  // =========================================================================

  // --- 1. Box Score Inning Runs & Errors Tracking ---
  function updateInningRunsFromScore(team, targetScore) {
    const arr = inningRuns[team];
    let currentSum = arr.reduce((a, b) => a + b, 0);
    const diff = targetScore - currentSum;

    if (diff > 0) {
      const innIdx = Math.min(Math.max(0, currentInning - 1), 8);
      arr[innIdx] += diff;
    } else if (diff < 0) {
      let toRemove = -diff;
      for (let i = Math.min(currentInning - 1, 8); i >= 0 && toRemove > 0; i--) {
        const canRemove = Math.min(arr[i], toRemove);
        arr[i] -= canRemove;
        toRemove -= canRemove;
      }
      for (let i = 8; i >= 0 && toRemove > 0; i--) {
        const canRemove = Math.min(arr[i], toRemove);
        arr[i] -= canRemove;
        toRemove -= canRemove;
      }
    }
    updateBoxScoreTable();
  }

  function updateBoxScoreTable() {
    // Away row
    const awayCells = document.querySelectorAll('#linescore-away-row .inn-cell');
    awayCells.forEach((cell) => {
      const inn = parseInt(cell.getAttribute('data-inn'), 10) - 1;
      cell.textContent = inningRuns.away[inn] ?? 0;
    });
    const boxAwayRuns = document.getElementById('box-away-runs');
    if (boxAwayRuns) boxAwayRuns.textContent = awayScoreVal;
    const boxAwayHits = document.getElementById('box-away-hits');
    if (boxAwayHits) boxAwayHits.textContent = teamHits.away;
    const boxAwayErrors = document.getElementById('box-away-errors');
    if (boxAwayErrors) boxAwayErrors.textContent = teamErrors.away;

    // Home row
    const homeCells = document.querySelectorAll('#linescore-home-row .inn-cell');
    homeCells.forEach((cell) => {
      const inn = parseInt(cell.getAttribute('data-inn'), 10) - 1;
      cell.textContent = inningRuns.home[inn] ?? 0;
    });
    const boxHomeRuns = document.getElementById('box-home-runs');
    if (boxHomeRuns) boxHomeRuns.textContent = homeScoreVal;
    const boxHomeHits = document.getElementById('box-home-hits');
    if (boxHomeHits) boxHomeHits.textContent = teamHits.home;
    const boxHomeErrors = document.getElementById('box-home-errors');
    if (boxHomeErrors) boxHomeErrors.textContent = teamErrors.home;

    // Error stepper indicators
    const errHomeVal = document.getElementById('err-home-val');
    if (errHomeVal) errHomeVal.textContent = teamErrors.home;
    const errAwayVal = document.getElementById('err-away-val');
    if (errAwayVal) errAwayVal.textContent = teamErrors.away;

    // Labels
    const linescoreAwayName = document.getElementById('linescore-away-name');
    if (linescoreAwayName) linescoreAwayName.textContent = awayTeamName;
    const linescoreHomeName = document.getElementById('linescore-home-name');
    if (linescoreHomeName) linescoreHomeName.textContent = homeTeamName;
    const errHomeLabel = document.getElementById('err-home-label');
    if (errHomeLabel) errHomeLabel.textContent = homeTeamName;
    const errAwayLabel = document.getElementById('err-away-label');
    if (errAwayLabel) errAwayLabel.textContent = awayTeamName;

    updateRecapCard();
  }

  // Interactive Inning Cell Tap/Click
  document.querySelectorAll('.inn-cell').forEach((cell) => {
    cell.addEventListener('click', () => {
      const team = cell.getAttribute('data-team');
      const inn = parseInt(cell.getAttribute('data-inn'), 10) - 1;
      inningRuns[team][inn]++;
      if (team === 'home') {
        homeScoreVal = inningRuns.home.reduce((a, b) => a + b, 0);
        if (homeScoreEl) homeScoreEl.textContent = homeScoreVal;
        triggerPop(homeScoreEl);
      } else {
        awayScoreVal = inningRuns.away.reduce((a, b) => a + b, 0);
        if (awayScoreEl) awayScoreEl.textContent = awayScoreVal;
        triggerPop(awayScoreEl);
      }
      triggerPop(cell);
      updateBoxScoreTable();
      updateSharePreview();
    });

    cell.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      const team = cell.getAttribute('data-team');
      const inn = parseInt(cell.getAttribute('data-inn'), 10) - 1;
      if (inningRuns[team][inn] > 0) {
        inningRuns[team][inn]--;
        if (team === 'home') {
          homeScoreVal = inningRuns.home.reduce((a, b) => a + b, 0);
          if (homeScoreEl) homeScoreEl.textContent = homeScoreVal;
          triggerPop(homeScoreEl);
        } else {
          awayScoreVal = inningRuns.away.reduce((a, b) => a + b, 0);
          if (awayScoreEl) awayScoreEl.textContent = awayScoreVal;
          triggerPop(awayScoreEl);
        }
        triggerPop(cell);
        updateBoxScoreTable();
        updateSharePreview();
      }
    });
  });

  // Team Error Stepper controls
  const errHomeMinus = document.getElementById('err-home-minus');
  const errHomePlus = document.getElementById('err-home-plus');
  const errAwayMinus = document.getElementById('err-away-minus');
  const errAwayPlus = document.getElementById('err-away-plus');

  if (errHomeMinus) {
    errHomeMinus.addEventListener('click', () => {
      teamErrors.home = Math.max(0, teamErrors.home - 1);
      updateBoxScoreTable();
    });
  }
  if (errHomePlus) {
    errHomePlus.addEventListener('click', () => {
      teamErrors.home++;
      updateBoxScoreTable();
    });
  }
  if (errAwayMinus) {
    errAwayMinus.addEventListener('click', () => {
      teamErrors.away = Math.max(0, teamErrors.away - 1);
      updateBoxScoreTable();
    });
  }
  if (errAwayPlus) {
    errAwayPlus.addEventListener('click', () => {
      teamErrors.away++;
      updateBoxScoreTable();
    });
  }

  // --- 2. Pitch Counter Logic ---
  let activePitcher = 'home';
  const pitchData = {
    home: { total: 0, strikes: 0, balls: 0, fouls: 0, inplay: 0, history: [] },
    away: { total: 0, strikes: 0, balls: 0, fouls: 0, inplay: 0, history: [] }
  };

  const pitchTeamHome = document.getElementById('pitch-team-home');
  const pitchTeamAway = document.getElementById('pitch-team-away');
  const pitchTotalNum = document.getElementById('pitch-total-num');
  const pitchStrikesNum = document.getElementById('pitch-strikes-num');
  const pitchBallsNum = document.getElementById('pitch-balls-num');
  const pitchPctNum = document.getElementById('pitch-pct-num');

  const btnPitchStrike = document.getElementById('btn-pitch-strike');
  const btnPitchBall = document.getElementById('btn-pitch-ball');
  const btnPitchFoul = document.getElementById('btn-pitch-foul');
  const btnPitchInplay = document.getElementById('btn-pitch-inplay');
  const btnPitchUndo = document.getElementById('btn-pitch-undo');
  const btnPitchReset = document.getElementById('btn-pitch-reset');

  function updatePitchDisplay() {
    const cur = pitchData[activePitcher];
    if (pitchTotalNum) pitchTotalNum.textContent = cur.total;
    if (pitchStrikesNum) pitchStrikesNum.textContent = cur.strikes;
    if (pitchBallsNum) pitchBallsNum.textContent = cur.balls;
    const pct = cur.total > 0 ? Math.round((cur.strikes / cur.total) * 100) : 0;
    if (pitchPctNum) pitchPctNum.textContent = `${pct}%`;

    if (pitchTeamHome) {
      pitchTeamHome.classList.toggle('active', activePitcher === 'home');
      pitchTeamHome.textContent = `${homeTeamName} Pitcher`;
    }
    if (pitchTeamAway) {
      pitchTeamAway.classList.toggle('active', activePitcher === 'away');
      pitchTeamAway.textContent = `${awayTeamName} Pitcher`;
    }

    updateRecapCard();
  }

  function recordPitch(type) {
    const cur = pitchData[activePitcher];
    cur.total++;
    if (type === 'strike') cur.strikes++;
    else if (type === 'ball') cur.balls++;
    else if (type === 'foul') cur.strikes++;
    else if (type === 'inplay') cur.strikes++;

    cur.history.push(type);
    triggerPop(pitchTotalNum);
    updatePitchDisplay();
  }

  function undoPitch() {
    const cur = pitchData[activePitcher];
    if (cur.history.length === 0) {
      showInningToast('PITCHES', 'No pitches to undo');
      return;
    }
    const lastType = cur.history.pop();
    cur.total = Math.max(0, cur.total - 1);
    if (lastType === 'strike' || lastType === 'foul' || lastType === 'inplay') {
      cur.strikes = Math.max(0, cur.strikes - 1);
    } else if (lastType === 'ball') {
      cur.balls = Math.max(0, cur.balls - 1);
    }
    triggerPop(pitchTotalNum);
    updatePitchDisplay();
    showInningToast('UNDO', `Reverted last ${lastType}`);
  }

  function resetPitchCounter() {
    const cur = pitchData[activePitcher];
    cur.total = 0;
    cur.strikes = 0;
    cur.balls = 0;
    cur.fouls = 0;
    cur.inplay = 0;
    cur.history = [];
    triggerPop(pitchTotalNum);
    updatePitchDisplay();
    showInningToast('PITCHES', `${activePitcher === 'home' ? homeTeamName : awayTeamName} counter reset`);
  }

  if (pitchTeamHome) {
    pitchTeamHome.addEventListener('click', () => {
      activePitcher = 'home';
      updatePitchDisplay();
    });
  }
  if (pitchTeamAway) {
    pitchTeamAway.addEventListener('click', () => {
      activePitcher = 'away';
      updatePitchDisplay();
    });
  }
  if (btnPitchStrike) btnPitchStrike.addEventListener('click', () => recordPitch('strike'));
  if (btnPitchBall) btnPitchBall.addEventListener('click', () => recordPitch('ball'));
  if (btnPitchFoul) btnPitchFoul.addEventListener('click', () => recordPitch('foul'));
  if (btnPitchInplay) btnPitchInplay.addEventListener('click', () => recordPitch('inplay'));
  if (btnPitchUndo) btnPitchUndo.addEventListener('click', undoPitch);
  if (btnPitchReset) btnPitchReset.addEventListener('click', resetPitchCounter);

  // --- 3. Hit Log Logic ---
  let hitTeam = 'away';
  let selectedPlayer = '#1 Lead-off';
  let selectedZone = 'Center Field (CF)';
  let selectedOutcome = '1B Single';
  let selectedIsHit = true;
  let hitLogEntries = [];

  const hitTeamAway = document.getElementById('hit-team-away');
  const hitTeamHome = document.getElementById('hit-team-home');
  const hitPlayerInput = document.getElementById('hit-player-input');
  const quickPlayerChips = document.querySelectorAll('#quick-player-chips .chip-btn');
  const baseballFieldSvg = document.getElementById('baseball-field-svg');
  const sprayMarker = document.getElementById('spray-marker');
  const selectedZoneTag = document.getElementById('selected-zone-tag');
  const outcomeButtons = document.querySelectorAll('.outcome-btn');
  const btnLogHitCommit = document.getElementById('btn-log-hit-commit');
  const hitLogList = document.getElementById('hit-log-list');
  const hitLogCount = document.getElementById('hit-log-count');
  const clearLogBtn = document.getElementById('clear-log-btn');

  function updateHitTeamUI() {
    if (hitTeamAway) {
      hitTeamAway.classList.toggle('active', hitTeam === 'away');
      hitTeamAway.textContent = `${awayTeamName} (Batting)`;
    }
    if (hitTeamHome) {
      hitTeamHome.classList.toggle('active', hitTeam === 'home');
      hitTeamHome.textContent = homeTeamName;
    }
  }

  if (hitTeamAway) {
    hitTeamAway.addEventListener('click', () => {
      hitTeam = 'away';
      updateHitTeamUI();
    });
  }
  if (hitTeamHome) {
    hitTeamHome.addEventListener('click', () => {
      hitTeam = 'home';
      updateHitTeamUI();
    });
  }

  quickPlayerChips.forEach((chip) => {
    chip.addEventListener('click', () => {
      quickPlayerChips.forEach((c) => c.classList.remove('active'));
      chip.classList.add('active');
      const val = chip.getAttribute('data-player');
      selectedPlayer = val;
      if (hitPlayerInput) hitPlayerInput.value = val;
    });
  });

  if (hitPlayerInput) {
    hitPlayerInput.addEventListener('input', (e) => {
      selectedPlayer = e.target.value.trim() || '#1';
    });
  }

  // Interactive Field SVG Zone & Spray Marker Placement
  function selectFieldZone(zoneName, x, y) {
    selectedZone = zoneName;
    if (selectedZoneTag) selectedZoneTag.textContent = zoneName;

    const allZones = document.querySelectorAll('.zone-poly, .zone-circle');
    allZones.forEach((z) => {
      z.classList.toggle('active', z.getAttribute('data-zone') === zoneName);
    });

    if (sprayMarker && x !== undefined && y !== undefined) {
      sprayMarker.setAttribute('cx', x);
      sprayMarker.setAttribute('cy', y);
    }
  }

  if (baseballFieldSvg) {
    baseballFieldSvg.addEventListener('click', (e) => {
      const rect = baseballFieldSvg.getBoundingClientRect();
      const scaleX = 280 / rect.width;
      const scaleY = 230 / rect.height;
      const svgX = Math.round(Math.max(10, Math.min(270, (e.clientX - rect.left) * scaleX)));
      const svgY = Math.round(Math.max(10, Math.min(220, (e.clientY - rect.top) * scaleY)));

      const targetZone = e.target.closest('[data-zone]');
      if (targetZone) {
        const zoneName = targetZone.getAttribute('data-zone');
        selectFieldZone(zoneName, svgX, svgY);
      } else {
        let detected = 'Center Field (CF)';
        if (svgY > 185) {
          detected = svgX < 140 ? '3rd Base (3B)' : '1st Base (1B)';
        } else if (svgY > 155) {
          if (Math.abs(svgX - 140) < 18) detected = 'Pitcher (P)';
          else detected = svgX < 140 ? '3rd Base (3B)' : '1st Base (1B)';
        } else if (svgY > 130) {
          if (svgX < 135) detected = 'Shortstop (SS)';
          else if (svgX > 145) detected = '2nd Base (2B)';
          else detected = 'Pitcher (P)';
        } else {
          if (svgX < 100) detected = 'Left Field (LF)';
          else if (svgX > 180) detected = 'Right Field (RF)';
          else detected = 'Center Field (CF)';
        }
        selectFieldZone(detected, svgX, svgY);
      }
    });
  }

  // Outcome buttons
  outcomeButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      outcomeButtons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      selectedOutcome = btn.getAttribute('data-outcome');
      selectedIsHit = btn.getAttribute('data-ishit') === 'true';
    });
  });

  // Render Hit Log List
  function renderHitLogList() {
    if (!hitLogList) return;
    if (hitLogCount) hitLogCount.textContent = hitLogEntries.length;

    if (hitLogEntries.length === 0) {
      hitLogList.innerHTML = `<div class="empty-log-notice">No hits or plays recorded yet. Tap above to log plays!</div>`;
      return;
    }

    hitLogList.innerHTML = hitLogEntries.map((entry) => {
      let badgeClass = 'misc';
      if (entry.outcome.includes('Home Run')) badgeClass = 'hr';
      else if (entry.isHit) badgeClass = 'hit';
      else if (entry.outcome.includes('out') || entry.outcome.includes('Strikeout')) badgeClass = 'out';

      return `
        <div class="hit-log-item" data-id="${entry.id}">
          <div class="item-left">
            <span class="item-badge ${badgeClass}">${entry.outcome.split(' ')[0]}</span>
            <span class="item-player">${entry.player} (${entry.teamName})</span>
            <span class="item-zone">→ ${entry.zone.split(' ')[0]}</span>
          </div>
          <button type="button" class="delete-hit-btn" data-delete-id="${entry.id}" title="Remove play">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </div>
      `;
    }).join('');

    hitLogList.querySelectorAll('.delete-hit-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = Number(btn.getAttribute('data-delete-id'));
        const idx = hitLogEntries.findIndex((item) => item.id === id);
        if (idx !== -1) {
          const removed = hitLogEntries[idx];
          if (removed.isHit && teamHits[removed.team] > 0) {
            teamHits[removed.team]--;
          }
          hitLogEntries.splice(idx, 1);
          renderHitLogList();
          updateBoxScoreTable();
          showInningToast('DELETED', 'Play removed from log');
        }
      });
    });
  }

  if (btnLogHitCommit) {
    btnLogHitCommit.addEventListener('click', () => {
      const playerName = (hitPlayerInput && hitPlayerInput.value.trim()) || selectedPlayer;
      const team = hitTeam;
      const teamName = team === 'home' ? homeTeamName : awayTeamName;

      const entry = {
        id: Date.now(),
        player: playerName,
        team: team,
        teamName: teamName,
        zone: selectedZone,
        outcome: selectedOutcome,
        isHit: selectedIsHit,
        inning: `${isTopInning ? 'Top' : 'Bottom'} ${currentInning}`,
        timestamp: formatTime(secondsElapsed)
      };

      hitLogEntries.unshift(entry);

      if (entry.isHit) {
        teamHits[team]++;
        showInningToast('HIT!', `${entry.outcome} by ${playerName}`);
      } else if (entry.outcome.includes('Error')) {
        const fieldingTeam = team === 'home' ? 'away' : 'home';
        teamErrors[fieldingTeam]++;
        showInningToast('ERROR', `Charged to ${fieldingTeam === 'home' ? homeTeamName : awayTeamName}`);
      } else {
        showInningToast('RECORDED', `${entry.outcome} by ${playerName}`);
      }

      renderHitLogList();
      updateBoxScoreTable();
      triggerPop(btnLogHitCommit);
    });
  }

  if (clearLogBtn) {
    clearLogBtn.addEventListener('click', () => {
      if (hitLogEntries.length === 0) return;
      hitLogEntries = [];
      teamHits.home = 0;
      teamHits.away = 0;
      renderHitLogList();
      updateBoxScoreTable();
      showInningToast('LOG CLEARED', 'All plays reset');
    });
  }

  // --- 4. Finish Game & Pictureized Summary ---
  const pictureSummaryCard = document.getElementById('picture-summary-card');
  const cardStatusTag = document.getElementById('card-status-tag');
  const cardHomeName = document.getElementById('card-home-name');
  const cardHomeScore = document.getElementById('card-home-score');
  const cardAwayName = document.getElementById('card-away-name');
  const cardAwayScore = document.getElementById('card-away-score');
  const cardLineHome = document.getElementById('card-line-home');
  const cardLineHomeR = document.getElementById('card-line-home-r');
  const cardLineHomeH = document.getElementById('card-line-home-h');
  const cardLineHomeE = document.getElementById('card-line-home-e');
  const cardLineAway = document.getElementById('card-line-away');
  const cardLineAwayR = document.getElementById('card-line-away-r');
  const cardLineAwayH = document.getElementById('card-line-away-h');
  const cardLineAwayE = document.getElementById('card-line-away-e');
  const cardDuration = document.getElementById('card-duration');
  const cardInningFinal = document.getElementById('card-inning-final');
  const cardTotalPitches = document.getElementById('card-total-pitches');
  const cardDateStamp = document.getElementById('card-date-stamp');
  const btnDownloadImage = document.getElementById('btn-download-image');
  const btnCopyCardSummary = document.getElementById('btn-copy-card-summary');
  const btnFinishGameToggle = document.getElementById('btn-finish-game-toggle');
  const finishGameBtnText = document.getElementById('finish-game-btn-text');

  function updateRecapCard() {
    if (cardHomeName) cardHomeName.textContent = homeTeamName;
    if (cardAwayName) cardAwayName.textContent = awayTeamName;
    if (cardHomeScore) cardHomeScore.textContent = homeScoreVal;
    if (cardAwayScore) cardAwayScore.textContent = awayScoreVal;

    if (cardLineHome) cardLineHome.textContent = homeTeamName;
    if (cardLineHomeR) cardLineHomeR.textContent = homeScoreVal;
    if (cardLineHomeH) cardLineHomeH.textContent = teamHits.home;
    if (cardLineHomeE) cardLineHomeE.textContent = teamErrors.home;

    if (cardLineAway) cardLineAway.textContent = awayTeamName;
    if (cardLineAwayR) cardLineAwayR.textContent = awayScoreVal;
    if (cardLineAwayH) cardLineAwayH.textContent = teamHits.away;
    if (cardLineAwayE) cardLineAwayE.textContent = teamErrors.away;

    if (cardDuration) cardDuration.textContent = formatTime(secondsElapsed);
    if (cardInningFinal) {
      cardInningFinal.textContent = isGameFinal
        ? `Final / ${currentInning} Inn`
        : `${isTopInning ? 'Top' : 'Bot'} ${currentInning}`;
    }

    const totalPitches = pitchData.home.total + pitchData.away.total;
    if (cardTotalPitches) cardTotalPitches.textContent = `${totalPitches} Pitches`;

    if (cardDateStamp) {
      const now = new Date();
      const options = { year: 'numeric', month: 'long', day: 'numeric' };
      cardDateStamp.textContent = now.toLocaleDateString('en-US', options).toUpperCase();
    }

    if (cardStatusTag) {
      cardStatusTag.textContent = isGameFinal ? 'FINAL' : 'LIVE';
      cardStatusTag.style.backgroundColor = isGameFinal ? '#ef4444' : '#10b981';
    }

    if (finishGameBtnText && btnFinishGameToggle) {
      finishGameBtnText.textContent = isGameFinal ? 'Resume Active Game' : 'Finish & Finalize Game';
      btnFinishGameToggle.classList.toggle('finalized', isGameFinal);
    }
  }

  if (btnFinishGameToggle) {
    btnFinishGameToggle.addEventListener('click', () => {
      isGameFinal = !isGameFinal;
      if (isGameFinal) {
        if (isTimerRunning) toggleTimer();
        showInningToast('GAME OVER', 'Official match finalized!');
      } else {
        showInningToast('RESUMED', 'Game set back to live');
      }
      triggerPop(btnFinishGameToggle);
      updateRecapCard();
    });
  }

  // --- Picture Card Canvas PNG Export ---
  function exportRecapCardImage() {
    const canvas = document.createElement('canvas');
    canvas.width = 900;
    canvas.height = 620;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Card background
    const bgGrad = ctx.createLinearGradient(0, 0, 900, 620);
    bgGrad.addColorStop(0, '#0f172a');
    bgGrad.addColorStop(1, '#020617');
    ctx.fillStyle = bgGrad;
    ctx.beginPath();
    ctx.roundRect(0, 0, 900, 620, 32);
    ctx.fill();

    // Outer border
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#38bdf8';
    ctx.stroke();

    // Top Header Banner
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 18px system-ui, sans-serif';
    ctx.fillText('⚾ OFFICIAL GAME RECAP', 44, 52);

    // Final badge
    ctx.fillStyle = isGameFinal ? '#ef4444' : '#10b981';
    ctx.beginPath();
    ctx.roundRect(750, 30, 105, 34, 17);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 16px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(isGameFinal ? 'FINAL' : 'LIVE', 802, 53);

    // Scoreboard Matchup Banner Box
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.roundRect(44, 85, 812, 170, 24);
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#334155';
    ctx.stroke();

    // Home Team Side
    ctx.textAlign = 'center';
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 22px system-ui, sans-serif';
    ctx.fillText(homeTeamName.toUpperCase(), 240, 130);
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 84px system-ui, sans-serif';
    ctx.fillText(String(homeScoreVal), 240, 220);

    // Divider
    ctx.fillStyle = '#64748b';
    ctx.font = '900 54px system-ui, sans-serif';
    ctx.fillText('-', 450, 180);

    // Away Team Side
    ctx.textAlign = 'center';
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 22px system-ui, sans-serif';
    ctx.fillText(awayTeamName.toUpperCase(), 660, 130);
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 84px system-ui, sans-serif';
    ctx.fillText(String(awayScoreVal), 660, 220);

    // Line score Table Box
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.roundRect(44, 280, 812, 185, 20);
    ctx.fill();
    ctx.strokeStyle = '#334155';
    ctx.stroke();

    // Line score Table Header
    ctx.font = 'bold 15px system-ui, sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.textAlign = 'left';
    ctx.fillText('TEAM', 70, 314);
    for (let i = 1; i <= 9; i++) {
      ctx.textAlign = 'center';
      ctx.fillText(String(i), 190 + (i - 1) * 44, 314);
    }
    ctx.fillText('R', 650, 314);
    ctx.fillText('H', 720, 314);
    ctx.fillText('E', 790, 314);

    // Separator line
    ctx.strokeStyle = '#334155';
    ctx.beginPath();
    ctx.moveTo(60, 328);
    ctx.lineTo(840, 328);
    ctx.stroke();

    // Away Row
    ctx.textAlign = 'left';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px system-ui, sans-serif';
    ctx.fillText(awayTeamName, 70, 365);
    for (let i = 0; i < 9; i++) {
      ctx.textAlign = 'center';
      ctx.fillStyle = '#cbd5e1';
      ctx.fillText(String(inningRuns.away[i] || 0), 190 + i * 44, 365);
    }
    ctx.fillStyle = '#38bdf8';
    ctx.font = '900 20px system-ui, sans-serif';
    ctx.fillText(String(awayScoreVal), 650, 365);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px system-ui, sans-serif';
    ctx.fillText(String(teamHits.away), 720, 365);
    ctx.fillText(String(teamErrors.away), 790, 365);

    // Home Row
    ctx.textAlign = 'left';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px system-ui, sans-serif';
    ctx.fillText(homeTeamName, 70, 420);
    for (let i = 0; i < 9; i++) {
      ctx.textAlign = 'center';
      ctx.fillStyle = '#cbd5e1';
      ctx.fillText(String(inningRuns.home[i] || 0), 190 + i * 44, 420);
    }
    ctx.fillStyle = '#38bdf8';
    ctx.font = '900 20px system-ui, sans-serif';
    ctx.fillText(String(homeScoreVal), 650, 420);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px system-ui, sans-serif';
    ctx.fillText(String(teamHits.home), 720, 420);
    ctx.fillText(String(teamErrors.home), 790, 420);

    // Stats bar Pills
    const statsPills = [
      `⏱ ${formatTime(secondsElapsed)}`,
      `⚾ ${isGameFinal ? `Final / ${currentInning} Inn` : `Inning ${currentInning}`}`,
      `🎯 ${pitchData.home.total + pitchData.away.total} Pitches`
    ];

    statsPills.forEach((stat, idx) => {
      const px = 44 + idx * 280;
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.roundRect(px, 490, 252, 44, 14);
      ctx.fill();
      ctx.strokeStyle = '#334155';
      ctx.stroke();

      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 16px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(stat, px + 126, 518);
    });

    // Footer Watermark & Date
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }).toUpperCase();
    ctx.fillStyle = '#64748b';
    ctx.font = 'bold 13px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(dateStr, 48, 582);
    ctx.textAlign = 'right';
    ctx.fillText('BASEBALL SCOREKEEPER APP', 856, 582);

    // Download PNG
    try {
      const dataUrl = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = `baseball-game-recap-${Date.now()}.png`;
      downloadLink.href = dataUrl;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      showInningToast('SAVED IMAGE', 'Game recap graphic downloaded!');
    } catch (_) {
      showInningToast('EXPORT', 'Could not save image');
    }
  }

  if (btnDownloadImage) {
    btnDownloadImage.addEventListener('click', exportRecapCardImage);
  }

  if (btnCopyCardSummary) {
    btnCopyCardSummary.addEventListener('click', () => {
      const totalPitches = pitchData.home.total + pitchData.away.total;
      const summaryText = [
        `⚾ OFFICIAL BASEBALL RECAP [${isGameFinal ? 'FINAL' : 'LIVE'}]`,
        `=================================`,
        `${homeTeamName}: ${homeScoreVal} runs, ${teamHits.home} hits, ${teamErrors.home} errors`,
        `${awayTeamName}: ${awayScoreVal} runs, ${teamHits.away} hits, ${teamErrors.away} errors`,
        `---------------------------------`,
        `Inning:     ${isGameFinal ? 'Final' : (isTopInning ? 'Top' : 'Bottom')} ${currentInning}`,
        `Duration:   ${formatTime(secondsElapsed)}`,
        `Pitches:    ${totalPitches} (${pitchData.home.total} Home / ${pitchData.away.total} Away)`,
        `Date:       ${new Date().toLocaleDateString('en-US')}`,
        `=================================`
      ].join('\n');
      copyTextToClipboard(summaryText, btnCopyCardSummary);
    });
  }

  // --- 5. Advanced Tools Drawer Opening & Switching ---
  const advancedToolsTabBtn = document.getElementById('advanced-tools-tab-btn');
  const advancedBackdrop = document.getElementById('advanced-backdrop');
  const closeAdvancedBtn = document.getElementById('close-advanced-btn');
  const advancedNavPills = document.querySelectorAll('.nav-pill-btn');
  const advancedPanels = document.querySelectorAll('.advanced-panel');

  function openAdvancedTools(toolName = 'pitches') {
    if (!advancedBackdrop) return;
    updatePitchDisplay();
    updateHitTeamUI();
    updateBoxScoreTable();
    updateRecapCard();

    switchAdvancedTool(toolName);

    advancedBackdrop.classList.add('open');
    advancedBackdrop.setAttribute('aria-hidden', 'false');
  }

  function closeAdvancedTools() {
    if (!advancedBackdrop) return;
    advancedBackdrop.classList.remove('open');
    advancedBackdrop.setAttribute('aria-hidden', 'true');
  }

  function switchAdvancedTool(toolName) {
    advancedNavPills.forEach((pill) => {
      const active = pill.getAttribute('data-tool') === toolName;
      pill.classList.toggle('active', active);
    });

    advancedPanels.forEach((panel) => {
      const active = panel.id === `panel-${toolName}`;
      panel.classList.toggle('active', active);
    });

    if (toolName === 'finish') {
      updateRecapCard();
    }
  }

  if (advancedToolsTabBtn) {
    advancedToolsTabBtn.addEventListener('click', () => {
      openAdvancedTools('pitches');
    });
  }

  if (closeAdvancedBtn) {
    closeAdvancedBtn.addEventListener('click', closeAdvancedTools);
  }

  if (advancedBackdrop) {
    advancedBackdrop.addEventListener('click', (e) => {
      if (e.target === advancedBackdrop) {
        closeAdvancedTools();
      }
    });
  }

  advancedNavPills.forEach((pill) => {
    pill.addEventListener('click', () => {
      const tool = pill.getAttribute('data-tool');
      if (tool) switchAdvancedTool(tool);
    });
  });

  // Close with Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (advancedBackdrop && advancedBackdrop.classList.contains('open')) closeAdvancedTools();
    }
  });

  // Initial renders
  updateInningDisplay();
  updateOutsDisplay();
  updateTimerUI();
  updateBoxScoreTable();
  updatePitchDisplay();
  updateHitTeamUI();
  renderHitLogList();
  updateRecapCard();
});
