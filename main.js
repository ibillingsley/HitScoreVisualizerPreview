"use strict";

// Layout
const preview = document.getElementById("preview");
const previewAll = document.getElementById("previewAll");
const previewToolbar = document.getElementById("previewToolbar");
const previewColumn = document.getElementById("previewColumn");
const editorColumn = document.getElementById("editorColumn");
// Editor
const textInput = document.getElementById("textInput");
const fileInput = document.getElementById("fileInput");
const fileName = document.getElementById("filenameInput");
const loadInput = document.getElementById("loadInput");
const formatButton = document.getElementById("format");
const downloadButton = document.getElementById("download");
const errorContainer = document.getElementById("error");
const errorMessage = document.getElementById("errorMessage");
const lintButton = document.getElementById("lint");
// Tabs
const previewTabs = document.getElementById("previewTabs");
const noteTab = document.getElementById("noteTab");
const chainTab = document.getElementById("chainTab");
const badcutTab = document.getElementById("badcutTab");
const missTab = document.getElementById("missTab");
// Checkboxes
const bloomInput = document.getElementById("bloomInput");
const italicsInput = document.getElementById("italicsInput");
const helpInput = document.getElementById("helpInput");
const backgroundInput = document.getElementById("backgroundInput");
// Format tokens
const help = document.getElementById("help");
const sInput = document.getElementById("sInput");
const pInput = document.getElementById("pInput");
const bInput = document.getElementById("bInput");
const cInput = document.getElementById("cInput");
const aInput = document.getElementById("aInput");
const tInput = document.getElementById("tInput");
// Preview sliders
const bRangeInput = document.getElementById("bRangeInput");
const cRangeInput = document.getElementById("cRangeInput");
const aRangeInput = document.getElementById("aRangeInput");
// Color picker
const colorInput = document.getElementById("colorInput");
const colorRegex =
	/"color"\s*:\s*\[\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*[\d.]+\s*)?\]|(color=)?(#[\dA-F]{6})/gi;
let modified = false;

function render(json) {
	preview.innerHTML = "";
	previewAll.innerHTML = "";
	noteTab.classList.toggle("empty", !json.judgments);
	chainTab.classList.toggle("empty", !json.chainHeadJudgments && !json.chainLinkDisplay);
	badcutTab.classList.toggle("empty", !json.badCutDisplays);
	missTab.classList.toggle("empty", !json.missDisplays);
	switch (getSelectedTab()) {
		case "noteTab":
			renderJudgments(json, false);
			break;
		case "chainTab":
			renderJudgments(json, true);
			break;
		case "badcutTab":
			renderBadcuts(json);
			break;
		case "missTab":
			renderMisses(json);
			break;
	}
	if (!previewAll.hasChildNodes()) previewAll.innerHTML = document.getElementById("empty").innerHTML;
}

function renderJudgments(json, chain) {
	const displayMode = json.displayMode?.toLowerCase() || (json.majorVersion ? "default" : "format");
	const judgments = (chain ? json.chainHeadJudgments : json.judgments) || [];
	const tokens = getTokens(json, chain);
	// Render single score
	let index = judgments.findIndex((j) => (j.threshold || 0) <= tokens.s);
	if (index < 0) index = judgments.length - 1;
	const judgment = Object.assign({}, judgments[index]);
	if (judgment.fade && index > 0) {
		const previous = judgments[index - 1];
		const ratio = (tokens.s - (judgment.threshold || 0)) / (previous.threshold - (judgment.threshold || 0));
		judgment.color = judgment.color.map((v, i) => v * (1 - ratio) + previous.color[i] * ratio);
	}
	preview.appendChild(renderScore(displayMode, judgment, tokens));
	// Render all threshold scores
	for (const judgment of judgments) {
		tokens.s = judgment.threshold || 0;
		tokens.p = Math.floor(tokens.s / 1.15);
		previewAll.appendChild(renderScore(displayMode, judgment, tokens));
	}
	if (chain && json.chainLinkDisplay) {
		tokens.s = 20;
		tokens.p = 100;
		previewAll.appendChild(renderScore(displayMode, json.chainLinkDisplay, tokens));
	}
}

function renderBadcuts(json) {
	for (const judgment of json.badCutDisplays || []) {
		previewAll.appendChild(renderScore("textonly", judgment, {}));
	}
}

function renderMisses(json) {
	for (const judgment of json.missDisplays || []) {
		previewAll.appendChild(renderScore("textonly", judgment, {}));
	}
}

function renderScore(displayMode, judgment, tokens) {
	const text = judgment.text || "";
	const score = document.createElement("p");
	score.className = "score";
	switch (displayMode) {
		case "format":
			score.innerHTML = richText(replaceTokens(text, tokens));
			break;
		case "numeric":
			score.textContent = tokens.s;
			break;
		case "textonly":
			score.innerHTML = richText(text);
			break;
		case "scoreontop":
			score.appendChild(document.createElement("span")).textContent = tokens.s;
			score.appendChild(document.createElement("br"));
			score.appendChild(document.createElement("span")).innerHTML = richText(text);
			break;
		default:
			score.appendChild(document.createElement("span")).innerHTML = richText(text);
			score.appendChild(document.createElement("br"));
			score.appendChild(document.createElement("span")).textContent = tokens.s;
			break;
	}
	const color = judgment.color || [0, 0, 0, 0];
	score.style.color = `rgb(${color
		.slice(0, 3)
		.map((c) => c * 255)
		.join(",")})`;
	if (italicsInput.checked) score.style.fontStyle = "italic";
	if (bloomInput.checked) {
		const bloom = score.cloneNode(true);
		bloom.className = "bloom";
		bloom.style.opacity = color[3] ?? 1;
		score.appendChild(bloom);
	}
	return score;
}

/** http://digitalnativestudios.com/textmeshpro/docs/rich-text/ */
function richText(text) {
	text = text.replaceAll("<", "&lt;");
	text = text.replaceAll(/&lt;size=([^>]+)>/g, '<span style="font-size: $1">');
	text = text.replaceAll(/&lt;\/size[^>]*>/g, "</span>");
	text = text.replaceAll(/&lt;(?:color=)?(#[\dA-F]{6})[^>]*>/gi, '<span style="color: $1">');
	text = text.replaceAll(/&lt;\/color[^>]*>/g, "</span>");
	text = text.replaceAll(/&lt;alpha=#([^>]+)>/g, (m, a) => `<span style="opacity: ${parseInt(a, 16) / 255}">`);
	text = text.replaceAll(/&lt;\/alpha[^>]*>/g, "</span>");
	text = text.replaceAll(/&lt;line-height=([^>]+)>/g, `<span style="display: inline-block; line-height: $1">`);
	text = text.replaceAll(/&lt;\/line-height[^>]*>/g, "</span>");
	text = text.replaceAll(/&lt;(\/?[uibs])>/g, "<$1>");
	return text;
}

function replaceTokens(text, tokens) {
	for (const token in tokens) {
		text = text.replaceAll("%" + token, tokens[token]);
	}
	return text;
}

function getTokens(json, chain) {
	const b = Number(bInput.value);
	const c = Number(cInput.value);
	const a = Number(aInput.value);
	const t = Number(tInput.value);
	const s = b + c + a;
	const p = Math.floor(s / 1.15);
	return {
		s: s,
		p: p,
		b: b,
		c: c,
		a: a,
		t: (t * 10 ** (json.timeDependencyDecimalOffset || 0)).toFixed(json.timeDependencyDecimalPrecision || 0),
		B: json.beforeCutAngleJudgments?.find((j) => (j.threshold || 0) <= b)?.text || "",
		C: json.accuracyJudgments?.find((j) => (j.threshold || 0) <= c)?.text || "",
		A: json.afterCutAngleJudgments?.find((j) => (j.threshold || 0) <= a)?.text || "",
		T: json.timeDependencyJudgments?.find((j) => (j.threshold || 0) <= t)?.text || "",
		d: "↗",
		n: "\n",
		"%": "%",
	};
}

function saveSetting(key, value) {
	try {
		localStorage.setItem(key, JSON.stringify(value));
	} catch (e) {
		console.error(e);
	}
}

function loadSetting(key, defaultValue) {
	try {
		return JSON.parse(localStorage.getItem(key) || "") || defaultValue;
	} catch (e) {
		console.error(e);
	}
	return defaultValue;
}

// Load from URL
async function fetchConfig(url) {
	try {
		url = new URL(url, location.href);
		// CORS proxy, see netlify.toml
		if (url.hostname === "cdn.discordapp.com") {
			url = new URL("/" + url.hostname + url.pathname + url.search, location.href);
		}
		const response = await fetch(url);
		textInput.value = await response.text();
		fileName.value = decodeURIComponent(url.pathname.replace(/.*\//, ""));
		parseAndRender();
		modified = false;
		return true;
	} catch (e) {
		console.error(e);
		alert(e.message + " " + url);
	}
}
// Tabs
const tabId = loadSetting("tab", noteTab.id);
(document.getElementById(tabId) || noteTab).checked = true;

function getSelectedTab() {
	return previewTabs.querySelector("input:checked").id;
}

for (const tab of previewTabs.getElementsByTagName("input")) tab.oninput = parseAndRender;

// Persist UI state
if (!textInput.value) textInput.value = loadSetting("text", "");
if (!fileName.value) fileName.value = loadSetting("filename", "Default.json");

const params = new URLSearchParams(location.search);
if (params.get("url")) fetchConfig(params.get("url"));
else if (!textInput.value) fetchConfig("configs/Default.json");

const layout = loadSetting("layout", ["", "", ""]);
document.body.className = layout[0];
previewColumn.style.width = layout[1];
editorColumn.style.width = layout[2];

const toggles = loadSetting("toggles", [false, true, true, true]);
const checkboxes = [bloomInput, backgroundInput, helpInput, italicsInput];
checkboxes.forEach((t, i) => (t.checked = toggles[i]));

window.onbeforeunload = () => {
	saveSetting("text", textInput.value);
	saveSetting("filename", fileName.value);
	saveSetting("tab", getSelectedTab());
	saveSetting(
		"toggles",
		checkboxes.map((t) => t.checked)
	);
	saveSetting("layout", [document.body.className, previewColumn.style.width || "", editorColumn.style.width || ""]);
};

// Text input
function parseAndRender() {
	textInput.classList.add("error");
	errorContainer.classList.add("hidden");
	errorMessage.textContent = "";
	let json = null;
	try {
		json = JSON.parse(textInput.value);
	} catch (e) {
		console.warn(e);
		// Show parse error
		errorMessage.textContent = e.message || "";
		errorContainer.classList.remove("hidden");
		try {
			// Remove trailing commas
			json = JSON.parse(textInput.value.replaceAll(/,(\s*[\]\}])/g, "$1"));
		} catch (e) {}
	}
	if (json) {
		render(json);
		textInput.classList.remove("error");
	}
	return json;
}

textInput.oninput = parseAndRender;
parseAndRender();

// Error location
errorMessage.onclick = () => {
	const match = errorMessage.textContent.match(/position (\d+)|line (\d+) column (\d+)/);
	if (!match) return;
	let [position, line, column] = match.slice(1).map((m) => Number(m));
	if (!position) {
		position = textInput.value
			.split("\n")
			.slice(0, line - 1)
			.reduce((t, v) => v.length + 1 + t, column - 1);
	}
	if (position) {
		textInput.setSelectionRange(position, position);
		textInput.focus();
	}
};

// Token inputs
function onTokenInput() {
	const s = Number(bInput.value) + Number(cInput.value) + Number(aInput.value);
	const p = Math.floor(s / 1.15);
	sInput.value = s + "";
	pInput.value = p + "";
	bRangeInput.value = bInput.value;
	cRangeInput.value = cInput.value;
	aRangeInput.value = aInput.value;
	parseAndRender();
}

bInput.oninput = onTokenInput;
cInput.oninput = onTokenInput;
aInput.oninput = onTokenInput;
tInput.oninput = onTokenInput;

function onRangeInput() {
	bInput.value = bRangeInput.value;
	cInput.value = cRangeInput.value;
	aInput.value = aRangeInput.value;
	onTokenInput();
}

bRangeInput.oninput = onRangeInput;
cRangeInput.oninput = onRangeInput;
aRangeInput.oninput = onRangeInput;

// Checkbox inputs
bloomInput.oninput = parseAndRender;
italicsInput.oninput = parseAndRender;

backgroundInput.oninput = () => {
	previewAll.style.background = backgroundInput.checked ? "" : "none";
};
backgroundInput.oninput();

helpInput.oninput = () => {
	help.classList.toggle("hidden", !helpInput.checked);
};
helpInput.oninput();

// Presets
loadInput.onchange = async () => {
	const preset = loadInput.value;
	loadInput.value = "";
	if (preset === "file") {
		fileInput.click();
	} else if (preset === "url") {
		const url = prompt("Enter URL to .json file");
		if (url && (await fetchConfig(url))) {
			history.pushState({}, "", "?url=" + url.replaceAll("&", "%26"));
		}
	} else if (preset) {
		if (modified && !confirm(`Unsaved changes \n\nLoad ${preset}?`)) return;
		fetchConfig("configs/" + preset);
	}
};

// File input
async function setFile(file) {
	const text = await file.text();
	textInput.value = text;
	parseAndRender();
	fileName.value = file.name;
	modified = false;
	hideColorPicker();
}

fileInput.onchange = () => {
	const file = fileInput.files[0];
	if (file) setFile(file);
};

// Drag and drop
document.body.addEventListener("dragover", (e) => {
	if (e.target !== fileInput && e.dataTransfer.types.includes("Files")) {
		e.preventDefault();
	}
});

document.body.addEventListener("drop", (e) => {
	const file = e.dataTransfer.files[0];
	if (file && (file.type === "application/json" || file.type === "text/plain") && e.target !== fileInput) {
		e.preventDefault();
		setFile(file);
	}
});

// Format
formatButton.onclick = function () {
	const json = parseAndRender();
	if (json) {
		const text = JSON.stringify(json, null, 2).replace(colorRegex, (match) =>
			match.replace(/\n\s*/g, "").replaceAll(",", ", ")
		);
		textInput.focus();
		textInput.select();
		// Preserves undo history
		if (!document.execCommand("insertText", false, text)) textInput.value = text;
		parseAndRender();
	}
};

// Download
downloadButton.onclick = function () {
	const a = document.createElement("a");
	const blob = new Blob([textInput.value], { type: "text/plain" });
	const url = URL.createObjectURL(blob);
	a.href = url;
	a.download = fileName.value;
	a.style.display = "none";
	document.body.appendChild(a);
	a.click();
	URL.revokeObjectURL(url);
	document.body.removeChild(a);
};

// Color picker
textInput.addEventListener("click", (e) => {
	const cursor = textInput.selectionDirection === "forward" ? textInput.selectionEnd : textInput.selectionStart;
	const matches = textInput.value.matchAll(colorRegex);
	const match = Array.from(matches).find((m) => cursor > m.index && cursor < m.index + m[0].length);
	if (!match) return hideColorPicker();
	// Cursor in color block, show picker
	const [text, r, g, b, prefix, hex] = match;
	colorInput.value = hex ?? "#" + rgbToHex(r, g, b);
	colorInput.style.left = e.clientX + 50 + "px";
	colorInput.style.top = e.clientY - 10 + "px";
	colorInput.classList.add("active");
	colorInput.oninput = () => {
		// Replace color
		let value = text;
		if (hex) {
			value = (prefix || "") + colorInput.value.toUpperCase();
		} else {
			const rgb = hexToRgb(colorInput.value.substring(1));
			const split = text.split(",");
			for (let i = 0; i < 3; i++) {
				split[i] = split[i].replace(/[\d.]+/, rgb[i].toFixed(3).replace(/(\..+?)0+$/, "$1"));
			}
			value = split.join(",");
		}
		textInput.value = match.input.substring(0, match.index) + value + match.input.substring(match.index + text.length);
		parseAndRender();
		modified = true;
	};
});

function rgbToHex(r, g, b) {
	return [r, g, b]
		.map((v) =>
			Math.round(Number(v) * 255)
				.toString(16)
				.padStart(2, "0")
		)
		.join("");
}

function hexToRgb(hex) {
	hex = parseInt(hex, 16);
	const r = ((hex >> 16) & 255) / 255;
	const g = ((hex >> 8) & 255) / 255;
	const b = (hex & 255) / 255;
	return [r, g, b];
}

function hideColorPicker() {
	colorInput.classList.remove("active");
	colorInput.oninput = null;
}

textInput.addEventListener("input", () => {
	modified = true;
	hideColorPicker();
});

document.body.addEventListener("click", (e) => {
	if (e.target !== textInput && e.target !== colorInput) {
		hideColorPicker();
	}
});

// Layout swap
document.addEventListener("mouseup", () => {
	if (
		(previewColumn.style.width || editorColumn.style.width) &&
		Math.min(previewColumn.clientWidth, editorColumn.clientWidth) <= 100
	) {
		previewColumn.style.width = "";
		editorColumn.style.width = "";
		document.body.classList.toggle("layout2");
	}
});
