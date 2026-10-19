import { Modal } from 'obsidian';

export class ThemeModal extends Modal {
	constructor(e, t, i) {
		super(e);
		this.filterCount = 'all';
		this.filterGroup = 'all';
		this.catInputValue = '';
		this.defaultThemes = [
			{
				name: 'Classic Autumn',
				colors: ['#5c1d11', '#a62c19', '#d45026', '#f2a024'],
				group: 'General',
			},
			{
				name: 'Ocean 5-Pack',
				colors: ['#0a2540', '#004b6e', '#007791', '#00a3a6', '#78cbd1'],
				group: 'General',
			},
			{
				name: 'Neon Duet',
				colors: ['#ff0055', '#00ffcc'],
				group: 'General',
			},
			{
				name: 'Pastel Garden',
				colors: ['#3b5249', '#519e8a', '#7ebc89', '#bad9b6'],
				group: 'General',
			},
		];
		((this.plugin = t), (this.onSelect = i));
	}
	onOpen() {
		(this.titleEl.setText('Style Packs Browser'), this.render());
	}
	render() {
		let { contentEl: e } = this;
		(e.empty(),
			this.plugin.settings.themeGroups.includes('General') ||
				this.plugin.settings.themeGroups.unshift('General'));
		let t = [...this.defaultThemes, ...this.plugin.settings.customThemes],
			i = e.createEl('div');
		i.setCssStyles({
			display: 'flex',
			flexWrap: 'wrap',
			gap: '10px',
			marginBottom: '15px',
			backgroundColor: 'var(--background-secondary)',
			padding: '10px',
			borderRadius: '6px',
			alignItems: 'center',
		});
		let r = i.createEl('select');
		(['all', '2', '3', '4', '5', '6', '7'].forEach(
			(s) =>
				(r.createEl('option', {
					text: s === 'all' ? 'All Lengths' : `${s} Colors`,
					attr: { value: s },
				}).selected = this.filterCount === s),
		),
			r.addEventListener('change', () => {
				((this.filterCount = r.value), g());
			}));
		let p = i.createEl('select');
		(['all', ...this.plugin.settings.themeGroups].forEach(
			(s) =>
				(p.createEl('option', {
					text: s === 'all' ? 'All Categories' : s,
					attr: { value: s },
				}).selected = this.filterGroup === s),
		),
			p.addEventListener('change', () => {
				((this.filterGroup = p.value), g());
			}));
		let h = i.createEl('input', {
			attr: { placeholder: 'New category...' },
		});
		(h.addClass('obsidian-input-override'),
			h.setCssStyles({ width: '120px', padding: '4px' }),
			(h.value = this.catInputValue),
			h.addEventListener('input', () => {
				this.catInputValue = h.value;
			}),
			i
				.createEl('button', { text: '\u2795' })
				.addEventListener('click', async () => {
					let s = this.catInputValue.trim();
					s &&
						!this.plugin.settings.themeGroups.includes(s) &&
						(this.plugin.settings.themeGroups.push(s),
						(this.catInputValue = ''),
						await this.plugin.saveSettings(),
						this.render());
				}),
			i
				.createEl('button', { text: '\u{1F5D1}\uFE0F Cat' })
				.addEventListener('click', async () => {
					let s = this.filterGroup;
					s !== 'all' && s !== 'General'
						? ((this.plugin.settings.themeGroups =
								this.plugin.settings.themeGroups.filter(
									(m) => m !== s,
								)),
							this.plugin.settings.customThemes.forEach((m) => {
								m.group === s && (m.group = 'General');
							}),
							(this.filterGroup = 'all'),
							await this.plugin.saveSettings(),
							this.render())
						: alert('Cannot delete default catch-alls.');
				}));
		let d = e.createEl('div');
		d.setCssStyles({
			display: 'grid',
			gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
			gap: '12px',
			maxHeight: '220px',
			overflowY: 'auto',
			marginBottom: '15px',
		});
		let g = () => {
			(d.empty(),
				t
					.filter((s) => {
						let m =
								this.filterCount === 'all' ||
								s.colors.length.toString() === this.filterCount,
							u =
								this.filterGroup === 'all' ||
								s.group === this.filterGroup;
						return m && u;
					})
					.forEach((s) => {
						let m = d.createEl('div');
						m.setCssStyles({
							border: '1px solid var(--background-modifier-border)',
							borderRadius: '6px',
							padding: '10px',
							backgroundColor: 'var(--background-primary-alt)',
							position: 'relative',
						});
						let u = m.createEl('div');
						(u.setCssStyles({ cursor: 'pointer' }),
							u.createEl('div', { text: s.name }).setCssStyles({
								fontWeight: 'bold',
								fontSize: '13px',
							}),
							u
								.createEl('div', {
									text: `Category: ${s.group}`,
								})
								.setCssStyles({
									fontSize: '11px',
									color: 'var(--text-muted)',
									margin: '4px 0',
								}));
						let C = u.createEl('div');
						if (
							(C.setCssStyles({
								display: 'flex',
								gap: '4px',
							}),
							s.colors.forEach((S) => {
								C.createEl('div').setCssStyles({
									width: '14px',
									height: '14px',
									borderRadius: '50%',
									backgroundColor: S,
								});
							}),
							u.addEventListener('click', () => {
								(this.onSelect(s.colors), this.close());
							}),
							this.plugin.settings.customThemes.some(
								(S) => S.name === s.name,
							))
						) {
							let S = m.createEl('button', {
								text: '\u{1F5D1}\uFE0F',
							});
							(S.setCssStyles({
								position: 'absolute',
								top: '5px',
								right: '5px',
								padding: '2px 6px',
								background: 'transparent',
								border: 'none',
								cursor: 'pointer',
							}),
								S.addEventListener('click', (W) => {
									(W.stopPropagation(),
										(this.plugin.settings.customThemes =
											this.plugin.settings.customThemes.filter(
												(w) => w.name !== s.name,
											)),
										this.plugin
											.saveSettings()
											.then(() => this.render()));
								}));
						}
					}));
		};
		(g(),
			e.createEl('hr'),
			e.createEl('h4', { text: '\u2795 Pack Creator Factory' }));
		let E = e.createEl('div');
		E.setCssStyles({
			display: 'flex',
			flexDirection: 'column',
			gap: '8px',
			backgroundColor: 'var(--background-secondary)',
			padding: '12px',
			borderRadius: '6px',
		});
		let f = E.createEl('div');
		f.setCssStyles({ display: 'flex', gap: '8px' });
		let l = f.createEl('input', {
			attr: { placeholder: 'Pack Name...' },
		});
		l.setCssStyles({ flex: '1' });
		let n = f.createEl('select');
		(n.setCssStyles({ flex: '1' }),
			this.plugin.settings.themeGroups.forEach((s) =>
				n.createEl('option', { text: s, attr: { value: s } }),
			));
		let v = E.createEl('input', {
			attr: {
				placeholder: 'Hex Codes: #ff0000, #00ff00 (Min 2, Max 7)',
			},
		});
		E.createEl('button', {
			text: 'Save Customized Style Pack',
			cls: 'mod-cta',
		}).addEventListener('click', async () => {
			let s = l.value.trim(),
				m = n.value,
				u = v.value
					.split(',')
					.map((b) => b.trim())
					.filter((b) => b.startsWith('#'));
			if (!s || u.length < 2 || u.length > 7) {
				alert(
					'Validation Failure: Hex entry must contain between 2 and 7 codes!',
				);
				return;
			}
			(this.plugin.settings.customThemes.push({
				name: s,
				colors: u,
				group: m,
			}),
				await this.plugin.saveSettings(),
				this.render());
		});
	}
}
