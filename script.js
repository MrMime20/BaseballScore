// script.js - Baseball Scorekeeper with Arrow Top/Bottom Indicator & Swipe Gestures

document.addEventListener('DOMContentLoaded', () => {
  // Game State
  let homeScoreVal = 4;
  let awayScoreVal = 0;
  let currentInning = 1;
  let isTopInning = true;
  let currentOuts = 0;

  // DOM Elements - Scores & Teams
  const homeScoreEl = document.getElementById('home-score');
  const awayScoreEl = document.getElementById('away-score');
  const homeLabelEl = document.getElementById('home-label');
  const awayLabelEl = document.getElementById('away-label');
  const timerEl = document.getElementById('timer');

  // DOM Elements - Inning & Half Arrows
  const inningValEl = document.getElementById('inning-val');
  const inningUpBtn = document.getElementById('inning-up');
  const inningDownBtn = document.getElementById('inning-down');
  const inningContainer = document.getElementById('inning-container');

  // DOM Elements - Outs Tracker
  const outsContainer = document.getElementById('outs-container');
  const outCircles = document.querySelectorAll('.out-circle');

  // --- Visual Feedback & Toast Utilities ---
  let sideChangeTimeout = null;
  let toastHideTimeout = null;

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
    }, 1600);
  }

  // --- Automatic 3-Outs Side Change Logic ---
  function handleThreeOuts() {
    clearTimeout(sideChangeTimeout);

    // 1. Immediately light up all 3 outs
    currentOuts = 3;
    updateOutsDisplay();

    // 2. Visual flash animation on the outs container
    if (outsContainer) {
      outsContainer.classList.remove('flash-3outs');
      void outsContainer.offsetWidth;
      outsContainer.classList.add('flash-3outs');
    }

    // 3. Prepare visual toast notification describing the change
    showInningToast('3 OUTS', 'CHANGE SIDES');

    // 4. Brief pause (450ms) so user sees 3 outs registered, then advance side and reset outs
    sideChangeTimeout = setTimeout(() => {
      currentOuts = 0;
      updateOutsDisplay();

      if (isTopInning) {
        // Top of inning -> Bottom of same inning
        isTopInning = false;
      } else {
        // Bottom of inning -> Top of next inning
        currentInning++;
        isTopInning = true;
      }

      updateInningDisplay();

      // Pulse animation on inning container to highlight new state
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

    // Highlight top arrow for Top of inning, bottom arrow for Bottom of inning
    if (inningUpBtn) {
      inningUpBtn.classList.toggle('active', isTopInning);
      inningUpBtn.setAttribute('aria-pressed', isTopInning ? 'true' : 'false');
      inningUpBtn.title = isTopInning ? 'Top of Inning (active) - click to +1 Inning' : 'Click to set Top of Inning';
    }
    if (inningDownBtn) {
      inningDownBtn.classList.toggle('active', !isTopInning);
      inningDownBtn.setAttribute('aria-pressed', !isTopInning ? 'true' : 'false');
      inningDownBtn.title = !isTopInning ? 'Bottom of Inning (active) - click to -1 Inning' : 'Click to set Bottom of Inning';
    }

    // Clean batting indicator: Away bats in Top, Home bats in Bottom
    if (awayLabelEl && homeLabelEl) {
      awayLabelEl.classList.toggle('batting', isTopInning);
      homeLabelEl.classList.toggle('batting', !isTopInning);
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
      // If clicking already active arrow, advance/decrement inning number
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

  // Arrow button click listeners
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

  // --- Runs (Score) Modification Logic ---
  function changeHomeScore(delta) {
    homeScoreVal = Math.max(0, homeScoreVal + delta);
    if (homeScoreEl) {
      homeScoreEl.textContent = homeScoreVal;
      triggerPop(homeScoreEl);
    }
  }

  function changeAwayScore(delta) {
    awayScoreVal = Math.max(0, awayScoreVal + delta);
    if (awayScoreEl) {
      awayScoreEl.textContent = awayScoreVal;
      triggerPop(awayScoreEl);
    }
  }

  // Contextmenu (right-click) to remove runs / innings / outs
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

  // Individual out circle clicks
  outCircles.forEach((circle) => {
    circle.addEventListener('click', (e) => {
      e.stopPropagation();
      const clickedOut = parseInt(circle.getAttribute('data-out'), 10);
      if (currentOuts === clickedOut) {
        clearTimeout(sideChangeTimeout);
        currentOuts = clickedOut - 1; // Click active out to turn it off
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

  // --- Universal Touch & Mouse Swipe Gesture Detector ---
  function setupSwipeGestures(element, { onSwipeUp, onSwipeDown, onSwipeLeft, onSwipeRight, onTap }) {
    if (!element) return;

    let startX = 0;
    let startY = 0;
    let isTracking = false;
    let moved = false;
    let startTime = 0;

    element.addEventListener('pointerdown', (e) => {
      // Ignore right clicks for gestures
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
      const threshold = 18; // Distance in px to trigger swipe

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

      // If user simply tapped without swiping
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

  // --- Attach Gestures to Components ---

  // 1. Home Score: Tap / Swipe Up = +1 Run; Swipe Down = -1 Run
  setupSwipeGestures(homeScoreEl, {
    onSwipeUp: () => changeHomeScore(+1),
    onSwipeDown: () => changeHomeScore(-1),
    onTap: () => changeHomeScore(+1),
  });

  // 2. Away Score: Tap / Swipe Up = +1 Run; Swipe Down = -1 Run
  setupSwipeGestures(awayScoreEl, {
    onSwipeUp: () => changeAwayScore(+1),
    onSwipeDown: () => changeAwayScore(-1),
    onTap: () => changeAwayScore(+1),
  });

  // 3. Inning Container & Number:
  //    - Tap / Swipe Up = +1 Inning
  //    - Swipe Down = -1 Inning (removes inning)
  //    - Swipe Left / Right = Toggle Top/Bottom
  setupSwipeGestures(inningContainer, {
    onSwipeUp: () => incrementInning(),
    onSwipeDown: () => decrementInning(),
    onSwipeLeft: () => toggleInningHalf(),
    onSwipeRight: () => toggleInningHalf(),
    onTap: (e) => {
      // If clicked on arrows, arrow listeners handled it; if clicked on number/container, increment inning
      if (!e.target.closest('.arrow-btn')) {
        incrementInning();
      }
    },
  });

  // 4. Outs Container:
  //    - Swipe Up / Right = +1 Out
  //    - Swipe Down / Left = -1 Out (removes out)
  //    - Tap container background = +1 Out (cycle)
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

  // --- Initialize UI State ---
  updateInningDisplay();
  updateOutsDisplay();

  // --- Stopwatch Timer ---
  let secondsElapsed = 0;
  function formatTime(totalSeconds) {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    const pad = (num) => String(num).padStart(2, '0');
    return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
  }

  if (timerEl) {
    setInterval(() => {
      secondsElapsed++;
      timerEl.textContent = formatTime(secondsElapsed);
    }, 1000);
  }
});
