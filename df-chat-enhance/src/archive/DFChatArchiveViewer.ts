import { DFChatArchive, DFChatArchiveEntry } from './DFChatArchive.js';

export default class DFChatArchiveViewer extends Application {
	archive: DFChatArchiveEntry;
	onCloseCallBack: (view: DFChatArchiveViewer) => void;
	constructor(archive: DFChatArchiveEntry, onCloseCallBack: (view: DFChatArchiveViewer) => void) {
		super();
		this.archive = archive;
		this.onCloseCallBack = onCloseCallBack;
	}

	static get defaultOptions() {
		return mergeObject(Application.defaultOptions as Partial<Application.Options>, {
			template: "modules/df-chat-enhance/templates/archive-viewer.hbs",
			width: 300,
			height: 500,
			resizable: true,
			title: 'DF_CHAT_ARCHIVE.ArchiveViewer_Title',
			classes: ['df-chat-log-window']
		}) as Application.Options;
	}

	getData(options = {}) {
		super.getData(options);
		return {
			name: this.archive.name,
			isGM: game.user.isGM,
			visible: this.archive.visible ?? false,
			logId: 'df-chat-log-' + this.archive.id
		};
	}

	_renderInner(data: {}, options?: any): Promise<JQuery> {
		return (super._renderInner(data, options) as Promise<JQuery>)
			.then(async (html: JQuery<HTMLElement>) => {
				html.find("#visible").on('change', async (element) => {
					this.archive.visible = (element.target as HTMLInputElement).checked;
					await DFChatArchive.updateChatArchive(this.archive);
				});
				html.find("#edit").on('click', async () => {
					setTimeout(async () => {
						const dialog = new Dialog({
							title: game.i18n.localize("DF_CHAT_ARCHIVE.ArchiveViewer_NameEdit_Title"),
							content: `<input id="name" type="text" value="${this.archive.name}"/>`,
							buttons: {
								save: {
									icon: '<i class="fas fa-save"></i>',
									label: game.i18n.localize('DF_CHAT_ARCHIVE.ArchiveViewer_NameEdit_Save'),
									callback: async (html) => {
										this.archive.name = $(html).find('#name').val() as string;
										await dialog.close();
										await DFChatArchive.updateChatArchive(this.archive);
										await this.render(false);
									}
								},
								close: {
									icon: '<i class="fas fa-times"></i>',
									label: game.i18n.localize('DF_CHAT_ARCHIVE.ArchiveViewer_NameEdit_Cancel'),
									callback: async () => {
										await dialog.close();
									}
								}
							},
							default: 'save'
						});
						dialog.render(true);
					}, 1);
				});
				html.find('#print').on('click', async () => {
					const clone = html.find('#df-chat-log').clone();
					clone.addClass('df-chat-print');
					$('body').hide();
					$('html').addClass('df-chat-print');
					$('html').append(clone);
					window.print();
					clone.remove();
					$('html').removeClass('df-chat-print');
					$('body').show();
				});
				html.find('#merge').on('click', async () => {
					if (DFChatArchive.getLogs().length == 1) {
						ui.notifications.info(game.i18n.localize('DF_CHAT_ARCHIVE.ArchiveViewer_Merge_OnlyOneArchive'));
						return;
					}
					const dialog: Dialog = new Dialog({
						title: game.i18n.localize('DF_CHAT_ARCHIVE.ArchiveViewer_Merge_Title'),
						default: 'merge',
						content: await renderTemplate('modules/df-chat-enhance/templates/archive-merge.hbs', {
							name: this.archive.name,
							archives: DFChatArchive.getLogs().filter(x => x.id != this.archive.id)
						}),
						buttons: {
							cancel: {
								icon: '<i class="fas fa-times"></i>',
								label: game.i18n.localize('DF_CHAT_ARCHIVE.ArchiveViewer_Merge_Cancel'),
								callback: async () => await dialog.close()
							},
							merge: {
								icon: '<i class="fas fa-sitemap"></i>',
								label: game.i18n.localize('DF_CHAT_ARCHIVE.ArchiveViewer_Merge_Merge'),
								callback: async (html) => {
									const val = $(html).find('#archive').val() as string;
									if (isNaN(parseInt(val))) return;
									const id = parseInt(val);
									const source = DFChatArchive.getLogs().find(x => x.id == id);
									const currentChats = await DFChatArchive.readChatArchive(this.archive.file);
									const sourceChats = await DFChatArchive.readChatArchive(source.file);
									const mergedChats = (currentChats as ChatMessage.Data[])
										.concat(sourceChats as ChatMessage.Data[])
										.sort((a, b) => a.timestamp - b.timestamp);
									DFChatArchive.updateChatArchive(this.archive, mergedChats);
									this.render(false);
									if (($(html).find('#delete')[0] as HTMLInputElement).checked) {
										DFChatArchive.deleteChatArchive(id);
									}
								}
							}
						}
					});
					await dialog.render(true);
				});

				const log = html.find('#df-chat-log');
				const messageHtml = [];
				const currentChats = await DFChatArchive.readChatArchive(this.archive.file);
				for (let value of currentChats as ChatMessage.Data[]) {
					const chatMessage = value instanceof ChatMessage ? value : new ChatMessage(value);
					try {
						const html = $(await chatMessage.render());
						// if we only have 1 message, don't allow it to be deleted. They might as well just delete the archive
						if (currentChats.length == 1)
							html.find('a.message-delete').hide();
						html.find('a.message-delete').on('click', (element) => {
							const messageHtml = element.target.parentElement?.parentElement?.parentElement?.parentElement;
							const id = messageHtml?.dataset?.messageId;
							if (!id) return;
							const index = currentChats.findIndex((x: any) => x._id === id);
							currentChats.splice(index, 1);
							$(messageHtml).hide(500, () => messageHtml.remove());
						});
						messageHtml.push(html);
					} catch (err) {
						console.error(`Chat message ${chatMessage.id} failed to render.\n${err})`);
					}
				}

				// Prepend the HTML
				log.prepend(messageHtml);

				html.find('#dfal-save-changes').on('click', async () => {
					Dialog.confirm({
						title: game.i18n.localize("DF_CHAT_ARCHIVE.ArchiveViewer_DeleteTitle"),
						content: game.i18n.localize("DF_CHAT_ARCHIVE.ArchiveViewer_DeleteContent"),
						defaultYes: false,
						no: () => { },
						yes: async () => {
							await DFChatArchive.updateChatArchive(this.archive, currentChats);
						}
					});
				});

				return html;
			});
	}
	close(options: Application.CloseOptions = {}): Promise<unknown> {
		this.onCloseCallBack(this);
		return super.close(options);
	}
}