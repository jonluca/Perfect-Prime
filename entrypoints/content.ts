import { PRIME_MATCHES } from "../prime-matches";

type Options = {
  autoPlayNext: boolean;
  watchCredits: boolean;
  skipTitleSequence: boolean;
  skipRecap: boolean;
  skipAds: boolean;
  highContrast: boolean;
};

const DEFAULT_OPTIONS: Options = {
  autoPlayNext: true,
  watchCredits: false,
  skipTitleSequence: true,
  skipRecap: true,
  skipAds: true,
  highContrast: false
};

function normalizeOptions(value: unknown): Options {
  return { ...DEFAULT_OPTIONS, ...(typeof value === "object" && value ? value : {}) };
}

export default defineContentScript({
  matches: [...PRIME_MATCHES],
  main() {
    let options = DEFAULT_OPTIONS;
    const lastClicked = new WeakMap<Element, number>();

    const shouldClick = (element: HTMLElement): boolean => {
      const text = element.textContent?.trim().toLowerCase() ?? "";
      if (text.includes("recap") && !options.skipRecap) return false;
      if (text.includes("intro") && !options.skipTitleSequence) return false;
      return true;
    };

    const clickMatches = (selector: string) => {
      for (const element of document.querySelectorAll<HTMLElement>(selector)) {
        if (!shouldClick(element)) continue;
        const now = Date.now();
        if (now - (lastClicked.get(element) ?? 0) < 2_000) continue;
        lastClicked.set(element, now);
        element.click();
      }
    };

    const scan = () => {
      if (options.autoPlayNext) clickMatches(".nextUpCard > .playIconWrapper > .playIcon");
      if (options.skipTitleSequence) clickMatches('[aria-label="Skip Intro"], [data-testid*="skip-intro"]');
      if (options.skipRecap || options.skipTitleSequence) clickMatches(".skipElement");
      if (options.skipAds) clickMatches(".adSkipButton, [data-testid*='skip-ad']");
      if (options.watchCredits) clickMatches(".nextUpHideText, [data-testid*='watch-credits']");
    };

    const load = async () => {
      const stored = await browser.storage.sync.get("options");
      options = normalizeOptions(stored.options);
      await browser.storage.sync.set({ options });
      scan();
    };

    browser.storage.onChanged.addListener((changes, area) => {
      if (area === "sync" && changes.options) {
        options = normalizeOptions(changes.options.newValue);
        scan();
      }
    });
    browser.runtime.onMessage.addListener((message) => {
      if (message?.action === "optionsChanged") {
        options = normalizeOptions(message.options);
        scan();
      }
    });
    new MutationObserver(scan).observe(document.documentElement, { childList: true, subtree: true });
    addEventListener("hashchange", scan);
    void load();
  }
});
