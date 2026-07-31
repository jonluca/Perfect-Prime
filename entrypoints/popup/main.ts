import "./style.css";

type Options = {
  autoPlayNext: boolean;
  watchCredits: boolean;
  skipTitleSequence: boolean;
  skipRecap: boolean;
  skipAds: boolean;
  highContrast: boolean;
};

const defaults: Options = {
  autoPlayNext: true,
  watchCredits: false,
  skipTitleSequence: true,
  skipRecap: true,
  skipAds: true,
  highContrast: false
};
let options = defaults;

function localize(): void {
  for (const element of document.querySelectorAll<HTMLElement>("[data-i18n]")) {
    const key = element.dataset.i18n as Parameters<typeof browser.i18n.getMessage>[0] | undefined;
    const message = key ? browser.i18n.getMessage(key) : "";
    if (message) element.textContent = message;
  }
}

function render(): void {
  for (const input of document.querySelectorAll<HTMLInputElement>("[data-option]")) {
    const key = input.dataset.option as keyof Options;
    input.checked = Boolean(options[key]);
  }
  document.documentElement.classList.toggle("high-contrast", options.highContrast);
}

async function save(): Promise<void> {
  await browser.storage.sync.set({ options });
  await browser.runtime.sendMessage({ action: "optionsChanged", options }).catch(() => undefined);
}

document.querySelector("#options")?.addEventListener("change", (event) => {
  const input = event.target;
  if (!(input instanceof HTMLInputElement) || !input.dataset.option) return;
  const key = input.dataset.option as keyof Options;
  (options[key] as boolean) = input.checked;
  if (key === "autoPlayNext" && input.checked) options.watchCredits = false;
  if (key === "watchCredits" && input.checked) options.autoPlayNext = false;
  render();
  void save();
});
document.querySelector("#contrast")?.addEventListener("click", () => {
  options.highContrast = !options.highContrast;
  render();
  void save();
});
for (const link of document.querySelectorAll<HTMLElement>("[data-url]")) {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    const url = link.dataset.url;
    if (url) void browser.tabs.create({ url });
  });
}

localize();
const stored = await browser.storage.sync.get("options");
options = { ...defaults, ...(typeof stored.options === "object" ? stored.options : {}) };
render();
