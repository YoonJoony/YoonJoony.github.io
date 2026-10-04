// 원본 HTML에는 움직임이 없습니다. 제목이 실제로 넘칠 때만 순환 이동을 더합니다.
// custom element는 화면에 붙거나 제거될 때 초기화/정리를 자동으로 호출합니다.
class NoticeBar extends HTMLElement {
  private dispose?: () => void;

  connectedCallback() {
    if (this.dispose) return;
    const viewport = this.querySelector<HTMLElement>('[data-notice-viewport]')!;
    const track = this.querySelector<HTMLElement>('[data-notice-track]')!;
    const original = this.querySelector<HTMLElement>('[data-notice-original]')!;
    const label = this.querySelector<HTMLElement>('.notice-label')!;
    const toggle = this.querySelector<HTMLButtonElement>('[data-notice-toggle]')!;
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
    const events = new AbortController();
    const options = { signal: events.signal };
    let animation: Animation | undefined;
    let copy: HTMLElement | undefined;
    let distance = 0;
    let overflow = false;
    let manual = false;
    let userPaused = false;
    let hovering = false;
    let keyboard = false;
    let frame = 0;
    let gesture: { id: number; x: number; y: number; scroll: number; dragging: boolean } | undefined;
    let suppressClick = false;

    const updateMotion = () => {
      const stopped = userPaused || manual || reducedMotion.matches;
      toggle.textContent = stopped ? '재생' : '멈춤';
      toggle.setAttribute('aria-label', `공지 자동 이동 ${stopped ? '재생' : '멈춤'}`);
      if (stopped || hovering || this.contains(document.activeElement) && keyboard) animation?.pause();
      else animation?.play();
    };

    // 애니메이션의 현재 위치를 수동 스크롤 위치로 넘길 때 사용합니다.
    const currentOffset = () => {
      const transform = getComputedStyle(track).transform;
      return transform === 'none' ? 0 : -new DOMMatrixReadOnly(transform).m41;
    };
    const stopAnimation = () => {
      animation?.cancel();
      animation = undefined;
      copy?.remove();
      copy = undefined;
    };
    const readManually = (focused?: HTMLElement) => {
      const offset = animation ? currentOffset() : viewport.scrollLeft;
      manual = true;
      userPaused = true;
      stopAnimation();
      this.dataset.mode = 'manual';
      viewport.scrollLeft = offset;
      focused?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'instant' });
      updateMotion();
    };

    const startAnimation = (newDistance: number) => {
      if (animation && distance === newDistance) return;
      const offset = animation ? currentOffset() : viewport.scrollLeft;
      stopAnimation();
      distance = newDistance;
      copy = original.cloneNode(true) as HTMLElement;
      copy.removeAttribute('data-notice-original');
      copy.setAttribute('data-notice-copy', '');
      copy.setAttribute('aria-hidden', 'true');
      copy.querySelectorAll('a').forEach((link) => { link.tabIndex = -1; });
      track.append(copy);
      viewport.scrollLeft = 0;
      this.dataset.mode = 'auto';
      animation = track.animate([
        { transform: 'translateX(0)' },
        { transform: `translateX(-${distance}px)` },
      ], { duration: distance / 18 * 1000, iterations: Infinity, easing: 'linear', delay: 1500, fill: 'both' });
      if (offset > 0) animation.currentTime = 1500 + (offset % distance) / 18 * 1000;
    };

    const measure = () => {
      // 버튼을 숨겼을 때의 너비로 판단해야 버튼 출현 때문에 측정이 반복되지 않습니다.
      const gap = Number.parseFloat(getComputedStyle(this).columnGap) || 0;
      const available = this.clientWidth - label.getBoundingClientRect().width - gap;
      const width = original.getBoundingClientRect().width;
      overflow = width > available + 1;
      toggle.hidden = !overflow || reducedMotion.matches;
      if (!overflow) {
        stopAnimation();
        manual = false;
        userPaused = false;
        this.dataset.mode = 'static';
        viewport.scrollLeft = 0;
      } else if (manual || reducedMotion.matches) {
        stopAnimation();
        this.dataset.mode = 'manual';
      } else {
        startAnimation(width + (Number.parseFloat(getComputedStyle(track).columnGap) || 0));
      }
      updateMotion();
    };
    const scheduleMeasure = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };
    const observer = new ResizeObserver(scheduleMeasure);
    observer.observe(this);
    observer.observe(original);
    observer.observe(label);
    document.fonts.ready.then(() => { if (!events.signal.aborted) scheduleMeasure(); });
    reducedMotion.addEventListener('change', () => {
      if (reducedMotion.matches) readManually();
      measure();
    }, options);

    this.addEventListener('pointerenter', (event) => {
      if (event.pointerType === 'mouse') { hovering = true; updateMotion(); }
    }, options);
    this.addEventListener('pointerleave', (event) => {
      if (event.pointerType === 'mouse') { hovering = false; updateMotion(); }
    }, options);
    document.addEventListener('keydown', (event) => { if (event.key === 'Tab') keyboard = true; }, options);
    document.addEventListener('pointerdown', () => { keyboard = false; }, { ...options, capture: true });
    this.addEventListener('focusin', (event) => {
      if (keyboard && event.target instanceof HTMLElement && original.contains(event.target)) readManually(event.target);
      else updateMotion();
    }, options);
    this.addEventListener('focusout', () => queueMicrotask(updateMotion), options);
    // 복제본은 마우스로 클릭할 수 있지만 키보드 초점을 받지 않습니다.
    track.addEventListener('mousedown', (event) => {
      if (event.target instanceof Element && event.target.closest('[data-notice-copy]')) event.preventDefault();
    }, options);
    toggle.addEventListener('click', () => {
      if (manual || userPaused) {
        manual = false;
        userPaused = false;
        measure();
      } else readManually();
    }, options);

    // 터치할 때는 현재 위치에서 멈춥니다. 탭은 링크로, 가로 드래그는 수동 읽기로 처리합니다.
    viewport.addEventListener('pointerdown', (event) => {
      suppressClick = false;
      if (event.pointerType !== 'touch' || !animation) return;
      gesture = { id: event.pointerId, x: event.clientX, y: event.clientY, scroll: 0, dragging: false };
      userPaused = true;
      updateMotion();
    }, options);
    viewport.addEventListener('pointermove', (event) => {
      if (!gesture || event.pointerId !== gesture.id) return;
      const dx = gesture.x - event.clientX;
      const dy = gesture.y - event.clientY;
      if (!gesture.dragging && Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy)) {
        readManually();
        gesture.dragging = true;
        gesture.scroll = viewport.scrollLeft;
        viewport.setPointerCapture(event.pointerId);
      }
      if (gesture.dragging) {
        event.preventDefault();
        viewport.scrollLeft = gesture.scroll + dx;
      }
    }, options);
    const endGesture = () => {
      suppressClick = gesture?.dragging ?? false;
      gesture = undefined;
    };
    viewport.addEventListener('pointerup', endGesture, options);
    viewport.addEventListener('pointercancel', endGesture, options);
    viewport.addEventListener('click', (event) => {
      if (suppressClick) { event.preventDefault(); suppressClick = false; }
    }, { ...options, capture: true });
    window.addEventListener('pagehide', () => animation?.pause(), options);
    window.addEventListener('pageshow', scheduleMeasure, options);

    this.dispose = () => {
      events.abort();
      observer.disconnect();
      cancelAnimationFrame(frame);
      stopAnimation();
      toggle.hidden = true;
      delete this.dataset.mode;
      this.dispose = undefined;
    };
    measure();
  }

  disconnectedCallback() { this.dispose?.(); }
}

if (!customElements.get('notice-bar')) customElements.define('notice-bar', NoticeBar);
