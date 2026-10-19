import { ItemView, Modal, Notice } from 'obsidian';
import { WheelVaultModal } from './WheelVaultModal.js';
import { ThemeModal } from './ThemeModal.js';

const VIEW_TYPE = 'decision-wheel-view';
const newId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

class SpinResultModal extends Modal {
  constructor(app, label, count, onHide) {
    super(app);
    this.label = label;
    this.count = count;
    this.onHide = onHide;
  }
  onOpen() {
    this.titleEl.setText('🎉 Spin Result');
    this.contentEl.addClass('dw-result-modal');
    this.contentEl.createEl('h2', { text: this.label, cls: 'dw-result-name' });
    this.contentEl.createEl('p', { text: `Landed on ${this.count} ${this.count === 1 ? 'time' : 'times'}.`, cls: 'dw-result-count' });
    const actions = this.contentEl.createDiv({ cls: 'dw-result-actions' });
    actions.createEl('button', { text: 'Keep Slice', cls: 'mod-cta' }).addEventListener('click', () => this.close());
    actions.createEl('button', { text: 'Hide Slice' }).addEventListener('click', async () => {
      await this.onHide();
      this.close();
    });
  }
}

export class WheelView extends ItemView {
  constructor(leaf, plugin) {
    super(leaf);
    this.plugin = plugin;
    this.wheelId = 'active-session';
    this.wheelName = 'Yes or No?';
    this.wheelGroup = 'General';
    this.slices = ['YES', 'NO', 'MAYBE'];
    this.sliceIds = [];
    this.hiddenSliceIds = [];
    this.sliceTallies = {};
    this.activeColors = ['#5c1d11', '#a62c19', '#d45026', '#f2a024'];
    this.currentAngle = 0;
    this.isSpinning = false;
    this.spinVelocity = 0;
    this.canvasContext = null;
    this.canvasEl = null;
    this.ensureSliceData();
  }
  getViewType() { return VIEW_TYPE; }
  getDisplayText() { return 'Decision Wheel'; }

  ensureSliceData() {
    if (!Array.isArray(this.slices)) this.slices = [];
    if (!Array.isArray(this.sliceIds)) this.sliceIds = [];
    if (!Array.isArray(this.hiddenSliceIds)) this.hiddenSliceIds = [];
    if (!this.sliceTallies || typeof this.sliceTallies !== 'object') this.sliceTallies = {};
    this.sliceIds = this.slices.map((_, i) => this.sliceIds[i] || newId());
    const valid = new Set(this.sliceIds);
    this.hiddenSliceIds = [...new Set(this.hiddenSliceIds)].filter(id => valid.has(id));
    this.sliceTallies = Object.fromEntries(this.sliceIds.map(id => [id, Math.max(0, Number(this.sliceTallies[id]) || 0)]));
  }
  snapshot() {
    this.ensureSliceData();
    return { slices: [...this.slices], sliceIds: [...this.sliceIds], hiddenSliceIds: [...this.hiddenSliceIds], sliceTallies: { ...this.sliceTallies } };
  }
  async persistState() {
    const state = this.snapshot();
    if (this.wheelId === 'active-session') {
      this.plugin.settings.activeWheelState = state;
    } else {
      const saved = this.plugin.settings.savedWheels.find(w => w.id === this.wheelId);
      if (saved) Object.assign(saved, state);
    }
    await this.plugin.saveSettings();
  }
  loadWheel(saved) {
    this.wheelId = saved.id;
    this.wheelName = saved.name;
    this.wheelGroup = saved.group;
    this.slices = [...saved.slices];
    this.sliceIds = [...(saved.sliceIds || [])];
    this.hiddenSliceIds = [...(saved.hiddenSliceIds || [])];
    this.sliceTallies = { ...(saved.sliceTallies || {}) };
    this.ensureSliceData();
    this.persistState();
  }
  getActiveIndices() {
    this.ensureSliceData();
    const hidden = new Set(this.hiddenSliceIds);
    return this.slices.map((_, i) => i).filter(i => !hidden.has(this.sliceIds[i]));
  }
  refresh() {
    if (this.titleElement) this.titleElement.setText(this.wheelName);
    this.renderListRef?.();
    this.renderTallyRef?.();
    this.drawWheel();
  }
  async onOpen() {
    const saved = this.plugin.settings.activeWheelState;
    if (this.wheelId === 'active-session' && saved) {
      this.slices = [...(saved.slices || this.slices)];
      this.sliceIds = [...(saved.sliceIds || [])];
      this.hiddenSliceIds = [...(saved.hiddenSliceIds || [])];
      this.sliceTallies = { ...(saved.sliceTallies || {}) };
    }
    this.ensureSliceData();
    const root = this.contentEl;
    root.empty();
    const container = root.createDiv({ cls: 'wheel-plugin-container' });
    this.titleElement = container.createEl('h3', { text: this.wheelName, cls: 'wheel-title' });
    const wheelSection = container.createDiv({ cls: 'wheel-section' });
    this.canvasEl = wheelSection.createEl('canvas');
    this.canvasEl.width = 200;
    this.canvasEl.height = 200;
    this.canvasContext = this.canvasEl.getContext('2d');
    this.drawWheel();
    wheelSection.createEl('button', { text: 'SPIN ▶', cls: 'wheel-spin-btn' }).addEventListener('click', () => this.startSpinPhysics());
    container.createEl('hr');
    const toolbar = container.createDiv({ cls: 'dw-toolbar' });
    toolbar.createEl('button', { text: '🎨 Colors' }).addEventListener('click', () => {
      new ThemeModal(this.app, this.plugin, colors => {
        this.activeColors = colors;
        this.refresh();
      }).open();
    });
    toolbar.createEl('button', { text: '📂 Wheels Vault' }).addEventListener('click', () => {
      new WheelVaultModal(this.app, this.plugin, this, () => this.refresh()).open();
    });
    container.createEl('hr');
    container.createEl('h4', { text: 'Slices' });
    const list = container.createDiv({ cls: 'wheel-list' });
    this.renderListRef = () => {
      list.empty();
      this.ensureSliceData();
      const colors = this.getClashFreeColors();
      this.slices.forEach((label, i) => {
        const id = this.sliceIds[i];
        const hidden = this.hiddenSliceIds.includes(id);
        const row = list.createDiv({ cls: `wheel-item-row${hidden ? ' dw-slice-hidden' : ''}` });
        row.createDiv({ cls: 'dw-slice-dot' }).style.backgroundColor = colors[i] || '#a62c19';
        row.createEl('span', { text: label, cls: 'wheel-item-text' });
        const controls = row.createDiv({ cls: 'dw-slice-controls' });
        controls.createEl('button', { text: '✎', attr: { 'aria-label': `Edit ${label}`, title: 'Edit slice' } }).addEventListener('click', () => {
          row.empty();
          const input = row.createEl('input', { type: 'text', value: label, cls: 'dw-edit-input' });
          const save = async () => {
            const value = input.value.trim();
            if (value) {
              this.slices[i] = value;
              await this.persistState();
            }
            this.refresh();
          };
          row.createEl('button', { text: 'Save' }).addEventListener('click', save);
          row.createEl('button', { text: 'Cancel' }).addEventListener('click', () => this.refresh());
          input.addEventListener('keydown', e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') this.refresh(); });
          input.focus();
        });
        if (hidden) {
          controls.createEl('button', { text: 'Restore', attr: { 'aria-label': `Restore ${label}` } }).addEventListener('click', async () => {
            this.hiddenSliceIds = this.hiddenSliceIds.filter(value => value !== id);
            await this.persistState();
            this.refresh();
          });
        }
        controls.createEl('button', { text: '×', cls: 'wheel-delete-btn', attr: { 'aria-label': `Delete ${label}` } }).addEventListener('click', async () => {
          if (this.isSpinning) return;
          this.slices.splice(i, 1);
          this.sliceIds.splice(i, 1);
          this.hiddenSliceIds = this.hiddenSliceIds.filter(value => value !== id);
          delete this.sliceTallies[id];
          await this.persistState();
          this.refresh();
        });
      });
    };
    this.renderListRef();
    const addRow = container.createDiv({ cls: 'dw-add-row' });
    const input = addRow.createEl('input', { type: 'text', attr: { placeholder: 'New slice name...' } });
    const addButton = addRow.createEl('button', { text: '➕ ADD', cls: 'wheel-add-btn' });
    const add = async () => {
      const value = input.value.trim();
      if (!value || this.isSpinning) return;
      this.slices.push(value);
      this.sliceIds.push(newId());
      input.value = '';
      await this.persistState();
      this.refresh();
    };
    addButton.addEventListener('click', add);
    input.addEventListener('keydown', e => { if (e.key === 'Enter') add(); });

    const tallyDetails = container.createEl('details', { cls: 'dw-tally-panel' });
    tallyDetails.createEl('summary', { text: 'Spin Tally' });
    const tallyBody = tallyDetails.createDiv();
    this.renderTallyRef = () => {
      tallyBody.empty();
      if (!this.slices.length) tallyBody.createEl('p', { text: 'No slices yet.' });
      this.slices.forEach((label, i) => {
        const row = tallyBody.createDiv({ cls: 'dw-tally-row' });
        const hidden = this.hiddenSliceIds.includes(this.sliceIds[i]);
        row.createEl('span', { text: `${label}${hidden ? ' (hidden)' : ''}` });
        row.createEl('strong', { text: String(this.sliceTallies[this.sliceIds[i]] || 0) });
      });
      tallyBody.createEl('button', { text: 'Reset Tallies' }).addEventListener('click', async () => {
        for (const id of this.sliceIds) this.sliceTallies[id] = 0;
        await this.persistState();
        this.renderTallyRef();
      });
    };
    this.renderTallyRef();
  }
  getClashFreeColors() {
    const count = this.getActiveIndices().length;
    const palette = this.activeColors.length ? this.activeColors : ['#a62c19'];
    if (count === 0) return [];
    if (palette.length < 2) return Array(count).fill(palette[0]);
    const result = [];
    const choose = i => {
      if (i === count) return count === 1 || result[count - 1] !== result[0];
      for (let c = 0; c < palette.length; c++) {
        if (i > 0 && result[i - 1] === c) continue;
        result.push(c);
        if (choose(i + 1)) return true;
        result.pop();
      }
      return false;
    };
    return choose(0) ? result.map(i => palette[i]) : Array.from({ length: count }, (_, i) => palette[i % palette.length]);
  }
  drawWheel() {
    const ctx = this.canvasContext;
    if (!ctx || !this.canvasEl) return;
    const active = this.getActiveIndices();
    const count = active.length;
    const cx = this.canvasEl.width / 2;
    const cy = this.canvasEl.height / 2;
    const radius = cx - 5;
    ctx.clearRect(0, 0, this.canvasEl.width, this.canvasEl.height);
    if (!count) {
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, 2 * Math.PI);
      ctx.fillStyle = '#777777';
      ctx.fill();
      return;
    }
    const size = 2 * Math.PI / count;
    const colors = this.getClashFreeColors();
    active.forEach((sliceIndex, i) => {
      const start = this.currentAngle + i * size;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, radius, start, start + size);
      ctx.fillStyle = colors[i] || '#a62c19';
      ctx.fill();
      ctx.stroke();
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(start + size / 2);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(this.slices[sliceIndex] || '', radius - 15, 4);
      ctx.restore();
    });
    ctx.beginPath();
    ctx.arc(cx, cy, 12, 0, 2 * Math.PI);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.stroke();
  }
  startSpinPhysics() {
    if (this.isSpinning) return;
    if (!this.getActiveIndices().length) {
      new Notice('No active slices. Restore or add a slice to spin.');
      return;
    }
    this.isSpinning = true;
    this.spinVelocity = 0.4 + Math.random() * 0.3;
    const tick = () => {
      this.currentAngle += this.spinVelocity;
      this.spinVelocity *= 0.98;
      this.drawWheel();
      if (this.spinVelocity > 0.002) requestAnimationFrame(tick);
      else {
        this.isSpinning = false;
        this.calculateWinner();
      }
    };
    tick();
  }
  async calculateWinner() {
    const active = this.getActiveIndices();
    if (!active.length) return;
    const size = 2 * Math.PI / active.length;
    const angle = ((3.5 * Math.PI - (this.currentAngle % (2 * Math.PI))) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
    const index = active[Math.floor(angle / size) % active.length];
    const id = this.sliceIds[index];
    const label = this.slices[index];
    this.sliceTallies[id] = (this.sliceTallies[id] || 0) + 1;
    await this.persistState();
    this.renderTallyRef?.();
    new SpinResultModal(this.app, label, this.sliceTallies[id], async () => {
      if (!this.hiddenSliceIds.includes(id)) this.hiddenSliceIds.push(id);
      await this.persistState();
      this.refresh();
    }).open();
  }
  async onClose() {
    this.canvasContext = null;
    this.canvasEl = null;
  }
}
