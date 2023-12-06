

const DOM = {
    listContainer: document.querySelector('#list-items-container'),
    listInputText: document.querySelector('#list-item'),
    listAddBtn: document.querySelector('#add-list-item-btn'),
    createElement: function(type, attributes = null, prop = null) {
        const element = document.createElement(type);

        if ( attributes === null ) return element; 
        
        // Set text of the element
        if ( 'text' in attributes && attributes.text !== null ) {
            element.textContent = attributes.text;
        }

        // Set type of element
        if ( 'type' in attributes && attributes.text !== null ) {
            element.setAttribute('type', attributes.type);
        }

        // Add class to the element
        if ( 'class' in attributes && attributes.class !== null ) {
            element.className = attributes.class;

            if ( Array.isArray(prop) ) {
                if ( prop[1] - prop[0] === 1 && prop[3] === false ) {
                    element.classList.add(prop[2]);
                }
            }
        }

        // Set attribute id
        if ( 'id' in attributes && attributes.id !== null ) {
            element.id = attributes.id;
        }

        // Set attribute style
        if ( 'style' in attributes && attributes.style !== null ) {
            element.style = attributes.style;
        }

        // Set attribute data
        if ( 'data' in attributes ) {
            if ( Array.isArray(attributes.data) && attributes.data.length == 2) {
                element.dataset[attributes.data[0]] = attributes.data[1];
            }
        }

        // Set attribute value or placeholder
        if ( 'value' in attributes && attributes.value !== null ) {
            element.value = attributes.value;
        } else {
            if ( 'placeholder' in attributes ) {
                element.setAttribute('placeholder', attributes.placeholder);
            }
        }

        // Add event listener to the element
        if ( 'event' in attributes ) {
            //element.setAttribute(attributes.event.type, attributes.event.method);
            element.addEventListener(attributes.event.type, attributes.event.method);
        }

        return element;

    },
    removeElement: function(target) {
        if ( document.querySelector(target) !== null ) {
            document.querySelector(target).remove();
        }
    }
};

const list = {
    add: function() {
        // Check if add input value is less than 3 words - show error
        if ( DOM.listInputText.value.length < 3 ) {
            utils.showInputError('Input field must be greater than 2 words');
            return false;
        }

        // Get items from localStorage 
        const items = localStorage.getItem('items');

        // If there is not items in localStorage create new array 
        // fill it and send it to localStorage. If items exists in 
        // localStorage append new item.
        if ( items === null ) {
            const listItems = [];
            listItems.push(DOM.listInputText.value);
            localStorage.setItem('items', btoa(JSON.stringify(listItems)));
        } else {
            const listItems = JSON.parse(atob(items));
            listItems.push(DOM.listInputText.value);
            localStorage.setItem('items', btoa(JSON.stringify(listItems)));
        }

        // Parse new items overview and clear add input field
        utils.showItems();

        DOM.listInputText.value = '';
    },
    update: function({target}) {
        // Check updated input value is less than 3 words - show error
        if ( target.value.length < 3 ) {
            target.classList.add('input-error');
            return false;
        }

        // Get items and item position for update
        const items = JSON.parse(atob(localStorage.getItem('items')));
        const i = parseInt(target.dataset['updatePosition']);

        // Update item send new items to the localStorage and parse new items overview
        items[i] = target.value;
        localStorage.setItem('items', btoa(JSON.stringify(items)));
        const stopLIAnimation = true;
        utils.showItems(stopLIAnimation);
    },
    removeSingle: function({target}) {
        
        switch ( target.tagName ) {
            case 'I':   // UL > LI > I is found by event delegation from UL
                const index = target.dataset.index;
                let items   = localStorage.getItem('items');
                items       = JSON.parse(atob(items));

                items.splice(index, 1);

                // If last item is removed remove localStorage item property
                if ( items.length === 0 ) {
                    localStorage.removeItem('items');
                    utils.showItems();
                    return true;
                }

                items = btoa(JSON.stringify(items));
                localStorage.setItem('items', items);

                const stopLIAnimation = true;
                utils.showItems(stopLIAnimation);
                break;
            case 'SPAN':    // UL > LI > SPAN is found by event delegation from UL
                utils.updateItem(target);
                break;
            case 'LI':  // UL > LI is found by event delegation from UL
                utils.updateItem(target.firstElementChild);
                break;
        }
        
    },
    removeAll: function() {
        const items = localStorage.getItem('items');

        if ( items !== null ) localStorage.removeItem('items');

        utils.showItems();
    },
    filter: function({target}) {
        if ( target.value.length > 2 ) {

            let search  = target.value;
            const items = JSON.parse(atob(localStorage.getItem('items')));

            let result = items.filter(function(item){

                const regex = new RegExp(`.*${search}.*`, 'gi');

                return item.match(regex);

            });
            
            utils.showItems(true, result, search);

        } else {
            let search  = target.value;
            let items = localStorage.getItem('items');
            items = JSON.parse(atob(items));

            utils.showItems(true, items, search);
        }
    }
};

const utils = {
    updateItem: function(target) {
        const itemPosition = target.parentElement.dataset['itemPosition'];
        const options = { 
            class: 'w-48 p-2 border border-gray-200 px-3 focus:outline-none', 
            value: target.textContent,
            data: ['updatePosition', itemPosition],
            event: { type: 'blur', method: list.update}
        };
        const input = DOM.createElement('input', options);

        target.replaceWith(input);
        
    },
    showInputError: function(text) {
        DOM.listInputText.classList.add('input-error');

        const errorText = document.createElement('div');
        errorText.textContent = text;
        errorText.setAttribute('id', 'custom-error-input');
        errorText.style = 'width: 100%; margin-top: .3rem; color: #DC143C; font-size: .8rem';

        DOM.listInputText.insertAdjacentElement('afterend', errorText);
    },
    hideInputError: function({target}) {
        if ( target.value.length > 2 ) {
            if ( document.querySelector('#custom-error-input') !== null ) {
                DOM.listInputText.classList.remove('input-error');
                document.querySelector('#custom-error-input').remove();
            }
        }
    },
    showItems: function(stopLIAnimation = false, filteredItems = false, filterValue = null) {
        DOM.removeElement('#filter-list-items');
        DOM.removeElement('#list-items');
        DOM.removeElement('#hrLine');
        DOM.removeElement('#remove-all-items-btn');

        let options;

        let items = filteredItems !== false ? filteredItems : localStorage.getItem('items');

        if ( items !== null ) {

            items = Array.isArray(items) ? items : JSON.parse(atob(items));

            options = {
                value: filterValue,
                type: 'text', 
                class: 'bg-transparent outline-none w-full border-b border-teal-500 py-2 px-3', 
                id: 'filter-list-items', 
                placeholder: 'Filter Items',
                event: {type: 'input', method: list.filter}
            };

            const filterItems = DOM.createElement('input', options);

            DOM.listContainer.appendChild(filterItems);

            document.querySelector('#filter-list-items').focus();
            
            options = {
                class: 'mt-20 w-full',
                id: 'list-items',
                text: null,
                event: { type: 'click', method: list.removeSingle }
            };

            const ul = DOM.createElement('ul', options);

            for ( let i = 0; i < items.length; i++ ) {
                const liOptions   = { 
                    class: 'flex justify-between items-center rounded bg-white border border-slate-300 my-4 p-2',
                    data: ['itemPosition', i]
                };
                const spanOptions = { text: items[i] };
                const iconOptions = {
                    class: 'fa-solid fa-xmark text-red-400 hover:text-teal-800',
                    style: 'cursor: pointer',
                    data: ['index', i]
                };

                const li   = DOM.createElement('li', liOptions, [i, items.length, 'show-added-item', stopLIAnimation]);
                const span = DOM.createElement('span', spanOptions);
                const icon = DOM.createElement('i', iconOptions);

                li.appendChild(span);
                li.appendChild(icon);
                ul.appendChild(li);
            }

            DOM.listContainer.appendChild(ul);

            options = {id: 'hrLine', style: 'width: 100%; height: 1px; background: #008B8B; margin: 10px 0 20px 0'};

            const hrLine = DOM.createElement('div', options);

            DOM.listContainer.appendChild(hrLine);
            
            options = {
                text: 'Remove All',
                id: 'remove-all-items-btn',
                class: 'w-full py-2 text-center bg-slate-800 text-white',
                event: {type: 'click', method: list.removeAll}
            };
            const removeAllBtn = DOM.createElement('button', options);

            DOM.listContainer.appendChild(removeAllBtn);

        }
    }
}

DOM.listAddBtn.addEventListener('click', list.add);
DOM.listInputText.addEventListener('input', utils.hideInputError);

utils.showItems();