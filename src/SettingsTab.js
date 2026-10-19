import { PluginSettingTab } from 'obsidian';

export class DecisionWheelSettingTab extends PluginSettingTab {
	constructor(a, e) {
		(super(a, e), (this.plugin = e));
	}
	display() {
		let { containerEl: a } = this;
		(a.empty(),
			a.createEl('h2', { text: 'Decision Wheel Configuration' }),
			a.createEl('p', {
				text: 'All advanced configurations, group indexing, and wheel states are managed dynamically inside your sidebar modals.',
			}));
	}
}
