/*
	The legend of Zelda: Breath of the wild v20200218
	塞尔达传说：旷野之息 v20200218
	by Marc Robledo 2017-2020
	translate by RainForest 2023
	除了提示框汉化以外，我还做了不通信息的颜色区分，现在可以用 msgnb 来修改数字颜色为蓝色，msgnm 修改文字颜色为橙色。
*/
var currentEditingItem=null;

SavegameEditor={
	Name:'The legend of Zelda: Breath of the wild',
	Filename:'game_data.sav',
	Version:20200218,

	/* Constants */
	/* 常量 */
	Constants:{
		MAX_ITEMS:420,
		STRING_SIZE:0x20,
		STRING64_SIZE:0x80,

		//缺少版本：1.1.1、1.1.2 和 1.4.1
		VERSION:				['v1.0', 'v1.1', 'v1.2', 'v1.3', 'v1.3.1', 'Kiosk', 'v1.3.3','v1.3.4', 'v1.4',  'v1.5',  'v1.5*',  'v1.6',  'v1.6*', 'v1.6**','v1.6***','v1.8'],
		FILESIZE:				[896976, 897160, 897112, 907824, 907824,  916576,  1020648, 1020648,   1027208, 1027208, 1027248, 1027216, 1027216, 1027216, 1027216, 1027248],
		HEADER:					[0x24e2, 0x24ee, 0x2588, 0x29c0, 0x2a46,  0x2f8e,  0x3ef8,  0x3ef9,    0x471a,  0x471b, 0x471b,  0x471e, 0x0f423d, 0x0f423e,0x0f423f,0x4730],

		ICON_TYPES:{SWORD: 27, BOW:28, SHIELD:29, POT:30, STAR:31, CHEST:32,SKULL:33,LEAF:34,TOWER:35}
	},

	/* 哈希 */
	Hashes:[
		0x0bee9e46, 'MAP',
		0x0cbf052a, 'FLAGS_BOW',
		0x1e3fd294, 'FLAGSV_BOW',
		0x23149bf8, 'RUPEES',
		0x2906f327, 'MAX_HEARTS',
		0x2fc0d2ab, 'SHIELD_CAPACITY', /* ShieldPorchStockNum */
		0x333aa6e5, 'HORSE_SADDLES',
		0x3adff047, 'MAX_STAMINA',
		0x441b7231, 'DEFEATED_MOLDUGA_COUNTER',
		0x54679940, 'DEFEATED_HINOX_COUNTER',
		0x57ee221d, 'FLAGS_WEAPON',
		0x5f283289, 'ITEMS',
		0x6150c6be, 'HORSE_REINS',
		0x698266be, 'DEFEATED_TALUS_COUNTER',
		0x69f17e8a, 'FLAGSV_SHIELD',
		0x6a09fc59, 'ITEMS_QUANTITY',
		0x73c29681, 'PLAYTIME',
		0x7b74e117, 'HORSE_NAMES',
		0x824892be, 'ITEMS_EQUIPPED', /* PorchItem_EquipFlag */
		0x8a94e07a, 'KOROK_SEED_COUNTER',
		0x8c270c56, 'WEAPON_CAPACITY', /* WeaponPorchStockNum */
		0x9383490e, 'MapApp_MapIconNo',
		0x97f925c3, 'RELIC_GERUDO',
		0x982ba201, 'HORSE_POSITION',
		0x9c6cfd3f, 'HORSE_MANES',
		0xa40ba103, 'PLAYER_POSITION',
		0xa6d926bc, 'FLAGSV_WEAPON',
		0xc247b696, 'HORSE_TYPES',
		0xc5238d2b, 'FLAGS_SHIELD',
		0xc9328299, 'MOTORCYCLE', /* IsGet_Obj_Motorcycle */
		0xce7afed3, 'MONS',
		0xd913b769, 'MAPTYPE',
		0xe1a0ca54, 'HORSE_BONDS', /* max=0x3f80 */
		0xe7ce4453, 'BOW_CAPACITY', /* BowPorchStockNum */
		0xea9def3f, 'MapApp_MapIconPos',
		0xf1cf4807, 'RELIC_GORON',
		0xfda0cde4, 'RELIC_RITO'
	],

	/* Document utils */
	/* 文档实用程序 */

	_getRowFromItemNumber: function(itemNumber){
		var nameSpan, spanContainer, row;
		nameSpan = document.getElementById("item-name"+itemNumber);
		if(nameSpan.parentElement){
			spanContainer = nameSpan.parentElement;
			if(spanContainer.parentElement){
				row = spanContainer.parentElement;
			}
		}
		return row;
	},
	_getItemNumberFromRow: function(rowElement){
		return rowElement.dataset.index;
	},
	_getItemNameFromDoc: function(itemNumber){
		var element = document.getElementById("item-name"+itemNumber);
		if(element && element.innerText){
			return element.innerText;
		}
		return null;
	},
	_setItemNameInDoc: function(itemNumber, itemName){
		var element = document.getElementById("item-name"+itemNumber);
		if(element){
			element.innerText = itemName;
		}
	},
	_getItemModifierFromDoc: function(itemNumber, itemCategory){
		var element = document.getElementById("select-modifier-"+itemCategory+"-"+itemNumber);
		if(element && element.value){
			return element.value;
		}
		return null;
	},
	_setItemModifierInDoc: function(itemNumber, itemCategory, itemModifier){
		var element = document.getElementById("select-modifier-"+itemCategory+"-"+itemNumber);
		if(element && element.value){
			element.value = itemModifier;
			return;
		}
	},
	_getItemModifierValueFromDoc: function(itemNumber, itemCategory){
		var element = document.getElementById("number-modifier-"+itemCategory+"-value-"+itemNumber);
		if(element && element.value){
			return element.value;
		}
		return null;
	},
	_setItemModifierValueInDoc: function(itemNumber, itemCategory, itemModifierValue){
		var element = document.getElementById("number-modifier-"+itemCategory+"-value-"+itemNumber);
		if(element && element.value){
			element.value = itemModifierValue;
			return;
		}
	},
	_getItemDurabilityFromDoc: function(itemNumber){
		var element = document.getElementById("number-item"+itemNumber);
		if(element && element.value){
			return element.value;
		}
		return null;
	},
	_setItemDurabilityInDoc: function(itemNumber, itemDurability){
		var element = document.getElementById("number-item"+itemNumber);
		if(element && element.value){
			element.value = itemDurability;
			return;
		}
	},

	/* private functions */
	/* 私有函数 */
	_toHexInt:function(i){var s=i.toString(16);while(s.length<8)s='0'+s;return '0x'+s},
	_writeBoolean:function(offset,val,arrayIndex){if(arrayIndex)tempFile.writeU32(offset+8*arrayIndex,val?1:0);else tempFile.writeU32(offset,val?1:0)},
	_writeValue:function(offset,val,arrayIndex){if(arrayIndex)tempFile.writeU32(offset+8*arrayIndex,val);else tempFile.writeU32(offset,val)},
	_writeFloat32:function(offset,val,arrayIndex){if(arrayIndex)tempFile.writeF32(offset+8*arrayIndex,val);else tempFile.writeF32(offset,val)},
	_writeString:function(offset,str,len){
		len=len || 8;
		for(var i=0; i<len; i++){
			tempFile.writeBytes(offset,[0,0,0,0]);
			var fourBytes=str.substr(i*4, 4);
			for(j=0; j<fourBytes.length; j++){
				tempFile.writeU8(offset+j, fourBytes.charCodeAt(j));
			}
			offset+=8;
		}
	},
	_writeString64:function(offset,str,arrayIndex){if(typeof arrayIndex==='number')offset+=this.Constants.STRING64_SIZE*arrayIndex;this._writeString(offset,str, 16);},
	_writeString256:function(offset,str){this._writeString(offset,str, 64);},

	_buildHashIndex:function(){
		var index=new Map();
		for(var i=0x0c; i<tempFile.fileSize; i+=8){
			var hash=tempFile.readU32(i);
			if(!index.has(hash)) index.set(hash, i);
		}
		this._hashIndex=index;
		this._hashIndexFile=tempFile;
	},
	_searchHash:function(hash){
		if(this._hashIndexFile!==tempFile) this._buildHashIndex();
		var offset=this._hashIndex.get(hash);
		return typeof offset==='number'?offset:false;
	},
	_readFromHash:function(hash){
		var offset=this._searchHash(hash);
		if(typeof offset === 'number')
			return tempFile.readU32(offset+4);
		return false;
	},
	_writeValueAtHash:function(hash,val){
		var offset=this._searchHash(hash);
		if(typeof offset==='number')
			this._writeValue(offset+4,val);
	},

	_getOffsets:function(){
		this._buildHashIndex();
		this.Offsets={};
		this.Headers={};
		for(var i=0; i<this.Hashes.length; i+=2){
			var offset=this._hashIndex.get(this.Hashes[i]);
			if(typeof offset==='number'){
				this.Offsets[this.Hashes[i+1]]=offset+4;
				this.Headers[this.Hashes[i+1]]=this.Hashes[i];
			}
		}
	},

	_getItemTranslation:function(itemId){
		this._ensureItemCatalog();
		return this._itemTranslation[itemId] || '<span style="color:red">'+itemId+'</span>';
	},
	_getItemCategory:function(itemId){
		this._ensureItemCatalog();
		return this._itemCategory[itemId] || 'other';
	},

	_readString:function(offset, len){
		len=len || 8;
		var txt='';
		for(var j=0; j<len; j++){
			txt+=tempFile.readString(offset,4);
			offset+=8;
		}
		return txt
	},
	_readString64:function(offset,arrayIndex){
		if(typeof arrayIndex==='number')
			offset+=this.Constants.STRING64_SIZE*arrayIndex;
		return this._readString(offset, 16);
	},
	_readString256:function(offset,){
		return this._readString(offset, 64);
	},

	_ensureItemCatalog:function(){
		if(this._itemCategory) return;
		this._itemCategory={};
		this._itemTranslation={};
		if(typeof BOTW_Data==='undefined' || !BOTW_Data.Translations) return;
		for(var i=0; i<BOTW_Data.Translations.length; i++){
			var group=BOTW_Data.Translations[i];
			for(var item in group.items){
				if(!group.items[item] || this._itemCategory[item]!==undefined) continue;
				this._itemCategory[item]=group.id;
				this._itemTranslation[item]=group.items[item];
			}
		}
	},
	_ensureItemNames:function(){
		if(this._itemNames && this._itemNamesFile===tempFile) return;
		var names=[];
		for(var i=0; i<this.Constants.MAX_ITEMS; i++){
			var name=this._readString64(this.Offsets.ITEMS+i*0x80);
			if(name==='') break;
			names.push(name);
		}
		this._itemNames=names;
		this._itemNamesFile=tempFile;
	},
	_loadItemName:function(i){
		this._ensureItemNames();
		return i<this._itemNames.length ? this._itemNames[i] : '';
	},
	_writeItemName:function(i,newItemNameId){
		this._writeString64(this.Offsets.ITEMS, newItemNameId, i);
		if(!this._itemNames || this._itemNamesFile!==tempFile){
			this._itemNames=null;
			return;
		}
		if(newItemNameId===''){
			if(i===this._itemNames.length-1) this._itemNames.pop();
			else this._itemNames=null;
			return;
		}
		if(i===this._itemNames.length) this._itemNames.push(newItemNameId);
		else if(i<this._itemNames.length) this._itemNames[i]=newItemNameId;
		else this._itemNames=null;
	},
	_getItemMaximumQuantity:function(itemId){
		var cat=this._getItemCategory(itemId);
		if(itemId.endsWith('Arrow') || itemId.endsWith('Arrow_A') || cat==='materials' || cat==='food'){
			return 999;
		}else if(cat==='weapons' || cat==='bows' || cat==='shields'){
			return 6553500;
		}else if(itemId==='Obj_DungeonClearSeal'){
			return 120
		}else if(itemId==='Obj_KorokNuts'){
			return 900
		}else{
			return 0xffffffff;
		}
	},
	_getItemQuantityOffset:function(i){
		return this.Offsets.ITEMS_QUANTITY+i*0x08;
	},
	_getItemEquippedOffset:function(i){
		return this.Offsets.ITEMS_EQUIPPED+i*0x08;
	},
	_getItemRow:function(i){
		return getField('number-item'+i).parentElement.parentElement
	},
	_getItemCount:function(){
		this._ensureItemNames();
		return this._itemNames.length;
	},
	_getEquipmentCapacity:function(category){
		var offsetName={weapons:'WEAPON_CAPACITY', bows:'BOW_CAPACITY', shields:'SHIELD_CAPACITY'}[category];
		return offsetName && typeof this.Offsets[offsetName]==='number' ? tempFile.readU32(this.Offsets[offsetName]) : null;
	},
	_usesEquipmentSlot:function(category,itemNameId){
		return category==='weapons' || category==='shields' || (category==='bows' && itemNameId.startsWith('Weapon_'));
	},
	_getEquipmentCount:function(category){
		var count=0;
		for(var i=0; i<this.Constants.MAX_ITEMS; i++){
			var itemNameId=this._loadItemName(i);
			if(itemNameId==='') break;
			if(this._getItemCategory(itemNameId)===category && this._usesEquipmentSlot(category,itemNameId)) count++;
		}
		return count;
	},
	_getEquipmentIndex:function(itemIndex,category){
		var equipmentIndex=0;
		for(var i=0; i<itemIndex; i++){
			var itemNameId=this._loadItemName(i);
			if(this._getItemCategory(itemNameId)===category && this._usesEquipmentSlot(category,itemNameId)) equipmentIndex++;
		}
		return equipmentIndex;
	},
	_getModifierArrayNames:function(category){
		var singular=category.replace(/s$/,'').toUpperCase();
		return ['FLAGS_'+singular,'FLAGSV_'+singular];
	},
	_insertEquipmentModifier:function(category,equipmentIndex,usedCount){
		var arrays=this._getModifierArrayNames(category);
		for(var a=0; a<arrays.length; a++){
			var offset=this.Offsets[arrays[a]];
			for(var i=usedCount; i>equipmentIndex; i--) tempFile.writeU32(offset+i*8,tempFile.readU32(offset+(i-1)*8));
			tempFile.writeU32(offset+equipmentIndex*8,0);
		}
	},
	_removeEquipmentModifier:function(category,equipmentIndex,usedCount){
		var arrays=this._getModifierArrayNames(category);
		for(var a=0; a<arrays.length; a++){
			var offset=this.Offsets[arrays[a]];
			for(var i=equipmentIndex; i<usedCount-1; i++) tempFile.writeU32(offset+i*8,tempFile.readU32(offset+(i+1)*8));
			tempFile.writeU32(offset+(usedCount-1)*8,0);
		}
	},
	_getCategoryInsertIndex:function(category){
		var order={weapons:0,bows:1,shields:2,clothes:3,materials:4,food:5,other:6};
		var itemCount=this._getItemCount();
		var insertIndex=itemCount;
		for(var i=0; i<itemCount; i++){
			var itemCategory=this._getItemCategory(this._loadItemName(i));
			if(itemCategory===category) insertIndex=i+1;
			else if(order[itemCategory]>order[category] && insertIndex===itemCount) return i;
		}
		return insertIndex;
	},
	_updateInventoryCapacity:function(){
		var categories=['weapons','bows','shields'];
		for(var i=0; i<categories.length; i++){
			var category=categories[i];
			var element=document.getElementById('inventory-capacity-'+category);
			var capacity=this._getEquipmentCapacity(category);
			var used=this._getEquipmentCount(category);
			element.textContent=capacity===null ? '容量字段不可用' : '已用 '+used+' / '+capacity+' 格';
			element.dataset.full=capacity!==null && used>=capacity ? 'true' : 'false';
		}
	},
	_indexFromElement:function(element){
		while(element && element.dataset.index===undefined) element=element.parentElement;
		return Number(element.dataset.index);
	},
	_detachItemSelector:function(commit){
		var select=this.selectItem;
		var editingItem=currentEditingItem;
		var value=select && select.value;
		clearTimeout(this._itemSelectorBlurTimer);
		this._itemEditSession=null;
		currentEditingItem=null;
		if(select && select.parentElement) select.parentElement.removeChild(select);
		if(commit!==false && editingItem!==null && select) this.editItem2(editingItem, value);
	},
	_setRowIndex:function(row, index){
		row.dataset.index=String(index);
		row.id='item-row-'+index;
		var icon=row.querySelector('img');
		if(icon) icon.id='icon'+index;
		var name=row.querySelector('.item-name');
		if(name) name.id='item-name'+index;
		var number=row.querySelector('.item-number');
		if(number) number.innerHTML='#'+index;
		var quantity=row.querySelector('input[id^="number-item"], select[id^="select-item"]');
		if(quantity) quantity.id=(quantity.tagName==='SELECT' ? 'select-item' : 'number-item')+index;
		var modifier=row.querySelector('select[id^="select-modifier-"]');
		if(modifier){
			var modifierCategory=modifier.id.replace(/^select-modifier-/,'').replace(/-\d+$/,'');
			modifier.id='select-modifier-'+modifierCategory+'-'+index;
		}
		var modifierValue=row.querySelector('input[id^="number-modifier-"]');
		if(modifierValue){
			var valueCategory=modifierValue.id.replace(/^number-modifier-/,'').replace(/-value-\d+$/,'');
			modifierValue.id='number-modifier-'+valueCategory+'-value-'+index;
		}
	},
	_shiftRowIndices:function(fromIndex, delta){
		var matched=[];
		var rows=document.querySelectorAll('.row-items[data-index]');
		for(var i=0; i<rows.length; i++){
			if(Number(rows[i].dataset.index)>=fromIndex) matched.push(rows[i]);
		}
		matched.sort(function(a,b){
			return delta>0 ? Number(b.dataset.index)-Number(a.dataset.index) : Number(a.dataset.index)-Number(b.dataset.index);
		});
		for(var j=0; j<matched.length; j++)
			this._setRowIndex(matched[j], Number(matched[j].dataset.index)+delta);
	},
	_mountModifier:function(itemNumber, category, modifier, modifierValue){
		var row=document.getElementById('item-row-'+itemNumber);
		var additional=row.children[2];
		while(additional.children.length>1) additional.removeChild(additional.lastChild);
		var modifierSelect=select('modifier-'+category+'-'+itemNumber, BOTW_Data.MODIFIERS.concat({value:modifier,name:this._toHexInt(modifier)}));
		modifierSelect.value=modifier;
		additional.appendChild(modifierSelect);
		additional.appendChild(inputNumber('modifier-'+category+'-value-'+itemNumber, 0, 0xffffffff, modifierValue));
	},
	_clearModifier:function(itemNumber){
		var additional=document.getElementById('item-row-'+itemNumber).children[2];
		while(additional.children.length>1) additional.removeChild(additional.lastChild);
	},
	_bindDurabilityTooltip:function(row, category){
		if(category!=='weapons' && category!=='bows' && category!=='shields') return;
		var text={weapons:'武器耐久',bows:'弓耐久',shields:'盾耐久'}[category];
		var input=row.querySelector('input[id^="number-item"]');
		if(input) MarcTooltips.add(input, {text:text,position:'bottom',align:'right'});
	},
	_createItemRow:function(i,itemCat){
		var itemNameId=this._loadItemName(i);
		var itemVal=itemCat===false?1:tempFile.readU32(this._getItemQuantityOffset(i));

		var img=new Image();
		img.id='icon'+i;
		img.src=BOTW_Icons.getBlankIcon();

		/*img.addEventListener('error', function(){
			img.src=BOTW_Icons.getBlankIcon();
		}, false);*/

		var itemNumber=document.createElement('span');
		itemNumber.className='item-number';
		itemNumber.innerHTML='#'+i;

		var span=document.createElement('span');
		span.className='item-name clickable';
		span.id='item-name'+i;
		span.innerHTML=this._getItemTranslation(itemNameId);
		span.addEventListener('click', function(){
			SavegameEditor.editItem(SavegameEditor._indexFromElement(this));
		}, false);


		var input;
		if(itemCat && itemCat==='clothes'){
			input=select('item'+i, BOTW_Data.DYE_COLORS, function(){
				var index=SavegameEditor._indexFromElement(this);
				BOTW_Icons.setIcon(document.getElementById('icon'+index), SavegameEditor._loadItemName(index), parseInt(this.value));
			});
			input.value=itemVal;

			BOTW_Icons.setIcon(img, itemNameId, itemVal);
		}else{
			input=inputNumber('item'+i, 0, this._getItemMaximumQuantity(itemNameId), itemVal);
			BOTW_Icons.setIcon(img, itemNameId);
		}

		var r=row([1,6,3,2],
			img,
			span,
			document.createElement('div'), /* modifier column 修饰列 */
			input
		);
		r.className+=' row-items';
		r.children[1].insertBefore(itemNumber, r.children[1].firstChild);

		var actions=document.createElement('div');
		actions.className='columns row item-actions';
		var removeButton=document.createElement('button');
		removeButton.type='button';
		removeButton.className='item-remove-button';
		removeButton.title='移除物品';
		removeButton.setAttribute('aria-label','移除 '+this._getItemTranslation(itemNameId).replace(/<[^>]+>/g,''));
		removeButton.textContent='×';
		removeButton.addEventListener('click',function(event){
			event.preventDefault();
			event.stopPropagation();
			SavegameEditor.removeItem(SavegameEditor._indexFromElement(this));
		},false);
		actions.appendChild(removeButton);
		r.appendChild(actions);
		r.dataset.index=String(i);
		r.id='item-row-'+i;
		return r;
	},

	addItem:function(){
		// Commit before changing options or shifting inventory indices.
		this._detachItemSelector();
		var group=this.selectItem.categories[currentTab];
		if(!group || !group.children.length) return;
		var itemCount=this._getItemCount();
		if(itemCount>=this.Constants.MAX_ITEMS){
			alert('存档的 420 个物品记录已全部占用。');
			return;
		}
		var nextIndex=0;
		for(var optionIndex=0; optionIndex<group.children.length; optionIndex++){
			if(group.children[optionIndex].value===this.selectItem.value){
				nextIndex=(optionIndex+1)%group.children.length;
				break;
			}
		}

		var itemNameId=group.children[nextIndex].value;
		var itemCategory=this._getItemCategory(itemNameId);
		var usedCount=this._getEquipmentCount(itemCategory);
		var capacity=this._getEquipmentCapacity(itemCategory);
		if(this._usesEquipmentSlot(itemCategory,itemNameId) && capacity!==null && usedCount>=capacity){
			alert('当前装备槽已满（'+capacity+' 格），请先移除一件物品或在游戏中扩充背包。');
			return;
		}

		this._saveInventory();
		var insertIndex=this._getCategoryInsertIndex(itemCategory);
		for(var i=itemCount; i>insertIndex; i--){
			this._writeItemName(i,this._loadItemName(i-1));
			tempFile.writeU32(this._getItemQuantityOffset(i),tempFile.readU32(this._getItemQuantityOffset(i-1)));
			tempFile.writeU32(this._getItemEquippedOffset(i),tempFile.readU32(this._getItemEquippedOffset(i-1)));
		}
		this._writeItemName(insertIndex,itemNameId);
		tempFile.writeU32(this._getItemQuantityOffset(insertIndex),1);
		tempFile.writeU32(this._getItemEquippedOffset(insertIndex),0);
		if(this._usesEquipmentSlot(itemCategory,itemNameId)) this._insertEquipmentModifier(itemCategory,usedCount,usedCount);

		this._shiftRowIndices(insertIndex, 1);
		var row=this._createItemRow(insertIndex, itemCategory);
		document.getElementById('container-'+itemCategory).appendChild(row);
		if(this._usesEquipmentSlot(itemCategory,itemNameId)) this._mountModifier(insertIndex, itemCategory, 0, 0);
		this._bindDurabilityTooltip(row, itemCategory);
		this._updateInventoryCapacity();
		showTab(itemCategory);
		document.getElementById('the-editor').dispatchEvent(new Event('input',{bubbles:true}));
		this.editItem(insertIndex);
	},

	removeItem:function(i){
		this._detachItemSelector();
		var itemNameId=this._loadItemName(i);
		if(!itemNameId) return;
		var itemLabel=this._getItemTranslation(itemNameId).replace(/<[^>]+>/g,'');
		if(!confirm('确定移除“'+itemLabel+'”吗？\n尚未保存时可返回槽位放弃更改；保存时会自动创建备份。')) return;

		this._saveInventory();
		var category=this._getItemCategory(itemNameId);
		var itemCount=this._getItemCount();
		var usesEquipmentSlot=this._usesEquipmentSlot(category,itemNameId);
		var usedCount=this._getEquipmentCount(category);
		var equipmentIndex=usesEquipmentSlot ? this._getEquipmentIndex(i,category) : -1;
		for(var index=i; index<itemCount-1; index++){
			this._writeItemName(index,this._loadItemName(index+1));
			tempFile.writeU32(this._getItemQuantityOffset(index),tempFile.readU32(this._getItemQuantityOffset(index+1)));
			tempFile.writeU32(this._getItemEquippedOffset(index),tempFile.readU32(this._getItemEquippedOffset(index+1)));
		}

		var lastIndex=itemCount-1;
		this._writeItemName(lastIndex,'');
		tempFile.writeU32(this._getItemQuantityOffset(lastIndex),0);
		tempFile.writeU32(this._getItemEquippedOffset(lastIndex),0);
		if(usesEquipmentSlot) this._removeEquipmentModifier(category,equipmentIndex,usedCount);

		document.getElementById('item-row-'+i).remove();
		this._shiftRowIndices(i+1, -1);
		this._updateInventoryCapacity();
		showTab(category);
		document.getElementById('the-editor').dispatchEvent(new Event('input',{bubbles:true}));
	},

	editItem:function(i){
		this._detachItemSelector();
		if(!this._loadItemName(i)) return;
		this._limitItemSelector(this._getItemCategory(this._loadItemName(i)));
		this.selectItem.value=this._loadItemName(i);
		currentEditingItem=i;
		this._itemEditSession={index:i};
		document.getElementById('item-name'+i).innerHTML='';
		document.getElementById('item-name'+i).parentElement.appendChild(this.selectItem);
		this.selectItem.focus();
	},
	editItem2:function(i,nameId){
		var oldNameId=this._loadItemName(i);
		if(!oldNameId || !document.getElementById('item-name'+i)) return;
		// Unknown/modded items have no option; closing the selector must retain them.
		if(!nameId) nameId=oldNameId;
		var oldCat=this._getItemCategory(oldNameId);
		var newCat=this._getItemCategory(nameId);
		var oldUsesSlot=this._usesEquipmentSlot(oldCat,oldNameId);
		var newUsesSlot=this._usesEquipmentSlot(newCat,nameId);
		var usedCount=this._getEquipmentCount(oldCat);
		var capacity=this._getEquipmentCapacity(oldCat);
		if(!oldUsesSlot && newUsesSlot && capacity!==null && usedCount>=capacity){
			nameId=oldNameId;
			newCat=oldCat;
			newUsesSlot=oldUsesSlot;
			alert('当前装备槽已满，无法把该物品替换为占用装备槽的物品。');
		}
		if(oldCat!==newCat){
			nameId=oldNameId;
			newCat=oldCat;
			newUsesSlot=oldUsesSlot;
		}
		if(oldUsesSlot!==newUsesSlot){
			this._saveInventory();
			var equipmentIndex=this._getEquipmentIndex(i,oldCat);
			if(newUsesSlot) this._insertEquipmentModifier(oldCat,equipmentIndex,usedCount);
			else this._removeEquipmentModifier(oldCat,equipmentIndex,usedCount);
		}
		this._writeItemName(i, nameId);
		document.getElementById('item-name'+i).innerHTML=this._getItemTranslation(nameId);
		BOTW_Icons.setIcon(document.getElementById('icon'+i), nameId);
		if(document.getElementById('number-item'+i))
			document.getElementById('number-item'+i).maxValue=this._getItemMaximumQuantity(nameId);
		if(oldUsesSlot!==newUsesSlot){
			if(newUsesSlot) this._mountModifier(i, oldCat, 0, 0);
			else this._clearModifier(i);
		}
		if(nameId!==oldNameId)
			document.getElementById('the-editor').dispatchEvent(new Event('input',{bubbles:true}));
		this._updateInventoryCapacity();
	},

	_limitItemSelector:function(category){
		var group=this.selectItem.categories[category];
		if(!group) return;
		if(this.selectItem.children.length===1 && this.selectItem.firstChild===group) return;
		while(this.selectItem.firstChild) this.selectItem.removeChild(this.selectItem.firstChild);
		group.hidden=false;
		group.disabled=false;
		for(var i=0; i<group.children.length; i++){
			group.children[i].hidden=false;
			group.children[i].disabled=false;
		}
		this.selectItem.appendChild(group);
	},

	filterItems:function(category){
	},

	_getModifierOffset1:function(type){
		if(type==='bows')
			return this.Offsets.FLAGS_BOW;
		else if(type==='shields')
			return this.Offsets.FLAGS_SHIELDS;
		else
			return this.Offsets.FLAGS_WEAPON;
	},
	_getModifierOffset2:function(type){
		if(type==='bows')
			return this.Offsets.FLAGSV_BOW;
		else if(type==='shields')
			return this.Offsets.FLAGSV_SHIELD;
		else
			return this.Offsets.FLAGSV_WEAPON;
	},

	editModifier2:function(type,i,modifier,val){
		tempFile.writeU32(this._getModifierOffset1(type)+i*0x08, modifier);
		tempFile.writeU32(this._getModifierOffset2(type)+i*0x08, val);
	},

	setHorseName:function(i,val){
		if(i<5)
			this._writeString64(this.Offsets.HORSE_NAMES, val, i);
	},
	setHorseSaddle:function(i,val){
		if(i<5)
			this._writeString64(this.Offsets.HORSE_SADDLES, val, i);
	},
	setHorseReins:function(i,val){
		if(i<5)
			this._writeString64(this.Offsets.HORSE_REINS, val, i);
	},
	setHorseType:function(i,val){
		if(currentEditingItem<6){
			this._writeString64(this.Offsets.HORSE_TYPES, val, i);
			/* fix mane */
			this._writeString64(this.Offsets.HORSE_MANES, (val==='GameRomHorse00L'?'Horse_Link_Mane_00L':'Horse_Link_Mane'), i);
		}
	},

	_arrayToSelectOpts:function(arr){
		var arr2=[];
		for(var i=0; i<arr.length; i++){
			var name=BOTW_Data.Translations[6].items[arr[i]] || arr[i];
			arr2.push({name:name, value:arr[i]});
		}
		return arr2;
	},

	changeEndianess:function(){
		// Save item data in clipboard
		// 在剪贴板中保存项目数据
		BOTW_Clipboard.fillClipboardWithItems();

		var tempFileByteSwapped=new MarcFile(tempFile.fileSize);
		tempFileByteSwapped.fileType=tempFile.fileType;
		tempFileByteSwapped.fileName=tempFile.fileName;
		tempFileByteSwapped.littleEndian=!tempFile.littleEndian;
		for(var i=0; i<tempFile.fileSize; i+=4){
			tempFileByteSwapped.writeU32(i, tempFile.readU32(i));
		}
		tempFile=tempFileByteSwapped;
		this.checkValidSavegame();

		// reload save to apply changes
		// 重新加载保存以应用更改
		this.load();
		// after changing endianess and reloading save, items get corrupted and all of them go to the other tab
		// 更改字节顺序并重新加载保存后，项目被损坏，所有项目都转到另一个选项卡
		empty('container-other');
		// overwrite corrupted items with the ones in the clipboard
		// 用剪贴板中的项目覆盖损坏的项目
		BOTW_Clipboard.overwriteItemsWithClipboard();

	},

	/* check if savegame is valid */
	/* 检查游戏存档是否有效 */
	_checkValidSavegameByConsole:function(switchMode){
		var CONSOLE=switchMode?'Switch':'Wii U';
		tempFile.littleEndian=switchMode;
		for(var i=0; i<this.Constants.FILESIZE.length; i++){
			var versionHash=tempFile.readU32(0);

			if(tempFile.fileSize===this.Constants.FILESIZE[i] && versionHash===this.Constants.HEADER[i] && tempFile.readU32(4)===0xffffffff){
				this._getOffsets(i);
				setValue('version', this.Constants.VERSION[i]+' ('+CONSOLE+')');
				return true;
			}else if((tempFile.fileSize>=896976 && tempFile.fileSize<=1500000) && versionHash===this.Constants.HEADER[i] && tempFile.readU32(4)===0xffffffff){ /* check for mods, filesizes vary */
				this._getOffsets(i);
				setValue('version', this.Constants.VERSION[i]+'<small>mod</small> ('+CONSOLE+')');
				return true;
			}
		}

		return false
	},
	checkValidSavegame:function(){
		return this._checkValidSavegameByConsole(false) || this._checkValidSavegameByConsole(true);
	},


	preload:function(){
		this._ensureItemCatalog();
		this.selectItem=document.createElement('select');
		this.selectItem.addEventListener('change', function(){
			SavegameEditor._detachItemSelector();
		}, false);
		this.selectItem.addEventListener('blur', function(){
			var select=this;
			var session=SavegameEditor._itemEditSession;
			clearTimeout(SavegameEditor._itemSelectorBlurTimer);
			SavegameEditor._itemSelectorBlurTimer=setTimeout(function(){
				if(!session || SavegameEditor._itemEditSession!==session || document.activeElement===select) return;
				SavegameEditor._detachItemSelector();
			}, 200);
		}, false);

		setNumericRange('rupees', 0, 999999);
		setNumericRange('mons', 0, 999999);
		setNumericRange('relic-gerudo', 0, 99);
		setNumericRange('relic-goron', 0, 99);
		setNumericRange('relic-rito', 0, 99);

		/* prepare edit item selector */
		/* 准备编辑项选择器 */
		this.selectItem.categories={};
		for(var i=0; i<BOTW_Data.Translations.length; i++){
			var optGroup=document.createElement('optgroup');
			optGroup.label=BOTW_Data.Translations[i].id;

			for(var item in BOTW_Data.Translations[i].items){
				var opt=document.createElement('option');
				opt.value=item;
				opt.group=BOTW_Data.Translations[i].id;
				opt.innerHTML=BOTW_Data.Translations[i].items[item];
				optGroup.appendChild(opt);
			}
			this.selectItem.appendChild(optGroup);
			this.selectItem.categories[BOTW_Data.Translations[i].id]=optGroup;
		}
		this.selectItem.value='Armor_180_Lower';

		/* map position selectors */
		/* 地图位置选择器 */
		select(
			'pos-maptype',
			[
				'?',
				{value:'MainField',name:'MainField'},
				{value:'MainFieldDungeon',name:'MainFieldDungeon'}
			],
			function(){
				if(this.value==='MainField'){
					setValue('pos-map','A-1');
				}else if(this.value==='MainFieldDungeon'){
					setValue('pos-map','RemainsElectric');
					fixDungeonCoordinates();
				}
			}
		);

		var maps=['?'];
		for(var i=0; i<10; i++){
			for(var j=0; j<8; j++){
				var map=(String.fromCharCode(65+i))+'-'+(j+1);
				maps.push({value:map,name:map});
			}
		}
		for(var i=0; i<120; i++){
			var map='Dungeon'
			if(i<100)
				map+='0';
			if(i<10)
				map+='0';
			map+=i;
			maps.push({value:map,name:map});
		}
		maps.push({value:'RemainsElectric',name:'RemainsElectric'});
		maps.push({value:'RemainsFire',name:'RemainsFire'});
		maps.push({value:'RemainsWater',name:'RemainsWater'});
		maps.push({value:'RemainsWind',name:'RemainsWind'});
		select('pos-map', maps, function(){
			if(/^.-\d$/.test(this.value)){
				setValue('pos-maptype','MainField');
			}else if(/^Remains/.test(this.value)){
				setValue('pos-maptype','MainFieldDungeon');
				fixDungeonCoordinates();
			}else if(/^Dungeon/.test(this.value)){
				setValue('pos-maptype','MainFieldDungeon');
			}
		});


		/* horses */
		/* 马匹 */
		for(var i=0; i<6; i++){
			if(i<5){
				get('input-horse'+i+'-name').horseIndex=i;
				get('input-horse'+i+'-name').addEventListener('change', function(){SavegameEditor.setHorseName(this.horseIndex, this.value)}, false);
				get('select-horse'+i+'-saddles').horseIndex=i;
				get('select-horse'+i+'-saddles').addEventListener('change', function(){SavegameEditor.setHorseSaddle(this.horseIndex, this.value)}, false);
				get('select-horse'+i+'-reins').horseIndex=i;
				get('select-horse'+i+'-reins').addEventListener('change', function(){SavegameEditor.setHorseReins(this.horseIndex, this.value)}, false);
			}
			get('select-horse'+i+'-type').horseIndex=i;
			get('select-horse'+i+'-type').addEventListener('change', function(){SavegameEditor.setHorseType(this.horseIndex, this.value)}, false);

			select('horse'+i+'-saddles', this._arrayToSelectOpts(BOTW_Data.HORSE_SADDLES));
			select('horse'+i+'-reins', this._arrayToSelectOpts(BOTW_Data.HORSE_REINS));
			select('horse'+i+'-type', this._arrayToSelectOpts(i===5?BOTW_Data.HORSE_TYPES.concat(BOTW_Data.HORSE_TYPES_UNTAMMED):BOTW_Data.HORSE_TYPES));
		}



		MarcTooltips.add('.tab-button',{className:'dark',fixed:true});
	},

	_timeToString:function(timeVal){
		var seconds=timeVal%60;
		if(seconds<10)seconds='0'+seconds;
		var minutes=parseInt(timeVal/60)%60;
		if(minutes<10)seconds='0'+seconds;
		return parseInt(timeVal/3600)+':'+minutes+':'+seconds;
	},

	/* Load data from the savegame file */
	/* 从存档文件加载数据 */
	load:function(){
		tempFile.fileName='game_data.sav';


		/* prepare editor */
		/* 准备编辑器 */
		setValue('rupees', tempFile.readU32(this.Offsets.RUPEES));
		setValue('mons', tempFile.readU32(this.Offsets.MONS));
		setValue('max-hearts', tempFile.readU32(this.Offsets.MAX_HEARTS));
		setValue('max-stamina', tempFile.readU32(this.Offsets.MAX_STAMINA));

		setValue('relic-gerudo', tempFile.readU32(this.Offsets.RELIC_GERUDO));
		setValue('relic-goron', tempFile.readU32(this.Offsets.RELIC_GORON));
		setValue('relic-rito', tempFile.readU32(this.Offsets.RELIC_RITO));

		setValue('koroks', tempFile.readU32(this.Offsets.KOROK_SEED_COUNTER));
		setValue('defeated-hinox', tempFile.readU32(this.Offsets.DEFEATED_HINOX_COUNTER));
		setValue('defeated-talus', tempFile.readU32(this.Offsets.DEFEATED_TALUS_COUNTER));
		setValue('defeated-molduga', tempFile.readU32(this.Offsets.DEFEATED_MOLDUGA_COUNTER));
		setValue('playtime',this._timeToString(tempFile.readU32(this.Offsets.PLAYTIME)));
		setValue('scale-score', BOTWScoreCalculator.calculate());


		/* motorcycle */
		/* 摩托车 */
		document.getElementById('checkbox-motorcycle').checked=!!tempFile.readU32(this.Offsets.MOTORCYCLE);
		if(this.Offsets.MOTORCYCLE){
			document.getElementById('row-motorcycle').style.display='flex';
		}else{
			document.getElementById('row-motorcycle').style.display='none';
		}


		/* coordinates */
		/*坐标*/
		setValue('pos-x', tempFile.readF32(this.Offsets.PLAYER_POSITION));
		setValue('pos-y', tempFile.readF32(this.Offsets.PLAYER_POSITION+8));
		setValue('pos-z', tempFile.readF32(this.Offsets.PLAYER_POSITION+16));

		var map=this._readString(this.Offsets.MAP);
		var mapType=this._readString(this.Offsets.MAPTYPE);
		getField('pos-map').children[0].value=map;
		getField('pos-map').children[0].innerHTML='* '+map+' *';
		getField('pos-maptype').children[0].value=mapType;
		getField('pos-maptype').children[0].innerHTML='* '+mapType+' *';
		setValue('pos-map',map)
		setValue('pos-maptype',mapType)

		setValue('pos-x-horse', tempFile.readF32(this.Offsets.HORSE_POSITION));
		setValue('pos-y-horse', tempFile.readF32(this.Offsets.HORSE_POSITION+8));
		setValue('pos-z-horse', tempFile.readF32(this.Offsets.HORSE_POSITION+16));


		/* map pins */
		/* 地图图钉 */
		loadMapPins();


		/* items */
		/* 物品 */
		this._renderItems();

		/* horses */
		/* 马匹 */
		for(var i=0; i<6; i++){
			if(i<5){
				setValue('horse'+i+'-name',this._readString64(this.Offsets.HORSE_NAMES, i));
				setValue('horse'+i+'-saddles',this._readString64(this.Offsets.HORSE_SADDLES, i));
				setValue('horse'+i+'-reins',this._readString64(this.Offsets.HORSE_REINS, i));
			}
			var horseType=this._readString64(this.Offsets.HORSE_TYPES, i);
			if(horseType){
				setValue('horse'+i+'-type',horseType);
				get('row-horse'+i).style.visibility='visible';
			}else{
				get('row-horse'+i).style.visibility='hidden';
			}
		}

		showTab('home');
	},

	/* save function */
	/* 保存函数 */
	save:function(){
		this._detachItemSelector();
		/* STATS */
		/* 统计 */
		tempFile.writeU32(this.Offsets.RUPEES, getValue('rupees'));
		tempFile.writeU32(this.Offsets.MONS, getValue('mons'));
		tempFile.writeU32(this.Offsets.MAX_HEARTS, getValue('max-hearts'));
		tempFile.writeU32(this.Offsets.MAX_STAMINA, getValue('max-stamina'));

		tempFile.writeU32(this.Offsets.RELIC_GERUDO, getValue('relic-gerudo'));
		tempFile.writeU32(this.Offsets.RELIC_GORON, getValue('relic-goron'));
		tempFile.writeU32(this.Offsets.RELIC_RITO, getValue('relic-rito'));

		tempFile.writeU32(this.Offsets.KOROK_SEED_COUNTER, getValue('koroks'));
		tempFile.writeU32(this.Offsets.DEFEATED_HINOX_COUNTER, getValue('defeated-hinox'));
		tempFile.writeU32(this.Offsets.DEFEATED_TALUS_COUNTER, getValue('defeated-talus'));
		tempFile.writeU32(this.Offsets.DEFEATED_MOLDUGA_COUNTER, getValue('defeated-molduga'));


		/* MOTORCYCLE */
		/* 摩托车 */
		if(this.Offsets.MOTORCYCLE){
			tempFile.writeU32(this.Offsets.MOTORCYCLE, getField('checkbox-motorcycle').checked?1:0);
		}



		/* COORDINATES */
		/* 坐标 */
		tempFile.writeF32(this.Offsets.PLAYER_POSITION, getValue('pos-x'));
		tempFile.writeF32(this.Offsets.PLAYER_POSITION+8, getValue('pos-y'));
		tempFile.writeF32(this.Offsets.PLAYER_POSITION+16, getValue('pos-z'));

		this._writeString(this.Offsets.MAP, getValue('pos-map'))
		this._writeString(this.Offsets.MAPTYPE, getValue('pos-maptype'))

		tempFile.writeF32(this.Offsets.HORSE_POSITION, getValue('pos-x-horse'));
		tempFile.writeF32(this.Offsets.HORSE_POSITION+8, getValue('pos-y-horse'));
		tempFile.writeF32(this.Offsets.HORSE_POSITION+16, getValue('pos-z-horse'));


		this._saveInventory();
	},

	_saveInventory:function(){
		for(var i=0; i<this.Constants.MAX_ITEMS; i++){
			if(document.getElementById('number-item'+i) || document.getElementById('select-item'+i))
				tempFile.writeU32(this._getItemQuantityOffset(i), getValue('item'+i));
			else
				break;
		}

		var modifierCategories=['weapon','bow','shield'];
		for(var i=0; i<3; i++){
			var category = modifierCategories[i];
			var offset = this.Offsets["FLAGS_"+category.toUpperCase()];
			var valueOffset = this.Offsets["FLAGSV_"+category.toUpperCase()];
			var container = document.getElementById("container-"+category+"s");
			var modifierIndex=0;
			for(var j=0; j<container.children.length; j++){
				var row = container.children[j];
				var itemNumber = this._getItemNumberFromRow(row);
				if(row.children[2].children.length===3){
					tempFile.writeU32(offset+modifierIndex*8, getValue('modifier-'+category+'s-'+itemNumber));
					tempFile.writeU32(valueOffset+modifierIndex*8, getValue('modifier-'+category+'s-value-'+itemNumber));
					modifierIndex++;
				}
			}
		}
	},

	_renderItems:function(){
		// A reload may already point at another save; discard the old edit session.
		this._detachItemSelector(false);
		var categories=['weapons','bows','shields','clothes','materials','food','other'];
		var fragments={};
		for(var c=0; c<categories.length; c++){
			empty('container-'+categories[c]);
			fragments[categories[c]]=document.createDocumentFragment();
		}
		this._itemNames=null;
		this._itemNamesFile=null;
		this._ensureItemNames();

		var modifiersArray=[[],[],[]];
		for(var i=0; i<this._itemNames.length; i++){
			var itemNameId=this._itemNames[i];
			var itemCat=this._getItemCategory(itemNameId);
			fragments[itemCat].appendChild(this._createItemRow(i, itemCat));
			if(itemCat==='weapons') modifiersArray[0].push(i);
			else if(itemCat==='bows' && itemNameId.startsWith('Weapon_')) modifiersArray[1].push(i);
			else if(itemCat==='shields') modifiersArray[2].push(i);
		}
		for(var c=0; c<categories.length; c++)
			document.getElementById('container-'+categories[c]).appendChild(fragments[categories[c]]);

		MarcTooltips.add('#container-weapons input[id^="number-item"]',{text:'武器耐久',position:'bottom',align:'right'});
		MarcTooltips.add('#container-bows input[id^="number-item"]',{text:'弓耐久',position:'bottom',align:'right'});
		MarcTooltips.add('#container-shields input[id^="number-item"]',{text:'盾耐久',position:'bottom',align:'right'});
		BOTW_Icons.startLoadingIcons();

		var modifierColumns=['weapon','bow','shield'];
		for(var j=0; j<3; j++){
			var modifierColumn=modifierColumns[j];
			for(var n=0; n<modifiersArray[j].length; n++){
				var itemNumber=modifiersArray[j][n];
				var modifier=tempFile.readU32(this.Offsets['FLAGS_'+modifierColumn.toUpperCase()]+n*8);
				var modifierSelect=select('modifier-'+modifierColumn+'s-'+itemNumber, BOTW_Data.MODIFIERS.concat({value:modifier,name:this._toHexInt(modifier)}));
				modifierSelect.value=modifier;
				var additional=this._getRowFromItemNumber(itemNumber).children[2];
				additional.appendChild(modifierSelect);
				additional.appendChild(inputNumber('modifier-'+modifierColumn+'s-value-'+itemNumber, 0, 0xffffffff, tempFile.readU32(this.Offsets['FLAGSV_'+modifierColumn.toUpperCase()]+n*8)));
			}
		}
		this._updateInventoryCapacity();
	}
}





/* TABS */
/*标签*/
var availableTabs=['home','weapons','bows','shields','clothes','materials','food','other','horses','master'];


var currentTab;
function showTab(newTab){
	if(newTab!==currentTab) SavegameEditor._detachItemSelector();
	currentTab=newTab;
	for(var i=0; i<availableTabs.length; i++){
		document.getElementById('tab-button-'+availableTabs[i]).className=currentTab===availableTabs[i]?'tab-button active':'tab-button';
		document.getElementById('tab-'+availableTabs[i]).style.display=currentTab===availableTabs[i]?'':'none';
	}

	document.getElementById('add-item-button').style.display=(newTab==='home' || newTab==='horses' || newTab==='master')? 'none':'block';

	if(newTab==='master'){
		if(BOTWMasterEditor.isLoaded())
			BOTWMasterEditor.refreshResults();
		else
			BOTWMasterEditor.loadHashes();
	}
}



/*
function setValueByHash(hash, val){
	var offset=SavegameEditor._searchHash(hash);
	if(offset){
		if(val.length && val.length===3){
			SavegameEditor._writeValue(offset, val[0]);
			SavegameEditor._writeValue(offset, val[1], 1);
			SavegameEditor._writeValue(offset, val[2], 2);
		}else if(typeof val==='string'){
			SavegameEditor._writeString64(offset, val);
		}else{
			SavegameEditor._writeValue(offset, val);
		}
	}else{
		alert('invalid hash '+SavegameEditor._toHexInt(hash));
	}
}*/

function setBooleans(hashTable, counterElement){
	var counter=0;
	for(var i=0;i<hashTable.length; i++){
		var offset=SavegameEditor._searchHash(hashTable[i]);
		if(offset && !tempFile.readU32(offset+4)){
			tempFile.writeU32(offset+4, 1);
			counter++;
		}
	}

	if(counterElement)
		setValue(counterElement, parseInt(getValue(counterElement))+counter);
	return counter;
}

function unlockKoroks(){
	var unlockedKoroks=setBooleans(BOTW_Data.KOROKS,'koroks');
	var offset=SavegameEditor._searchHash(0x64622a86); //HiddenKorok_Complete 隐藏的克洛洛完成
	if(typeof offset==='number') tempFile.writeU32(offset+4, 1);

	//search korok seeds in inventory
	//在库存中搜索korok种子
	for(var i=0; i<SavegameEditor.Constants.MAX_ITEMS; i++){
		if(SavegameEditor._loadItemName(i)==='Obj_KorokNuts'){
			setValue('item'+i, parseInt(getValue('item'+i))+unlockedKoroks);
			break;
		}
	}
	MarcDialogs.alert('获得了 <span class="msgnb">'+unlockedKoroks+'</span> 个 [<span class="msgnm"> 克洛洛的果实 </span>]');
}

function defeatAllHinox(){
	var unlockedKoroks=setBooleans(BOTW_Data.DEFEATED_HINOX,'defeated-hinox');
	MarcDialogs.alert('打败了 <span class="msgnb">'+unlockedKoroks+'</span> 只 [<span class="msgnm"> 西诺克斯 </span>]');
}
function defeatAllTalus(){
	var unlockedKoroks=setBooleans(BOTW_Data.DEFEATED_TALUS,'defeated-talus');
	MarcDialogs.alert('打败了 <span class="msgnb">'+unlockedKoroks+'</span> 只 [<span class="msgnm"> 岩石巨人 </span>]');
}
function defeatAllMolduga(){
	var unlockedKoroks=setBooleans(BOTW_Data.DEFEATED_MOLDUGA,'defeated-molduga');
	MarcDialogs.alert('打败了 <span class="msgnb">'+unlockedKoroks+'</span> 只 [<span class="msgnm"> 莫尔德拉吉克 </span>]');
}
function treatCoke(){
	MarcDialogs.alert('打败了 <span class="msgnb">'+unlockedKoroks+'</span> 只 [<span class="msgnm"> 莫尔德拉吉克 </span>]');
}
function visitAllLocations(){
	var missingLocations=setBooleans(BOTW_Data.LOCATIONS);
	MarcDialogs.alert('访问了 <span class="msgnb">'+missingLocations+'</span> 个 [<span class="msgnm"> 未知的地点 </span>]');
}
function setCompendiumToStock(){
	var setToStock=0;
	for(var i=0; i<BOTW_Data.PICTURE_BOOK_SIZE.length; i++){
		var offset=SavegameEditor._searchHash(BOTW_Data.PICTURE_BOOK_SIZE[i]);
		if(typeof offset === 'number'){
			var val=tempFile.readU32(offset+4);
			if(val && val!==0xffffffff){
				tempFile.writeU32(offset+4, 0xffffffff);
				setToStock++;
			}
		}
	}
	MarcDialogs.alert('已经将 <span class="msgnb">'+setToStock+'</span> 张照片重制为库存。<br/> 现在你可以安全的删除<span class="msgnm"><u>pict_book</u>文件夹</span>下的所有图片');
}

var mapPinCount = 0;
var MAX_MAP_PINS = 100;
function loadMapPins(){
	// Read Pin Types
	// 读取引脚类型
	var count = 0;
	iterateMapPins(function(val){
		if (val == 0xffffffff){
			return false;
		}
		count++;
		//console.log(count, val)
		//控制台日志（计数，值）
		return true;
	})
	// to debug saved locations
	// 调试保存的位置
	// var i = 0;
	// iterateMapPinLocations(function(val, offset){
	// 	if (i % 3 == 0){
	// 		console.log("-----")
	// 		if (val == -100000){
	// 			return false;
	// 		}
	// 	}
	// 	i++
	// 	console.log(val)
	// 	return true
	// })
	mapPinCount = count;
	setValue('number-map-pins', count);
}

function guessMainFieldGrid() {
	if (getValue('pos-maptype') == "MainField")
		setValue("pos-map",guessMainFieldGridInternal(getValue("pos-x"), getValue("pos-z")))
}

function fixDungeonCoordinates() {
	var dungeon = getValue('pos-map')
	if (dungeon == "RemainsFire") {
		setValue('pos-x', 0)
		setValue('pos-y',16.8)
		setValue('pos-z',69.5)
	} else if (dungeon == "RemainsWater") {
		setValue('pos-x',47.7)
		setValue('pos-y',6.05)
		setValue('pos-z',6.3)
	} else if (dungeon == "RemainsWind") {
		setValue('pos-x',0)
		setValue('pos-y',3.4)
		setValue('pos-z',-77.7)
	} else if (dungeon == "RemainsElectric") {
		setValue('pos-x',0)
		setValue('pos-y',71.9)
		setValue('pos-z',3.7)
	} else if (dungeon == "FinalTrial") {
		setValue('pos-x',0)
		setValue('pos-y',-0.4)
		setValue('pos-z',64.5)
	}
}

function guessMainFieldGridInternal(xpos, zpos) {
	// A1 = -4974.629, -3974.629
	// J8 =  4974.629,  3974.629
	// X and letter part of grid: west/east
	// 网格的 X 和字母部分：西/东
	// Z and number part of grid: north/south
	// 网格的 Z 和数字部分：北/南

	// grid also visible at https://mrcheeze.github.io/botw-object-map/
	// 网格也可见于 https://mrcheeze.github.io/botw-object-map/

	// idea: Take position fraction out of the whole grid and divide equally.
	// idea: 从整个网格中取出position fraction，平分。

	var gridvalX = Math.min(10, Math.max(1, Math.trunc((xpos + 4974.629) / 9949.258 * 10 + 1)))
	var gridvalZ = Math.min( 8, Math.max(1, Math.trunc((zpos + 3974.629) / 7949.258 * 8  + 1)))

	return String.fromCharCode(64 + gridvalX) + '-' + gridvalZ
}

function clearMapPins(){
	// types
	// 类型
	var count = 0;
	iterateMapPins(function(val,offset){
		if (val != 0xffffffff){
			count++;
			tempFile.writeU32(offset, 0xffffffff)
		}
		return true;
	})

	var count2 =0;
	var i = 0;
	iterateMapPinLocations(function(val, offset){
		var expect = i % 3 == 0 ? -100000 : 0;
		i++;
		if (val != expect){
			count2++
			tempFile.writeF32(offset, expect)
		}
		return true
	})
	if (count2 / 3 > count){
		count = count2 / 3
	}
	mapPinCount = 0;
	setValue('number-map-pins', 0);
	MarcDialogs.alert('<span class="msgnm"><u>删除</u></span>了 <span class="msgnb">'+count+'</span> 个 [<span class="msgnm"> 地图图钉 </span>]');
}

function iterateMapPins(f){
	var offset = SavegameEditor.Offsets.MapApp_MapIconNo-4;
	for (var i = 0;; i++){
		var base = offset + (8 * i)
		var hdr = tempFile.readU32(base)
		var val = tempFile.readU32(base + 4)
		//if (hdr != SavegameEditor.Constants.MAP_ICONS){
		if (hdr != SavegameEditor.Headers.MapApp_MapIconNo){
			break
		}
		if (!f(val,base+4)){
			break
		}
	}
}
function iterateMapPinLocations(f){
	offset = SavegameEditor.Offsets.MapApp_MapIconPos-4;
	for (var i = 0;; i++){
		var base = offset + (8 * i)
		var hdr = tempFile.readU32(base)
		var val = tempFile.readF32(base + 4)
		if (hdr != SavegameEditor.Headers.MapApp_MapIconPos){
			break
		}
		if(!f(val,base+4)){
			break
		}
	}
}

function dist(px,py,pz,l){
	// 2d seems to work better than 3d
	// 2d 似乎比 3d 效果更好
	return Math.sqrt((Math.pow(l[0]-px,2))+(Math.pow(l[2]-pz,2)))
}



function addToMap(data, icon){
	var px=tempFile.readF32(SavegameEditor.Offsets.PLAYER_POSITION);
	var py=tempFile.readF32(SavegameEditor.Offsets.PLAYER_POSITION+8);
	var pz=tempFile.readF32(SavegameEditor.Offsets.PLAYER_POSITION+16);

	var points = [];
	for (var i = 0; i<data.length; i++){
		var l = BOTW_Data.COORDS[data[i]]
		if (l){
			points.push({H:data[i], L:l})
		}
	}
	// fill closest first
	// 先填充最近的
	points.sort(function(a,b){
		aDist = dist(px,py,pz,a.L);
		bDist = dist(px,py,pz,b.L);
		return aDist - bDist
	})
	var count = 0;
	for (var i = 0; i<points.length && mapPinCount<MAX_MAP_PINS; i++){
		var pt = points[i]
		var hash = pt.H;
		var offset=SavegameEditor._searchHash(hash);
		if(offset && !tempFile.readU32(offset + 4)){
			addMapPin(icon, pt.L)
			count++;
			mapPinCount++;
		}
	}
	setValue('number-map-pins', mapPinCount);
	return count;
}

function addMapPin(icon, location){
	// add pin to next availible location.
	// 将 pin 添加到下一个可用位置。
	iterateMapPins(function(val,offset){
		if (val == 0xffffffff){
			tempFile.writeU32(offset, icon)
			return false
		}
		return true;
	})
	var i = 0;
	var added = false;
	iterateMapPinLocations(function(val, offset){
		if (i%3 != 0){
			i++
			return true;
		}
		i++
		if (val == -100000){
			added = true;
			tempFile.writeF32(offset,location[0])
			tempFile.writeF32(offset+8,location[1])
			tempFile.writeF32(offset+16,location[2])
			return false;
		}
		return true;
	})
}

function addKoroksToMap(){
	var n = addToMap(BOTW_Data.KOROKS, SavegameEditor.Constants.ICON_TYPES.LEAF);
	MarcDialogs.alert('将 <span class="msgnb">'+n+'</span> 个剩余的 [<span class="msgnm"> 克洛洛的果实 </span>] 图钉添加到地图');
}

function addHinoxToMap(){
	var n = addToMap(BOTW_Data.DEFEATED_HINOX, SavegameEditor.Constants.ICON_TYPES.SKULL);
	MarcDialogs.alert('将 <span class="msgnb">'+n+'</span> 个剩余的 [<span class="msgnm"> 西诺克斯 </span>] 图钉添加到地图');
}

function addTalusToMap(){
	var n = addToMap(BOTW_Data.DEFEATED_TALUS, SavegameEditor.Constants.ICON_TYPES.SHIELD);
	MarcDialogs.alert('将 <span class="msgnb">'+n+'</span> 个剩余的 [<span class="msgnm"> 岩石巨人 </span>] 图钉添加到地图');
}

function addMoldugaToMap(){
	var n = addToMap(BOTW_Data.DEFEATED_MOLDUGA, SavegameEditor.Constants.ICON_TYPES.CHEST);
	MarcDialogs.alert('将 <span class="msgnb">'+n+'</span> 个剩余的 [<span class="msgnm"> 莫尔德拉吉克 </span>] 图钉添加到地图');
}

function addLocationsToMap(){
	var n = addToMap(BOTW_Data.LOCATIONS, SavegameEditor.Constants.ICON_TYPES.STAR);
	MarcDialogs.alert('将 <span class="msgnb">'+n+'</span> 个图钉添加到地图');
}


/* MarcTooltips.js v20200216 - Marc Robledo 2014-2020 - http://www.marcrobledo.com/license */
var MarcTooltips=function(){var n=/MSIE 8/.test(navigator.userAgent);function d(t,e,o){n?t.attachEvent("on"+e,o):t.addEventListener(e,o,!1)}function u(t){void 0!==t.stopPropagation?t.stopPropagation():t.cancelBubble=!0}function g(t){if(/^#[0-9a-zA-Z_\-]+$/.test(t))return[document.getElementById(t.replace("#",""))];var e=document.querySelectorAll(t);if(n){for(var o=[],i=0;i<e.length;i++)o.push(e[i]);return o}return Array.prototype.slice.call(e)}var h=function(t,e,o){t.className=t.className.replace(/position-\w+/,"position-"+e.position).replace(/align-\w+/,"align-"+e.align);var i=(window.pageXOffset||document.documentElement.scrollLeft)-(document.documentElement.clientLeft||0),n=(window.pageYOffset||document.documentElement.scrollTop)-(document.documentElement.clientTop||0);e.fixed&&(n=i=0);var l=t.attachedTo.getBoundingClientRect().left,a=t.attachedTo.getBoundingClientRect().top,s=t.attachedTo.offsetWidth,p=t.attachedTo.offsetHeight;if("up"===e.position?t.style.top=parseInt(a+n-t.offsetHeight)+"px":"down"===e.position?t.style.top=parseInt(a+n+p)+"px":"top"===e.align?t.style.top=parseInt(a+n)+"px":"bottom"===e.align?t.style.top=parseInt(a+n-(t.offsetHeight-p))+"px":t.style.top=parseInt(a+n-parseInt((t.offsetHeight-p)/2))+"px","up"===e.position||"down"===e.position?"left"===e.align?t.style.left=parseInt(l+i)+"px":"right"===e.align?t.style.left=parseInt(l+i-(t.offsetWidth-s))+"px":t.style.left=parseInt(l+i-parseInt((t.offsetWidth-s)/2))+"px":"left"===e.position?t.style.left=parseInt(l+i-t.offsetWidth)+"px":"right"===e.position&&(t.style.left=parseInt(l+i+s)+"px"),o){var r={position:e.position,align:e.align,fixed:e.fixed},c=parseInt(t.style.left.replace("px","")),f=parseInt(t.style.top.replace("px","")),d=c+t.offsetWidth,u=f+t.offsetHeight,g=(i=window.scrollX,n=window.scrollY,Math.max(document.documentElement.clientWidth,window.innerWidth||0)),m=Math.max(document.documentElement.clientHeight,window.innerHeight||0);"up"===e.position||"down"===e.position?(g<d?r.align="right":c<i&&(r.align="left"),f<n?r.position="down":n+m<u&&(r.position="up")):(m<u?r.align="bottom":f<n&&(r.align="top"),c<i?r.position="right":i+g<d&&(r.position="left")),h(t,r,!1)}},m={};d(window,"load",function(){d(n?document:window,"click",function(){for(key in m)/ visible$/.test(m[key].className)&&/:true:/.test(key)&&(m[key].className=m[key].className.replace(" visible",""))}),d(window,"resize",function(){for(key in m)/ visible$/.test(m[key].className)&&m[key].attachedTo&&h(m[key],m[key].tooltipInfo,!0)})});function y(t){var e=t.currentTarget||t.srcElement;e.title&&(e.setAttribute("data-tooltip",e.title),e.title=""),(e.tooltip.attachedTo=e).tooltip.innerHTML=e.getAttribute("data-tooltip"),e.tooltip.className+=" visible",h(e.tooltip,e.tooltip.tooltipInfo,!0)}function w(t){var e=t.currentTarget||t.srcElement;e.tooltip.className=e.tooltip.className.replace(" visible","")}return{add:function(t,e){var o="down",i="center",n=!1,l=!1,a=!1,s=!1,p=!1;e&&(e.position&&/^(up|down|left|right)$/i.test(e.position)&&(o=e.position.toLowerCase()),e.align&&/^(top|bottom|left|right)$/i.test(e.align)&&(("up"!==o&&"down"!==o||"left"!==e.align&&"right"!==e.align)&&("left"!==o&&"right"!==o||"top"!==e.align&&"bottom"!==e.align)||(i=e.align.toLowerCase())),l=e.clickable||e.onClick||e.onclick||!1,a=e.focusable||e.onFocus||e.onfocus||!1,s=e.fixed||e.positionFixed||!1,n=e.class||e.className||e.customClass||e.customClassName||!1,p=e.text||e.customText||!1);for(var r=function(t){if("string"==typeof t)return g(t);if(t.length){for(var e=[],o=0;o<t.length;o++)"string"==typeof t[o]?e=e.concat(g(t[o])):e.push(t[o]);return e}return[t]}(t),c=function(t,e,o,i,n){var l=t+":"+e+":"+o+":"+i;if(m[l])return m[l];var a=document.createElement("div");return a.className="tooltip position-"+t+" align-"+e,a.className+="left"===t||"right"===t?" position-horizontal":" position-vertical",i&&(a.className+=" "+i),a.style.position=n?"fixed":"absolute",a.style.zIndex="9000",a.style.top="0",a.style.left="0",a.attachedTo=null,a.tooltipInfo={position:t,align:e,fixed:n},o&&d(a,"click",u),m[l]=a,document.body.appendChild(a),a}(o,i,l||a,n,s),f=0;f<r.length;f++)p?r[f].setAttribute("data-tooltip",p):r[f].title&&r[f].setAttribute("data-tooltip",r[f].title),r[f].title="",r[f].tooltip=c,a?(d(r[f],"focus",y),d(r[f],"blur",w),d(r[f],"click",u)):l?(d(r[f],"click",y),d(r[f],"click",u)):(d(r[f],"mouseover",y),d(r[f],"mouseout",w))}}}();

if(typeof String.endsWith==='undefined'){
	String.prototype.endsWith=function(search){
		return (new RegExp(search+'$')).test(this)
	};
}
if(typeof String.startsWith==='undefined'){
	String.prototype.startsWith=function(search){
		return (new RegExp('^'+search)).test(this)
	};
}










var masterModeLoaded=false;
function loadMasterMode(){
	if(!masterModeLoaded){
		var script=document.createElement('script');
		script.type='text/javascript';
		script.src='./zelda-botw.master.js';
		script.onload=function(){
			masterModeLoaded=true;
			document.getElementById('tab-button-master').disabled=false;
			//BOTWMasterEditor.prepare();
		};
		document.getElementsByTagName('head')[0].appendChild(script);
	}
}
