const defaultConfig = `{
  "majorVersion": 3,
  "minorVersion": 3,
  "patchVersion": 3,
  "isDefaultConfig": false,
  "displayMode": "format",
  "doIntermediateUpdates": true,
  "judgments": [
    {
      "threshold": 115,
      "text": "<size=110%>%s</size>",
      "color": [1.0, 1.0, 1.0, 1.0],
      "fade": false
    },
    {
      "threshold": 113,
      "text": "<size=110%>%s</size>",
      "color": [0.52, 0.0, 1.0, 1.0],
      "fade": false
    },
    {
      "threshold": 110,
      "text": "<size=110%>%s</size>",
      "color": [0.0, 0.64, 1.0, 1.0],
      "fade": false
    },
    {
      "threshold": 106,
      "text": "<size=110%>%s</size>",
      "color": [0.0, 1.0, 0.0, 1.0],
      "fade": false
    },
    {
      "threshold": 100,
      "text": "<size=110%>%s</size>",
      "color": [1.0, 1.0, 0.0, 1.0],
      "fade": false
    },
    {
      "threshold": 0,
      "text": "<size=110%>%s</size>",
      "color": [1.0, 0.0, 0.22, 1.0],
      "fade": false
    }
  ]
}
`;

const preview = document.getElementById("preview");
const previewAll = document.getElementById("previewAll");
const previewToolbar = document.getElementById("previewToolbar");
const previewColumn = document.getElementById("previewColumn");
const editorColumn = document.getElementById("editorColumn");
const textInput = document.getElementById("textInput");
const fileInput = document.getElementById("fileInput");
const fileName = document.getElementById("filenameInput");
const loadInput = document.getElementById("loadInput");
const errorMessage = document.getElementById("errorMessage");
const download = document.getElementById("download");
const bloomInput = document.getElementById("bloomInput");
const help = document.getElementById("help");
const helpInput = document.getElementById("helpInput");
const backgroundInput = document.getElementById("backgroundInput");
const previewInput = document.getElementById("previewInput");
const sInput = document.getElementById("sInput");
const pInput = document.getElementById("pInput");
const bInput = document.getElementById("bInput");
const cInput = document.getElementById("cInput");
const aInput = document.getElementById("aInput");
const tInput = document.getElementById("tInput");
const bRangeInput = document.getElementById("bRangeInput");
const cRangeInput = document.getElementById("cRangeInput");
const aRangeInput = document.getElementById("aRangeInput");
const colorInput = document.getElementById("colorInput");
const colorRegex = /"color"\s*:\s*\[\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*[\d.]+\s*\]|color=(#[\dA-F]{6})/gi;
let modified = false;

function render(json) {
	const displayMode = json.displayMode || (json.majorVersion ? "default" : "format");
	const tokens = getTokens(json);
	preview.innerHTML = "";
	previewAll.innerHTML = "";
	// Render single score
	let index = json.judgments.findIndex((j) => (j.threshold || 0) <= tokens.s);
	if (index < 0) index = json.judgments.length - 1;
	const judgment = Object.assign({}, json.judgments[index]);
	if (judgment.fade && index > 0) {
		const previous = json.judgments[index - 1];
		const ratio = (tokens.s - (judgment.threshold || 0)) / (previous.threshold - (judgment.threshold || 0));
		judgment.color = judgment.color.map((v, i) => v * (1 - ratio) + previous.color[i] * ratio);
	}
	preview.appendChild(renderScore(displayMode, judgment, tokens));
	// Render all threshold scores
	for (const judgment of json.judgments) {
		tokens.s = judgment.threshold || 0;
		tokens.p = Math.floor(tokens.s / 1.15);
		previewAll.appendChild(renderScore(displayMode, judgment, tokens));
	}
}

function renderScore(displayMode, judgment, tokens) {
	const text = judgment.text || "";
	const score = document.createElement("p");
	score.className = "score";
	switch (displayMode) {
		case "format":
			score.innerHTML = rich(format(text, tokens));
			break;
		case "numeric":
			score.textContent = tokens.s;
			break;
		case "textOnly":
			score.innerHTML = rich(text);
			break;
		case "scoreOnTop":
			score.appendChild(document.createElement("span")).textContent = tokens.s;
			score.appendChild(document.createElement("br"));
			score.appendChild(document.createElement("span")).innerHTML = rich(text);
			break;
		default:
			score.appendChild(document.createElement("span")).innerHTML = rich(text);
			score.appendChild(document.createElement("br"));
			score.appendChild(document.createElement("span")).textContent = tokens.s;
			break;
	}
	const color = judgment.color || [0, 0, 0, 0];
	score.style.color = `rgb(${color
		.slice(0, 3)
		.map((c) => c * 255)
		.join(",")})`;
	if (bloomInput.checked) {
		const bloom = score.cloneNode(true);
		bloom.className = "bloom";
		bloom.style.filter = `blur(7px) opacity(${color[3]})`;
		score.appendChild(bloom);
	}
	return score;
}

function rich(text) {
	text = text.replaceAll("<", "&lt;");
	text = text.replaceAll(/&lt;size=([^>]+)>/g, '<span style="font-size: $1">');
	text = text.replaceAll(/&lt;\/size[^>]*>/g, "</span>");
	text = text.replaceAll(/&lt;color=([^>]+)>/g, '<span style="color: $1">');
	text = text.replaceAll(/&lt;\/color[^>]*>/g, "</span>");
	text = text.replaceAll("\n", "<br>");
	return text;
}

function format(text, tokens) {
	for (const token in tokens) {
		text = text.replaceAll("%" + token, tokens[token]);
	}
	return text;
}

function getTokens(json) {
	const b = Number(bInput.value);
	const c = Number(cInput.value);
	const a = Number(aInput.value);
	const t = Number(tInput.value);
	const s = Number(sInput.value);
	const p = Number(pInput.value);
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
		n: "\n",
		"%": "%",
	};
}

function save(key, value) {
	try {
		localStorage.setItem(key, JSON.stringify(value));
	} catch (e) {
		console.error(e);
	}
}

function load(key, defaultValue) {
	try {
		return JSON.parse(localStorage.getItem(key) || "") || defaultValue;
	} catch (e) {
		console.error(e);
	}
	return defaultValue;
}

// Persist UI state
if (!textInput.value) textInput.value = load("text", defaultConfig);
if (!fileName.value) fileName.value = load("filename", "default.json");

const layout = load("layout", ["", "", ""]);
document.body.className = layout[0];
previewColumn.style.width = layout[1];
editorColumn.style.width = layout[2];

const toggles = load("toggles", [false, true, true, true]);
const checkboxes = [bloomInput, backgroundInput, previewInput, helpInput];
checkboxes.forEach((t, i) => (t.checked = toggles[i]));

window.onbeforeunload = () => {
	save("text", textInput.value);
	save("filename", fileName.value);
	save(
		"toggles",
		checkboxes.map((t) => t.checked)
	);
	save("layout", [document.body.className, previewColumn.style.width || "", editorColumn.style.width || ""]);
};

// Text input
textInput.oninput = () => {
	textInput.classList.add("error");
	errorMessage.textContent = "";
	let json = null;
	try {
		json = JSON.parse(textInput.value);
	} catch (e) {
		try {
			// Remove trailing commas
			json = JSON.parse(textInput.value.replaceAll(/,(\s*[\]\}])/g, "$1"));
		} catch (e) {
			// Show parse error
			console.warn(e);
			let message = e.message || "";
			const match = message.match(/position ([\d]+)$/);
			if (match && match[1]) {
				const line = textInput.value.substring(0, match[1]).split("\n").length;
				message += ` (line ${line})`;
			}
			errorMessage.textContent = message;
		}
	}
	if (json && json.judgments) {
		render(json);
		textInput.classList.remove("error");
	}
};
textInput.oninput();

// Token inputs
function onTokenInput() {
	const s = Number(bInput.value) + Number(cInput.value) + Number(aInput.value);
	const p = Math.floor(s / 1.15);
	sInput.value = s + "";
	pInput.value = p + "";
	bRangeInput.value = bInput.value;
	cRangeInput.value = cInput.value;
	aRangeInput.value = aInput.value;
	textInput.oninput();
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
previewInput.oninput = () => {
	preview.style.display = previewInput.checked ? "" : "none";
	previewToolbar.style.display = previewInput.checked ? "" : "none";
};
previewInput.oninput();

bloomInput.oninput = textInput.oninput;

backgroundInput.oninput = () => {
	previewAll.style.background = backgroundInput.checked ? "" : "none";
};
backgroundInput.oninput();

helpInput.oninput = () => {
	help.style.display = helpInput.checked ? "" : "none";
};
helpInput.oninput();

// Presets
loadInput.onchange = async () => {
	const value = loadInput.value;
	loadInput.value = "";
	if (value === "file") {
		fileInput.click();
	} else if (value) {
		if (modified && !confirm(`Unsaved changes \n\nLoad ${value}?`)) return;
		const response = await fetch("configs/" + value);
		textInput.value = await response.text();
		fileName.value = value;
		textInput.oninput();
		modified = false;
	}
};

// File input
async function setFile(file) {
	const text = await file.text();
	textInput.value = text;
	textInput.oninput();
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
	if (e.target !== fileInput && e.target !== textInput) {
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

// Download
download.onclick = function () {
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
	for (const match of matches) {
		if (cursor > match.index && cursor < match.index + match[0].length) {
			// Cursor in color block, show picker
			if (match[4]) {
				colorInput.value = match[4];
			} else {
				colorInput.value =
					"#" +
					[match[1], match[2], match[3]]
						.map((value) => {
							value = Math.round(Number(value) * 255).toString(16);
							return value.length < 2 ? "0" + value : value;
						})
						.join("");
			}
			colorInput.style.left = e.clientX + 50 + "px";
			colorInput.style.top = e.clientY - 10 + "px";
			colorInput.classList.add("active");
			colorInput.oninput = () => {
				// Replace color
				let value = match[0];
				if (match[4]) {
					value = "color=" + colorInput.value.toUpperCase();
				} else {
					const hex = parseInt(colorInput.value.substring(1), 16);
					const r = (((hex >> 16) & 255) / 255).toFixed(3).replace(/(\..+?)0+$/, "$1");
					const g = (((hex >> 8) & 255) / 255).toFixed(3).replace(/(\..+?)0+$/, "$1");
					const b = ((hex & 255) / 255).toFixed(3).replace(/(\..+?)0+$/, "$1");
					const split = match[0].split(",");
					split[0] = split[0].replace(/[\d.]+/, r);
					split[1] = split[1].replace(/[\d.]+/, g);
					split[2] = split[2].replace(/[\d.]+/, b);
					value = split.join(",");
				}
				textInput.value =
					match.input.substring(0, match.index) + value + match.input.substring(match.index + match[0].length);
				textInput.oninput();
				modified = true;
			};
			return;
		}
	}
	hideColorPicker();
});

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
