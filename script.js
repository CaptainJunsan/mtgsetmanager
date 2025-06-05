// DOM elements
const emptySplash = document.getElementById('emptyPage');
const createCollectionForm = document.getElementById('createCollectionForm');
const createCollectionFormButton = document.getElementById('createCollectionFormButton');
const collectionInfoBlock = document.getElementById('collectionInfo');
const collectionNameInput = document.getElementById('collectionName');
const collectionFormatSelect = document.getElementById('collectionFormat');
const collectionNameDisplay = document.getElementById('collectionNameDisplay');
const collectionFormatDisplay = document.getElementById('collectionFormatDisplay');
const collectionFormatRow = document.getElementById('collectionFormatRow');
const collectionCardCount = document.getElementById('collectionCardCount');
const collectionList = document.getElementById('collectionList');
const collectionCardsList = document.getElementById('collectionCardsList');
const noCardsInCollectionText = document.getElementById('noCardsInCollectionText');
const searchInput = document.getElementById('searchInput');
const searchResults = document.getElementById('searchResults');
const addCardModal = document.getElementById('addCardModal');
const createNewCollectionButton = document.getElementById('createNewCollectionButton');
const loadCollectionButton = document.getElementById('loadCollectionButton');
const searchCollectionList = document.getElementById('searchCollectionList');
const cardDetailsModal = document.getElementById('cardDetailsModal');
const sortToggleButton = document.getElementById('sortToggleButton');
const filterToggleButton = document.getElementById('filterToggleButton');
const sortControls = document.getElementById('sortControls');
const filterControls = document.getElementById('filterControls');
const fileInput = document.getElementById('fileInput');
const referencesModal = document.getElementById('referencesModal');
const quickCardSearchButton = document.getElementById('quickCardSearchButton');
const displayCount = document.getElementById('displayCount');
const sortCriterionSelect = document.getElementById('sortCriterion');
const sortDirectionSelect = document.getElementById('sortDirection');
const resetSortButton = document.getElementById('resetSortButton');
const importCardsModal = document.getElementById('importCardsModal');
const importCardsText = document.getElementById('importCardsText');
const editCollectionModal = document.getElementById('editCollectionModal');
const editCollectionNameInput = document.getElementById('editCollectionName');
const editCollectionDescriptionInput = document.getElementById('editCollectionDescription');
const loadCollectionModal = document.getElementById('loadCollectionModal');
const contextModalMenu = document.getElementById('contextModalMenu');
const loadFromGoogleDriveBtn = document.getElementById('loadFromGoogleDriveBtn');
const uploadFromDeviceBtn = document.getElementById('uploadFromDeviceBtn');
const createDeckModal = document.getElementById('createDeckModal');
const deckName = document.getElementById('deckName');
const deckControlPanel = document.getElementById('deckControlPanel');
const addToDeckModal = document.getElementById('addToDeckModal');
const deckSearchInput = document.getElementById('deckSearchInput');
const collectionForDeckList = document.getElementById('collectionForDeckList');
const deckCardCount = document.getElementById('deckCardCount');
const closeDeckBtn = document.getElementById('closeDeckBtn');
const deleteDeckBtn = document.getElementById('deleteDeckBtn');
const deckSelect = document.getElementById('deckSelect');
// const deckSelectDefaultOption = document.getElementById('deckSelectDefaultOption');
const addCardsToDeckBtn = document.getElementById('addCardsToDeckBtn');
const importCardsToDeckBtn = document.getElementById('importCardsToDeckBtn');
const helpCentreModal = document.getElementById('helpCentreModal');
const mainHeader = document.getElementById('mainHeader');
const menuBar = document.getElementById('menuBar');
const viewModeLabel = document.getElementById('viewModeLabel');
// const sortFilterControlsContainer = document.getElementById('sortFilterControlsContainer');

// Google Drive API configuration
const CLIENT_ID = '1082824817658-ana0620kbg7rqa7krvn7nk06qat39k0e.apps.googleusercontent.com';
const API_KEY = 'AIzaSyCGRNW_GIZA_jLVZ4CNs4iebNpPo4Xnv1E';
const SCOPES = 'https://www.googleapis.com/auth/drive';

let tokenClient;
let accessToken = null;
let pickerInited = false;
let gisInited = false;

// Use the API Loader script to load google.picker
function onApiLoad() {
    console.log('Loading Google Picker API...');
    gapi.load('picker', onPickerApiLoad);
}

function onPickerApiLoad() {
    console.log('Google Picker API loaded');
    pickerInited = true;
}

function gisLoaded() {
    console.log('Google Identity Services loaded');
    tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: '1082824817658-ana0620kbg7rqa7krvn7nk06qat39k0e.apps.googleusercontent.com',
        scope: 'https://www.googleapis.com/auth/drive',
        callback: '',
    });
    gisInited = true;
}

function createPicker() {
    console.log('Creating Google Picker...');
    if (!accessToken) {
        showFeedback('Not authenticated. Please try again.', 'error');
        return;
    }
    const view = new google.picker.View(google.picker.ViewId.DOCS);
    view.setMimeTypes('application/json');
    const picker = new google.picker.PickerBuilder()
        .enableFeature(google.picker.Feature.NAV_HIDDEN)
        .setAppId(CLIENT_ID.split('-')[0])
        .setOAuthToken(accessToken)
        .addView(view)
        .setCallback(data => {
            if (data.action === google.picker.Action.PICKED) {
                const fileId = data.docs[0].id;
                console.log('File selected:', data.docs[0].name, 'ID:', fileId);
                loadFileFromDrive(fileId);
            } else if (data.action === google.picker.Action.CANCEL) {
                showFeedback('File selection cancelled.', 'info');
            }
        })
        .build();
    picker.setVisible(true);
    console.log('Google Picker created and visible');
}

function highlightContainers(deckIndex) {
    const collectionInfoBlock = document.getElementById('collectionInfo');
    const collectionList = document.getElementById('collectionCardsList');
    const deckControlPanel = document.getElementById('deckControlPanel');
    const viewModeLabel = document.getElementById('viewModeLabel');

    const isCollectionActive = currentView === 'collection';
    const isDeckSelected = currentView !== 'collection';

    // #ec5915 is the highlight color
    // Default style setting: boxShadow = '0 4px 8px rgba(0, 0, 0, 0.3)'
    // Highlighted style" boxShadow = '0 0px 12px rgba(255, 255, 255, 0.5)'

    if (isCollectionActive) {
        console.log('Highlighting collection view');
        viewModeLabel.innerHTML = `<p>Working in Collection</p>`;
        collectionInfoBlock.style.boxShadow = '0 0px 12px rgba(255, 255, 255, 0.35)'
        if (collectionList.innerHTML == '') {
            collectionList.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.3)';
        } else {
            collectionList.style.boxShadow = '0 0px 12px rgba(255, 255, 255, 0.35)'
        }
        deckControlPanel.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.3)';
    } else if (isDeckSelected) {
        const deck = currentCollection.decks[currentView];
        console.log('Highlighting deck view');
        viewModeLabel.innerHTML = `<p>Working in Deck: ${deck.name}</p>`;
        deckControlPanel.style.boxShadow = '0 0px 12px rgba(255, 255, 255, 0.35)'
        if (collectionList.innerHTML == '') {
            collectionList.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.3)';
        } else {
            collectionList.style.boxShadow = '0 0px 12px rgba(255, 255, 255, 0.35)'
        }
        collectionInfoBlock.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.3)';
    } else {
        console.log('No active workspace');
        viewModeLabel.innerHTML = '';
        collectionInfoBlock.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.3)';
        collectionList.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.3)';
        deckControlPanel.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.3)';
    }
}

async function fetchFullCardData(card) {
    if (!cardCache[card.id]) {
        const response = await fetch(`https://api.scryfall.com/cards/${card.id}`);
        if (response.ok) {
            cardCache[card.id] = await response.json();
        } else {
            console.error(`Failed to fetch card ${card.name}: ${response.status}`);
        }
    }
    return cardCache[card.id];
}

function loadFileFromDrive(fileId) {
    gapi.client.drive.files.get({
        fileId: fileId,
        alt: 'media',
    }).then(async fileResponse => {
        let data = JSON.parse(fileResponse.body);
        currentCollection = {
            name: data.name || 'Unnamed Collection',
            description: data.description || '',
            cards: await Promise.all(data.cards.map(async c => {
                const fullCard = await fetchFullCardData({ id: c.id, name: c.name });
                return { card: fullCard, quantity: c.quantity || 1, treatment: c.treatment || 'non-foil' };
            })),
            decks: data.decks ? data.decks.map(deck => ({
                name: deck.name,
                format: deck.format,
                cards: deck.cards.map(dc => ({
                    cardId: dc.cardId,
                    quantity: dc.quantity,
                    treatment: dc.treatment || 'non-foil'
                }))
            })) : []
        };
        currentFilters = { colors: [], manaCosts: [], rarities: [] };
        searchCollectionList.value = '';
        updateCollectionList();
        updateDeckSelectOptions();
        updateDeckControlButtons();
        showFeedback(`Loaded collection "${currentCollection.name}" from Google Drive.`, 'success');
    }).catch(error => {
        showFeedback('Failed to load file from Google Drive.', 'error');
    });

    highlightContainers(currentView);
}

// Set Default Sorting Order to Set Number, Ascending
let currentSort = { criterion: 'collector_number', direction: 'asc' };

// State
let currentCollection = { name: '', description: '', cards: [], decks: [] };
let currentView = 'collection';
const cardCache = {};
let currentFilters = { colors: [], manaCosts: [], rarities: [] };
let lastSaved = Date.now();
let isCreatingCollection = false;

// Mana symbol mapping with color classes
const manaMap = {
    '{W}': '<i class="ms ms-w ms-cost"></i>',
    '{U}': '<i class="ms ms-u ms-cost"></i>',
    '{B}': '<i class="ms ms-b ms-cost"></i>',
    '{G}': '<i class="ms ms-g ms-cost"></i>',
    '{R}': '<i class="ms ms-r ms-cost"></i>',
    '{C}': '<i class="ms ms-c ms-cost"></i>',
    '{T}': '<i class="ms ms-tap ms-cost"></i>',
    '{0}': '<i class="ms ms-0 ms-cost"></i>',
    '{1}': '<i class="ms ms-1 ms-cost"></i>',
    '{2}': '<i class="ms ms-2 ms-cost"></i>',
    '{3}': '<i class="ms ms-3 ms-cost"></i>',
    '{4}': '<i class="ms ms-4 ms-cost"></i>',
    '{5}': '<i class="ms ms-5 ms-cost"></i>',
    '{6}': '<i class="ms ms-6 ms-cost"></i>',
    '{7}': '<i class="ms ms-7 ms-cost"></i>',
    '{8}': '<i class="ms ms-8 ms-cost"></i>',
    '{9}': '<i class="ms ms-9 ms-cost"></i>',
    '{10}': '<i class="ms ms-10 ms-cost"></i>',
    '{11}': '<i class="ms ms-11 ms-cost"></i>',
    '{12}': '<i class="ms ms-12 ms-cost"></i>',
    '{13}': '<i class="ms ms-13 ms-cost"></i>',
    '{14}': '<i class="ms ms-14 ms-cost"></i>',
    '{15}': '<i class="ms ms-15 ms-cost"></i>',
    '{16}': '<i class="ms ms-16 ms-cost"></i>',
    '{17}': '<i class="ms ms-17 ms-cost"></i>',
    '{18}': '<i class="ms ms-18 ms-cost"></i>',
    '{19}': '<i class="ms ms-19 ms-cost"></i>',
    '{20}': '<i class="ms ms-20 ms-cost"></i>',
    '{W/U}': '<i class="ms ms-wu ms-cost"></i>',
    '{W/B}': '<i class="ms ms-wb ms-cost"></i>',
    '{B/R}': '<i class="ms ms-br ms-cost"></i>',
    '{B/G}': '<i class="ms ms-bg ms-cost"></i>',
    '{R/G}': '<i class="ms ms-rg ms-cost"></i>',
    '{R/W}': '<i class="ms ms-rw ms-cost"></i>',
    '{G/W}': '<i class="ms ms-gw ms-cost"></i>',
    '{G/U}': '<i class="ms ms-gu ms-cost"></i>',
    '{U/B}': '<i class="ms ms-ub ms-cost"></i>',
    '{U/R}': '<i class="ms ms-ur ms-cost"></i>',
    '{2/W}': '<i class="ms ms-2w ms-cost"></i>',
    '{2/U}': '<i class="ms ms-2u ms-cost"></i>',
    '{2/B}': '<i class="ms ms-2b ms-cost"></i>',
    '{2/R}': '<i class="ms ms-2r ms-cost"></i>',
    '{2/G}': '<i class="ms ms-2g ms-cost"></i>',
    '{W/P}': '<i class="ms ms-wp ms-cost"></i>',
    '{U/P}': '<i class="ms ms-up ms-cost"></i>',
    '{B/P}': '<i class="ms ms-bp ms-cost"></i>',
    '{R/P}': '<i class="ms ms-rp ms-cost"></i>',
    '{G/P}': '<i class="ms ms-gp ms-cost"></i>',
    '{S}': '<i class="ms ms-s ms-cost"></i>',
    '{X}': '<i class="ms ms-x ms-cost"></i>',
    '{Q}': '<i class="ms ms-untap ms-cost"></i>',
    '{E}': '<i class="ms ms-e ms-cost"></i>',
    '{CHAOS}': '<i class="ms ms-chaos ms-cost"></i>'
};
const regex = new RegExp(Object.keys(manaMap).map(k => k.replace(/\{|\}/g, '\\$&')).join('|'), 'g');
function replaceManaSymbols(text) {
    return text ? text.replace(regex, match => manaMap[match]) : '';
}

// Rarity and treatment abbreviation mappings
const rarityMap = {
    'common': 'C',
    'uncommon': 'U',
    'rare': 'R',
    'mythic': 'M'
};

const treatmentMap = {
    'non-foil': 'NF',
    'foil': 'F'
};

// Feedback with varied messages
function showFeedback(message, type = 'info', persist = false) {
    const messages = {
        success: [message, `${message} Nice work!`, `${message} You're on fire!`, `${message} Ready for action!`, `${message} Let's go!`],
        error: [message, `Oops, ${message.toLowerCase()}`, `Uh-oh, ${message.toLowerCase()}`, `Something went wrong: ${message.toLowerCase()}`],
        info: [message, `${message} Let's keep going!`, `${message} Good to know!`, `${message} Heads up!`],
        loading: [message, `${message} Hang tight!`, `${message} Almost there!`, `${message} Just a moment...`]
    };
    const selectedMessage = type === 'loading' ? message : messages[type][Math.floor(Math.random() * messages[type].length)];

    const parts = selectedMessage.split(/([.!?])\s+/);
    let mainMessage = parts[0];
    let secondaryMessage = '';

    if (parts.length > 1) {
        mainMessage += parts[1];
        secondaryMessage = parts.slice(2).join(' ').trim();
    }

    const feedback = document.createElement('div');
    feedback.className = `feedback ${type}`;
    feedback.id = `feedback-${Date.now()}`;
    feedback.innerHTML = `
        <div class="main-message">${mainMessage}</div>
        ${secondaryMessage ? `<div class="secondary-message">${secondaryMessage}</div>` : ''}
        <span class="close-feedback" onclick="this.parentElement.remove()">×</span>
    `;

    const feedbackContainer = document.getElementById('feedbackContainer') || document.createElement('div');
    if (!feedbackContainer.id) {
        feedbackContainer.id = 'feedbackContainer';
        document.body.appendChild(feedbackContainer);
    }
    feedbackContainer.appendChild(feedback);
    if (!persist) {
        setTimeout(() => feedback.remove(), 10000);
    }
    return feedback.id;
}

function updateFeedback(feedbackId, message) {
    const feedback = document.getElementById(feedbackId);
    if (feedback) {
        feedback.innerHTML = message;
    }
}

function removeFeedback(feedbackId) {
    const feedback = document.getElementById(feedbackId);
    if (feedback) {
        feedback.remove();
    }
}

// Update UI state
function updateUIState() {
    const isCollectionActive = currentCollection.name !== '';
    const hasCards = currentCollection.cards.length > 0;

    emptySplash.style.display = !isCollectionActive && !isCreatingCollection ? 'flex' : 'none';
    createCollectionForm.style.display = isCreatingCollection ? 'flex' : 'none';
    collectionInfoBlock.style.display = isCollectionActive ? 'flex' : 'none';
    collectionList.style.display = isCollectionActive ? 'flex' : 'none';
    noCardsInCollectionText.style.display = isCollectionActive && !hasCards ? 'flex' : 'none';
    searchCollectionList.style.display = isCollectionActive && hasCards ? 'block' : 'none';
    filterControls.style.display = isCollectionActive && hasCards ? 'flex' : 'none';
    displayCount.style.display = isCollectionActive && hasCards ? 'block' : 'none';
    deckControlPanel.style.display = isCollectionActive ? 'flex' : 'none';
    quickCardSearchButton.innerHTML = isCollectionActive ? 'Search to add cards...' : 'Search any card in Magic...';

    if (isCollectionActive) {
        quickCardSearchButton.innerHTML = 'Search to add cards...';
        quickCardSearchButton.style.border = '1px solid #ec5915';
        quickCardSearchButton.style.boxShadow = '0 0 8px rgba(255, 255, 255, 0.35)'
    } else {
        quickCardSearchButton.innerHTML = 'Search any card in Magic...';
        quickCardSearchButton.style.border = '';
    }

    const sortControls = document.querySelector('.sort-controls');
    if (sortControls) {
        sortControls.style.display = isCollectionActive && hasCards ? 'flex' : 'none';
    }
    if (filterToggleButton) {
        filterToggleButton.style.display = isCollectionActive && hasCards ? 'flex' : 'none';
        sortToggleButton.style.display = isCollectionActive && hasCards ? 'flex' : 'none';
    }

    menuBar.style.display = !isCollectionActive ? 'flex' : 'none';

    if (isCollectionActive) {
        collectionNameDisplay.innerText = `${currentCollection.name}`;
        document.getElementById('collectionDescriptionDisplay').innerText = currentCollection.description || '';
        document.getElementById('collectionDescriptionDisplay').style.display = currentCollection.description ? 'block' : 'none';
    }
}

window.addEventListener('resize', () => {

    if (window.innerWidth < 1470) {
        contextModalMenu.style.top = `${mainHeader.offsetHeight - 5}px`;
        contextModalMenu.style.left = 'auto';
        contextModalMenu.style.right = 'auto';
    } else if (window.innerWidth > 1469) {
        contextModalMenu.style.top = `${mainHeader.offsetHeight - 10}px`;
        contextModalMenu.style.left = 'auto';
        contextModalMenu.style.right = '20px';
    }
});

// Backup prompt
function checkForBackup() {
    if (currentCollection.name && Date.now() - lastSaved > 15 * 60 * 1000) {
        showFeedback('Consider saving your collection to avoid losing changes.', 'info');
    }
}
setInterval(checkForBackup, 60 * 1000);

// Toggle sort controls
function toggleSortControls() {
    sortControls.classList.toggle('visible');
    sortToggleButton.setAttribute('aria-expanded', sortControls.classList.contains('visible'));
}

// Toggle filter controls
function toggleFilterControls() {
    filterControls.classList.toggle('visible');
    filterToggleButton.setAttribute('aria-expanded', filterControls.classList.contains('visible'));
    updateFilterButtonText();
}

// Update filter button text
function updateFilterButtonText() {
    const filterCount = currentFilters.colors.length + currentFilters.manaCosts.length + currentFilters.rarities.length;
    filterToggleButton.innerText = `Filter${filterCount > 0 ? `: ${filterCount}` : ''}`;
}

// References modal handlers
function openReferencesModal() {
    referencesModal.style.display = 'flex';
    referencesModal.classList.add('active');
}

function closeReferencesModal() {
    referencesModal.classList.remove('active');
    referencesModal.style.display = 'none';
}

// Help Centre modal handlers
function openHelpCentreModal() {
    helpCentreModal.style.display = 'flex';
    helpCentreModal.classList.add('active');
}

function closeHelpCentreModal() {
    helpCentreModal.classList.remove('active');
    helpCentreModal.style.display = 'none';
}

function openLoadCollectionModal(event) {
    loadCollectionModal.classList.add('active');
    const button = event.target;
    const rect = button.getBoundingClientRect();
    const modalContent = loadCollectionModal.querySelector('.context-modal-content');
    modalContent.style.position = 'absolute';
}

function closeLoadCollectionModal() {
    loadCollectionModal.classList.remove('active');
}

loadCollectionModal.addEventListener('click', (event) => { // 
    if (event.target === loadCollectionModal) {
        closeLoadCollectionModal();
    }
});

loadFromGoogleDriveBtn.addEventListener('click', () => {
    if (!tokenClient) {
        showFeedback('Google Drive client not initialized. Please try again.', 'error');
        return;
    }
    if (currentCollection.name !== '' && !confirm('This will overwrite the current collection. Continue?')) {
        closeLoadCollectionModal();
        return;
    }
    tokenClient.requestAccessToken();
    closeLoadCollectionModal();
});

function loadFileFromGoogleDrive() {
    console.log('Opening Google Drive file picker...');
    createPicker();
}

uploadFromDeviceBtn.addEventListener('click', () => {
    fileInput.accept = '.json';
    fileInput.onchange = async e => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 10 * 1024 * 1024) {
            showFeedback('File is too large (max 10MB).', 'error');
            return;
        }
        if (!file.name.endsWith('.json')) {
            showFeedback('Please select a .json file.', 'error');
            return;
        }
        const reader = new FileReader();
        reader.onload = async function (e) {
            try {
                const text = e.target.result.replace(/^\uFEFF/, '');
                const data = JSON.parse(text);
                if (!data.name || !Array.isArray(data.cards)) {
                    throw new Error('Invalid collection structure');
                }
                currentCollection = {
                    name: data.name || 'Unnamed Collection',
                    description: data.description || '',
                    cards: await Promise.all(data.cards.map(async c => {
                        const fullCard = await fetchFullCardData({ id: c.id, name: c.name });
                        return { card: fullCard, quantity: c.quantity || 1, treatment: c.treatment || 'non-foil' };
                    })),
                    decks: data.decks ? data.decks.map(deck => ({
                        name: deck.name,
                        format: deck.format,
                        cards: deck.cards.map(dc => ({
                            cardId: dc.cardId,
                            quantity: dc.quantity,
                            treatment: dc.treatment || 'non-foil'
                        }))
                    })) : []
                };
                currentFilters = { colors: [], manaCosts: [], rarities: [] };
                searchCollectionList.value = '';
                updateCollectionList();
                updateDeckSelectOptions();
                updateDeckControlButtons();
                showFeedback(`Loaded collection "${currentCollection.name}".`, 'success');
            } catch (error) {
                console.error('Load collection error:', error);
                showFeedback(error.message === 'Invalid collection structure' ? 'Invalid collection structure.' : 'Failed to load collection.', 'error');
            }
            fileInput.value = '';
        };
        reader.onerror = () => {
            showFeedback('Failed to read file.', 'error');
            fileInput.value = '';
        };
        reader.readAsText(file);
    };
    fileInput.click();
    closeLoadCollectionModal();

    highlightContainers();
});

// Open the Edit Collection Modal and pre-populate fields
function openEditCollectionModal() {
    console.log('Opening Edit Collection modal');
    editCollectionNameInput.value = currentCollection.name;
    editCollectionDescriptionInput.value = currentCollection.description || '';
    editCollectionModal.style.display = 'flex';
    editCollectionModal.classList.add('active');
    editCollectionNameInput.focus();
    showFeedback('Editing collection details.', 'info');
}

// Open the Create Deck Modal
function openCreateDeckModal() {
    console.log('Opening Create Deck modal');
    createDeckModal.style.display = 'flex';
    createDeckModal.classList.add('active');
    deckName.focus();
}

// Close the Create Deck Modal
function closeCreateDeckModal() {
    createDeckModal.classList.remove('active');
    setTimeout(() => {
        createDeckModal.style.display = 'none';
    }, 300);
}

// Create Deck
function createDeck() {
    const deckName = document.getElementById('deckName').value.trim();
    const deckFormat = document.getElementById('deckFormat').value;

    if (!deckName) {
        showFeedback('Please enter a deck name.', 'error');
        return;
    }

    if (!currentCollection) {
        currentCollection = { decks: [] };
    }
    if (!Array.isArray(currentCollection.decks)) {
        currentCollection.decks = [];
    }

    const newDeck = {
        name: deckName,
        format: deckFormat,
        cards: []
    };

    currentCollection.decks.push(newDeck);
    const newDeckIndex = currentCollection.decks.length - 1;
    currentView = newDeckIndex;                // Set the new deck as active
    updateDeckSelectOptions(newDeckIndex);     // Update menu and select new deck
    updateCollectionList();                    // Clear list (empty deck)
    updateDeckControlButtons();                // Enable buttons
    closeCreateDeckModal();
    showFeedback(`Deck "${deckName}" created!`, 'success');

    highlightContainers(currentView);
}

// Update Deck Select Options
function updateDeckSelectOptions(selectedIndex = null) {
    // Clear any existing options
    deckSelect.innerHTML = '';

    // Create and append the default option
    const defaultOption = document.createElement('option');
    defaultOption.id = 'deckSelectDefaultOption'; // to ensure styling works
    defaultOption.disabled = true;
    defaultOption.selected = selectedIndex === null;
    defaultOption.text = currentCollection.decks.length > 0 ? 'Select deck...' : 'No decks available';
    deckSelect.appendChild(defaultOption);

    // Populate deck options
    currentCollection.decks.forEach((deck, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.text = deck.name;
        if (selectedIndex === index) option.selected = true;
        deckSelect.appendChild(option);
    });

    // Enable or disable the select menu
    deckSelect.disabled = currentCollection.decks.length === 0;

    // Optional styling
    if (currentCollection.decks.length > 0) {
        deckSelect.style.border = '1px solid #ffffff';
        deckSelect.style.backgroundColor = '#0a0a0a';
        deckSelect.style.color = '#e0e0e0';
    } else {
        deckSelect.style.border = '1px dashed #555';
        deckSelect.style.color = '#aaa';
        deckSelect.style.cursor = 'cursor';
    }
}


// Select Deck
function selectDeck(deckIndex) {
    if (deckIndex === '') {
        currentView = 'collection';
        showFeedback('Viewing collection.', 'info');
    } else {
        currentView = parseInt(deckIndex);
        const deck = currentCollection.decks[currentView];

        // Remove orphaned cards no longer in collection
        deck.cards = deck.cards.map(deckCard => {
            const collectionCard = currentCollection.cards.find(c => c.card.id === deckCard.cardId && c.treatment === deckCard.treatment);
            if (collectionCard) {
                return {
                    ...deckCard,
                    quantity: Math.min(deckCard.quantity, collectionCard.quantity)
                };
            }
            return null;
        }).filter(Boolean);

        showFeedback(`Viewing deck: ${deck.name}`, 'info');
    }

    updateCollectionList(); // Will reflect cleaned-up deck
    updateDeckControlButtons();

    highlightContainers(currentView);
}

// Close Deck
function closeDeck() {
    if (currentView === 'collection') {
        showFeedback('No deck selected to close.', 'info');
        return;
    }
    currentView = 'collection';
    deckSelectDefaultOption.selected = true; // Reset to default option
    deckSelectDefaultOption.text = 'Select deck...';; // Reset to "Select deck..."
    updateCollectionList();                           // Show all collection cards
    updateDeckControlButtons();                       // Disable buttons
    showFeedback('Closed deck. Viewing collection.', 'info');

    highlightContainers(currentView);
}

// Delete Deck
function deleteDeck() {
    if (currentView === 'collection') {
        showFeedback('No deck selected to delete.', 'error');
        return;
    }
    const deckIndex = currentView;
    const deckName = currentCollection.decks[deckIndex].name;
    if (confirm(`Are you sure you want to delete deck "${deckName}"?`)) {
        currentCollection.decks.splice(deckIndex, 1);
        currentView = 'collection';
        updateDeckSelectOptions();                    // Refresh menu
        deckSelectDefaultOption.selected = true; // Reset to default option
        deckSelectDefaultOption.text = 'Select deck...'; // Reset to "Select deck..."
        updateCollectionList();                       // Show all collection cards
        updateDeckControlButtons();                   // Disable buttons
        showFeedback(`Deck "${deckName}" deleted.`, 'success');
    }

    highlightContainers(currentView);
}

// Update Deck Control Buttons
function updateDeckControlButtons() {
    const isDeckSelected = currentView !== 'collection';
    
    closeDeckBtn.disabled = !isDeckSelected;
    deleteDeckBtn.disabled = !isDeckSelected;
    // deckSelect.style.cursor = !isDeckSelected ? 'not-allowed' : 'pointer';
    deckSelect.style.opacity = !isDeckSelected ? '0.5' : '1';
    addCardsToDeckBtn.disabled = !isDeckSelected;
    importCardsToDeckBtn.disabled = !isDeckSelected;
}

// Close the Edit Collection Modal
function closeEditCollectionModal() {
    editCollectionModal.classList.remove('active');
    setTimeout(() => {
        editCollectionModal.style.display = 'none';
    }, 300);
}

// Save the updated collection details
function saveCollectionDetails() {
    const name = editCollectionNameInput.value.trim();
    const description = editCollectionDescriptionInput.value.trim();
    if (!name) {
        showFeedback('Please enter a collection name.', 'error');
        return;
    }

    currentCollection.name = name;
    currentCollection.description = description;
    collectionNameDisplay.innerText = `${name}`;
    document.getElementById('collectionDescriptionDisplay').innerText = description || '';
    document.getElementById('collectionDescriptionDisplay').style.display = description ? 'block' : 'none';
    closeEditCollectionModal();
    showFeedback(`Collection details updated to "${name}"!`, 'success');

    highlightContainers(currentView);
}

// Collection creation
function createNewCollection() {
    console.log('Creating new collection');
    try {
        isCreatingCollection = true;
        currentFilters = { colors: [], manaCosts: [], rarities: [] };
        searchCollectionList.value = '';
        updateUIState();
        collectionNameInput.focus();
    } catch (error) {
        console.error('Create new collection error:', error);
        showFeedback('Failed to initialize new collection.', 'error');
    }
}

// Create Collection
function createCollection() {
    const name = collectionNameInput.value.trim();
    const description = document.getElementById('collectionDescription').value.trim();
    if (!name) {
        showFeedback('Please enter a collection name.', 'error');
        return;
    }

    currentCollection = { name, description, cards: [], decks: [] };
    isCreatingCollection = false;
    createCollectionForm.style.display = 'none';
    collectionInfoBlock.style.opacity = '0';
    collectionList.style.opacity = '0';
    setTimeout(() => {
        collectionInfoBlock.style.opacity = '1';
        collectionList.style.opacity = '1';
    }, 10);
    collectionNameDisplay.innerText = `${name}`;
    document.getElementById('collectionDescriptionDisplay').innerText = description || '';
    document.getElementById('collectionDescriptionDisplay').style.display = description ? 'block' : 'none';
    updateCollectionList();
    updateDeckSelectOptions();
    updateDeckControlButtons();
    updateUIState();
    showFeedback(`Collection "${name}" created!`, 'success');
    collectionNameInput.value = '';
    document.getElementById('collectionDescription').value = '';

    highlightContainers(currentView);
}

function cancelCreateCollection() {
    isCreatingCollection = false;
    updateUIState();
}

// Card modal handlers
function openAddCardModal() {
    console.log('Opening Add Card modal');
    const isCollectionActive = currentCollection.name !== '';
    const modalTitle = document.getElementById('addCardModalTitle');
    if (!modalTitle) {
        console.warn('Modal title element with id "addCardModalTitle" not found. Defaulting to "Add Card" in console.');
        console.log('Opening modal with default title: Add Card');
    } else {
        modalTitle.innerText = isCollectionActive ? 'Add Card' : 'Search any card in Magic...';
    }
    addCardModal.style.display = 'flex';
    addCardModal.classList.add('active');
    searchInput.focus();
    searchInput.value = '';
    searchResults.innerHTML = '';
    searchCardsDebounced();
}

function openAddCardModalWithDestination() {
    if (currentView !== 'collection') {
        openAddToDeckModal();
    } else {
        openAddCardModal();
    }
}

function openAddToDeckModal() {
    if (currentView === 'collection') {
        showFeedback('Please select a deck first.', 'error');
        return;
    }
    console.log('Opening Add to Deck modal');
    addToDeckModal.style.display = 'flex';
    addToDeckModal.classList.add('active');
    deckSearchInput.value = '';
    deckSearchInput.focus();
    // Store temporary deck cards for this session
    const deck = currentCollection.decks[currentView];
    deck.tempCards = deck.tempCards || deck.cards.map(c => ({ ...c }));
    displayCollectionForDeck();
}

function closeAddToDeckModal() {
    addToDeckModal.classList.remove('active');
    setTimeout(() => {
        addToDeckModal.style.display = 'none';
    }, 300);
    const deck = currentCollection.decks[currentView];
    deck.cards = deck.tempCards || deck.cards;
    delete deck.tempCards;
    updateCollectionList();
}

function displayCollectionForDeck() {
    const query = deckSearchInput.value.trim().toLowerCase();
    collectionForDeckList.innerHTML = '';
    const deck = currentCollection.decks[currentView];
    const totalDeckCards = deck.tempCards.reduce((sum, c) => sum + c.quantity, 0);

    const filteredCards = currentCollection.cards.filter(({ card }) => {
        return !query || card.name.toLowerCase().includes(query) || card.type_line.toLowerCase().includes(query);
    });

    filteredCards.forEach(({ card, quantity, treatment }) => {
        const deckCard = deck.tempCards.find(c => c.cardId === card.id && c.treatment === treatment);
        const deckQuantity = deckCard ? deckCard.quantity : 0;
        const availableQuantity = quantity - deckQuantity;
        if (availableQuantity <= 0) return;

        const div = document.createElement('div');
        div.className = 'card-entry';
        const imageUrl = card.image_uris?.normal || '';
        div.innerHTML = `
            ${imageUrl ? `<img src="${imageUrl}" alt="${card.name}" class="${treatment === 'foil' ? 'foil' : ''}">` : '<p>No image available</p>'}
            <table class="card-table">
                <tr>
                    <td class="quantity-cell">${availableQuantity}</td>
                    <td>${card.name}</td>
                    <td title="${card.rarity.charAt(0).toUpperCase() + card.rarity.slice(1)}" class="rarity-symbol ${card.rarity.toLowerCase()} table-rarity-symbol">${rarityMap[card.rarity.toLowerCase()] || card.rarity.charAt(0).toUpperCase() + card.rarity.slice(1)}</td>
                    <td title="${treatment.charAt(0).toUpperCase() + treatment.slice(1)}">${treatment === 'foil' ? '<span class="foil-star">★</span>' : '<span class="non-foil-dot">•</span>'}</td>
                </tr>
            </table>
        `;
        div.addEventListener('click', () => addCardToDeckFromCollection(card.id, treatment, div));
        collectionForDeckList.appendChild(div);
    });

    if (collectionForDeckList.children.length === 0) {
        collectionForDeckList.style.display = 'none';
        return;
    } else {
        collectionForDeckList.style.display = 'grid';
    }

    deckCardCount.innerText = `${totalDeckCards}/${deck.tempCards.length} cards in Deck`;
}

function addCardToDeckFromCollection(cardId, treatment, element) {
    const deck = currentCollection.decks[currentView];
    const collectionCard = currentCollection.cards.find(c => c.card.id === cardId && c.treatment === treatment);
    if (!collectionCard) return;

    const deckCard = deck.tempCards.find(c => c.cardId === cardId && c.treatment === treatment);
    const availableQuantity = collectionCard.quantity - (deckCard ? deckCard.quantity : 0);
    if (availableQuantity <= 0) {
        showFeedback(`No more copies of ${collectionCard.card.name} available.`, 'error');
        return;
    }

    if (deckCard) {
        deckCard.quantity += 1;
    } else {
        deck.tempCards.push({ cardId, quantity: 1, treatment });
    }

    element.classList.add('selected');
    showFeedback(`1 × ${collectionCard.card.name} (${treatment}) added to deck!`, 'success');
    displayCollectionForDeck();
}

function closeAddCardModal() {
    addCardModal.classList.remove('active');
    setTimeout(() => {
        addCardModal.style.display = 'none';
    }, 300);
}

function clearSearchInput() {
    searchInput.value = '';
    searchResults.innerHTML = '';
    searchInput.focus();
}

function clearSearchResults() {
    searchInput.value = '';
    searchResults.innerHTML = '';
    searchInput.focus();
}

function openCardDetailsModal(card, treatment, fromSearch = false) {
    console.log('Opening card details:', { cardId: card.id, name: card.name, treatment, fromSearch });
    try {
        console.log(`Applying foil class: ${treatment === 'foil'}`);
        cardDetailsModal.innerHTML = '';
        const modalContent = document.createElement('div');
        modalContent.className = 'modal-content';
        const imageUrl = card.image_uris?.normal || '';
        const isCollectionActive = currentCollection.name !== '';
        const cardCount = isCollectionActive ? currentCollection.cards.filter(c => c.card.id === card.id && c.treatment === treatment).reduce((sum, c) => sum + c.quantity, 0) : 0;
        const hasDecks = currentCollection.decks && currentCollection.decks.length > 0;
        modalContent.innerHTML = `
            <span class="svg-close-button" onclick="closeCardDetailsModal()">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M6 6L18 18M6 18L18 6" stroke="#e0e0e0" stroke-width="2" stroke-linecap="round"/>
                </svg>
            </span>
            ${imageUrl ? `<img src="${imageUrl}" alt="${card.name}" class="${treatment === 'foil' ? 'foil' : ''}" style="max-width: 350px; height: auto; border-radius: 10px; margin-bottom: 20px;">` : '<p>No image available</p>'}
            <div class="card-details-content">
                <h3>${card.name}</h3>
                <p class="mana-text">${replaceManaSymbols(card.mana_cost || '')}</p>
                <h4 class="type-line">${card.type_line || 'Unknown'}</h4>
                ${card.power && card.toughness ? `<p>${card.power}/${card.toughness}</p>` : ''}
                <p class="mana-text">${replaceManaSymbols(card.oracle_text || '')}</p>
                ${fromSearch && isCollectionActive ?
                `<button class="button primary-button small-button" onclick="addToCollection('${card.id}')">Add to Collection</button>` :
                fromSearch ? '' :
                    isCollectionActive ? `
                    <div>
                        <label for="removeQty-${card.id}">Remove: </label>
                        <input type="number" id="removeQty-${card.id}" class="text-input quantity" min="1" max="${cardCount}" value="1" style="width: 50px; margin-right: 10px;">
                        ${hasDecks ? `
                            <label for="source-${card.id}">from&nbsp;</label>
                            <select id="source-${card.id}" class="text-input text-input-dropdown" style="width: 150px; margin-right: 10px;">
                                <option value="collection">Collection</option>
                                ${currentCollection.decks.map((deck, index) => `<option value="${index}">${deck.name}</option>`).join('')}
                            </select>
                        ` : ''}
                        <button class="button secondary-button small-button" onclick="removeFromCollection('${card.id}', '${treatment}', document.getElementById('source-${card.id}')?.value || 'collection')">Remove</button>
                    </div>` : ''}
            </div>
        `;
        cardDetailsModal.appendChild(modalContent);
        cardDetailsModal.style.display = 'flex';
        cardDetailsModal.classList.add('active');
    } catch (error) {
        console.error('Error opening card details modal:', error);
        showFeedback('Failed to open card details.', 'error');
    }
}

function closeCardDetailsModal() {
    cardDetailsModal.classList.remove('active');
    setTimeout(() => {
        cardDetailsModal.style.display = 'none';
        cardDetailsModal.innerHTML = '';
    }, 300);
}

// Debounce for search
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}

// Card search
let latestSearchId = 0;
const searchCardsDebounced = debounce(async () => {
    const query = searchInput.value.trim();
    if (!query || query.length < 2) {
        searchResults.innerHTML = query ? '<p>Please enter at least 2 characters.</p>' : '';
        return;
    }

    const searchId = ++latestSearchId;
    searchResults.innerHTML = '<p>Loading...</p>';
    try {
        console.log(`Searching for query: "${query}" (Search ID: ${searchId})`);
        const response = await fetch(`https://api.scryfall.com/cards/search?q=${encodeURIComponent(query)}`);
        if (!response.ok) throw new Error(`Network response was not ok: ${response.status}`);
        const data = await response.json();
        if (searchId === latestSearchId) {
            const cards = data.data || [];
            console.log(`Received ${cards.length} results for query: "${query}"`);
            if (cards.length > 50) {
                console.warn(`Result set too large (${cards.length} cards), capping at 50`);
                displaySearchResults(cards.slice(0, 50));
                showFeedback('Too many results. Showing first 50 cards.', 'info');
            } else {
                displaySearchResults(cards);
            }
        } else {
            console.log(`Discarding outdated search results for query: "${query}" (Search ID: ${searchId})`);
        }
    } catch (error) {
        console.error(`Search error for query "${query}":`, error);
        if (searchId === latestSearchId) {
            searchResults.innerHTML = '<p id="searchErrorMessage">Error fetching cards. Please try again.</p>';
        }
    }
}, 300);

searchInput.addEventListener('input', (e) => {
    searchCardsDebounced();
    // document.getElementById('clearSearchBtn').style.display = e.target.value.trim() ? 'block' : 'none';
});

// Render search results
function displaySearchResults(cards) {
    searchResults.innerHTML = '';
    if (!cards.length) {
        searchResults.innerHTML = '<p>No cards found.</p>';
        return;
    }
    const isCollectionActive = currentCollection.name !== '';
    const hasDecks = currentCollection.decks && currentCollection.decks.length > 0;
    const defaultDestination = currentView === 'collection' ? '' : currentView.toString();
    cards.forEach(card => {
        const div = document.createElement('div');
        div.className = 'search-result';
        const imageUrl = card.image_uris?.small || '';
        const foilCount = isCollectionActive ? currentCollection.cards.filter(c => c.card.id === card.id && c.treatment === 'foil').reduce((sum, c) => sum + c.quantity, 0) : 0;
        const nonFoilCount = isCollectionActive ? currentCollection.cards.filter(c => c.card.id === card.id && c.treatment === 'non-foil').reduce((sum, c) => sum + c.quantity, 0) : 0;
        const showCountText = isCollectionActive && (foilCount > 0 || nonFoilCount > 0);
        div.innerHTML = `
            ${imageUrl ? `<img src="${imageUrl}" alt="${card.name}" id="img-${card.id}" style="cursor: pointer;">` : '<p>No image available</p>'}
            <div class="result-content">
                <span class="card-name">${card.name}</span>
                <div class="type-line-container"><h4 class="search-result-type-line">${card.type_line} - ${card.rarity ? card.rarity.charAt(0).toUpperCase() + card.rarity.slice(1) : 'Unknown'}</h4></div>
                <div class="result-list-mana-text-container"><p class="result-list-mana-text">${replaceManaSymbols(card.mana_cost || '')}</p></div>
                <div class="more-info-text-container"><p class="results-more-info-text">Click the card image for details.</p></div>
                ${isCollectionActive ? `
                    <div class="inputs">
                        <div class="qty-and-treatment">
                            <input type="number" class="text-input quantity" min="1" max="4" value="1" id="qty-${card.id}">
                            <select class="text-input text-input-dropdown" id="treatment-${card.id}" onchange="updateSearchResultFoil(this, '${card.id}')">
                                <option value="non-foil">Non-foil</option>
                                <option value="foil">Foil</option>
                            </select>
                        </div>
                        ${hasDecks ? `
                            <select class="text-input-dropdown" id="deck-${card.id}">
                                <option value="">Select Destination</option>
                                <option value="collection">Collection</option>
                                ${currentCollection.decks.map((deck, index) => `<option value="${index}">${deck.name}</option>`).join('')}
                            </select>
                        ` : ''}
                        <div class="add-button-container">
                            <button class="button primary-button small-button" onclick="addToCollectionOrDeck('${card.id}')">Add card</button>
                            ${showCountText ? `<span class="card-collection-count">★ ${foilCount} | ${nonFoilCount}</span>` : ''}
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
        searchResults.appendChild(div);
        if (isCollectionActive && hasDecks) {
            const deckSelect = div.querySelector(`#deck-${card.id}`);
            deckSelect.value = defaultDestination;
        }
        const img = div.querySelector(`#img-${card.id}`);
        if (img) {
            img.addEventListener('click', () => {
                const treatment = isCollectionActive ? document.getElementById(`treatment-${card.id}`).value : 'non-foil';
                openCardDetailsModal(card, treatment, true);
            });
        }
    });
}

// Add card to collection or deck
async function addToCollectionOrDeck(cardId) {
    const quantityInput = document.getElementById(`qty-${cardId}`);
    const treatmentSelect = document.getElementById(`treatment-${cardId}`);
    const deckSelect = document.getElementById(`deck-${cardId}`);
    const quantity = parseInt(quantityInput.value) || 1;
    const treatment = treatmentSelect.value || 'non-foil';
    const destination = deckSelect ? deckSelect.value : 'collection';

    if (quantity < 1 || quantity > 4) {
        showFeedback('Quantity must be between 1 and 4.', 'error');
        return;
    }

    let fullCard = cardCache[cardId];
    if (!fullCard) {
        const response = await fetch(`https://api.scryfall.com/cards/${cardId}`);
        if (!response.ok) throw new Error(`Failed to fetch card ${cardId}`);
        fullCard = await response.json();
        cardCache[cardId] = fullCard;
    }

    if (destination === 'collection' || destination === '') {
        const existingCard = currentCollection.cards.find(c => c.card.id === cardId && c.treatment === treatment);
        if (existingCard) {
            existingCard.quantity += quantity;
        } else {
            currentCollection.cards.push({ card: fullCard, quantity, treatment });
        }
        showFeedback(`${quantity} × ${fullCard.name} (${treatment}) added to collection!`, 'success');
    } else {
        const deckIndex = parseInt(destination);
        const deck = currentCollection.decks[deckIndex];
        let collectionCard = currentCollection.cards.find(c => c.card.id === cardId && c.treatment === treatment);

        // Add to collection if not present
        if (!collectionCard) {
            currentCollection.cards.push({ card: fullCard, quantity, treatment });
            collectionCard = currentCollection.cards.find(c => c.card.id === cardId && c.treatment === treatment);
        } else {
            // Ensure enough cards in collection
            const availableQuantity = collectionCard.quantity;
            const deckCard = deck.cards.find(c => c.cardId === cardId && c.treatment === treatment);
            const currentDeckQuantity = deckCard ? deckCard.quantity : 0;
            if (currentDeckQuantity + quantity > availableQuantity) {
                showFeedback(`Cannot add ${quantity} copies to deck. Only ${availableQuantity - currentDeckQuantity} available in collection.`, 'error');
                return;
            }
        }

        // Add to deck
        const deckCard = deck.cards.find(c => c.cardId === cardId && c.treatment === treatment);
        if (deckCard) {
            deckCard.quantity += quantity;
        } else {
            deck.cards.push({ cardId, quantity, treatment });
        }
        showFeedback(`${quantity} × ${fullCard.name} (${treatment}) added to deck "${deck.name}"!`, 'success');
    }

    updateCollectionList();
    searchInput.focus();
}

// Update foil class for search result image
function updateSearchResultFoil(select, cardId) {
    const img = document.getElementById(`img-${cardId}`);
    if (img) {
        img.classList.remove('foil');
        if (select.value === 'foil') {
            img.classList.add('foil');
            console.log(`Foil class added to search result image: ${cardId}`);
        }
    }
}

//Update display count
function updateDisplayCount() {
    const entries = collectionCardsList.getElementsByClassName('card-entry');
    const totalCards = entries.length;
    let visibleCards = 0;
    for (let i = 0; i < entries.length; i++) {
        if (entries[i].style.display !== 'none') {
            visibleCards++;
        }
    }
    displayCount.innerHTML = `Displaying ${visibleCards}/${totalCards} cards </br> • non-foil | ★ foil`;
}

// Add card to collection & Update collection list
async function updateCollectionList() {
    let cardsToDisplay;
    if (currentView === 'collection') {
        cardsToDisplay = currentCollection.cards;
    } else {
        const deck = currentCollection.decks[currentView];

        // Sanitize card list by syncing with cardCache and actual collection availability
        cardsToDisplay = deck.cards.map(deckCard => {
            const fullCard = cardCache[deckCard.cardId];
            const inCollection = currentCollection.cards.find(c => c.card.id === deckCard.cardId && c.treatment === deckCard.treatment);

            if (fullCard && inCollection) {
                // Adjust deck quantity if it exceeds available collection count
                const safeQty = Math.min(deckCard.quantity, inCollection.quantity);
                return { card: fullCard, quantity: safeQty, treatment: deckCard.treatment };
            }

            return null;
        }).filter(Boolean); // remove nulls
    }

    const filteredCards = cardsToDisplay.filter(({ card: fullCard }) => {
        const colorMatch = !currentFilters.colors.length ||
            (fullCard.color_identity && currentFilters.colors.some(color => fullCard.color_identity.includes(color))) ||
            (fullCard.color_identity?.length === 0 && currentFilters.colors.includes('Colorless')) ||
            (fullCard.color_identity?.length > 1 && currentFilters.colors.includes('Multicolor'));

        const manaCostMatch = !currentFilters.manaCosts.length ||
            currentFilters.manaCosts.some(cost => cost === 7 ? fullCard.cmc >= 7 : fullCard.cmc === cost);

        const rarityMatch = !currentFilters.rarities.length ||
            currentFilters.rarities.includes(fullCard.rarity.toLowerCase());

        return colorMatch && manaCostMatch && rarityMatch;
    });

    sortCards(filteredCards, currentSort.criterion, currentSort.direction);

    // Render cards
    collectionCardsList.innerHTML = '';
    filteredCards.forEach(({ card: fullCard, quantity, treatment }) => {
        const rarity = fullCard.rarity || 'unknown';
        const displayRarity = rarityMap[rarity.toLowerCase()] || rarity.charAt(0).toUpperCase() + rarity.slice(1);
        const div = document.createElement('div');
        div.className = 'card-entry';
        div.dataset.cardName = fullCard.name;
        div.dataset.typeLine = fullCard.type_line || '';
        div.dataset.oracleText = fullCard.oracle_text || '';
        div.dataset.colorIdentity = fullCard.color_identity ? fullCard.color_identity.join(',') : '';
        div.dataset.cmc = fullCard.cmc || 0;
        div.dataset.rarity = rarity;
        div.dataset.collectorNumber = fullCard.collector_number || '9999';
        const imageUrl = fullCard.image_uris?.normal || '';
        div.innerHTML = `
            ${imageUrl ? `<img src="${imageUrl}" alt="${fullCard.name}" class="${treatment === 'foil' ? 'foil' : ''}">` : '<p>No image available</p>'}
            <table class="card-table">
                <tr>
                    <td class="quantity-cell">${quantity}</td>
                    <td>${fullCard.name}</td>
                    <td title="${rarity}" class="rarity-symbol ${rarity.toLowerCase()} table-rarity-symbol">${displayRarity}</td>
                    <td title="${treatment}">${treatment === 'foil' ? '<span class="foil-star">★</span>' : '<span class="non-foil-dot">•</span>'}</td>
                </tr>
            </table>
        `;
        div.addEventListener('click', () => openCardDetailsModal(fullCard, treatment));
        collectionCardsList.appendChild(div);
        setTimeout(() => div.classList.add('added'), 10);
    });

    // Update UI elements
    const totalCards = cardsToDisplay.reduce((sum, c) => sum + c.quantity, 0);
    collectionCardCount.innerText = `Collection cards: ${totalCards}`;
    collectionCardCount.classList.add('updated');
    setTimeout(() => collectionCardCount.classList.remove('updated'), 200);
    updateDisplayCount();
    updateUIState();
    if (searchCollectionList.value) searchCollectionDebounced();
}

// Apply sort debug function
function applySort() {
    currentSort.criterion = sortCriterionSelect.value;
    currentSort.direction = sortDirectionSelect.value;
    console.log(`Applying sort: criterion=${currentSort.criterion}, direction=${currentSort.direction}`);

    sortCards(currentSort.criterion, currentSort.direction);
    updateCollectionList();
    applyFilters();
    showFeedback(`Collection sorted by ${currentSort.criterion} (${currentSort.direction}).`, 'success');
}

function isBasicLand(cardName) {
    const basics = ['Plains', 'Island', 'Swamp', 'Mountain', 'Forest'];
    return basics.includes(cardName);
}

// Add card
async function addToCollection(cardId) {
    console.log('Adding card to collection:', cardId);
    try {
        const quantityInput = document.getElementById(`qty-${cardId}`);
        const treatmentSelect = document.getElementById(`treatment-${cardId}`);
        const quantity = parseInt(quantityInput.value) || 1;
        const treatment = treatmentSelect.value || 'non-foil';

        if (quantity < 1 || quantity > 4) {
            showFeedback('Quantity must be between 1 and 4.', 'error');
            return;
        }

        let fullCard = cardCache[cardId];
        if (!fullCard) {
            const response = await fetch(`https://api.scryfall.com/cards/${cardId}`);
            if (!response.ok) throw new Error(`Failed to fetch card ${cardId}`);
            fullCard = await response.json();
            cardCache[cardId] = fullCard;
        }

        const existingCard = currentCollection.cards.find(c => c.card.id === cardId && c.treatment === treatment);
        if (existingCard) {
            existingCard.quantity += quantity;
        } else {
            currentCollection.cards.push({ card: fullCard, quantity, treatment });
        }

        updateCollectionList();
        searchInput.value = '';
        searchInput.focus();
        searchCardsDebounced();
        showFeedback(`${quantity} × ${fullCard.name} (${treatment}) added to collection!`, 'success');
    } catch (error) {
        console.error('Error adding card to collection:', error);
        showFeedback('Failed to add card to collection.', 'error');
    }
}

// Remove card
function removeFromCollection(cardId, treatment, source = 'collection') {
    console.log('Removing card:', { cardId, treatment, source });
    const removeQtyInput = document.getElementById(`removeQty-${cardId}`);
    const removeQty = parseInt(removeQtyInput ? removeQtyInput.value : 1) || 1;

    let targetCards, cardEntry, cardCount;
    if (source === 'collection') {
        cardEntry = currentCollection.cards.find(c => c.card.id === cardId && c.treatment === treatment);
        cardCount = currentCollection.cards.filter(c => c.card.id === cardId && c.treatment === treatment).reduce((sum, c) => sum + c.quantity, 0);
        targetCards = currentCollection.cards;
    } else {
        const deckIndex = parseInt(source);
        const deck = currentCollection.decks[deckIndex];
        cardEntry = deck.cards.find(c => c.cardId === cardId && c.treatment === treatment);
        cardCount = deck.cards.filter(c => c.cardId === cardId && c.treatment === treatment).reduce((sum, c) => sum + c.quantity, 0);
        targetCards = deck.cards;
    }

    if (removeQty < 0 || removeQty > cardCount) {
        showFeedback(`Quantity to remove must be between 1 and ${cardCount}.`, 'error');
        return;
    }

    if (!cardEntry) {
        console.error('Card not found:', { cardId, treatment, source });
        showFeedback('Card not found in source.', 'error');
        closeCardDetailsModal();
        return;
    }

    const fullCard = cardEntry.card || cardCache[cardEntry.cardId];
    const safeName = fullCard?.name ? fullCard.name.replace(/"/g, '\\"') : '';
    const cardElement = collectionCardsList.querySelector(`[data-card-name="${safeName}"]`);

    if (cardElement) {
        cardElement.classList.add('removed');
        const particleDiv = document.createElement('div');
        particleDiv.className = 'particle-effect';
        particleDiv.style.setProperty('--x', Math.random() * 2 - 1);
        particleDiv.style.setProperty('--y', Math.random() * 2 - 1);
        cardElement.appendChild(particleDiv);
        setTimeout(() => particleDiv.remove(), 500);
    }

    if (cardEntry.quantity <= removeQty) {
        if (source === 'collection') {
            currentCollection.cards = currentCollection.cards.filter(c => !(c.card.id === cardId && c.treatment === treatment));

            // Adjust from all decks
            let remainingToRemove = removeQty;
            currentCollection.decks.forEach(deck => {
                const deckCard = deck.cards.find(c => c.cardId === cardId && c.treatment === treatment);
                if (deckCard && remainingToRemove > 0) {
                    const toSubtract = Math.min(deckCard.quantity, remainingToRemove);
                    deckCard.quantity -= toSubtract;
                    remainingToRemove -= toSubtract;
                    if (deckCard.quantity <= 0) {
                        deck.cards = deck.cards.filter(c => !(c.cardId === cardId && c.treatment === treatment));
                    }
                }
            });
        } else {
            // Remove completely from deck
            const deckIndex = parseInt(source);
            const deck = currentCollection.decks[deckIndex];
            deck.cards = deck.cards.filter(c => !(c.cardId === cardId && c.treatment === treatment));
        }
    } else {
        // Works for both collection and deck
        cardEntry.quantity -= removeQty;
    }


    console.log('Current collection after remove:', JSON.parse(JSON.stringify(currentCollection)));

    // Refresh the right list view: collection or deck
    if (currentView === 'collection') {
        updateCollectionList(); // show all collection cards
    } else {
        selectDeck(currentView); // re-renders just the current deck view
    }

    closeCardDetailsModal();

    console.log('Deck view after update:', currentCollection.decks[currentView]);
    showFeedback(`${removeQty} × ${cardEntry.card ? cardEntry.card.name : cardEntry.name} (${treatment}) removed from ${source === 'collection' ? 'collection' : currentCollection.decks[source].name}!`, 'success');
}

// Sorting
function sortCards(cards, criterion, direction = 'asc') {
    console.log('Sorting cards with criterion:', criterion, 'direction:', direction);
    cards.sort((a, b) => {
        let valueA, valueB, secondaryA, secondaryB, tertiaryA, tertiaryB;
        try {
            switch (criterion) {
                case 'name':
                    valueA = a.card.name || '';
                    valueB = b.card.name || '';
                    break;
                case 'cmc':
                    valueA = Number(a.card.cmc) || 0;
                    valueB = Number(b.card.cmc) || 0;
                    break;
                case 'color':
                    const colorOrder = { W: 0, U: 1, B: 2, R: 3, G: 4, C: 5, M: 6 };
                    if (a.card.color_identity?.length > 1) {
                        valueA = colorOrder['M'];
                    } else if (a.card.color_identity?.length === 0) {
                        valueA = colorOrder['C'];
                    } else {
                        valueA = colorOrder[a.card.color_identity[0]] || 5;
                    }
                    if (b.card.color_identity?.length > 1) {
                        valueB = colorOrder['M'];
                    } else if (b.card.color_identity?.length === 0) {
                        valueB = colorOrder['C'];
                    } else {
                        valueB = colorOrder[b.card.color_identity[0]] || 5;
                    }
                    secondaryA = a.card.name || '';
                    secondaryB = b.card.name || '';
                    break;
                case 'collector_number':
                    valueA = a.card.collector_number || '9999';
                    valueB = b.card.collector_number || '9999';
                    const numA = parseInt(valueA);
                    const numB = parseInt(valueB);
                    if (!isNaN(numA) && !isNaN(numB)) {
                        valueA = numA;
                        valueB = numB;
                    }
                    break;
                case 'rarity':
                    const rarityOrder = { token: 0, land: 1, common: 2, uncommon: 3, rare: 4, mythic: 5 };
                    valueA = rarityOrder[(a.card.rarity || 'unknown').toLowerCase()] || 6;
                    valueB = rarityOrder[(b.card.rarity || 'unknown').toLowerCase()] || 6;
                    secondaryA = Number(a.card.cmc) || 0;
                    secondaryB = Number(b.card.cmc) || 0;
                    tertiaryA = a.card.name || '';
                    tertiaryB = b.card.name || '';
                    break;
                default:
                    return 0;
            }

            let result;
            if (typeof valueA === 'number' && typeof valueB === 'number') {
                result = direction === 'asc' ? valueA - valueB : valueB - valueA;
            } else {
                result = direction === 'asc'
                    ? String(valueA).localeCompare(String(valueB))
                    : String(valueB).localeCompare(String(valueA));
            }

            if (criterion === 'rarity' && result === 0) {
                if (secondaryA !== secondaryB) {
                    result = direction === 'asc' ? secondaryA - secondaryB : secondaryB - secondaryA;
                } else if (tertiaryA !== tertiaryB) {
                    result = direction === 'asc'
                        ? tertiaryA.localeCompare(tertiaryB)
                        : tertiaryB.localeCompare(tertiaryA);
                }
            } else if (criterion === 'color' && result === 0) {
                result = direction === 'asc'
                    ? secondaryA.localeCompare(secondaryB)
                    : secondaryB.localeCompare(secondaryA);
            }

            return result;
        } catch (error) {
            console.error('Error during sorting:', error, 'Card A:', a, 'Card B:', b);
            return 0;
        }
    });
}

// Filters
function filterByColor(color) {
    const index = currentFilters.colors.indexOf(color);
    if (index === -1) currentFilters.colors.push(color);
    else currentFilters.colors.splice(index, 1);
    document.querySelectorAll('.filter-button').forEach(btn => btn.classList.remove('active'));
    currentFilters.colors.forEach(c => {
        document.querySelector(`.filter-button[onclick="filterByColor('${c}')"]`)?.classList.add('active');
    });
    applyFilters();
    updateFilterButtonText();
}

function filterByManaCost(cost) {
    const index = currentFilters.manaCosts.indexOf(cost);
    if (index === -1) currentFilters.manaCosts.push(cost);
    else currentFilters.manaCosts.splice(index, 1);
    document.querySelectorAll('.filter-button').forEach(btn => btn.classList.remove('active'));
    currentFilters.manaCosts.forEach(c => {
        document.querySelector(`.filter-button[onclick="filterByManaCost(${c})"]`)?.classList.add('active');
    });
    applyFilters();
    updateFilterButtonText();
}

function filterByRarity(rarity) {
    console.log('Filtering by rarity:', rarity, 'Current filters:', currentFilters.rarities);
    const index = currentFilters.rarities.indexOf(rarity);
    if (index === -1) currentFilters.rarities.push(rarity);
    else currentFilters.rarities.splice(index, 1);
    document.querySelectorAll('.filter-button-rarity').forEach(btn => btn.classList.remove('active'));
    currentFilters.rarities.forEach(r => {
        document.querySelector(`.filter-button-rarity[onclick="filterByRarity('${r}')"]`)?.classList.add('active');
    });
    applyFilters();
    updateFilterButtonText();
}

function clearFilters() {
    currentFilters = { colors: [], manaCosts: [], rarities: [] };
    document.querySelectorAll('.filter-button, .filter-button-rarity').forEach(btn => btn.classList.remove('active'));
    applyFilters();
    updateFilterButtonText();
}

function applyFilters() {
    updateCollectionList();
}

// Collection search
const searchCollectionDebounced = debounce(() => {
    const filter = searchCollectionList.value.toUpperCase();
    const entries = collectionCardsList.getElementsByClassName('card-entry');
    for (let i = 0; i < entries.length; i++) {
        const entry = entries[i];
        const cardData = currentCollection.cards.find(c => c.card.name === entry.dataset.cardName);
        const name = entry.dataset.cardName.toUpperCase();
        const typeLine = entry.dataset.typeLine.toUpperCase() || '';
        const oracleText = entry.dataset.oracleText.toUpperCase() || '';
        const text = entry.textContent || entry.innerText;
        const matchesSearch = name.includes(filter) || typeLine.includes(filter) || oracleText.includes(filter);

        if (matchesSearch) {
            const colors = entry.dataset.colorIdentity ? entry.dataset.colorIdentity.split(',') : [];
            const cmc = parseInt(entry.dataset.cmc);
            const rarity = entry.dataset.rarity.toLowerCase();
            let show = true;

            if (currentFilters.colors.length > 0) {
                let matchesColor = false;
                if (currentFilters.colors.includes('Colorless') && colors.length === 0) matchesColor = true;
                else if (currentFilters.colors.includes('Multicolor') && colors.length > 1) matchesColor = true;
                else matchesColor = currentFilters.colors.some(c => colors.includes(c));
                show = show && matchesColor;
            }

            if (currentFilters.manaCosts.length > 0) {
                let matchesMana = false;
                currentFilters.manaCosts.forEach(cost => {
                    if (cost === 7 && cmc >= 7) matchesMana = true;
                    else if (cmc === cost) matchesMana = true;
                });
                show = show && matchesMana;
            }

            if (currentFilters.rarities.length > 0) {
                show = show && currentFilters.rarities.includes(rarity);
            }

            entry.style.display = show ? '' : 'none';
        } else {
            entry.style.display = 'none';
        }
    }
    updateDisplayCount();
}, 300);

searchCollectionList.addEventListener('input', searchCollectionDebounced);

// Save collection
function saveCollection() {
    const collectionData = {
        name: currentCollection.name,
        description: currentCollection.description || '',
        cards: currentCollection.cards.map(({ card, quantity, treatment }) => ({ name: card.name, id: card.id || '', quantity, treatment })),
        decks: currentCollection.decks.map(deck => ({
            name: deck.name,
            format: deck.format,
            cards: deck.cards.map(({ cardId, quantity, treatment }) => ({ cardId, quantity, treatment }))
        }))
    };
    const jsonData = JSON.stringify(collectionData, null, 2);
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentCollection.name || 'collection'}.json`;
    a.click();
    URL.revokeObjectURL(url);
    lastSaved = Date.now();
    showFeedback('Collection saved successfully!', 'success');
}

// Load collection
function loadCollection(event) {
    if (currentCollection.name !== '' && !confirm('This will overwrite the current collection. Continue?')) return;
    openLoadCollectionModal(event);

    highlightContainers(currentView);
}

// Unload collection
function unloadCollection() {
    if (currentCollection.name !== '' && !confirm('This will unload the current collection. Continue?')) return;
    currentCollection = { name: '', description: '', cards: [], decks: [] };
    updateCollectionList();
    updateDeckSelectOptions();
    updateDeckControlButtons();
    updateUIState();
    showFeedback('Collection unloaded.', 'success');
    if (createCollectionForm.style.display !== 'none') {
        collectionNameInput.value = '';
        document.getElementById('collectionDescription').value = '';
    }

    highlightContainers(currentView);
}

// Initialize filter button icons
function initializeFilterIcons() {
    document.querySelectorAll('.filter-button').forEach(button => {
        const originalText = button.innerHTML;
        button.innerHTML = replaceManaSymbols(originalText);
    });
}

// Reset sorting
function resetSort() {
    sortCriterionSelect.value = 'collector_number';
    sortDirectionSelect.value = 'asc';
    currentSort.criterion = 'collector_number';
    currentSort.direction = 'asc';
    updateCollectionList();
    showFeedback('Sort reset to Set Number (Ascending).', 'success');
}

// Function to open the import cards modal
function openImportCardsModal() {
    if (currentView === 'collection') {
        showFeedback('Please select a deck to import cards into.', 'error');
        return;
    }
    importCardsModal.style.display = 'flex';
    importCardsModal.classList.add('active');
    importCardsText.value = '';
    importCardsText.focus();
    showFeedback('Paste your Arena deck list to import cards.', 'info');
}

// Function to close the import cards modal
function closeImportCardsModal() {
    importCardsModal.classList.remove('active');
    setTimeout(() => {
        importCardsModal.style.display = 'none';
    }, 300);
}

// Function to handle file upload
function uploadImportFile() {
    fileInput.accept = '.txt';
    fileInput.onchange = e => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 10 * 1024 * 1024) {
            showFeedback('File is too large (max 10MB).', 'error');
            return;
        }
        const reader = new FileReader();
        reader.onload = function (e) {
            const text = e.target.result.replace(/^\uFEFF/, '');
            importCardsText.value = text;
            fileInput.value = '';
            showFeedback('File contents loaded into textarea. Please review and click Submit.', 'success');
        };
        reader.onerror = () => {
            console.error('FileReader error:', reader.error);
            showFeedback('Failed to read file. Please try again.', 'error');
            fileInput.value = '';
        };
        reader.readAsText(file);
    };
    fileInput.click();
}

// Add function to clear the textarea
function clearImportText() {
    importCardsText.value = '';
    showFeedback('Textarea cleared.', 'success');
}

// Function to submit the import
async function submitImportCards() {
    const text = importCardsText.value.trim();
    if (!text) {
        showFeedback('Please paste a deck export or upload a file.', 'error');
        return;
    }

    await processArenaImport(text);
    closeImportCardsModal();
    importCardsText.value = '';
}

// Function to process the Arena import
async function processArenaImport(text) {
    try {
        const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
        if (lines.length === 0 || lines[0] !== 'Deck') {
            throw new Error('Invalid MTG Arena format: file must start with "Deck"');
        }

        const newCards = [];
        let feedbackId = showFeedback(`Processing ${lines.length - 1} cards...`, 'loading', true);

        for (let i = 1; i < lines.length; i++) {
            const line = lines[i];
            const match = line.match(/^(\d+)\s+(.+?)\s+\(([A-Z0-9]+)\)\s+(\d+)$/);
            if (!match) {
                console.warn(`Skipping invalid line: ${line}`);
                continue;
            }

            const [, quantity, cardName, setCode, collectorNumber] = match;
            try {
                const response = await fetch(`https://api.scryfall.com/cards/${setCode.toLowerCase()}/${collectorNumber}`);
                if (!response.ok) {
                    console.error(`Failed to fetch card ${cardName} (${setCode} ${collectorNumber}): ${response.status}`);
                    continue;
                }
                const cardData = await response.json();
                if (cardData.name.toLowerCase() !== cardName.toLowerCase()) {
                    console.warn(`Name mismatch for ${cardName} in set ${setCode} (${collectorNumber})`);
                    continue;
                }
                newCards.push({
                    card: { name: cardData.name, id: cardData.id },
                    quantity: parseInt(quantity),
                    treatment: 'non-foil'
                });
                updateFeedback(feedbackId, `Processed ${i}/${lines.length - 1} cards...`);
            } catch (error) {
                console.error(`Error fetching card ${cardName}:`, error);
                continue;
            }
        }

        removeFeedback(feedbackId);
        if (newCards.length === 0) {
            showFeedback('No valid cards found to import.', 'error');
            return;
        }

        currentCollection.cards = currentCollection.cards.concat(newCards);
        updateCollectionList();
        showFeedback(`Imported ${newCards.length} cards successfully!`, 'success');
    } catch (error) {
        console.error('Import collection error:', error);
        showFeedback(error.message || 'Failed to import collection. Invalid format.', 'error');
    }
}

// Function to parse and import deck text
function parseAndImportDeckText(deckText) {
    if (currentView === 'collection') {
        showFeedback('No deck selected.', 'error');
        return;
    }

    const deck = currentCollection.decks[currentView];
    const lines = deckText.split('\n');
    const cardEntries = [];

    lines.forEach(line => {
        const match = line.match(/^(\d+)\s+(.+)/);
        if (match) {
            const quantity = parseInt(match[1]);
            const name = match[2].trim();
            if (quantity > 0 && name) cardEntries.push({ name, quantity });
        }
    });

    let added = 0;
    const importPromises = cardEntries.map(async entry => {
        try {
            const response = await fetch(`https://api.scryfall.com/cards/named?exact=${encodeURIComponent(entry.name)}`);
            if (response.ok) {
                const card = await response.json();
                const existing = deck.cards.find(c => c.cardId === card.id);
                if (existing) {
                    existing.quantity += entry.quantity;
                } else {
                    deck.cards.push({ cardId: card.id, quantity: entry.quantity, treatment: 'non-foil' });
                }
                added++;
            } else {
                showFeedback(`Card not found: ${entry.name}`, 'error', true);
            }
        } catch (err) {
            showFeedback(`Error importing: ${entry.name}`, 'error', true);
        }
    });

    Promise.all(importPromises).then(() => {
        updateCollectionList();
        updateDeckSelectOptions(currentView);
        updateDeckControlButtons();
        closeImportCardsModal();
        showFeedback(`Imported ${added} cards to deck "${deck.name}".`, 'success');
    });

    highlightContainers(currentView);
}

// Listen for import cards button click
const importCardsSubmitBtn = document.getElementById('importCardsSubmitBtn');
if (importCardsSubmitBtn) {
    importCardsSubmitBtn.addEventListener('click', () => {
        parseAndImportDeckText(importCardsText.value);
    });
}

// Initialize UI and filter icons
document.addEventListener('DOMContentLoaded', () => {
    const closeDeckBtn = document.getElementById('closeDeckBtn');
    console.log('closeDeckBtn:', closeDeckBtn);
    if (closeDeckBtn) {
        closeDeckBtn.addEventListener('click', closeDeck);
    } else {
        console.error('Element with ID "closeDeckBtn" not found');
    }

    const deleteDeckBtn = document.getElementById('deleteDeckBtn');
    console.log('deleteDeckBtn:', deleteDeckBtn);
    if (deleteDeckBtn) {
        deleteDeckBtn.addEventListener('click', deleteDeck);
    } else {
        console.error('Element with ID "deleteDeckBtn" not found');
    }

    updateUIState();
    initializeFilterIcons();
    document.querySelector('#createCollectionForm .secondary-button').onclick = cancelCreateCollection;
    createNewCollectionButton.addEventListener('click', createNewCollection);
    loadCollectionButton.addEventListener('click', loadCollection);
    quickCardSearchButton.addEventListener('click', openAddCardModal);

    collectionNameInput.addEventListener('input', () => {
        createCollectionFormButton.disabled = collectionNameInput.value === "" ? true : false;
    });

    sortCriterionSelect.addEventListener('change', () => {
        currentSort.criterion = sortCriterionSelect.value;
        updateCollectionList();
        showFeedback(`Sorted by ${sortCriterionSelect.value} (${sortDirectionSelect.value}).`, 'success');
    });
    sortDirectionSelect.addEventListener('change', () => {
        currentSort.direction = sortDirectionSelect.value;
        updateCollectionList();
        showFeedback(`Sorted by ${sortCriterionSelect.value} (${sortDirectionSelect.value}).`, 'success');
    });
    resetSortButton.addEventListener('click', resetSort);
    document.getElementById('closeDeckBtn').addEventListener('click', closeDeck);
    document.getElementById('deleteDeckBtn').addEventListener('click', deleteDeck);
    document.getElementById('deckSelect').addEventListener('change', (e) => {
        selectDeck(e.target.value);
    });
    deckSearchInput.addEventListener('input', debounce(displayCollectionForDeck, 300));
});