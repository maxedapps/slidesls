// Browser-side motion verification. Single frames cannot see motion, so this
// script runs a scripted navigation sequence inside the page and samples
// rendered state on a timeline: entrance opacity ramp, exit completion,
// stagger paint-in distinctness, and a key-spam interrupt run. The returned
// JSON is judged offline by analyzeMotion().
export function motionCheckScript() {
  return String.raw`(async () => {
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const press = (key) =>
    document.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true }));
  const deck = document.querySelector("[data-ls-deck]");
  const slides = [...document.querySelectorAll(".ls-slide")];
  const opacity = (element) => Number.parseFloat(getComputedStyle(element).opacity);
  const display = (element) => getComputedStyle(element).display;
  const state = () => ({
    current: deck.dataset.lsCurrentSlide,
    activeCount: slides.filter((slide) => slide.dataset.active === "true").length,
    transitCount: slides.filter((slide) => slide.dataset.lsTransit).length,
    // Only slide-level WAAPI pairs count as orphans; child entrance
    // transitions legitimately outlive a navigation on slow styles.
    runningAnimations: deck
      .getAnimations({ subtree: true })
      .filter((a) => a.playState === "running" && a.effect?.target?.classList?.contains("ls-slide"))
      .length,
  });

  const result = { slideCount: slides.length };
  if (!deck || slides.length < 2) return JSON.stringify({ ...result, skipped: "needs >=2 slides" });

  // Reset to slide 1 without animation.
  location.hash = "#slide=1&step=0";
  await sleep(80);

  // Entrance burst: navigate 1 -> 2, sample the entering slide's opacity ramp
  // and the leaving slide's teardown.
  const from = slides[0];
  const to = slides[1];
  press("ArrowRight");
  const burst = [];
  const start = performance.now();
  for (const at of [0, 120, 300, 600]) {
    const elapsed = performance.now() - start;
    if (at > elapsed) await sleep(at - elapsed);
    burst.push({
      at,
      enteringOpacity: opacity(to),
      leavingDisplay: display(from),
      leavingTransit: from.dataset.lsTransit || null,
    });
  }
  await sleep(300);
  result.entranceBurst = burst;
  result.afterEntrance = { ...state(), leavingDisplay: display(from) };

  // Stagger distinctness: sample entering-slide units mid-entrance.
  location.hash = "#slide=1&step=0";
  await sleep(700);
  press("ArrowRight");
  await sleep(150);
  const units = [...to.querySelectorAll("[data-ls-enter]")];
  result.staggerSample = units.map((unit) => ({
    index: unit.style.getPropertyValue("--ls-enter-index"),
    opacity: opacity(unit),
  }));
  await sleep(900);
  result.staggerSettled = units.map((unit) => opacity(unit));

  // Key-spam interrupt run: 5 navigations in ~500ms must end on a coherent
  // state with no orphaned transits or running slide animations.
  const spamKeys = ["ArrowRight", "ArrowLeft", "ArrowRight", "ArrowRight", "ArrowLeft"];
  for (const key of spamKeys) {
    press(key);
    await sleep(90);
  }
  await sleep(900);
  result.afterSpam = state();
  result.afterSpamDisplayedSlides = slides.filter((slide) => display(slide) !== "none").length;

  return JSON.stringify(result);
})()`;
}

function findings(entries) {
  return entries.filter(Boolean);
}

// Offline judgement of the collected motion facts. Returns { failures: [] }.
export function analyzeMotion(collected, { name = "motion" } = {}) {
  if (collected.skipped) return { failures: [], skipped: collected.skipped };
  const burst = collected.entranceBurst || [];
  const opacities = burst.map((sample) => sample.enteringOpacity);
  const strictlyRising = opacities.every(
    (value, index) => index === 0 || value > opacities[index - 1] - 0.001,
  );
  const movedAtAll = opacities.length >= 2 && opacities.at(-1) > opacities[0] + 0.2;
  const staggerOpacities = (collected.staggerSample || []).map((unit) => unit.opacity);
  const distinctStagger =
    staggerOpacities.length < 2 ||
    staggerOpacities.some(
      (value, index) => index > 0 && Math.abs(value - staggerOpacities[index - 1]) > 0.03,
    );

  return {
    failures: findings([
      !strictlyRising &&
        `${name}: entering slide opacity is not monotonically increasing: ${opacities.join(", ")}`,
      !movedAtAll && `${name}: entering slide shows no opacity ramp: ${opacities.join(", ")}`,
      collected.afterEntrance?.leavingDisplay !== "none" &&
        `${name}: leaving slide still displayed after the transition settled`,
      collected.afterEntrance?.transitCount !== 0 &&
        `${name}: data-ls-transit attribute left behind after settle`,
      !distinctStagger &&
        `${name}: stagger units paint in lockstep mid-entrance: ${staggerOpacities.join(", ")}`,
      (collected.staggerSettled || []).some((value) => value < 0.999) &&
        `${name}: stagger units did not settle at opacity 1`,
      collected.afterSpam?.activeCount !== 1 &&
        `${name}: key-spam left ${collected.afterSpam?.activeCount} active slides`,
      collected.afterSpam?.transitCount !== 0 &&
        `${name}: key-spam left orphaned data-ls-transit slides`,
      collected.afterSpam?.runningAnimations !== 0 &&
        `${name}: key-spam left ${collected.afterSpam?.runningAnimations} running animations`,
      collected.afterSpamDisplayedSlides !== 1 &&
        `${name}: ${collected.afterSpamDisplayedSlides} slides displayed after key-spam settled`,
    ]),
  };
}
