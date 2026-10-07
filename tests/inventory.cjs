// Run against the real page, Chromium DOM, and an in-memory copy of the sample save.
const fs = require('node:fs');
const path = require('node:path');
if (!process.versions.electron) {
    const env = { ...process.env };
    delete env.ELECTRON_RUN_AS_NODE;
    const child = require('node:child_process').spawn(require('electron'), [__filename], { env, stdio: 'inherit' });
    child.on('exit', code => process.exit(code ?? 1));
} else {
    const { app, BrowserWindow } = require('electron');
    app.whenReady().then(async () => {
        const window = new BrowserWindow({ show: false, webPreferences: { backgroundThrottling: false } });
        // Tests do not need remote icons or other network resources.
        window.webContents.session.webRequest.onBeforeRequest({ urls: ['http://*/*', 'https://*/*'] }, (_details, callback) => callback({ cancel: true }));
        try {
            await window.loadFile(path.join(__dirname, '../zelda-botw/index.html'));
            const bytes = [...fs.readFileSync(path.join(__dirname, '../zelda-botw/game_data.sav'))];
            await window.webContents.executeJavaScript(`
                tempFile = new MarcFile(${bytes.length});
                tempFile._u8array.set(${JSON.stringify(bytes)});
                _tempFileLoadFunction();
            `);
            const result = await window.webContents.executeJavaScript(`(${runTests.toString()})()`);
            console.log(result);
            const nativeSource = fs.readFileSync(path.join(__dirname, '../zelda-botw/js/native-app.js'), 'utf8');
            console.log(await window.webContents.executeJavaScript(`(${testReturnToSlots.toString()})(${JSON.stringify(bytes)}, ${JSON.stringify(nativeSource)})`));
            app.exit(0);
        } catch (error) {
            console.error(error);
            app.exit(1);
        }
    });
}

async function testReturnToSlots(bytes, nativeSource) {
    const slot = { slot: 1, filePath: 'test/game_data.sav', summary: {} };
    window.botwDesktop = {
        discoverSlots: async () => [slot], getRecentRoots: async () => [],
        readSave: async () => bytes,
        writeSave: async () => ({ modifiedAt: new Date().toISOString(), summary: {} }),
        minimize() {}, toggleMaximize() {}, close() {}
    };
    (0, eval)(nativeSource);
    window.dispatchEvent(new Event('load'));
    const wait = () => new Promise(resolve => setTimeout(resolve, 50));
    const assert = (condition, message) => { if (!condition) throw new Error(message); };
    await wait();
    async function openSlot() {
        document.querySelector('.slot-card button').click();
        await wait();
    }
    await openSlot();
    window.closeFileConfirm();
    assert(document.getElementById('the-editor').style.display === 'none', 'clean return skips confirmation');
    await wait();
    await openSlot();
    document.getElementById('number-rupees').dispatchEvent(new Event('input', { bubbles: true }));
    window.closeFileConfirm();
    const dialog = document.getElementById('dialog-quick-confirm');
    assert(dialog.classList.contains('active'), 'dirty return asks for confirmation');
    const buttons = dialog.querySelectorAll('button');
    const first = buttons[0].getBoundingClientRect();
    const second = buttons[1].getBoundingClientRect();
    assert(Math.abs(first.top - second.top) < 1 && second.left - first.right >= 12, 'confirmation buttons sit side by side with a gap');
    buttons[1].click();
    assert(document.getElementById('the-editor').style.display !== 'none', 'cancel keeps editor open');
    await window.saveChanges();
    window.closeFileConfirm();
    assert(document.getElementById('the-editor').style.display === 'none', 'saved return skips confirmation');
    await wait();
    await openSlot();
    showTab(SavegameEditor._getItemCategory(SavegameEditor._loadItemName(0)));
    SavegameEditor.editItem(0);
    SavegameEditor.selectItem.selectedIndex = (SavegameEditor.selectItem.selectedIndex + 1) % SavegameEditor.selectItem.options.length;
    window.closeFileConfirm();
    assert(dialog.classList.contains('active'), 'pending selection must trigger unsaved confirmation');
    buttons[0].click();
    assert(document.getElementById('the-editor').style.display === 'none', 'confirm returns to slots');
    return 'PASS: return-to-slots clean/dirty/saved/pending/cancel/confirm and button layout';
}

async function runTests() {
    const editor = SavegameEditor;
    const categories = ['weapons', 'bows', 'shields', 'clothes', 'materials', 'food', 'other'];
    const baseline = tempFile._u8array.slice();
    let checks = 0;
    const assert = (condition, message) => { if (!condition) throw new Error(message); checks++; };
    const wait = () => new Promise(resolve => setTimeout(resolve, 250));
    const names = category => [...editor.selectItem.categories[category].children].map(option => option.value);
    const alerts = [];
    window.alert = message => alerts.push(message);
    window.confirm = () => true;
    function reset(items) {
        editor._detachItemSelector(false);
        tempFile._u8array.set(baseline);
        editor._itemNames = null;
        for (let i = 0; i < editor.Constants.MAX_ITEMS; i++) {
            editor._writeString64(editor.Offsets.ITEMS, items[i] || '', i);
            tempFile.writeU32(editor._getItemQuantityOffset(i), 10 + i);
            tempFile.writeU32(editor._getItemEquippedOffset(i), i % 2);
        }
        for (const category of ['weapons', 'bows', 'shields']) {
            const capacity = { weapons: 'WEAPON_CAPACITY', bows: 'BOW_CAPACITY', shields: 'SHIELD_CAPACITY' }[category];
            tempFile.writeU32(editor.Offsets[capacity], 20);
        }
        editor._renderItems();
        editor.selectItem.selectedIndex = -1;
        alerts.length = 0;
    }
    function consistent() {
        const ids = [...document.querySelectorAll('.row-items[id], .row-items [id]')].map(element => element.id).filter(id => !/^box\d+$/.test(id));
        assert(new Set(ids).size === ids.length, 'DOM IDs must stay unique: ' + ids.filter((id, index) => ids.indexOf(id) !== index).join(', '));
        for (let i = 0; i < editor._getItemCount(); i++) {
            assert(editor._loadItemName(i) === editor._readString64(editor.Offsets.ITEMS, i), 'name cache must match bytes at ' + i);
            const row = document.getElementById('item-row-' + i);
            assert(row && Number(row.dataset.index) === i, 'row index must match bytes at ' + i);
            if (currentEditingItem !== i)
                assert(document.getElementById('item-name' + i).innerHTML === editor._getItemTranslation(editor._loadItemName(i)), 'name must remain visible at ' + i);
        }
    }
    for (const category of categories) {
        reset([]);
        showTab(category);
        const options = names(category);
        editor.addItem();
        editor.selectItem.value = options[3];
        editor.selectItem.dispatchEvent(new FocusEvent('blur'));
        editor.addItem();
        assert(editor._loadItemName(0) === options[3], category + ': second add must preserve first selection');
        assert(currentEditingItem === 1, category + ': second row must be editable');
        for (let i = 2; i < 6; i++) editor.addItem();
        await wait();
        assert(currentEditingItem === 5 && editor.selectItem.isConnected, category + ': old blur must not close new selector');
        editor.selectItem.value = options[8];
        editor.selectItem.dispatchEvent(new Event('change', { bubbles: true }));
        assert(editor._getItemCount() === 6 && editor._loadItemName(5) === options[8], category + ': repeated add and selection');
        consistent();
        editor._saveInventory();
        editor._renderItems();
        consistent();
    }

    const materials = names('materials');
    const weapons = names('weapons');
    reset([materials[0], materials[1]]);
    showTab('materials');
    editor.editItem(0);
    editor.selectItem.value = materials[2];
    editor.editItem(1);
    assert(editor._loadItemName(0) === materials[2], 'switching rows commits previous value');
    editor.selectItem.value = materials[3];
    showTab('weapons');
    editor.addItem();
    assert(editor._loadItemName(2) === materials[3], 'insert before edited category preserves selection');
    assert(document.getElementById('number-item2').value === '11', 'quantity follows shifted row');
    editor._detachItemSelector();
    consistent();
    editor.editItem(2);
    editor.selectItem.value = materials[4];
    editor.removeItem(0);
    assert(editor._loadItemName(1) === materials[4], 'removal commits selection before shifting indices');
    consistent();
    editor.editItem(1);
    editor.removeItem(1);
    await wait();
    assert(editor._getItemCount() === 1, 'removing edited final row must not resurrect it');
    consistent();

    reset([materials[0]]);
    showTab('materials');
    let dirty = 0;
    document.getElementById('the-editor').addEventListener('input', () => dirty++);
    editor.editItem(0);
    editor.selectItem.value = materials[1];
    editor.save();
    assert(editor._loadItemName(0) === materials[1] && dirty > 0, 'save commits pending selection and marks dirty');
    editor.editItem(0);
    editor.selectItem.dispatchEvent(new FocusEvent('blur'));
    editor.editItem(0);
    await wait();
    assert(editor.selectItem.isConnected, 'reopening same index invalidates old blur');
    document.getElementById('number-item0').focus();
    // Hidden BrowserWindows update activeElement without native window focus events.
    editor.selectItem.dispatchEvent(new FocusEvent('blur'));
    await wait();
    assert(currentEditingItem === null, 'blur finishes selection');

    reset([materials[0]]);
    showTab('materials');
    editor.editItem(0);
    editor.selectItem.value = materials[materials.length - 1];
    editor.addItem();
    assert(editor._loadItemName(0) === materials[materials.length - 1] && editor._loadItemName(1) === materials[0], 'last option wraps without changing previous item');
    editor.selectItem.value = materials[2];
    editor.selectItem.dispatchEvent(new FocusEvent('blur'));
    editor._writeString64(editor.Offsets.ITEMS, materials[4], 1);
    editor._renderItems();
    await wait();
    assert(editor._loadItemName(1) === materials[4] && currentEditingItem === null, 'reload discards pending selection and old timer');

    const bows = names('bows');
    const bow = bows.find(name => name.startsWith('Weapon_'));
    const arrow = bows.find(name => !name.startsWith('Weapon_'));
    reset([bow, bow, materials[0]]);
    showTab('bows');
    document.getElementById('number-modifier-bows-value-0').value = '31';
    document.getElementById('number-modifier-bows-value-1').value = '72';
    editor.editItem(0);
    editor.selectItem.value = arrow;
    editor.addItem();
    assert(editor._loadItemName(0) === arrow, 'pending bow-to-arrow change commits before adding');
    assert(tempFile.readU32(editor.Offsets.FLAGSV_BOW) === 72, 'remaining bow keeps its modifier');
    editor._detachItemSelector();
    editor.editItem(0);
    editor.selectItem.value = bow;
    editor.selectItem.dispatchEvent(new Event('change', { bubbles: true }));
    assert(tempFile.readU32(editor.Offsets.FLAGSV_BOW) === 0 && tempFile.readU32(editor.Offsets.FLAGSV_BOW + 8) === 72, 'arrow-to-bow inserts modifier without overwriting next bow');
    editor.removeItem(0);
    editor._saveInventory();
    editor._renderItems();
    assert(document.getElementById('number-modifier-bows-value-0').value === '72', 'modifier survives remove/save/reload');
    consistent();

    reset(['Mod_Unknown']);
    editor.editItem(0);
    editor._detachItemSelector();
    assert(editor._loadItemName(0) === 'Mod_Unknown', 'unknown item must not become an empty record');
    reset([weapons[0]]);
    tempFile.writeU32(editor.Offsets.WEAPON_CAPACITY, 1);
    showTab('weapons');
    editor.addItem();
    assert(editor._getItemCount() === 1 && alerts.length === 1, 'full equipment capacity rejects add');
    reset([arrow]);
    tempFile.writeU32(editor.Offsets.BOW_CAPACITY, 0);
    showTab('bows');
    editor.editItem(0);
    editor.selectItem.value = bow;
    editor.selectItem.dispatchEvent(new Event('change', { bubbles: true }));
    assert(editor._loadItemName(0) === arrow && alerts.length === 1, 'full bow capacity rejects arrow-to-bow replacement');
    consistent();
    reset(Array(419).fill(materials[0]));
    showTab('materials');
    editor.addItem();
    editor.selectItem.value = materials[2];
    editor.addItem();
    assert(editor._getItemCount() === 420 && editor._loadItemName(419) === materials[2] && alerts.length === 1, 'final slot selection survives rejected next add');
    reset(Array(420).fill(materials[0]));
    showTab('materials');
    editor.addItem();
    assert(editor._getItemCount() === 420 && alerts.length === 1, 'full inventory rejects add');
    return 'PASS: ' + checks + ' inventory assertions (real Electron DOM and save bytes)';
}
