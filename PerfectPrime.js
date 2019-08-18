let options = {};
let monitor = null;
chrome.runtime.onMessage.addListener(onMessage);

function onMessage(message, sender, sendResponse) {
  if (message.action === 'optionsChanged') {
    options = message.options;
  }
}

$(_ => {
  loadOptions(receivedOptions => {
    options = receivedOptions;
    startHelper();
    window.onhashchange = function () {
      startHelper();
      console.log('hashchange');
    };

    // Reset the mutation observer every 30 minutes in case the document changes
    setInterval(_ => {
      startHelper();
    }, 1000 * 60 * 30);
  });
});

function startMonitoringForSelectors(selectors) {
  // Maintain a reference to the global monitor and disconnect it
  // This is needed because single page apps will rearrange their HTML and we won't be able to monitor for the
  // appropriate changes anymore
  if (monitor) {
    monitor.disconnect();
  }

  const observerFunction = debounce(_ => {
    let selector = selectors.join(', ');
    for (const elem of document.querySelectorAll(selector)) {
      let shouldClick = true;
      // Skip Recap and Skip Intro have the same selectors, so we need to differentiate between clicking them here
      if (elem && elem.textContent) {
        const text = elem.textContent;
        if (text === 'Skip Recap' && !options.skipRecap) {
          shouldClick = false;
        } else if (text === 'Skip Intro' && !options.skipTitleSequence) {
          shouldClick = false;
        }
      }
      shouldClick && elem.click();
    }
  }, 100);

  monitor = new MutationObserver(observerFunction);

  /*Start monitoring at html body*/
  monitor.observe(document.body, {
    attributes: false, // Don't monitor attribute changes
    childList: true, // Monitor direct child elements (anything observable) changes
    subtree: true // Monitor all descendants
  });

}

function startHelper() {
  let selectors = [];

  if (options.skipTitleSequence) {
    enableSkipTitleSequence(selectors);
  }

  if (options.autoPlayNext) {
    enableAutoPlayNext(selectors);
  }

  if (options.skipRecap) {
    /* Skip if still watching*/
    enableSkipRecap(selectors);
  }

  if (options.skipAds) {
    /* Skip if still watching*/
    enableSkipAds(selectors);
  }

  if (options.watchCredits) {
    watchCredits(selectors);
  }

  startMonitoringForSelectors(selectors);
}

function enableAutoPlayNext(selectors) {
  /*Skip title sequence*/
  selectors.push('.nextUpCard > .playIconWrapper > .playIcon');
}

function enableSkipTitleSequence(selectors) {
  /*Skip title sequence*/
  selectors.push('[aria-label="Skip Intro"]');
}

function enableSkipRecap(selectors) {
  /*Skip title sequence*/
  selectors.push('.skipElement');
}

function enableSkipAds(selectors) {
  /*Skip title sequence*/
  selectors.push('.adSkipButton');
}

function watchCredits(selectors) {
  /*Skip title sequence*/
  selectors.push('.nextUpHideText');
}

// Credit David Walsh (https://davidwalsh.name/javascript-debounce-function)

// Returns a function, that, as long as it continues to be invoked, will not
// be triggered. The function will be called after it stops being called for
// N milliseconds. If `immediate` is passed, trigger the function on the
// leading edge, instead of the trailing.
function debounce(func, wait, immediate) {
  let timeout;

  return function executedFunction() {
    const context = this;
    const args = arguments;

    const later = function () {
      timeout = null;
      if (!immediate) {
        func.apply(context, args);
      }
    };

    const callNow = immediate && !timeout;

    clearTimeout(timeout);

    timeout = setTimeout(later, wait);

    if (callNow) {
      func.apply(context, args);
    }
  };
};
