import { Modal } from 'obsidian';

export class WheelVaultModal extends Modal {
	constructor(e, t, i, r) {
		super(e);
		this.filterGroup = 'all';
		this.catInputValue = '';
		((this.plugin = t), (this.view = i), (this.onReload = r));
	}
	onOpen() {
		(this.titleEl.setText('Saved Wheels Vault'), this.render());
	}
	render() {
		let { contentEl: e } = this;
		(e.empty(),
			this.plugin.settings.wheelGroups.includes('General') ||
				this.plugin.settings.wheelGroups.unshift('General'));
		let t = e.createEl('div');
		t.setCssStyles({
			display: 'flex',
			flexWrap: 'wrap',
			gap: '10px',
			marginBottom: '15px',
			backgroundColor: 'var(--background-secondary)',
			padding: '10px',
			borderRadius: '6px',
			alignItems: 'center',
		});
		let i = t.createEl('select');
		(['all', ...this.plugin.settings.wheelGroups].forEach(
			(l) =>
				(i.createEl('option', {
					text: l === 'all' ? 'All Categories' : l,
					attr: { value: l },
				}).selected = this.filterGroup === l),
		),
			i.addEventListener('change', () => {
				((this.filterGroup = i.value), o());
			}));
		let r = t.createEl('input', {
			attr: { placeholder: 'New category...' },
		});
		(r.addClass('obsidian-input-override'),
			r.setCssStyles({ width: '120px', padding: '4px' }),
			(r.value = this.catInputValue),
			r.addEventListener('input', () => {
				this.catInputValue = r.value;
			}),
			t
				.createEl('button', { text: '\u2795' })
				.addEventListener('click', async () => {
					let l = this.catInputValue.trim();
					l &&
						!this.plugin.settings.wheelGroups.includes(l) &&
						(this.plugin.settings.wheelGroups.push(l),
						(this.catInputValue = ''),
						await this.plugin.saveSettings(),
						this.render());
				}),
			t
				.createEl('button', { text: '\u{1F5D1}\uFE0F Cat' })
				.addEventListener('click', async () => {
					let l = this.filterGroup;
					l !== 'all' && l !== 'General'
						? ((this.plugin.settings.wheelGroups =
								this.plugin.settings.wheelGroups.filter(
									(n) => n !== l,
								)),
							this.plugin.settings.savedWheels.forEach((n) => {
								n.group === l && (n.group = 'General');
							}),
							(this.filterGroup = 'all'),
							await this.plugin.saveSettings(),
							this.render())
						: alert('Cannot delete default catch-all groups.');
				}));
		let c = e.createEl('div');
		c.setCssStyles({
			display: 'grid',
			gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
			gap: '12px',
			maxHeight: '220px',
			overflowY: 'auto',
			marginBottom: '15px',
		});
		let o = () => {
			c.empty();
			let l = this.plugin.settings.savedWheels.filter(
				(n) =>
					this.filterGroup === 'all' || n.group === this.filterGroup,
			);
			if (l.length === 0) {
				c.createEl('div', {
					text: 'No configuration items found.',
				}).setCssStyles({
					textAlign: 'center',
					color: 'var(--text-muted)',
					gridColumn: '1/-1',
					padding: '20px',
				});
				return;
			}
			l.forEach((n) => {
				let v = c.createEl('div');
				v.setCssStyles({
					border: '1px solid var(--background-modifier-border)',
					borderRadius: '6px',
					padding: '10px',
					backgroundColor: 'var(--background-primary-alt)',
					position: 'relative',
					display: 'flex',
					flexDirection: 'column',
					justifyContent: 'space-between',
				});
				let y = v.createEl('div');
				(y.setCssStyles({ cursor: 'pointer' }),
					y.createEl('div', { text: n.name }).setCssStyles({
						fontWeight: 'bold',
						fontSize: '13px',
					}),
					y
						.createEl('div', { text: n.slices.join(', ') })
						.setCssStyles({
							fontSize: '11px',
							color: 'var(--text-muted)',
							whiteSpace: 'nowrap',
							overflow: 'hidden',
							textOverflow: 'ellipsis',
							margin: '4px 0',
						}),
					y.addEventListener('click', () => {
						((this.view.wheelId = n.id),
							(this.view.wheelName = n.name),
							(this.view.wheelGroup = n.group),
							this.view.loadWheel(n),
							this.onReload(),
							this.close());
					}));
				let u = v.createEl('div');
				(u.setCssStyles({
					display: 'flex',
					alignItems: 'center',
					gap: '4px',
					marginTop: '8px',
				}),
					u.createEl('span', { text: 'Cat: ' }).setCssStyles({
						fontSize: '11px',
						color: 'var(--text-muted)',
					}));
				let G = u.createEl('select');
				(G.setCssStyles({ fontSize: '11px', padding: '1px' }),
					this.plugin.settings.wheelGroups.forEach((w) => {
						G.createEl('option', {
							text: w,
							attr: { value: w },
						}).selected = n.group === w;
					}),
					G.addEventListener('change', async (w) => {
						(w.stopPropagation(),
							(n.group = G.value),
							await this.plugin.saveSettings(),
							this.render());
					}));
				let C = u.createEl('div');
				C.setCssStyles({
					display: 'flex',
					gap: '2px',
					marginLeft: 'auto',
				});
				let S = C.createEl('button', { text: '\u{1F4CB}' });
				(S.setCssStyles({ padding: '2px 6px', fontSize: '11px' }),
					S.addEventListener('click', async (w) => {
						w.stopPropagation();
						let D = {
							id: Date.now().toString(),
							name: `${n.name} (Copy)`,
							slices: [...n.slices],
							sliceIds: n.slices.map(() => `${Date.now()}-${Math.random().toString(36).slice(2)}`),
							hiddenSliceIds: [],
							sliceTallies: {},
							group: n.group,
						};
						(this.plugin.settings.savedWheels.push(D),
							await this.plugin.saveSettings(),
							this.render());
					}));
				let W = C.createEl('button', { text: '\u{1F5D1}\uFE0F' });
				(W.setCssStyles({ padding: '2px 6px', fontSize: '11px' }),
					W.addEventListener('click', async (w) => {
						(w.stopPropagation(),
							(this.plugin.settings.savedWheels =
								this.plugin.settings.savedWheels.filter(
									(D) => D.id !== n.id,
								)),
							await this.plugin.saveSettings(),
							this.render());
					}));
			});
		};
		(o(),
			e.createEl('hr'),
			e.createEl('h4', {
				text: '\u{1F4BE} Save Active Configuration State',
			}));
		let d = e.createEl('div');
		d.setCssStyles({
			display: 'flex',
			gap: '8px',
			backgroundColor: 'var(--background-secondary)',
			padding: '12px',
			borderRadius: '6px',
		});
		let g = d.createEl('input', {
			attr: { value: this.view.wheelName },
		});
		g.setCssStyles({ flex: '2' });
		let E = d.createEl('select');
		(E.setCssStyles({ flex: '1' }),
			this.plugin.settings.wheelGroups.forEach(
				(l) =>
					(E.createEl('option', {
						text: l,
						attr: { value: l },
					}).selected = this.view.wheelGroup === l),
			),
			d
				.createEl('button', { text: 'Commit Save', cls: 'mod-cta' })
				.addEventListener('click', async () => {
					let l = g.value.trim() || 'Untitled Wheel',
						n = E.value;
					this.plugin.settings.savedWheels =
						this.plugin.settings.savedWheels.filter(
							(y) => y.id !== this.view.wheelId,
						);
					let v = {
						id:
							this.view.wheelId === 'active-session'
								? Date.now().toString()
								: this.view.wheelId,
						name: l,
						...this.view.snapshot(),
						group: n,
					};
					((this.view.wheelId = v.id),
						(this.view.wheelName = v.name),
						(this.view.wheelGroup = v.group),
						this.plugin.settings.savedWheels.push(v),
						await this.plugin.saveSettings(),
						this.onReload(),
						this.render());
				}));
	}
}
