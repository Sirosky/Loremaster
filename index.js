import { extension_settings } from "../../../extensions.js";
import { saveSettingsDebounced, eventSource, event_types } from "../../../../script.js";
import { getContext } from "../../../st-context.js";
import { ConnectionManagerRequestService } from "../../../extensions/shared.js";
import { DEFAULT_DEPTH, createNewWorldInfo, createWorldInfoEntry, loadWorldInfo, saveWorldInfo, METADATA_KEY, world_info_position, world_names } from "../../../world-info.js";
import { getPresetManager } from "../../../preset-manager.js";
import { getUniqueName } from "../../../utils.js";

const EXTENSION_NAME = 'Loremaster';
const EXTENSION_FOLDER = `scripts/extensions/third-party/${EXTENSION_NAME}`;

const DEFAULT_CHARACTER_PROMPT = `# Task

Create a character profile for the character in the highlighted text (provided below).

# Template

## Name
[Name, age, gender, ethnicity, basic personality traits, important relations]

**Virtues**: [Positive qualities] "[Quote reflecting their thoughts]"
**Flaws**: [Weaknesses or negative traits] "[Quote reflecting their thoughts]"
**Dreams**: [Short-term goal and long-term goal] "[Quote reflecting their thoughts]"
**Mannerisms**: [Three distinctive habits, tics, or behaviors]
**Speech**: [Speech patterns, vocabulary, cadence, accent, quirks. Then provide 3 dialogue examples.]
"[Dialogue example 1]" ([context])
"[Dialogue example 2]" ([context])
"[Dialogue example 3]" ([context])
**Sexual Experience**: [Sexuality, history, experiences, kinks if relevant] "[Quote reflecting their thoughts]"
**Marital Status/Family Plans**: [Relationship status, spouse/partner if any, whether they want children] "[Quote reflecting their thoughts]"
**Appearance**: [Physical appearance, cup size if female (**mandatory!**)] "[Quote reflecting their thoughts]"
**Typical Clothing**: [Usual style and outfits] "[Quote reflecting their thoughts]"
**Activities**: [Daily routines, work, hobbies, leisure] "[Quote reflecting their thoughts]"
**Relationships**: [Important relationships and dynamics] "[Quote reflecting their thoughts]"

# Example

Use the following example only as a model for formatting, field order, cadence, and level of detail. Do not copy its subject matter, quotes, or traits.

---

## Marcus Jean-Baptiste

19-year-old freshman at University of Miami, Marcus is a marine biology major from Key West with Haitian roots. He’s impossibly chill—the kind of guy who makes everyone feel like they’ve been friends for years. Laid-back, observant, and deeply connected to the ocean, he moves through life with a surfer’s rhythm and a scientist’s curiosity.

**Virtues**: Genuinely warm, emotionally intelligent, unflappable under pressure, generous with his time and knowledge. "Man, stress is like a rip current—you fight it, you drown. You flow with it, you end up exactly where you need to be."
**Flaws**: Conflict-avoidant to a fault, chronically late, sometimes too detached from practical responsibilities, uses chill vibes as a shield against vulnerability. "Deadlines? Nah, those are more like... suggestions, you feel me? The coral doesn't rush to grow, and it's been here millions of years."
**Dreams**: Short-term—get scuba certified and join a reef restoration dive by spring semester. Long-term—earn a PhD in marine ecology and open a research station back in the Keys, combining conservation science with community education. "I wanna be the guy little island kids point to and say, 'He figured out how to save our reefs.' That's the dream right there."
**Mannerisms**: Constantly touches his dreadlocks when thinking, twirling the ends around his finger. Has a habit of closing his eyes and taking a deep breath before responding to anything remotely serious. Always positions himself facing the nearest window or body of water.
**Speech**: Soft-spoken with a melodic, unhurried cadence; drops his g's (doin', goin', chillin'); sprinkles in Haitian Creole phrases from his grandmother and surfer slang from his Key West upbringing; asks more questions than he makes statements.
"Yo, you good? Like, actually good? 'Cause your shoulders are up by your ears, and that's not the vibe." (gently observant, checking in on someone's emotional state)
"Nah, see, parrotfish are the unsung heroes—they literally poop out beaches, for real. That white sand? Parrotfish digestion, my dude." (enthusiastic, nerding out about marine life)
"Grann taught me this—*dèyè mòn gen mòn*. Behind mountains, more mountains. But also behind mountains? Views you can't even imagine." (philosophical, mixing Creole wisdom with his own optimism)
**Sexual Experience**: Bisexual, comfortably out since sophomore year of high school. A few serious relationships and some casual island flings—treats sex like everything else: relaxed, communicative, and focused on mutual good vibes. Has a thing for salt-rimmed margaritas and making out in the ocean. "Connection's the whole point, right? Bodies are just... the vessel. A very fun vessel."
**Marital Status/Family Plans**: Single, not looking for anything serious during freshman year but open to wherever the current takes him. Wants kids someday—specifically, wants to teach them to free-dive before they can walk. "My dad had me in the water at six months. That's non-negotiable for my future little ones."
**Appearance**: 6'1" with the lean, ropey build of someone who swims daily rather than lifts. Deep brown skin that holds the sun like it's been expecting it, shoulder-length dreadlocks usually half-up, warm amber eyes that crinkle when he smiles, which is often. "My mom says I got my grandpa's eyes. I say I got the ocean's eyes—same thing, really."
**Typical Clothing**: Board shorts, worn-in flip-flops, band tees (Bob Marley, Toots and the Maytals, Jimi Hendrix), puka shell necklace he's had since middle school, never without his Garmin dive watch. "Fashion? I dunno, man. If I can swim in it, sleep in it, and my grann doesn't call me a vagabond, it's a fit."
**Activities**: Spends mornings paddleboarding on Lake Osceola before class, works part-time at the university's marine science lab, volunteers with a local mangrove restoration group, late nights playing reggae bass lines on his electric bass, reading reef ecology papers for fun, hosting impromptu cookouts on the dorm balcony. "Work? This isn't work. I'd be doing this for free if they let me. Wait—I am doing this for free. Huh."
**Relationships**: Tight with his grandmother back in Key West (calls her every Sunday), friendly exes who still hit him up for tide chart recommendations, already the unofficial dorm therapist—people just show up at 613

---

# Rules

- Fill every template field completely.
- Infer missing details from context, but keep them plausible.
- Keep the result vivid and concise.
- Do not copy the example's subject matter, quotes, or traits.

Write only the completed profile content for the entry section.
`;

const DEFAULT_LORE_PROMPT = `# Task

Write a lorebook entry for the subject in the highlighted text (provided below).

# Example

Use the following example only as a model for formatting, sentence rhythm, density, and descriptive style. Do not copy its subject matter or details substantively.

---

## Lake Osceola

Lake Osceola is the scenic, man-made freshwater centerpiece of the University of Miami campus, fringed by palms, manicured lawns, and residential halls (e.g., Lakeside Village). Its sun-dappled waters reflect the surrounding dorm architecture, drawing students to its banks for leisure (hammock lounging, paddleboarding, late-night bonfires) and serving as a living lab for marine biology students studying its introduced species (tilapia, peacock bass, invasive apple snails). A seamless infinity-pool edge blurs the lake into the natural shoreline, embodying the university's blend of academic rigor and tropical luxury.

---

# Rules

- Include the markdown H2 header in the output.
- Write one polished paragraph after the header.
- Infer missing details from context, but keep them grounded.
- Use comma lists in parentheticals to compress details cleanly.
- Keep the result vivid and concise.

Write only the completed lorebook entry content for the entry section.
`;

const DEFAULT_NEW_PROMPT_TEMPLATE = `# Task
Write a lorebook entry for the subject in the highlighted text.

# Guidelines
- Base the entry strictly on information available in the provided context.
- Keep the result vivid and concise.

Write only the completed lorebook entry content for the entry section.`;

const ICON_PRESETS = ['👤', '📖', '⚔️', '🏰', '🌍', '🧙', '🐉', '💀', '👑', '🗡️', '🛡️', '🔮', '🌟', '📜', '🎭'];

const DEFAULT_PROMPTS = [
    {
        id: 'character',
        name: 'Character',
        icon: '👤',
        prompt: DEFAULT_CHARACTER_PROMPT,
        isDefault: true,
    },
    {
        id: 'lore',
        name: 'Lore',
        icon: '📖',
        prompt: DEFAULT_LORE_PROMPT,
        isDefault: true,
    },
];

const DEFAULT_SETTINGS = {
    selectedProfileId: '',
    presetOverride: '',
    contextMessageCount: 6,
    insertionDepth: world_info_position.before,
    insertionChatDepth: DEFAULT_DEPTH,
    lorebookPrefix: 'zzzLM - ',
    prompts: DEFAULT_PROMPTS,
    selectedPromptId: 'character',
};

const selectionState = {
    active: null,
    busy: false,
    pointerDown: false,
    toolbarInteraction: false,
};

let settingsListenersBound = false;

function resetSettingsToDefaults() {
    const currentSettings = getSettings();
    const freshSettings = structuredClone(DEFAULT_SETTINGS);

    for (const key of Object.keys(currentSettings)) {
        delete currentSettings[key];
    }

    Object.assign(currentSettings, freshSettings);
    saveSettings();
}

function getSettings() {
    if (!extension_settings[EXTENSION_NAME]) {
        extension_settings[EXTENSION_NAME] = structuredClone(DEFAULT_SETTINGS);
    }

    const settings = extension_settings[EXTENSION_NAME];

    // Migrate legacy prompt format to new prompts array
    if (!settings.prompts && (settings.characterPrompt || settings.lorePrompt)) {
        settings.prompts = [
            {
                id: 'character',
                name: 'Character',
                icon: '👤',
                prompt: settings.characterPrompt || DEFAULT_CHARACTER_PROMPT,
                isDefault: true,
            },
            {
                id: 'lore',
                name: 'Lore',
                icon: '📖',
                prompt: settings.lorePrompt || DEFAULT_LORE_PROMPT,
                isDefault: true,
            },
        ];
        delete settings.characterPrompt;
        delete settings.lorePrompt;
        saveSettings();
    }

    // Ensure prompts array exists
    if (!settings.prompts || !Array.isArray(settings.prompts)) {
        settings.prompts = structuredClone(DEFAULT_PROMPTS);
    }

    // Ensure selectedPromptId exists and is valid
    if (!settings.selectedPromptId || !settings.prompts.some(p => p.id === settings.selectedPromptId)) {
        settings.selectedPromptId = settings.prompts[0]?.id || 'character';
    }

    if (settings.insertionDepth === undefined && settings.entryPlacement !== undefined) {
        settings.insertionDepth = settings.entryPlacement;
    }

    if (settings.insertionChatDepth === undefined && settings.entryDepth !== undefined) {
        settings.insertionChatDepth = settings.entryDepth;
    }

    for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
        if (settings[key] === undefined) {
            settings[key] = structuredClone(value);
        }
    }

    return settings;
}

function saveSettings() {
    saveSettingsDebounced();
}

function normalizeText(text) {
    return String(text ?? '').replace(/\r\n/g, '\n').trim();
}

function normalizeKeyword(keyword) {
    return normalizeText(keyword).replace(/^["'`]+|["'`]+$/g, '');
}

function splitKeywords(keywordText) {
    return normalizeText(keywordText)
        .split(/[,;/|\n]+/g)
        .map(normalizeKeyword)
        .filter(Boolean);
}

function getSupportedProfiles() {
    try {
        return ConnectionManagerRequestService.getSupportedProfiles();
    } catch {
        return [];
    }
}

function getSelectedProfile() {
    const settings = getSettings();
    return getSupportedProfiles().find((profile) => profile.id === settings.selectedProfileId) ?? getSupportedProfiles()[0] ?? null;
}

function getProfileApiFamily(profile) {
    if (!profile?.api) {
        return null;
    }

    try {
        return ConnectionManagerRequestService.validateProfile(profile).selected;
    } catch {
        return null;
    }
}

function getPresetOptions(profile) {
    const apiFamily = getProfileApiFamily(profile);
    if (!apiFamily) {
        return [];
    }

    const presetManager = getPresetManager(apiFamily);
    if (!presetManager) {
        return [];
    }

    return (presetManager.getAllPresets?.() || []).slice();
}

function renderProfileSelect() {
    const settings = getSettings();
    const select = document.getElementById('lm_connection_profile');
    if (!select) {
        return;
    }

    const profiles = getSupportedProfiles();
    select.innerHTML = '';

    if (profiles.length === 0) {
        const option = document.createElement('option');
        option.value = '';
        option.textContent = 'No supported profiles found';
        select.appendChild(option);
        select.disabled = true;
        return;
    }

    select.disabled = false;
    for (const profile of profiles) {
        const option = document.createElement('option');
        option.value = profile.id;
        option.textContent = profile.name ? `${profile.name} (${profile.api})` : profile.api;
        select.appendChild(option);
    }

    const selectedProfileId = profiles.some((profile) => profile.id === settings.selectedProfileId)
        ? settings.selectedProfileId
        : profiles[0].id;

    if (selectedProfileId !== settings.selectedProfileId) {
        settings.selectedProfileId = selectedProfileId;
        saveSettings();
    }

    select.value = selectedProfileId;
}

function renderPresetSelect() {
    const settings = getSettings();
    const profile = getSelectedProfile();
    const select = document.getElementById('lm_preset_override');
    const familyLabel = document.querySelector('#lm_preset_override')?.closest('.lm-settings-field')?.querySelector('span');

    if (!select) {
        return;
    }

    const apiFamily = getProfileApiFamily(profile);
    const presets = getPresetOptions(profile);

    if (familyLabel) {
        familyLabel.textContent = apiFamily === 'openai' ? 'Chat Complete preset override' : 'Text Complete preset override';
    }

    select.innerHTML = '';

    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'Use connection profile preset';
    select.appendChild(defaultOption);

    if (!profile || !apiFamily) {
        const option = document.createElement('option');
        option.value = '';
        option.textContent = 'Unsupported profile';
        select.appendChild(option);
        select.disabled = true;
        select.value = '';
        return;
    }

    for (const presetName of presets) {
        const option = document.createElement('option');
        option.value = presetName;
        option.textContent = presetName;
        select.appendChild(option);
    }

    select.disabled = false;
    select.value = presets.includes(settings.presetOverride) ? settings.presetOverride : '';
}

function buildContextMessages(messageIndex, selectionText) {
    const settings = getSettings();
    const context = getContext();
    const count = Math.max(1, Number(settings.contextMessageCount) || 1);
    const startIndex = Math.max(0, messageIndex - count + 1);
    const messages = context.chat.slice(startIndex, messageIndex + 1);

    const formattedMessages = messages
        .map((message, index) => {
            const absoluteIndex = startIndex + index;
            const speaker = message.name || (message.is_user ? context.name1 : context.name2) || message.role || 'message';
            const text = normalizeText(message.mes);
            return `${absoluteIndex + 1}. ${speaker}: ${text}`;
        })
        .join('\n');

    return [
        `Highlighted text: ${selectionText}`,
        '',
        `Selected message #${messageIndex + 1}:`,
        formattedMessages,
    ].join('\n');
}

function buildRequestMessages(promptId, selection) {
    const settings = getSettings();
    const prompt = settings.prompts.find(p => p.id === promptId);
    
    if (!prompt) {
        throw new Error(`Prompt with ID "${promptId}" not found.`);
    }

    const systemPrompt = prompt.prompt;
    const instruction = [
        'Complete the selected prompt\'s primary task using the Target and provided context above.',
        'Return exactly two XML-style sections and no other text:',
        '<entry>',
        'Write only the completed lorebook entry requested by the selected prompt here. Do not include keywords or metadata.',
        '</entry>',
        '<keywords>',
        'Highlighted target text; short alias; another trigger phrase',
        '</keywords>',
        'Rules for <keywords>: include the highlighted target text exactly as the first keyword; use 3-8 concise search trigger keywords or phrases; separate them with semicolons.',
        'The keywords are metadata for lorebook triggers, not part of the entry content.',
    ];

    return [
        { role: 'system', content: systemPrompt },
        {
            role: 'user',
            content: [
                '## Target',
                selection.text,
                '',
                '## Context',
                buildContextMessages(selection.messageIndex, selection.text),
                '',
                '## Instructions',
                ...instruction,
            ].join('\n'),
        },
    ];
}

function extractResponseText(response) {
    if (typeof response === 'string') {
        return response;
    }

    if (response && typeof response === 'object') {
        return String(response.content ?? response.text ?? response.message ?? '').trim();
    }

    return '';
}

function parseResponse(content) {
    const normalizedContent = normalizeText(content);
    const entryMatch = normalizedContent.match(/<entry>\s*([\s\S]*?)\s*<\/entry>/i);
    const keywordsMatch = normalizedContent.match(/<keywords>\s*([\s\S]*?)\s*<\/keywords>/i);

    if (entryMatch || keywordsMatch) {
        const entryContent = entryMatch
            ? entryMatch[1].trim()
            : normalizedContent.replace(/<keywords>\s*[\s\S]*?\s*<\/keywords>/i, '').trim();

        return {
            content: entryContent,
            keywords: keywordsMatch ? splitKeywords(keywordsMatch[1]) : [],
        };
    }

    const lines = normalizedContent.split('\n');
    const keywordLineIndexes = [];

    for (let index = 0; index < lines.length; index++) {
        if (/^\s*(?:trigger\s+)?keywords?\s*:\s*/i.test(lines[index])) {
            keywordLineIndexes.push(index);
        }
    }

    let keywords = [];
    if (keywordLineIndexes.length > 0) {
        const index = keywordLineIndexes[keywordLineIndexes.length - 1];
        const match = lines[index].match(/^\s*(?:trigger\s+)?keywords?\s*:\s*(.*)$/i);
        keywords = splitKeywords(match?.[1] ?? '');
        lines.splice(index, 1);
    }

    return {
        content: lines.join('\n').trim(),
        keywords,
    };
}

async function ensureChatLorebook() {
    const context = getContext();
    const chatId = context.getCurrentChatId?.() ?? context.chatId;
    const settings = getSettings();

    if (!chatId) {
        throw new Error('Open a chat before generating Loremaster entries.');
    }

    const existingName = context.chatMetadata?.[METADATA_KEY];
    if (existingName && world_names.includes(existingName)) {
        return existingName;
    }

    const baseName = getUniqueName(`${settings.lorebookPrefix ?? ''}Loremaster Chat Book ${chatId}`.replace(/[^a-z0-9 -]/gi, '_').replace(/_{2,}/g, '_').substring(0, 64), world_names.includes.bind(world_names));
    await createNewWorldInfo(baseName, { interactive: false });
    context.chatMetadata[METADATA_KEY] = baseName;
    await context.saveMetadata();
    return baseName;
}

async function sendSidecarRequest(profile, messages) {
    const apiFamily = getProfileApiFamily(profile);
    const settings = getSettings();
    const presetOverride = settings.presetOverride?.trim();
    const runtimeContext = getContext();

    if (!apiFamily) {
        throw new Error('Selected connection profile is not supported by Loremaster.');
    }

    if (!runtimeContext?.ChatCompletionService || !runtimeContext?.TextCompletionService) {
        throw new Error('Loremaster runtime context is unavailable.');
    }

    if (apiFamily === 'openai') {
        const proxyPreset = (globalThis.proxies || []).find((preset) => preset.name === profile.proxy);
        return await runtimeContext.ChatCompletionService.processRequest({
            stream: false,
            messages,
            model: profile.model,
            chat_completion_source: runtimeContext.CONNECT_API_MAP[profile.api].source,
            secret_id: profile['secret-id'],
            custom_url: profile['api-url'],
            vertexai_region: profile['api-url'],
            zai_endpoint: profile['api-url'],
            siliconflow_endpoint: profile['api-url'],
            minimax_endpoint: profile['api-url'],
            pollinations_endpoint: profile['api-url'],
            reverse_proxy: proxyPreset?.url,
            proxy_password: proxyPreset?.password,
            custom_prompt_post_processing: profile['prompt-post-processing'],
        }, {
            presetName: presetOverride || profile.preset,
        }, true, null);
    }

    return await runtimeContext.TextCompletionService.processRequest({
        stream: false,
        prompt: messages,
        model: profile.model,
        api_type: runtimeContext.CONNECT_API_MAP[profile.api].type,
        api_server: profile['api-url'],
        secret_id: profile['secret-id'],
    }, {
        presetName: presetOverride || profile.preset,
        instructName: profile.instruct,
        instructSettings: {},
    }, true, null);
}

async function createLoreEntry(promptId, selection) {
    const settings = getSettings();
    const prompt = settings.prompts.find(p => p.id === promptId);
    
    if (!prompt) {
        throw new Error(`Prompt with ID "${promptId}" not found.`);
    }

    const profile = getSelectedProfile();
    if (!profile) {
        throw new Error('Choose a supported connection profile first.');
    }

    const messages = buildRequestMessages(promptId, selection);
    toastr.info('Request sent.', 'Loremaster', { timeOut: 1500 });

    const response = await sendSidecarRequest(profile, messages);
    const parsed = parseResponse(extractResponseText(response));
    const content = parsed.content || extractResponseText(response).trim();
    const keywords = [selection.text, ...parsed.keywords]
        .map(normalizeKeyword)
        .filter(Boolean);

    if (!content) {
        throw new Error('The LLM response was empty.');
    }

    if (parsed.keywords.length === 0) {
        toastr.warning('The model did not return a Keywords line. Using only the highlighted text as a trigger.', 'Loremaster', { timeOut: 3000 });
    }

    const bookName = await ensureChatLorebook();
    const data = await loadWorldInfo(bookName);
    const entry = createWorldInfoEntry(bookName, data);

    if (!entry) {
        throw new Error('Could not create a new World Info entry.');
    }

    const selectionLabel = selection.text.length > 80 ? `${selection.text.slice(0, 77)}...` : selection.text;
    const placement = Number(settings.insertionDepth);
    const entryPlacement = [
        world_info_position.before,
        world_info_position.after,
        world_info_position.EMTop,
        world_info_position.EMBottom,
        world_info_position.ANTop,
        world_info_position.ANBottom,
        world_info_position.atDepth,
    ].includes(placement)
        ? placement
        : world_info_position.before;
    const entryDepth = Math.max(0, Number(settings.insertionChatDepth) || DEFAULT_DEPTH);

    Object.assign(entry, {
        key: Array.from(new Set(keywords)),
        keysecondary: [],
        comment: `[${prompt.name}] ${selectionLabel}`.slice(0, 100),
        content,
        position: entryPlacement,
        depth: entryPlacement === world_info_position.atDepth ? entryDepth : DEFAULT_DEPTH,
    });

    await saveWorldInfo(bookName, data, true);
    toastr.success(`Created ${prompt.name} entry in ${bookName}.`, 'Loremaster', { timeOut: 2000 });
}

function getSelectionData() {
    const selection = window.getSelection?.();
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
        return null;
    }

    const text = normalizeText(selection.toString());
    if (!text) {
        return null;
    }

    const range = selection.getRangeAt(0);
    const container = range.commonAncestorContainer;
    const messageNode = container.nodeType === Node.ELEMENT_NODE ? container : container.parentElement;
    const messageText = messageNode?.closest?.('.mes_text');
    const messageElement = messageText?.closest?.('.mes');

    if (!messageText || !messageElement) {
        return null;
    }

    const messageIndex = Number(messageElement.getAttribute('mesid'));
    if (!Number.isInteger(messageIndex)) {
        return null;
    }

    return {
        text,
        messageIndex,
        range,
    };
}

function getToolbar() {
    let toolbar = document.getElementById('lm_selection_toolbar');
    if (toolbar) {
        return toolbar;
    }

    toolbar = document.createElement('div');
    toolbar.id = 'lm_selection_toolbar';
    toolbar.className = 'lm-selection-toolbar';
    
    // Build toolbar dynamically from prompts
    const settings = getSettings();
    const label = document.createElement('span');
    label.className = 'lm-toolbar-label';
    label.textContent = '🪄';
    toolbar.appendChild(label);

    for (const prompt of settings.prompts) {
        const button = document.createElement('button');
        button.type = 'button';
        button.dataset.action = prompt.id;
        button.setAttribute('aria-label', `Generate ${prompt.name}`);
        button.title = prompt.name;

        // Render icon: either emoji or FontAwesome
        if (isEmojiIcon(prompt.icon)) {
            button.textContent = prompt.icon;
            button.style.fontSize = '18px';
        } else {
            const icon = document.createElement('i');
            icon.className = prompt.icon;
            button.appendChild(icon);
        }

        toolbar.appendChild(button);
    }

    document.body.appendChild(toolbar);

    toolbar.addEventListener('click', async (event) => {
        const button = event.target.closest('button[data-action]');
        if (!button || selectionState.busy) {
            return;
        }

        const promptId = button.dataset.action;
        const selection = selectionState.active;
        if (!selection) {
            return;
        }

        selectionState.busy = true;
        setToolbarBusy(true);

        try {
            hideToolbar();
            await createLoreEntry(promptId, selection);
        } catch (error) {
            console.error('[Loremaster] Failed to create entry:', error);
            toastr.error(error?.message || 'Failed to create Loremaster entry.', 'Loremaster');
        } finally {
            selectionState.busy = false;
            setToolbarBusy(false);
        }
    });

    return toolbar;
}

function setToolbarBusy(isBusy) {
    const toolbar = document.getElementById('lm_selection_toolbar');
    if (!toolbar) {
        return;
    }

    toolbar.querySelectorAll('button').forEach((button) => {
        button.disabled = isBusy;
    });
}

function positionToolbar(selection) {
    const toolbar = getToolbar();
    toolbar.classList.add('visible');
    toolbar.style.visibility = 'hidden';
    toolbar.style.display = 'flex';

    const rect = selection.range.getBoundingClientRect();
    const toolbarRect = toolbar.getBoundingClientRect();
    const margin = 12;
    const top = Math.max(margin, rect.top - toolbarRect.height - 10);
    let left = rect.left + (rect.width / 2) - (toolbarRect.width / 2);
    left = Math.min(window.innerWidth - toolbarRect.width - margin, Math.max(margin, left));

    toolbar.style.top = `${top}px`;
    toolbar.style.left = `${left}px`;
    toolbar.style.visibility = 'visible';
}

function hideToolbar() {
    const toolbar = document.getElementById('lm_selection_toolbar');
    if (!toolbar) {
        return;
    }

    toolbar.classList.remove('visible');
    toolbar.style.display = 'none';
    toolbar.style.visibility = 'hidden';
    selectionState.active = null;
}

function updateSelectionToolbar() {
    if (selectionState.busy || selectionState.pointerDown || selectionState.toolbarInteraction) {
        return;
    }

    const selection = getSelectionData();
    if (!selection) {
        hideToolbar();
        return;
    }

    selectionState.active = selection;
    positionToolbar(selection);
}

function generatePromptId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function isEmojiIcon(str) {
    // Check if it's a single emoji or starts with fa- (FontAwesome class)
    if (!str || typeof str !== 'string') return false;
    const trimmed = str.trim();
    if (trimmed.startsWith('fa-')) return false;
    // Simple emoji detection: if it's short and not starting with 'fa-', treat as emoji
    return trimmed.length <= 4;
}

function renderIconPresets() {
    const container = document.getElementById('lm_icon_presets');
    if (!container) return;

    container.innerHTML = '';
    for (const icon of ICON_PRESETS) {
        const span = document.createElement('span');
        span.className = 'lm-icon-preset';
        span.textContent = icon;
        span.title = `Use ${icon}`;
        span.addEventListener('click', () => {
            const iconInput = document.getElementById('lm_prompt_icon');
            if (iconInput) {
                iconInput.value = icon;
                iconInput.dispatchEvent(new Event('input'));
            }
        });
        container.appendChild(span);
    }
}

function refreshToolbar() {
    const toolbar = document.getElementById('lm_selection_toolbar');
    if (toolbar) {
        toolbar.remove();
    }
    // Toolbar will be recreated on next selection
}

function renderPromptSelector() {
    const settings = getSettings();
    const selector = document.getElementById('lm_prompt_selector');
    if (!selector) return;

    selector.innerHTML = '';
    for (const prompt of settings.prompts) {
        const option = document.createElement('option');
        option.value = prompt.id;
        option.textContent = `${prompt.icon} ${prompt.name}`;
        selector.appendChild(option);
    }

    selector.value = settings.selectedPromptId;
    updatePromptUI();
}

function updatePromptUI() {
    const settings = getSettings();
    const selectedPrompt = settings.prompts.find(p => p.id === settings.selectedPromptId);
    if (!selectedPrompt) return;

    const iconInput = document.getElementById('lm_prompt_icon');
    const textArea = document.getElementById('lm_prompt_text');
    const deleteButton = document.getElementById('lm_prompt_delete');
    const renameButton = document.getElementById('lm_prompt_rename');
    const moveUpButton = document.getElementById('lm_prompt_move_up');
    const moveDownButton = document.getElementById('lm_prompt_move_down');

    if (iconInput) iconInput.value = selectedPrompt.icon;
    if (textArea) textArea.value = selectedPrompt.prompt;

    // Disable delete/rename for default prompts
    if (deleteButton) deleteButton.disabled = selectedPrompt.isDefault;
    if (renameButton) renameButton.disabled = selectedPrompt.isDefault;

    // Update move buttons based on position
    const currentIndex = settings.prompts.findIndex(p => p.id === settings.selectedPromptId);
    if (moveUpButton) moveUpButton.disabled = currentIndex === 0;
    if (moveDownButton) moveDownButton.disabled = currentIndex === settings.prompts.length - 1;
}

function selectPrompt(promptId) {
    const settings = getSettings();
    settings.selectedPromptId = promptId;
    saveSettings();
    updatePromptUI();
}

function addPrompt() {
    const settings = getSettings();
    const newPrompt = {
        id: generatePromptId(),
        name: 'New Prompt',
        icon: '📝',
        prompt: DEFAULT_NEW_PROMPT_TEMPLATE,
        isDefault: false,
    };
    settings.prompts.push(newPrompt);
    settings.selectedPromptId = newPrompt.id;
    saveSettings();
    renderPromptSelector();
    refreshToolbar();
}

function deletePrompt(promptId) {
    const settings = getSettings();
    const prompt = settings.prompts.find(p => p.id === promptId);
    if (!prompt || prompt.isDefault) return;

    if (!confirm(`Delete prompt "${prompt.name}"?`)) return;

    const index = settings.prompts.findIndex(p => p.id === promptId);
    settings.prompts.splice(index, 1);

    // Select the previous prompt, or the first one if we deleted the first
    if (settings.selectedPromptId === promptId) {
        settings.selectedPromptId = settings.prompts[Math.max(0, index - 1)]?.id || settings.prompts[0]?.id;
    }

    saveSettings();
    renderPromptSelector();
    refreshToolbar();
}

function renamePrompt(promptId) {
    const settings = getSettings();
    const prompt = settings.prompts.find(p => p.id === promptId);
    if (!prompt || prompt.isDefault) return;

    const newName = window.prompt('Enter new prompt name:', prompt.name);
    if (!newName || newName.trim() === '') return;

    prompt.name = newName.trim();
    saveSettings();
    renderPromptSelector();
    refreshToolbar();
}

function movePrompt(promptId, direction) {
    const settings = getSettings();
    const index = settings.prompts.findIndex(p => p.id === promptId);
    if (index === -1) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= settings.prompts.length) return;

    // Swap
    [settings.prompts[index], settings.prompts[newIndex]] = [settings.prompts[newIndex], settings.prompts[index]];
    saveSettings();
    renderPromptSelector();
    refreshToolbar();
}

async function populateSettings() {
    const settings = getSettings();
    const profileSelect = document.getElementById('lm_connection_profile');
    const presetSelect = document.getElementById('lm_preset_override');
    const contextInput = document.getElementById('lm_context_message_count');
    const insertionDepthInput = document.getElementById('lm_insertion_depth');
    const insertionChatDepthInput = document.getElementById('lm_insertion_chat_depth');
    const insertionChatDepthRow = document.getElementById('lm_insertion_chat_depth_row');
    const lorebookPrefixInput = document.getElementById('lm_lorebook_prefix');
    const restoreDefaultsButton = document.getElementById('lm_restore_defaults');
    
    // Prompt management UI elements
    const promptSelector = document.getElementById('lm_prompt_selector');
    const promptAddButton = document.getElementById('lm_prompt_add');
    const promptRenameButton = document.getElementById('lm_prompt_rename');
    const promptDeleteButton = document.getElementById('lm_prompt_delete');
    const promptMoveUpButton = document.getElementById('lm_prompt_move_up');
    const promptMoveDownButton = document.getElementById('lm_prompt_move_down');
    const promptIconInput = document.getElementById('lm_prompt_icon');
    const promptTextArea = document.getElementById('lm_prompt_text');

    const syncInsertionDepthVisibility = () => {
        if (!insertionChatDepthRow || !insertionDepthInput) {
            return;
        }

        const isAtDepth = Number(insertionDepthInput.value) === world_info_position.atDepth;
        insertionChatDepthRow.hidden = !isAtDepth;
    };

    if (!settingsListenersBound) {
        if (profileSelect) {
            profileSelect.addEventListener('change', () => {
                settings.selectedProfileId = profileSelect.value;
                saveSettings();
                renderPresetSelect();
            });
        }

        if (presetSelect) {
            presetSelect.addEventListener('change', () => {
                settings.presetOverride = presetSelect.value;
                saveSettings();
            });
        }

        if (contextInput) {
            contextInput.addEventListener('change', () => {
                settings.contextMessageCount = Math.max(1, Number(contextInput.value) || 1);
                contextInput.value = String(settings.contextMessageCount);
                saveSettings();
            });
        }

        if (insertionDepthInput) {
            insertionDepthInput.addEventListener('change', () => {
                settings.insertionDepth = Number(insertionDepthInput.value);
                insertionDepthInput.value = String(settings.insertionDepth);
                syncInsertionDepthVisibility();
                saveSettings();
            });
        }

        if (insertionChatDepthInput) {
            insertionChatDepthInput.addEventListener('change', () => {
                settings.insertionChatDepth = Math.max(0, Number(insertionChatDepthInput.value) || 0);
                insertionChatDepthInput.value = String(settings.insertionChatDepth);
                saveSettings();
            });
        }

        if (lorebookPrefixInput) {
            lorebookPrefixInput.addEventListener('change', () => {
                settings.lorebookPrefix = lorebookPrefixInput.value;
                saveSettings();
            });
        }

        // Prompt management listeners
        if (promptSelector) {
            promptSelector.addEventListener('change', () => {
                selectPrompt(promptSelector.value);
            });
        }

        if (promptAddButton) {
            promptAddButton.addEventListener('click', () => {
                addPrompt();
            });
        }

        if (promptRenameButton) {
            promptRenameButton.addEventListener('click', () => {
                renamePrompt(settings.selectedPromptId);
            });
        }

        if (promptDeleteButton) {
            promptDeleteButton.addEventListener('click', () => {
                deletePrompt(settings.selectedPromptId);
            });
        }

        if (promptMoveUpButton) {
            promptMoveUpButton.addEventListener('click', () => {
                movePrompt(settings.selectedPromptId, 'up');
            });
        }

        if (promptMoveDownButton) {
            promptMoveDownButton.addEventListener('click', () => {
                movePrompt(settings.selectedPromptId, 'down');
            });
        }

        if (promptIconInput) {
            promptIconInput.addEventListener('input', () => {
                const prompt = settings.prompts.find(p => p.id === settings.selectedPromptId);
                if (prompt) {
                    prompt.icon = promptIconInput.value;
                    saveSettings();
                    renderPromptSelector();
                    refreshToolbar();
                }
            });
        }

        if (promptTextArea) {
            promptTextArea.addEventListener('change', () => {
                const prompt = settings.prompts.find(p => p.id === settings.selectedPromptId);
                if (prompt) {
                    prompt.prompt = promptTextArea.value;
                    saveSettings();
                }
            });
        }

        if (restoreDefaultsButton) {
            restoreDefaultsButton.addEventListener('click', () => {
                resetSettingsToDefaults();
                window.setTimeout(() => {
                    populateSettings();
                }, 0);
            });
        }

        settingsListenersBound = true;
    }

    if (contextInput) {
        contextInput.value = String(settings.contextMessageCount);
    }

    if (insertionDepthInput) {
        insertionDepthInput.value = String(settings.insertionDepth ?? world_info_position.before);
        syncInsertionDepthVisibility();
    }

    if (insertionChatDepthInput) {
        insertionChatDepthInput.value = String(settings.insertionChatDepth ?? DEFAULT_DEPTH);
    }

    if (lorebookPrefixInput) {
        lorebookPrefixInput.value = settings.lorebookPrefix ?? '';
    }

    // Render prompt UI
    renderIconPresets();
    renderPromptSelector();

    renderProfileSelect();
    renderPresetSelect();
}

async function initSettingsPanel() {
    const settingsHtml = await $.get(`${EXTENSION_FOLDER}/settings.html`);
    if (!document.getElementById('loremaster_settings')) {
        $('#extensions_settings2').append(settingsHtml);
    }

    await populateSettings();
}

function setupEventHandlers() {
    document.addEventListener('mousedown', (event) => {
        selectionState.pointerDown = true;
        if (event.target.closest('#lm_selection_toolbar')) {
            selectionState.toolbarInteraction = true;
            return;
        }

        hideToolbar();
    }, true);

    document.addEventListener('mouseup', () => {
        selectionState.pointerDown = false;
        window.setTimeout(() => {
            updateSelectionToolbar();
        }, 0);
        window.setTimeout(() => {
            selectionState.toolbarInteraction = false;
        }, 0);
    }, true);

    document.addEventListener('selectionchange', () => {
        if (!selectionState.busy && !selectionState.pointerDown) {
            window.setTimeout(updateSelectionToolbar, 0);
        }
    });

    document.addEventListener('scroll', () => hideToolbar(), true);
    document.addEventListener('click', (event) => {
        const toolbar = document.getElementById('lm_selection_toolbar');
        if (toolbar && !toolbar.contains(event.target) && !event.target.closest('.mes_text')) {
            hideToolbar();
        }
    }, true);

    eventSource.on(event_types.CONNECTION_PROFILE_CREATED, () => {
        renderProfileSelect();
        renderPresetSelect();
    });

    eventSource.on(event_types.CONNECTION_PROFILE_UPDATED, () => {
        renderProfileSelect();
        renderPresetSelect();
    });

    eventSource.on(event_types.CONNECTION_PROFILE_DELETED, () => {
        renderProfileSelect();
        renderPresetSelect();
    });

    eventSource.on(event_types.CONNECTION_PROFILE_LOADED, () => {
        renderProfileSelect();
        renderPresetSelect();
    });
}

function seedProfileIfNeeded() {
    const settings = getSettings();
    const profiles = getSupportedProfiles();

    if (!profiles.length) {
        settings.selectedProfileId = '';
        return;
    }

    if (!profiles.some((profile) => profile.id === settings.selectedProfileId)) {
        settings.selectedProfileId = profiles[0].id;
        saveSettings();
    }
}

jQuery(async () => {
    getSettings();
    seedProfileIfNeeded();
    await initSettingsPanel();
    setupEventHandlers();
    getToolbar();
});
