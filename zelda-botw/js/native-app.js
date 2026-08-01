(function () {
    'use strict';

    var api = window.botwDesktop;
    var currentSlot = null;
    var isLoading = false;
    var isDirty = false;
    var recentRootItems = [];
    var browserSaveChanges = window.saveChanges;

    function byId(id) {
        return document.getElementById(id);
    }

    function formatDate(iso) {
        if (!iso) return '未知时间';
        return new Intl.DateTimeFormat('zh-CN', {
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit'
        }).format(new Date(iso));
    }

    function formatPlaytime(seconds) {
        if (seconds === null || typeof seconds === 'undefined') return '--';
        return Math.floor(seconds / 3600) + ' 小时';
    }

    function staminaLabel(value) {
        if (!value) return '--';
        return Math.round(value / 100) / 10 + ' 圈';
    }

    function setSaveState(text, state) {
        var element = byId('save-state');
        if (!element) return;
        element.textContent = text;
        element.dataset.state = state || 'clean';
    }

    function markDirty() {
        if (isLoading || !currentSlot) return;
        isDirty = true;
        setSaveState('有未保存修改', 'dirty');
    }

    function toast(message, type) {
        var element = byId('app-toast');
        if (!element) {
            element = document.createElement('div');
            element.id = 'app-toast';
            document.body.appendChild(element);
        }
        element.textContent = message;
        element.className = 'visible ' + (type || 'info');
        clearTimeout(toast.timer);
        toast.timer = setTimeout(function () { element.className = ''; }, 3200);
    }

    function asUint8Array(value) {
        if (value instanceof Uint8Array) return value;
        if (value && Array.isArray(value.data)) return new Uint8Array(value.data);
        return new Uint8Array(value);
    }

    async function loadSlot(slot) {
        try {
            isLoading = true;
            setSaveState('正在读取', 'working');
            var source = asUint8Array(await api.readSave(slot.filePath));
            var copy = new Uint8Array(source.length);
            copy.set(source);
            tempFile = new MarcFile(copy.length);
            tempFile.fileName = 'game_data.sav';
            tempFile.fileType = 'application/octet-stream';
            tempFile._u8array = copy;
            tempFile._dataView = new DataView(copy.buffer);
            currentSlot = slot;
            _tempFileLoadFunction();
            byId('current-save-label').textContent = '槽位 ' + slot.slot + ' · ' + slot.filePath;
            byId('current-save-label').title = slot.filePath;
            isDirty = false;
            setSaveState('已加载，未修改', 'clean');
            window.scrollTo(0, 0);
        } catch (error) {
            currentSlot = null;
            toast(error.message || '读取存档失败', 'error');
            setSaveState('读取失败', 'error');
        } finally {
            isLoading = false;
        }
    }

    function createSlotCard(slot) {
        var card = document.createElement('article');
        card.className = 'slot-card';
        card.dataset.path = slot.filePath;

        var preview = document.createElement('div');
        preview.className = 'slot-preview';
        if (slot.caption) {
            var image = document.createElement('img');
            image.src = slot.caption;
            image.alt = '槽位 ' + slot.slot + ' 游戏截图';
            preview.appendChild(image);
        } else {
            preview.textContent = '无预览图';
        }

        var body = document.createElement('div');
        body.className = 'slot-body';
        var title = document.createElement('div');
        title.className = 'slot-title';
        title.innerHTML = '<strong>存档槽位 ' + slot.slot + '</strong><span>' + slot.summary.versionHeader + '</span>';
        var source = document.createElement('div');
        source.className = 'slot-source';
        source.textContent = slot.filePath.replace(/[\\\/]\d[\\\/]game_data\.sav$/i, '');
        source.title = source.textContent;

        var stats = document.createElement('dl');
        stats.className = 'slot-stats';
        stats.innerHTML =
            '<div><dt>卢比</dt><dd>' + slot.summary.rupees + '</dd></div>' +
            '<div><dt>生命</dt><dd>' + slot.summary.hearts + ' 颗</dd></div>' +
            '<div><dt>精力</dt><dd>' + staminaLabel(slot.summary.stamina) + '</dd></div>' +
            '<div><dt>时间</dt><dd>' + formatPlaytime(slot.summary.playtime) + '</dd></div>';

        var footer = document.createElement('div');
        footer.className = 'slot-footer';
        var time = document.createElement('span');
        time.textContent = formatDate(slot.modifiedAt);
        var button = document.createElement('button');
        button.type = 'button';
        button.className = 'primary-action';
        button.textContent = '编辑此槽位';
        button.addEventListener('click', function () { loadSlot(slot); });
        footer.appendChild(time);
        footer.appendChild(button);

        body.appendChild(title);
        body.appendChild(source);
        body.appendChild(stats);
        body.appendChild(footer);
        card.appendChild(preview);
        card.appendChild(body);
        return card;
    }

    function renderSlotPicker(slots, roots) {
        if (Array.isArray(roots)) recentRootItems = roots;
        var dragZone = byId('dragzone');
        if (!dragZone) return;
        dragZone.innerHTML = '';
        dragZone.className = 'save-library wrapper';

        var intro = document.createElement('div');
        intro.className = 'library-heading';
        intro.innerHTML = '<div><h2>选择要修改的存档</h2><p>已自动读取 Eden 存档。保存时会先创建备份。</p></div>';
        var actions = document.createElement('div');
        actions.className = 'library-actions';

        var rootButton = document.createElement('button');
        rootButton.type = 'button';
        rootButton.textContent = '选择 Eden 目录';
        rootButton.addEventListener('click', chooseRoot);
        var fileButton = document.createElement('button');
        fileButton.type = 'button';
        fileButton.textContent = '打开单个存档';
        fileButton.addEventListener('click', chooseFile);
        actions.appendChild(rootButton);
        actions.appendChild(fileButton);
        intro.appendChild(actions);
        dragZone.appendChild(intro);

        if (recentRootItems.length) {
            var recentBar = document.createElement('div');
            recentBar.className = 'recent-directory-bar';
            var recentLabel = document.createElement('label');
            recentLabel.htmlFor = 'recent-root-select';
            recentLabel.textContent = '最近目录';
            var recentSelect = document.createElement('select');
            recentSelect.id = 'recent-root-select';
            recentRootItems.forEach(function (item) {
                var option = document.createElement('option');
                option.value = item.path;
                option.textContent = item.name + '  ·  ' + item.path + (item.available ? '' : '（不可用）');
                option.disabled = !item.available;
                recentSelect.appendChild(option);
            });
            var openRecent = document.createElement('button');
            openRecent.type = 'button';
            openRecent.textContent = '打开所选目录';
            openRecent.disabled = !recentRootItems.some(function (item) { return item.available; });
            openRecent.addEventListener('click', function () { useRecentRoot(recentSelect.value); });
            var removeRecent = document.createElement('button');
            removeRecent.type = 'button';
            removeRecent.className = 'remove-recent';
            removeRecent.textContent = '移除记录';
            removeRecent.addEventListener('click', function () { removeRecentRoot(recentSelect.value); });
            recentBar.appendChild(recentLabel);
            recentBar.appendChild(recentSelect);
            recentBar.appendChild(openRecent);
            recentBar.appendChild(removeRecent);
            dragZone.appendChild(recentBar);
        }

        var grid = document.createElement('div');
        grid.className = 'slot-grid';
        slots.forEach(function (slot) { grid.appendChild(createSlotCard(slot)); });
        dragZone.appendChild(grid);

        if (!slots.length) {
            var empty = document.createElement('div');
            empty.className = 'empty-library';
            empty.innerHTML = '<strong>没有自动找到《旷野之息》存档</strong><span>请选择 Eden 主目录，或直接打开 game_data.sav。</span>';
            dragZone.appendChild(empty);
        }
    }

    async function refreshSlots(root) {
        try {
            var result = await Promise.all([api.discoverSlots(root), api.getRecentRoots()]);
            renderSlotPicker(result[0], result[1]);
        } catch (error) {
            renderSlotPicker([]);
            toast(error.message || '扫描存档失败', 'error');
        }
    }

    async function chooseRoot() {
        var result = await api.chooseRoot();
        if (result) renderSlotPicker(result.slots, result.recentRoots);
    }

    async function useRecentRoot(root) {
        if (!root) return;
        try {
            var result = await api.useRoot(root);
            renderSlotPicker(result.slots, result.recentRoots);
            if (!result.slots.length) toast('该目录中没有找到 BOTW 存档', 'error');
        } catch (error) {
            toast(error.message || '读取目录失败', 'error');
        }
    }

    async function removeRecentRoot(root) {
        if (!root) return;
        recentRootItems = await api.forgetRoot(root);
        renderSlotPicker(await api.discoverSlots(), recentRootItems);
        toast('已移除目录记录', 'success');
    }

    async function chooseFile() {
        var slot = await api.chooseFile();
        if (slot) loadSlot(slot);
    }

    async function saveNativeChanges() {
        if (!currentSlot) return browserSaveChanges();
        var button = byId('save-file-button');
        try {
            button.disabled = true;
            setSaveState('正在保存', 'working');
            SavegameEditor.save();
            var result = await api.writeSave(currentSlot.filePath, tempFile._u8array.slice());
            currentSlot.modifiedAt = result.modifiedAt;
            currentSlot.summary = result.summary;
            isDirty = false;
            setSaveState('已保存并备份', 'saved');
            toast('保存成功，备份已创建', 'success');
        } catch (error) {
            setSaveState('保存失败', 'error');
            toast(error.message || '保存存档失败', 'error');
        } finally {
            button.disabled = false;
        }
    }

    function closeBackupDialog() {
        var dialog = byId('backup-dialog');
        if (dialog) dialog.remove();
    }

    async function showBackups() {
        if (!currentSlot) return;
        try {
            var backups = await api.listBackups(currentSlot.filePath);
            closeBackupDialog();
            var overlay = document.createElement('div');
            overlay.id = 'backup-dialog';
            overlay.className = 'app-modal-overlay';
            var panel = document.createElement('section');
            panel.className = 'app-modal';
            var heading = document.createElement('header');
            heading.innerHTML = '<div><h2>备份记录</h2><p>恢复前仍会自动备份当前存档。</p></div>';
            var closeButton = document.createElement('button');
            closeButton.type = 'button';
            closeButton.className = 'modal-close';
            closeButton.textContent = '×';
            closeButton.addEventListener('click', closeBackupDialog);
            heading.appendChild(closeButton);
            panel.appendChild(heading);

            var list = document.createElement('div');
            list.className = 'backup-list';
            if (!backups.length) {
                list.innerHTML = '<div class="backup-empty">还没有备份。首次保存后会自动创建。</div>';
            }
            backups.forEach(function (backup) {
                var row = document.createElement('div');
                row.className = 'backup-row';
                var info = document.createElement('div');
                info.innerHTML = '<strong>' + formatDate(backup.createdAt) + '</strong><span>卢比 ' + backup.summary.rupees + ' · 生命 ' + backup.summary.hearts + ' 颗 · ' + backup.summary.versionHeader + '</span>';
                var restore = document.createElement('button');
                restore.type = 'button';
                restore.textContent = '恢复';
                restore.addEventListener('click', async function () {
                    if (!window.confirm('确定恢复这份备份吗？当前存档会先自动备份。')) return;
                    try {
                        restore.disabled = true;
                        await api.restoreBackup(currentSlot.filePath, backup.backupPath);
                        closeBackupDialog();
                        await loadSlot(currentSlot);
                        toast('备份恢复成功', 'success');
                    } catch (error) {
                        restore.disabled = false;
                        toast(error.message || '恢复备份失败', 'error');
                    }
                });
                row.appendChild(info);
                row.appendChild(restore);
                list.appendChild(row);
            });
            panel.appendChild(list);
            overlay.appendChild(panel);
            overlay.addEventListener('click', function (event) {
                if (event.target === overlay) closeBackupDialog();
            });
            document.body.appendChild(overlay);
        } catch (error) {
            toast(error.message || '读取备份失败', 'error');
        }
    }

    function applyMaxStats() {
        if (!currentSlot) return;
        setValue('rupees', 999999);
        setValue('mons', 999999);
        setValue('max-hearts', 120);
        setValue('max-stamina', 1161527296);
        setValue('relic-gerudo', 99);
        setValue('relic-goron', 99);
        setValue('relic-rito', 99);
        markDirty();
        toast('角色核心数值已设为最大值', 'success');
    }

    function fillCurrentItems() {
        if (!currentSlot || ['home', 'horses', 'master'].indexOf(window.currentTab) >= 0) {
            toast('请先选择一个物品分类', 'error');
            return;
        }
        var container = byId('container-' + window.currentTab);
        if (!container) return;
        var durabilityCategory = ['weapons', 'bows', 'shields'].indexOf(window.currentTab) >= 0;
        var fields = container.querySelectorAll('input[id^="number-item"]');
        Array.prototype.forEach.call(fields, function (field) {
            field.value = durabilityCategory ? 99999 : 999;
        });
        markDirty();
        toast('已批量更新 ' + fields.length + ' 个物品', 'success');
    }

    function resetAmiiboCooldown() {
        if (!currentSlot) return;
        var hash = 0x0a577f65; // AmiiboLastTouchDate (S32, YYYYMMDD)
        if (SavegameEditor._searchHash(hash) === false) {
            toast('当前存档不包含 Amiibo 冷却字段', 'error');
            return;
        }
        SavegameEditor._writeValueAtHash(hash, 19700101);
        markDirty();
        toast('Amiibo 每日冷却已重置，保存后生效', 'success');
    }

    function filterItems(query) {
        if (!window.currentTab) return;
        var container = byId('container-' + window.currentTab);
        if (!container) return;
        var normalized = query.trim().toLowerCase();
        Array.prototype.forEach.call(container.children, function (row) {
            row.style.display = !normalized || row.textContent.toLowerCase().indexOf(normalized) >= 0 ? '' : 'none';
        });
    }

    function bindDesktopEvents() {
        byId('window-minimize').addEventListener('click', api.minimize);
        byId('window-maximize').addEventListener('click', api.toggleMaximize);
        byId('window-close').addEventListener('click', api.close);
        byId('show-save-folder').addEventListener('click', function () {
            if (currentSlot) api.showInFolder(currentSlot.filePath);
        });
        byId('backup-manager').addEventListener('click', showBackups);
        byId('bulk-max-stats').addEventListener('click', applyMaxStats);
        byId('bulk-fill-items').addEventListener('click', fillCurrentItems);
        byId('reset-amiibo-cooldown').addEventListener('click', resetAmiiboCooldown);
        byId('item-search').addEventListener('input', function () { filterItems(this.value); });
        Array.prototype.forEach.call(document.querySelectorAll('.tab-button'), function (button) {
            button.addEventListener('click', function () {
                setTimeout(function () { filterItems(byId('item-search').value); }, 0);
            });
        });
        byId('the-editor').addEventListener('input', markDirty);
        byId('the-editor').addEventListener('change', markDirty);

        window.addEventListener('beforeunload', function (event) {
            if (isDirty) event.returnValue = false;
        });

        var originalClose = window.closeFile;
        window.closeFile = function () {
            currentSlot = null;
            isDirty = false;
            byId('current-save-label').textContent = '未加载存档';
            setSaveState('未修改', 'clean');
            originalClose();
            refreshSlots();
        };
        window.saveChanges = saveNativeChanges;
    }

    window.addEventListener('load', function () {
        if (!api) return;
        bindDesktopEvents();
        refreshSlots();
    });
}());
