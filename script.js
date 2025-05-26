// DOM elements
const emptySplash = document.getElementById('emptyPage');
const createCollectionForm = document.getElementById('createCollectionForm');
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
const filterToggleButton = document.getElementById('filterToggleButton');
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
const loadFromGoogleDriveBtn = document.getElementById('loadFromGoogleDriveBtn');
const uploadFromDeviceBtn = document.getElementById('uploadFromDeviceBtn');

// This is a new comment

// Google Drive API configuration
const CLIENT_ID = '1082824817658-ana0620kbg7rqa7krvn7nk06qat39k0e.apps.googleusercontent.com'; // Replace with your OAuth 2.0 Client ID from Google Cloud
const API_KEY = 'AIzaSyAx6RffiV7cGc-IQlkA2rpEpaOBjUYqxrs'; // Replace with your API Key from Google Cloud
const DISCOVERY_DOCS = ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'];
const SCOPES = 'https://www.googleapis.com/auth/drive.readonly';

let tokenClient;
let accessToken = null;

function initializeGapiClient(retryCount = 0) {
    gapi.load('client:picker', () => { // Load both client and picker
        gapi.client.init({
            apiKey: API_KEY,
            discoveryDocs: DISCOVERY_DOCS,
        }).then(() => {
            tokenClient = google.accounts.oauth2.initTokenClient({
                client_id: CLIENT_ID,
                scope: SCOPES,
                callback: (response) => {
                    if (response.error) {
                        showFeedback('Google Drive authentication failed: ' + response.error, 'error');
                        console.error('Auth error:', response.error);
                        return;
                    }
                    accessToken = response.access_token;
                    console.log('Access token obtained:', accessToken);
                    loadFileFromGoogleDrive();
                },
            });
        }).catch(error => {
            console.error('Error initializing gapi client:', error);
            if (retryCount < 3) {
                setTimeout(() => initializeGapiClient(retryCount + 1), 2000 * (retryCount + 1));
            } else {
                showFeedback('Failed to initialize Google Drive client after multiple attempts.', 'error');
            }
        });
    });
}

function createPicker() {
    if (!accessToken) {
        showFeedback('Not authenticated. Please try again.', 'error');
        return;
    }
    const view = new google.picker.View(google.picker.ViewId.DOCS);
    view.setMimeTypes('application/json'); // Only show .json files
    const picker = new google.picker.PickerBuilder()
        .enableFeature(google.picker.Feature.NAV_HIDDEN)
        .setAppId(CLIENT_ID.split('-')[0]) // Project number from Google Cloud
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
}

function loadFileFromDrive(fileId) {
    gapi.client.drive.files.get({
        fileId: fileId,
        alt: 'media',
    }).then(fileResponse => {
        console.log('Raw file response:', fileResponse.body); // Log raw content
        let data;
        try {
            data = JSON.parse(fileResponse.body);
            console.log('Parsed data:', data); // Log parsed data
        } catch (error) {
            console.error('JSON parse error:', error);
            showFeedback('Failed to parse file from Google Drive: Invalid JSON format.', 'error');
            return;
        }
        if (!data.name || !Array.isArray(data.cards)) {
            console.error('Invalid structure - Expected name:', data.name, 'cards:', data.cards);
            throw new Error('Invalid collection structure');
        }
        currentCollection = {
            name: data.name || 'Unnamed Collection',
            description: data.description || '',
            cards: data.cards.map(c => ({
                card: { name: c.name, id: c.id || '' },
                quantity: c.quantity || 1,
                treatment: c.treatment || 'non-foil'
            }))
        };
        currentFilters = { colors: [], manaCosts: [], rarities: [] };
        searchCollectionList.value = '';
        updateCollectionList();
        showFeedback(`Loaded collection "${currentCollection.name}" from Google Drive.`, 'success');
        localStorage.setItem('mtgCollection', JSON.stringify({
            name: currentCollection.name,
            description: currentCollection.description,
            cards: currentCollection.cards.map(({ card, quantity, treatment }) => ({ name: card.name, id: c.id || '', quantity, treatment }))
        }));
    }).catch(error => {
        console.error('Error loading file from Google Drive:', error);
        showFeedback('Failed to load file from Google Drive: Invalid format or network issue.', 'error');
    });
}

// Set Default Sorting Order to Set Number, Ascending
let currentSort = { criterion: 'collector_number', direction: 'asc' };

// State
let currentCollection = { name: '', description: '', cards: [] };
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
        loading: [message] // Loading messages don't vary
    };
    const selectedMessage = type === 'loading' ? message : messages[type][Math.floor(Math.random() * messages[type].length)];
    
    // Split the message into main and secondary parts after punctuation and whitespace
    const parts = selectedMessage.split(/([.!?])\s+/); // Split after punctuation AND whitespace
    let mainMessage = parts[0]; // Text before punctuation
    let secondaryMessage = '';
    
    // If there's punctuation, include it in the main message
    if (parts.length > 1) {
        mainMessage += parts[1]; // Add the punctuation to the main message
        secondaryMessage = parts.slice(2).join(' ').trim(); // Remaining text after punctuation and whitespace
    }

    const feedback = document.createElement('div');
    feedback.className = `feedback ${type}`;
    feedback.id = `feedback-${Date.now()}`; // Unique ID for persistent feedback
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
    return feedback.id; // Return the ID for later updates or removal
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
    noCardsInCollectionText.style.display = isCollectionActive && !hasCards ? 'block' : 'none';
    searchCollectionList.style.display = isCollectionActive && hasCards ? 'block' : 'none';
    filterControls.style.display = isCollectionActive && hasCards ? 'flex' : 'none';
    displayCount.style.display = isCollectionActive && hasCards ? 'block' : 'none';

    const sortControls = document.querySelector('.sort-controls');
    if (sortControls) {
        sortControls.style.display = isCollectionActive && hasCards ? 'flex' : 'none';
    }
    const filterToggleButton = document.getElementById('filterToggleButton');
    if (filterToggleButton) {
        filterToggleButton.style.display = isCollectionActive && hasCards ? 'inline-block' : 'none';
        sortToggleButton.style.display = isCollectionActive && hasCards ? 'inline-block' : 'none';
    }

    createNewCollectionButton.disabled = isCollectionActive;
    loadCollectionButton.disabled = isCollectionActive;
    createNewCollectionButton.style.opacity = isCollectionActive ? '0.5' : '1';
    loadCollectionButton.style.opacity = isCollectionActive ? '0.5' : '1';

    if (isCollectionActive) {
        collectionNameDisplay.innerText = `${currentCollection.name}`;
        document.getElementById('collectionDescriptionDisplay').innerText = currentCollection.description || '';
        document.getElementById('collectionDescriptionDisplay').style.display = currentCollection.description ? 'block' : 'none';
    }
}

// Backup prompt
function checkForBackup() {
    if (currentCollection.name && Date.now() - lastSaved > 15 * 60 * 1000) {
        showFeedback('Consider saving your collection to avoid losing changes.', 'info');
    }
}
setInterval(checkForBackup, 60 * 1000);

// Toggle sort controls
function toggleSortControls() {
    const sortControls = document.getElementById('sortControls');
    sortControls.classList.toggle('visible');
    const sortToggleButton = document.getElementById('sortToggleButton');
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

// Modal handlers
document.addEventListener('click', (e) => {
    if (e.target === cardDetailsModal) closeCardDetailsModal();
    else if (e.target === addCardModal) closeAddCardModal();
    else if (e.target === referencesModal) closeReferencesModal();
    else if (e.target === editCollectionModal) closeEditCollectionModal();
});

// References modal handlers
function openReferencesModal() {
    referencesModal.style.display = 'flex';
    referencesModal.classList.add('active');
}

function closeReferencesModal() {
    referencesModal.classList.remove('active');
    setTimeout(() => {
        referencesModal.style.display = 'none';
    }, 300);
}

function openLoadCollectionModal(event) {
    loadCollectionModal.classList.add('active');
    
    // Position the modal below the Load Collection button
    const button = event.target;
    const rect = button.getBoundingClientRect();
    const modalContent = loadCollectionModal.querySelector('.context-modal-content');
    modalContent.style.position = 'absolute';
    // modalContent.style.top = `${rect.bottom + window.scrollY}px`;
    // modalContent.style.left = `${rect.left + window.scrollX}px`;
}

function closeLoadCollectionModal() {
    loadCollectionModal.classList.remove('active');
}

loadCollectionModal.addEventListener('click', (event) => {
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
    fileInput.onchange = e => {
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
        reader.onload = function(e) {
            try {
                const text = e.target.result.replace(/^\uFEFF/, '');
                const data = JSON.parse(text);
                if (!data.name || !Array.isArray(data.cards)) {
                    throw new Error('Invalid collection structure');
                }
                currentCollection = {
                    name: data.name || 'Unnamed Collection',
                    description: data.description || '',
                    cards: data.cards.map(c => ({
                        card: { name: c.name, id: c.id || '' },
                        quantity: c.quantity || 1,
                        treatment: c.treatment || 'non-foil'
                    }))
                };
                currentFilters = { colors: [], manaCosts: [], rarities: [] };
                searchCollectionList.value = '';
                updateCollectionList();
            } catch (error) {
                console.error('Load collection error:', error);
                showFeedback(error.message === 'Invalid collection structure' ? 'Invalid collection structure. Please check the file.' : 'Failed to load collection. Invalid JSON format.', 'error');
            }
            fileInput.value = '';
        };
        reader.onerror = () => {
            console.error('FileReader error:', reader.error);
            showFeedback('Failed to read file. Please try again.', 'error');
            fileInput.value = '';
        };
        reader.readAsText(file);
    };
    fileInput.click();
    closeLoadCollectionModal();
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
        // showFeedback('Ready to create a new collection!', 'info'); 
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

    currentCollection = { name, description, cards: [] };
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
    updateUIState();
    showFeedback(`Collection "${name}" created!`, 'success');
    // Clear the form fields
    collectionNameInput.value = '';
    document.getElementById('collectionDescription').value = '';
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
    searchCardsDebounced(); // Clear previous results
}

function closeAddCardModal() {
    addCardModal.classList.remove('active');
    setTimeout(() => {
        addCardModal.style.display = 'none';
    }, 300);
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
        const cardCount = currentCollection.cards.filter(c => c.card.id === card.id && c.treatment === treatment).reduce((sum, c) => sum + c.quantity, 0);
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
                <p class="type-line">${card.type_line || 'Unknown'}</p>
                ${card.power && card.toughness ? `<p>${card.power}/${card.toughness}</p>` : ''}
                <p class="mana-text">${replaceManaSymbols(card.oracle_text || '')}</p>
                ${fromSearch && isCollectionActive ? 
                    `<button class="button primary-button medium-button" onclick="addToCollection('${card.id}')">Add to Collection</button>` :
                    fromSearch ? '' :
                    isCollectionActive ? `
                        <div>
                            <label for="removeQty-${card.id}">Remove: </label>
                            <input type="number" id="removeQty-${card.id}" class="text-input quantity" min="1" max="${cardCount}" value="1" style="width: 50px; margin-right: 10px;">
                            <button class="button secondary-button medium-button" onclick="removeFromCollection('${card.id}', '${treatment}')">Remove from Collection</button>
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
            searchResults.innerHTML = '<p>Error fetching cards. Please try again.</p>';
            showFeedback('Failed to fetch cards. Check your connection.', 'error');
        }
    }
}, 300);

searchInput.addEventListener('input', searchCardsDebounced);

function displaySearchResults(cards) {
    searchResults.innerHTML = '';
    if (!cards.length) {
        searchResults.innerHTML = '<p>No cards found.</p>';
        searchResults.classList.add('active');
        return;
    }
    const isCollectionActive = currentCollection.name !== '';
    cards.forEach(card => {
        const div = document.createElement('div');
        div.className = 'search-result';
        const imageUrl = card.image_uris?.small || '';
        // Calculate foil and non-foil counts for the card in the current collection
        let foilCount = 0;
        let nonFoilCount = 0;
        if (isCollectionActive) {
            foilCount = currentCollection.cards
                .filter(c => c.card.id === card.id && c.treatment === 'foil')
                .reduce((sum, c) => sum + c.quantity, 0);
            nonFoilCount = currentCollection.cards
                .filter(c => c.card.id === card.id && c.treatment === 'non-foil')
                .reduce((sum, c) => sum + c.quantity, 0);
        }
        // Only show the count text if the card is in the collection (foil or non-foil count > 0) and a collection is active
        const showCountText = isCollectionActive && (foilCount > 0 || nonFoilCount > 0);
        div.innerHTML = `
            <div class="content">
                <span class="card-name">${card.name}</span>
                <div class="type-line">${card.type_line} - ${card.rarity ? card.rarity.charAt(0).toUpperCase() + card.rarity.slice(1) : 'Unknown'}</div>
                ${isCollectionActive ? `
                    <div class="inputs">
                        <input type="number" class="text-input quantity" min="1" max="4" value="1" id="qty-${card.id}">
                        <select class="text-input" id="treatment-${card.id}" onchange="updateSearchResultFoil(this, '${card.id}')">
                            <option value="non-foil">Non-foil</option>
                            <option value="foil">Foil</option>
                        </select>
                        <div class="add-button-container">
                            <button class="button primary-button medium-button" onclick="addToCollection('${card.id}')">Add</button>
                            ${showCountText ? `
                                <span class="card-collection-count">★ ${foilCount} | 🞄 ${nonFoilCount}</span>
                            ` : ''}
                        </div>
                    </div>
                ` : ''}
            </div>
            ${imageUrl ? `<img src="${imageUrl}" alt="${card.name}" id="img-${card.id}" style="cursor: pointer;">` : '<p>No image available</p>'}
        `;
        searchResults.appendChild(div);
        // Add click event to image for preview
        const img = div.querySelector(`#img-${card.id}`);
        if (img) {
            img.addEventListener('click', () => {
                const treatment = isCollectionActive ? document.getElementById(`treatment-${card.id}`).value : 'non-foil';
                openCardDetailsModal(card, treatment, true);
            });
        }
    });
    searchResults.classList.add('active');
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

// Add card to collection
async function updateCollectionList() {
    console.log('Updating collection list, cards:', JSON.parse(JSON.stringify(currentCollection.cards)));
    collectionCardsList.innerHTML = '';
    const cardCounts = {};
    let totalCards = 0;
    const updatedCards = [];

    let feedbackId = null;
    const totalCardEntries = currentCollection.cards.length;
    if (totalCardEntries > 0) {
        feedbackId = showFeedback(`Loading card 0/${totalCardEntries}`, 'loading', true);
    }

    // Fetch all cards first
    for (let i = 0; i < currentCollection.cards.length; i++) {
        const { card, quantity, treatment } = currentCollection.cards[i];
        let fullCard = null;
        try {
            console.log(`Fetching card: ${card.name}`);
            const response = await fetch(`https://api.scryfall.com/cards/named?fuzzy=${encodeURIComponent(card.name)}`);
            if (!response.ok) {
                console.error(`Failed to fetch card ${card.name}: ${response.status}`);
                showFeedback(`Failed to load card: ${card.name}`, 'error');
                continue;
            }
            fullCard = await response.json();
            if (fullCard.card_faces && !fullCard.rarity) {
                fullCard.rarity = fullCard.card_faces[0].rarity || 'unknown';
                fullCard.image_uris = fullCard.image_uris || fullCard.card_faces[0].image_uris;
                fullCard.color_identity = fullCard.color_identity || fullCard.card_faces[0].color_identity;
                fullCard.cmc = fullCard.cmc || fullCard.card_faces[0].cmc || 0;
                fullCard.mana_cost = fullCard.mana_cost || fullCard.card_faces[0].mana_cost || '';
                fullCard.type_line = fullCard.type_line || fullCard.card_faces[0].type_line || 'Unknown';
                fullCard.collector_number = fullCard.collector_number || fullCard.card_faces[0].collector_number || '9999';
            }
            cardCache[fullCard.id] = fullCard;
            updatedCards.push({ card: fullCard, quantity, treatment });
            if (feedbackId) {
                updateFeedback(feedbackId, `Loading card ${i + 1}/${totalCardEntries}`);
            }
        } catch (error) {
            console.error(`Error fetching card ${card.name}:`, error);
            showFeedback(`Error loading card: ${card.name}`, 'error');
            continue;
        }
    }

    if (feedbackId) {
        removeFeedback(feedbackId);
        showFeedback('Collection loaded successfully!', 'success');
    }

    currentCollection.cards = updatedCards;
    console.log('After fetch, currentCollection.cards length:', currentCollection.cards.length, JSON.parse(JSON.stringify(currentCollection.cards)));

    // Sort the cards
    sortCards(currentSort.criterion, currentSort.direction);

    // Render the sorted cards
    totalCards = 0;
    for (const { card: fullCard, quantity, treatment } of currentCollection.cards) {
        const rarity = fullCard.rarity || 'unknown';
        const displayRarity = rarityMap[rarity.toLowerCase()] || rarity.charAt(0).toUpperCase() + rarity.slice(1);
        cardCounts[fullCard.name] = (cardCounts[fullCard.name] || 0) + quantity;
        totalCards += quantity;
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
                    <td title="${rarity.charAt(0).toUpperCase() + rarity.slice(1)}" class="rarity-symbol ${rarity.toLowerCase()} table-rarity-symbol">${displayRarity}</td>
                    <td title="${treatment.charAt(0).toUpperCase() + treatment.slice(1)}">${treatment === 'foil' ? '<span class="foil-star">★</span>' : '<span class="non-foil-dot">•</span>'}</td>
                </tr>
            </table>
        `;
        console.log(`Rendering card: ${fullCard.name}, id: ${fullCard.id}, foil: ${treatment === 'foil'}`);
        div.addEventListener('click', () => {
            console.log(`Card clicked: ${fullCard.name}, id: ${fullCard.id}, treatment: ${treatment}`);
            openCardDetailsModal(fullCard, treatment);
        });
        collectionCardsList.appendChild(div);
        setTimeout(() => div.classList.add('added'), 10);
    }

    console.log('Total rendered cards:', collectionCardsList.getElementsByClassName('card-entry').length);
    collectionCardCount.innerText = `Total Cards: ${totalCards}`;
    collectionCardCount.classList.add('updated');
    setTimeout(() => collectionCardCount.classList.remove('updated'), 200);
    updateUIState();
    applyFilters(); // Apply filters after rendering to respect current filter state
    if (searchCollectionList.value) searchCollectionDebounced();
    updateDisplayCount();
    console.log('Collection list updated, total cards:', totalCards);
}

// Apply sort debug function
function applySort() {
    currentSort.criterion = sortCriterionSelect.value;
    currentSort.direction = sortDirectionSelect.value;
    console.log(`Applying sort: criterion=${currentSort.criterion}, direction=${currentSort.direction}`);
    
    // Sort the current collection and reapply filters
    sortCards(currentSort.criterion, currentSort.direction);
    updateCollectionList(); // This will render the sorted list and reapply filters
    applyFilters(); // Ensure filters are reapplied after sorting
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

        // Fetch full card data if not in cache
        let fullCard = cardCache[cardId];
        if (!fullCard) {
            const response = await fetch(`https://api.scryfall.com/cards/${cardId}`);
            if (!response.ok) throw new Error(`Failed to fetch card ${cardId}`);
            fullCard = await response.json();
            cardCache[cardId] = fullCard;
        }

        // Check if card already exists with the same treatment
        const existingCard = currentCollection.cards.find(c => c.card.id === cardId && c.treatment === treatment);
        if (existingCard) {
            existingCard.quantity += quantity;
        } else {
            currentCollection.cards.push({ card: fullCard, quantity, treatment });
        }

        updateCollectionList();
        // Clear search input and focus it instead of closing the modal
        searchInput.value = '';
        searchInput.focus();
        searchCardsDebounced(); // Refresh search results after clearing
        showFeedback(`${quantity} × ${fullCard.name} (${treatment}) added to collection!`, 'success');
    } catch (error) {
        console.error('Error adding card to collection:', error);
        showFeedback('Failed to add card to collection.', 'error');
    }
}

// Remove card
function removeFromCollection(cardId, treatment) {
    console.log('Removing card:', { cardId, treatment });
    const removeQtyInput = document.getElementById(`removeQty-${cardId}`);
    const removeQty = parseInt(removeQtyInput ? removeQtyInput.value : 1) || 1;
    const cardCount = currentCollection.cards.filter(c => c.card.id === cardId && c.treatment === treatment).reduce((sum, c) => sum + c.quantity, 0);

    if (removeQty < 1 || removeQty > cardCount) {
        showFeedback(`Quantity to remove must be between 1 and ${cardCount}.`, 'error');
        return;
    }

    const cardEntry = currentCollection.cards.find(c => c.card.id === cardId && c.treatment === treatment);
    if (!cardEntry) {
        console.error('Card not found:', { cardId, treatment });
        showFeedback('Card not found in collection.', 'error');
        closeCardDetailsModal();
        return;
    }

    const cardElement = collectionCardsList.querySelector(`[data-card-name="${cardEntry.card.name.replace(/"/g, '\\"')}"]`);
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
        currentCollection.cards = currentCollection.cards.filter(c => !(c.card.id === cardId && c.treatment === treatment));
    } else {
        cardEntry.quantity -= removeQty;
    }

    console.log('Current collection after remove:', JSON.parse(JSON.stringify(currentCollection.cards)));
    updateCollectionList();
    closeCardDetailsModal();
    showFeedback(`${removeQty} ${cardEntry.card.name} (${treatment}) removed from collection!`, 'success');
}

// Sorting
function sortCards(criterion, direction = 'asc') {
    console.log('Sorting cards with criterion:', criterion, 'direction:', direction);
    currentCollection.cards.sort((a, b) => {
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
    console.log('Applying filters:', JSON.parse(JSON.stringify(currentFilters)));
    const filteredCards = currentCollection.cards.filter(card => {
        const { card: fullCard } = card;
        const colorMatch = !currentFilters.colors.length ||
            (fullCard.color_identity && currentFilters.colors.some(color => fullCard.color_identity.includes(color))) ||
            (fullCard.color_identity?.length === 0 && currentFilters.colors.includes('Colorless')) ||
            (fullCard.color_identity?.length > 1 && currentFilters.colors.includes('Multicolor'));
        const manaCostMatch = !currentFilters.manaCost ||
            (fullCard.cmc !== undefined && (currentFilters.manaCost === 7 ? fullCard.cmc >= 7 : fullCard.cmc === currentFilters.manaCost));
        const rarityMatch = !currentFilters.rarity ||
            (fullCard.rarity && currentFilters.rarity.toLowerCase() === fullCard.rarity.toLowerCase());
        return colorMatch && manaCostMatch && rarityMatch;
    });

    // Update the displayed cards with the filtered subset
    collectionCardsList.innerHTML = '';
    filteredCards.forEach(card => {
        const div = document.createElement('div');
        div.className = 'card-entry';
        div.dataset.cardName = card.card.name;
        div.dataset.typeLine = card.card.type_line || '';
        div.dataset.oracleText = card.card.oracle_text || '';
        div.dataset.colorIdentity = card.card.color_identity ? card.card.color_identity.join(',') : '';
        div.dataset.cmc = card.card.cmc || 0;
        div.dataset.rarity = card.card.rarity || 'unknown';
        div.dataset.collectorNumber = card.card.collector_number || '9999';
        const imageUrl = card.card.image_uris?.normal || '';
        div.innerHTML = `
            ${imageUrl ? `<img src="${imageUrl}" alt="${card.card.name}" class="${card.treatment === 'foil' ? 'foil' : ''}">` : '<p>No image available</p>'}
            <table class="card-table">
                <tr>
                    <td class="quantity-cell">${card.quantity}</td>
                    <td>${card.card.name}</td>
                    <td title="${card.card.rarity.charAt(0).toUpperCase() + card.card.rarity.slice(1)}" class="rarity-symbol ${card.card.rarity.toLowerCase()} table-rarity-symbol">${rarityMap[card.card.rarity.toLowerCase()] || card.card.rarity.charAt(0).toUpperCase() + card.card.rarity.slice(1)}</td>
                    <td title="${card.treatment.charAt(0).toUpperCase() + card.treatment.slice(1)}">${card.treatment === 'foil' ? '<span class="foil-star">★</span>' : '<span class="non-foil-dot">•</span>'}</td>
                </tr>
            </table>
        `;
        div.addEventListener('click', () => openCardDetailsModal(card.card, card.treatment));
        collectionCardsList.appendChild(div);
        setTimeout(() => div.classList.add('added'), 10);
    });

    // Reapply the current sort to the filtered cards
    sortCards(currentSort.criterion, currentSort.direction);

    // Update UI and display count
    updateDisplayCount();
    updateUIState();
    if (searchCollectionList.value) searchCollectionDebounced();
    showFeedback('Filters applied successfully!', 'success');
}

// Collection search
const searchCollectionDebounced = debounce(() => {
    const filter = searchCollectionList.value.toUpperCase();
    const entries = collectionCardsList.getElementsByClassName('card-entry');
    for (let i = 0; i < entries.length; i++) {
        const entry = entries[i];
        const cardData = currentCollection.cards.find(c => c.card.name === entry.dataset.cardName); // Match card by name
        const name = entry.dataset.cardName.toUpperCase();
        const typeLine = entry.dataset.typeLine.toUpperCase() || '';
        const oracleText = entry.dataset.oracleText.toUpperCase() || '';
        const text = entry.textContent || entry.innerText; // Full text content as fallback
        const matchesSearch = name.includes(filter) || typeLine.includes(filter) || oracleText.includes(filter); // Search name, type_line, and oracle_text

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
    updateDisplayCount(); // Add this line
}, 300);

searchCollectionList.addEventListener('input', searchCollectionDebounced);

// Save collection
function saveCollection() {
    const collectionData = {
        name: currentCollection.name,
        description: currentCollection.description || '',
        cards: currentCollection.cards.map(({ card, quantity, treatment }) => ({ name: card.name, id: card.id || '', quantity, treatment }))
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
}

// Unload collection
function unloadCollection() {
    if (currentCollection.name !== '' && !confirm('This will unload the current collection. Continue?')) return;
    currentCollection = { name: '', description: '', cards: [] };
    updateCollectionList();
    updateUIState();
    showFeedback('Collection unloaded.', 'success');
    // Clear the create collection form fields
    if (createCollectionForm.style.display !== 'none') {
        collectionNameInput.value = '';
        document.getElementById('collectionDescription').value = '';
    }
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
    importCardsText.value = ''; // Clear the textarea
    importCardsModal.style.display = 'flex';
    setTimeout(() => {
        importCardsModal.classList.add('active');
    }, 10); // Minimal delay to trigger animation
}

// Function to close the import cards modal
function closeImportCardsModal() {
    importCardsModal.classList.remove('active');
    setTimeout(() => {
        importCardsModal.style.display = 'none';
    }, 300); // Match fade-out to 300ms
}

// Close modal when clicking outside
importCardsModal.addEventListener('click', (e) => {
    if (e.target === importCardsModal) {
        closeImportCardsModal();
    }
});

// Function to handle file upload
function uploadImportFile() {
    fileInput.accept = '.txt'; // Only allow text files
    fileInput.onchange = e => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 10 * 1024 * 1024) {
            showFeedback('File is too large (max 10MB).', 'error');
            return;
        }
        const reader = new FileReader();
        reader.onload = function(e) {
            const text = e.target.result.replace(/^\uFEFF/, '');
            importCardsText.value = text; // Populate the textarea with the file content
            fileInput.value = ''; // Clear the file input
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
    // Clear the textarea after submission
    importCardsText.value = '';
}

// Function to process the Arena import (reusing existing logic)
async function processArenaImport(text) {
    try {
        const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
        if (lines.length === 0 || lines[0] !== 'Deck') {
            throw new Error('Invalid MTG Arena format: file must start with "Deck"');
        }

        const newCards = [];
        let feedbackId = showFeedback(`Processing ${lines.length - 1} cards...`, 'loading', true);

        // Process each line (skip the "Deck" header)
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

// initialize UI and filter icons
document.addEventListener('DOMContentLoaded', () => {
    updateUIState();
    initializeFilterIcons();
    document.querySelector('#createCollectionForm .secondary-button').onclick = cancelCreateCollection;
    createNewCollectionButton.addEventListener('click', createNewCollection);
    loadCollectionButton.addEventListener('click', loadCollection);
    quickCardSearchButton.addEventListener('click', openAddCardModal);
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
    initializeGapiClient();
});