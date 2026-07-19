import {
  appState,
  setActiveTab,
  setEvents,
  setMobileNavOpen,
  setSelectedId
} from "./state.js";
import {
  patchEventDocument,
  removeEventDocument,
  saveEventDocument,
  subscribeToEvents
} from "./firebase.js";

const KV_TICKET_FORM_URL = "https://form.jotform.com/251081662723050";
const MARIO_TICKET_URL = "https://www.kaufmuseum.de/tickets";

const tabButtons = Array.from(document.querySelectorAll("[data-tab]"));
const panels = {
  home: document.getElementById("panel-home"),
  kv: document.getElementById("panel-kv"),
  mario: document.getElementById("panel-mario")
};
const mobileNav = document.getElementById("mobileNav");
const mobileToggle = document.querySelector(".mobile-menu-toggle");
const headerAlertButton = document.getElementById("headerAlertButton");
const workspace = document.querySelector(".workspace");
const workspaceSide = document.querySelector(".workspace-side");
const listTargets = {
  home: {
    kv: document.getElementById("home-kv-list"),
    mario: document.getElementById("home-mario-list")
  },
  kv: document.getElementById("kv-list"),
  mario: document.getElementById("mario-list")
};
const countTargets = {
  homeKv: document.getElementById("home-kv-count"),
  homeMario: document.getElementById("home-mario-count"),
  kv: document.getElementById("kv-count"),
  mario: document.getElementById("mario-count")
};
const inspectorStage = document.getElementById("inspector-stage");
const createKvButton = document.getElementById("create-kv-button");
const createMarioButton = document.getElementById("create-mario-button");
const toastHost = document.getElementById("toastHost");
const confirmElements = {
  modal: document.getElementById("confirmModal"),
  message: document.getElementById("confirmMessage"),
  cancel: document.getElementById("confirmCancelButton"),
  deleteSingle: document.getElementById("confirmDeleteSingleButton"),
  confirm: document.getElementById("confirmDeleteButton")
};

const editorElements = {
  modal: document.getElementById("editorModal"),
  eyebrow: document.getElementById("editorEyebrow"),
  heading: document.getElementById("editorHeading"),
  stepNav: document.getElementById("editorStepNav"),
  stepCopy: document.getElementById("editorStepCopy"),
  stepPanels: Array.from(document.querySelectorAll(".editor-step-panel")),
  imgPreview: document.getElementById("editorImgPreview"),
  close: document.getElementById("editorCloseButton"),
  cancel: document.getElementById("editorCancelButton"),
  prev: document.getElementById("editorPrevButton"),
  next: document.getElementById("editorNextButton"),
  save: document.getElementById("editorSaveButton"),
  form: document.getElementById("editorForm"),
  preview: document.getElementById("editorPreviewStage"),
  crossPublishField: document.getElementById("editorCrossPublishField"),
  crossPublishLabel: document.getElementById("editorCrossPublishLabel"),
  typeSpecific: Array.from(document.querySelectorAll("[data-editor-only]")),
  fields: {
    titel: document.getElementById("editor-fTitel"),
    untertitel: document.getElementById("editor-fUntertitel"),
    beschreibung: document.getElementById("editor-fBeschreibung"),
    datum: document.getElementById("editor-fDatum"),
    ort: document.getElementById("editor-fOrt"),
    einlass: document.getElementById("editor-fEinlass"),
    beginn: document.getElementById("editor-fBeginn"),
    preis: document.getElementById("editor-fPreis"),
    telefon: document.getElementById("editor-fTelefon"),
    buttonLabel: document.getElementById("editor-fButtonLabel"),
    link: document.getElementById("editor-fLink"),
    linkPreset: document.getElementById("editor-fLinkPreset"),
    linkHint: document.getElementById("editorLinkHint"),
    bildFile: document.getElementById("editor-fBildFile"),
    bild: document.getElementById("editor-fBild"),
    aktiv: document.getElementById("editor-fAktiv"),
    ticketFormDone: document.getElementById("editor-fTicketDone"),
    crossPublish: document.getElementById("editor-fCrossPublish")
  }
};

const editorState = {
  open: false,
  type: "kv",
  mode: "create",
  eventId: null,
  saving: false,
  stepIndex: 0
};

const confirmState = {
  open: false,
  type: null,
  eventId: null,
  loading: false,
  loadingMode: null,
  linkedType: null,
  linkedId: null
};

const reminderState = {
  kvSignature: "",
  kvExpiredSignature: ""
};

const publishState = {
  type: null,
  eventId: null,
  loading: false,
  action: null
};

const editorPublishState = {
  targetType: null,
  targetId: null
};

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getTypeLabel(type) {
  return type === "mario" ? "Mario Marschall" : "Kulturverein";
}

function getOtherType(type) {
  return type === "mario" ? "kv" : "mario";
}

function getEmptyDraft(type) {
  return {
    titel: "",
    untertitel: "",
    beschreibung: "",
    datum: "",
    ort: "",
    einlass: "",
    beginn: "",
    preis: "",
    telefon: "",
    buttonLabel: type === "mario" ? "Mehr erfahren" : "",
    link: "",
    bild: "",
    aktiv: true,
    ticketFormDone: false,
    ticketFormRemoved: false,
    archived: false
  };
}

function getEventById(type, eventId) {
  if (!eventId) return null;
  return appState.events[type].find((eventItem) => eventItem.id === eventId) || null;
}

function getCrossPlatformTargetId(type, eventItem) {
  const targetType = getOtherType(type);
  return eventItem?.crossPlatform?.[targetType] || null;
}

function getCrossPlatformTarget(type, eventItem) {
  const targetType = getOtherType(type);
  const targetId = getCrossPlatformTargetId(type, eventItem);
  return {
    type: targetType,
    id: targetId,
    event: getEventById(targetType, targetId)
  };
}

function mapEventToDraft(type, eventItem) {
  return {
    titel: eventItem.titel || "",
    untertitel: eventItem.untertitel || "",
    beschreibung: eventItem.beschreibung || "",
    datum: eventItem.datum || "",
    ort: eventItem.ort || "",
    einlass: eventItem.einlass || "",
    beginn: eventItem.beginn || "",
    preis: eventItem.preis || "",
    telefon: eventItem.telefon || "",
    buttonLabel: eventItem.buttonLabel || (type === "mario" ? "Mehr erfahren" : ""),
    link: eventItem.link || "",
    bild: eventItem.bild || "",
    aktiv: eventItem.aktiv !== false,
    ticketFormDone: !!eventItem.ticketFormDone,
    ticketFormRemoved: !!eventItem.ticketFormRemoved,
    archived: !!eventItem.archived
  };
}

function formatDate(dateString) {
  if (!dateString) return "Kein Datum";
  const parsed = new Date(dateString + "T12:00:00");
  if (Number.isNaN(parsed.getTime())) return dateString;
  return parsed.toLocaleDateString("de-DE", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric"
  });
}

function getTodayDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getDateParts(dateString) {
  if (!dateString) {
    return {
      weekday: "Termin",
      display: "Datum folgt"
    };
  }

  const parsed = new Date(dateString + "T12:00:00");
  if (Number.isNaN(parsed.getTime())) {
    return {
      weekday: "Termin",
      display: dateString
    };
  }

  return {
    weekday: parsed.toLocaleDateString("de-DE", { weekday: "long" }).toUpperCase(),
    display: parsed.toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "long",
      year: "numeric"
    })
  };
}

function buildEventDateTime(dateString, timeString = "") {
  if (!dateString) return "";
  const timePart = timeString || "19:00";
  return `${dateString}T${timePart}:00`;
}

function isEventArchived(eventItem) {
  return !!eventItem?.archived;
}

function isEventExpired(eventItem) {
  return !!eventItem?.datum && eventItem.datum < getTodayDateString();
}

function needsExpiredKvCleanup(eventItem) {
  return !!eventItem
    && !isEventArchived(eventItem)
    && isEventExpired(eventItem)
    && !!eventItem.ticketFormDone
    && !eventItem.ticketFormRemoved;
}

function canResolveExpiredKvEvent(eventItem) {
  return !!eventItem
    && !isEventArchived(eventItem)
    && isEventExpired(eventItem)
    && (!eventItem.ticketFormDone || !!eventItem.ticketFormRemoved);
}

function getVisibleEvents(type) {
  return appState.events[type].filter((eventItem) => !isEventArchived(eventItem));
}

function getHomeEvents(type) {
  return getVisibleEvents(type)
    .filter((eventItem) => eventItem.aktiv && !isEventExpired(eventItem))
    .slice(0, 3);
}

function getStatus(eventItem) {
  if (isEventArchived(eventItem)) {
    return { label: "Archiviert", className: "archived" };
  }

  if (!eventItem.aktiv) {
    return { label: "Inaktiv", className: "off" };
  }

  if (isEventExpired(eventItem)) {
    return { label: "Abgelaufen", className: "expired" };
  }

  if (!eventItem.datum) {
    return { label: "Aktiv", className: "live" };
  }

  const now = Date.now();
  const eventTime = new Date(eventItem.datum + "T12:00:00").getTime();
  if (!Number.isNaN(eventTime) && eventTime > now && eventTime - now < 7 * 24 * 60 * 60 * 1000) {
    return { label: "Bald", className: "soon" };
  }

  return { label: "Aktiv", className: "live" };
}

function getPlaceholder(type) {
  return type === "mario" ? "MM" : "KV";
}

function showToast(title, message = "", kind = "") {
  if (!toastHost) return;

  const safeTitle = escapeHtml(title);
  const safeMessage = escapeHtml(message);
  toastHost.innerHTML = `
    <div class="toast-card${kind === "error" ? " is-error" : ""}">
      <div class="toast-copy">
        <strong>${safeTitle}</strong>
        ${safeMessage ? `<p>${safeMessage}</p>` : ""}
      </div>
      <button class="icon-button" type="button" data-action="close-toast" aria-label="Hinweis schließen">x</button>
    </div>
  `;
}

function closeToast() {
  if (toastHost) toastHost.innerHTML = "";
}

function getDeleteMessage(type, eventItem) {
  const title = eventItem?.titel || "Dieser Eintrag";
  return `${getTypeLabel(type)}: "${title}" wird dauerhaft aus Firestore entfernt. Diese Aktion kann nicht rückgängig gemacht werden.`;
}

function getLinkedDeleteMessage(type, eventItem, linkedType) {
  const title = eventItem?.titel || "Dieser Eintrag";
  return `${getTypeLabel(type)}: "${title}" ist mit ${getTypeLabel(linkedType)} verknüpft. Du kannst nur diesen Eintrag löschen und die Verknüpfung aufheben oder beide verknüpften Einträge zusammen entfernen.`;
}

function getPendingKvEvents() {
  return getVisibleEvents("kv").filter(
    (eventItem) => eventItem.aktiv && !isEventExpired(eventItem) && !eventItem.ticketFormDone
  );
}

function getExpiredKvEventsNeedingCleanup() {
  return getVisibleEvents("kv").filter((eventItem) => needsExpiredKvCleanup(eventItem));
}

function getFirstKvEventNeedingReview() {
  return getExpiredKvEventsNeedingCleanup()[0] || getPendingKvEvents()[0] || null;
}

function renderHeaderAlert() {
  if (!headerAlertButton) return;
  headerAlertButton.hidden = !getFirstKvEventNeedingReview();
}

function getCrossPlatformButtonLabel(type, eventItem) {
  const targetType = getOtherType(type);
  const targetLabel = targetType === "mario" ? "Mario" : "Kulturverein";
  return getCrossPlatformTargetId(type, eventItem)
    ? `${targetLabel} aktualisieren`
    : `Zu ${targetLabel} übernehmen`;
}

function getJumpToLinkedLabel(type) {
  const targetType = getOtherType(type);
  return targetType === "mario" ? "Zu Mario springen" : "Zum Kulturverein springen";
}

function getUnlinkLabel(type) {
  const targetType = getOtherType(type);
  return targetType === "mario" ? "Mario-Verknüpfung lösen" : "KV-Verknüpfung lösen";
}

function getEditorCrossPublishLabel(type, hasLinkedTarget) {
  const targetType = getOtherType(type);
  const targetLabel = targetType === "mario" ? "Mario" : "Kulturverein";
  return hasLinkedTarget
    ? `Verknüpften ${targetLabel}-Eintrag mitaktualisieren`
    : `Zusätzlich auf ${targetLabel} anlegen`;
}

function getEditorSteps(type) {
  if (type === "kv") {
    return [
      { label: "Bild",          copy: "Veranstaltungsbild vom Gerät hochladen." },
      { label: "Inhalt",        copy: "Titel, Untertitel und Beschreibung." },
      { label: "Termin",        copy: "Datum, Ort, Zeiten und Preise." },
      { label: "Einstellungen", copy: "Sichtbarkeit, Ticketformular und Ausgabe." }
    ];
  }
  return [
    { label: "Inhalt",      copy: "Titel und Beschreibung." },
    { label: "Termin",      copy: "Datum und Ort." },
    { label: "Link & Ausgabe", copy: "Bild, Button und Ziel-Link." }
  ];
}

function clampEditorStep(index) {
  const maxIndex = getEditorSteps(editorState.type).length - 1;
  return Math.max(0, Math.min(index, maxIndex));
}

function getEditorStepValidationMessage(type, stepIndex, draft) {
  if (type === "kv") {
    if (stepIndex === 1 && !draft.titel) return "Bitte zuerst einen Titel eintragen.";
    if (stepIndex === 2 && !draft.datum) return "Bitte zuerst ein Datum auswählen.";
    if (stepIndex === 3) return validateDraft(type, draft);
  } else {
    if (stepIndex === 0 && !draft.titel) return "Bitte zuerst einen Titel eintragen.";
    if (stepIndex === 1 && !draft.datum) return "Bitte zuerst ein Datum auswählen.";
    if (stepIndex === 2) return validateDraft(type, draft);
  }

  return "";
}

function setEditorStep(nextStepIndex, options = {}) {
  const draft = readEditorDraft();
  const targetIndex = clampEditorStep(nextStepIndex);

  if (targetIndex > editorState.stepIndex && !options.skipValidation) {
    const validationMessage = getEditorStepValidationMessage(editorState.type, editorState.stepIndex, draft);
    if (validationMessage) {
      showToast("Schritt noch nicht fertig", validationMessage, "error");
      return false;
    }
  }

  editorState.stepIndex = targetIndex;
  renderEditor();
  return true;
}

function updateEditorPreviewAndMaybeRender() {
  if (!editorState.open) return;
  renderEditorPreview();
}

function setEditorFieldValue(fieldId, value) {
  const field = document.getElementById(fieldId);
  if (!field) return;
  field.value = value;
  updateEditorPreviewAndMaybeRender();
}

function setEditorTimePreset(einlass, beginn) {
  if (editorElements.fields.einlass) editorElements.fields.einlass.value = einlass;
  if (editorElements.fields.beginn) editorElements.fields.beginn.value = beginn;
  updateEditorPreviewAndMaybeRender();
}

function detectMarioLinkPresetFromValues() {
  const label = (editorElements.fields.buttonLabel?.value || "").trim();
  const link = (editorElements.fields.link?.value || "").trim();

  if (link === MARIO_TICKET_URL && label === "Ticket reservieren") return "ticket";
  if (!label || label === "Mehr erfahren") return "more";
  return "custom";
}

function syncMarioPresetUi() {
  const preset = editorElements.fields.linkPreset?.value || detectMarioLinkPresetFromValues();
  if (editorElements.fields.linkPreset) editorElements.fields.linkPreset.value = preset;

  ["ticket", "more", "custom"].forEach((key) => {
    document.getElementById(`editor-preset-${key}`)?.classList.toggle("active", key === preset);
  });

  if (!editorElements.fields.buttonLabel || !editorElements.fields.link || !editorElements.fields.linkHint) return;

  if (preset === "ticket") {
    editorElements.fields.buttonLabel.disabled = true;
    editorElements.fields.link.disabled = true;
    editorElements.fields.linkHint.textContent = "Der Reservierungslink ist automatisch hinterlegt.";
    return;
  }

  if (preset === "more") {
    editorElements.fields.buttonLabel.disabled = true;
    editorElements.fields.link.disabled = false;
    editorElements.fields.linkHint.textContent = "Die Bezeichnung ist fest, den Ziel-Link kannst du frei setzen.";
    return;
  }

  editorElements.fields.buttonLabel.disabled = false;
  editorElements.fields.link.disabled = false;
  editorElements.fields.linkHint.textContent = "Hier kannst du Link und Button-Text frei festlegen.";
}

function selectMarioLinkPreset(preset, preserveValues = false) {
  if (!editorElements.fields.linkPreset || !editorElements.fields.buttonLabel || !editorElements.fields.link) return;

  const previousPreset = editorElements.fields.linkPreset.value || "more";
  editorElements.fields.linkPreset.value = preset;

  if (preset === "ticket") {
    if (!preserveValues || !editorElements.fields.buttonLabel.value) {
      editorElements.fields.buttonLabel.value = "Ticket reservieren";
    }
    if (!preserveValues || !editorElements.fields.link.value) {
      editorElements.fields.link.value = MARIO_TICKET_URL;
    }
  } else if (preset === "more") {
    if (!preserveValues && previousPreset === "ticket" && editorElements.fields.link.value === MARIO_TICKET_URL) {
      editorElements.fields.link.value = "";
    }
    if (!editorElements.fields.buttonLabel.value || !preserveValues) {
      editorElements.fields.buttonLabel.value = "Mehr erfahren";
    }
  } else {
    if (!preserveValues && previousPreset === "ticket" && editorElements.fields.link.value === MARIO_TICKET_URL) {
      editorElements.fields.link.value = "";
    }
    if (!preserveValues) {
      if (editorElements.fields.buttonLabel.value === "Mehr erfahren" || editorElements.fields.buttonLabel.value === "Ticket reservieren") {
        editorElements.fields.buttonLabel.value = "";
      }
    }
  }

  syncMarioPresetUi();
  updateEditorPreviewAndMaybeRender();
}

function buildPreviewMedia(type, eventItem) {
  if (eventItem?.bild) {
    return `<img src="${escapeHtml(eventItem.bild)}" alt="${escapeHtml(eventItem.titel || "Eventbild")}">`;
  }

  return `
    <div class="preview-media-placeholder${type === "mario" ? " is-mario" : " is-kv"}">
      <span>${type === "mario" ? "Mario Marschall" : "Kulturverein"}</span>
    </div>
  `;
}

function buildCrossPlatformPayload(sourceType, targetType, sourceData, existingTarget = null) {
  const base = {
    titel: sourceData.titel || "",
    datum: sourceData.datum || "",
    aktiv: sourceData.aktiv !== false,
    bild: sourceData.bild || "",
    beschreibung: sourceData.beschreibung || "",
    ort: sourceData.ort || "",
    archived: sourceType === targetType ? !!sourceData.archived : !!existingTarget?.archived
  };

  if (targetType === "kv") {
    const kvData = {
      ...base,
      untertitel: sourceType === "kv" ? (sourceData.untertitel || "") : (existingTarget?.untertitel || ""),
      einlass: sourceType === "kv" ? (sourceData.einlass || "") : (existingTarget?.einlass || ""),
      beginn: sourceType === "kv" ? (sourceData.beginn || "") : (existingTarget?.beginn || ""),
      preis: sourceType === "kv" ? (sourceData.preis || "") : (existingTarget?.preis || ""),
      telefon: sourceType === "kv" ? (sourceData.telefon || "") : (existingTarget?.telefon || ""),
      ticketFormDone: sourceType === "kv" ? !!sourceData.ticketFormDone : !!existingTarget?.ticketFormDone,
      ticketFormRemoved: sourceType === "kv" ? !!sourceData.ticketFormRemoved : !!existingTarget?.ticketFormRemoved,
      buttonLabel: "",
      link: ""
    };

    return {
      ...kvData,
      agentText: buildAgentText("kv", kvData),
      schemaData: buildSchemaData("kv", kvData)
    };
  }

  const marioData = {
    ...base,
    untertitel: "",
    einlass: "",
    beginn: "",
    preis: "",
    telefon: "",
    ticketFormDone: false,
    ticketFormRemoved: false,
    buttonLabel: sourceType === "mario" ? (sourceData.buttonLabel || "") : (existingTarget?.buttonLabel || ""),
    link: sourceType === "mario" ? (sourceData.link || "") : (existingTarget?.link || "")
  };

  return {
    ...marioData,
    agentText: buildAgentText("mario", marioData),
    schemaData: buildSchemaData("mario", marioData)
  };
}

function buildAgentText(type, data) {
  const lines = [
    data.titel || "",
    type === "kv" && data.untertitel ? data.untertitel : "",
    data.beschreibung || "",
    data.datum ? `Datum: ${formatDate(data.datum)}` : "",
    type === "kv" && data.einlass ? `Einlass: ${data.einlass} Uhr` : "",
    type === "kv" && data.beginn ? `Beginn: ${data.beginn} Uhr` : "",
    data.ort ? `Ort: ${data.ort}` : "",
    type === "kv" && data.preis ? `Eintritt: ${data.preis}` : "",
    type === "kv" && data.telefon ? `Telefon: ${data.telefon}` : "",
    type === "mario" && data.link ? `Link: ${data.link}` : "",
    type === "mario" && data.buttonLabel ? `Button: ${data.buttonLabel}` : "",
    type === "kv" ? `Ticketformular erledigt: ${data.ticketFormDone ? "ja" : "nein"}` : "",
    type === "kv" ? `Ticketformular entfernt: ${data.ticketFormRemoved ? "ja" : "nein"}` : "",
    `Archiviert: ${data.archived ? "ja" : "nein"}`
  ];

  return lines.filter(Boolean).join("\n");
}

function buildSchemaData(type, data) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: data.titel || "",
    description: [data.untertitel, data.beschreibung].filter(Boolean).join("\n\n"),
    startDate: buildEventDateTime(data.datum, type === "kv" ? data.beginn : ""),
    organizer: {
      "@type": "Organization",
      name: type === "mario" ? "Mario Marschall" : "Kulturverein Weißensee"
    }
  };

  if (data.ort) {
    schema.location = {
      "@type": "Place",
      name: data.ort,
      address: data.ort
    };
  }

  if (data.bild) {
    schema.image = [data.bild];
  }

  if (type === "kv") {
    schema.offers = {
      "@type": "Offer",
      url: KV_TICKET_FORM_URL,
      availability: "https://schema.org/InStock"
    };
  } else if (data.link) {
    schema.url = data.link;
  }

  return schema;
}

function buildSavePayload(type, draft) {
  const base = {
    titel: draft.titel,
    datum: draft.datum,
    aktiv: !!draft.aktiv,
    bild: draft.bild || "",
    beschreibung: draft.beschreibung || "",
    ort: draft.ort || "",
    archived: !!draft.archived
  };

  if (type === "kv") {
    const kvData = {
      ...base,
      untertitel: draft.untertitel || "",
      einlass: draft.einlass || "",
      beginn: draft.beginn || "",
      preis: draft.preis || "",
      telefon: draft.telefon || "",
      ticketFormDone: !!draft.ticketFormDone,
      ticketFormRemoved: !!draft.ticketFormRemoved,
      link: "",
      buttonLabel: ""
    };

    return {
      ...kvData,
      agentText: buildAgentText(type, kvData),
      schemaData: buildSchemaData(type, kvData)
    };
  }

  const marioData = {
    ...base,
    untertitel: "",
    einlass: "",
    beginn: "",
    preis: "",
    telefon: "",
    ticketFormDone: false,
    ticketFormRemoved: false,
    buttonLabel: draft.buttonLabel || "",
    link: draft.link || ""
  };

  return {
    ...marioData,
    agentText: buildAgentText(type, marioData),
    schemaData: buildSchemaData(type, marioData)
  };
}

function buildPreviewPoster(type, eventItem, options = {}) {
  const isEmpty = !eventItem || !Object.values(eventItem).some(Boolean);
  if (isEmpty) {
    return `
      <div class="preview-empty${options.light ? " is-light" : ""}">
        <h4>${escapeHtml(options.emptyTitle || "Noch keine Vorschau")}</h4>
        <p>${escapeHtml(options.emptyText || "Sobald Inhalt eingetragen ist, erscheint hier die Vorschau.")}</p>
      </div>
    `;
  }

  const status = getStatus(eventItem);
  const linkedTarget = type ? getCrossPlatformTarget(type, eventItem) : null;
  const reminder = type === "kv" && eventItem.aktiv && !eventItem.ticketFormDone
    ? `<span class="ticket-warning" title="Ticketformular noch offen">!</span>`
    : "";
  const image = buildPreviewMedia(type, eventItem);
  const dateParts = getDateParts(eventItem.datum);
  const linkedStatus = type === "kv"
    ? (getCrossPlatformTargetId(type, eventItem) ? "Mit Mario verbunden" : "Noch nicht mit Mario verbunden")
    : (getCrossPlatformTargetId(type, eventItem) ? "Mit Kulturverein verbunden" : "Noch nicht mit Kulturverein verbunden");

  const operationsMeta = options.light ? "" : (type === "kv"
    ? `
      <div class="preview-ops-grid">
        <div class="preview-ops-item">
          <strong>Status</strong>
          <span>${escapeHtml(status.label)} ${reminder}</span>
        </div>
        <div class="preview-ops-item">
          <strong>Ticketformular</strong>
          <span>${eventItem.ticketFormDone ? "Erledigt" : "Noch offen"}</span>
        </div>
        <div class="preview-ops-item">
          <strong>Verknüpfung</strong>
          <span>${linkedStatus}</span>
        </div>
        ${linkedTarget?.event ? `
        <div class="preview-ops-item">
          <strong>Ziel-Eintrag</strong>
          <span>${escapeHtml(linkedTarget.event.titel || "(Ohne Titel)")}</span>
        </div>` : ""}
      </div>
    `
    : `
      <div class="preview-ops-grid">
        <div class="preview-ops-item">
          <strong>Status</strong>
          <span>${escapeHtml(status.label)}</span>
        </div>
        ${eventItem.link ? `
        <div class="preview-ops-item">
          <strong>Ziel-Link</strong>
          <span>${escapeHtml(eventItem.link)}</span>
        </div>` : ""}
        <div class="preview-ops-item">
          <strong>Verknüpfung</strong>
          <span>${linkedStatus}</span>
        </div>
        ${linkedTarget?.event ? `
        <div class="preview-ops-item">
          <strong>Ziel-Eintrag</strong>
          <span>${escapeHtml(linkedTarget.event.titel || "(Ohne Titel)")}</span>
        </div>` : ""}
      </div>
    `);

  if (type === "kv") {
    let datumStr = "";
    if (eventItem.datum) {
      datumStr = formatDate(eventItem.datum);
      if (eventItem.einlass) datumStr += ` · Einlass: ${eventItem.einlass} Uhr`;
      if (eventItem.beginn) datumStr += `, Beginn: ${eventItem.beginn} Uhr`;
    }

    const imgHtml = eventItem.bild
      ? `<div class="pw-kv-img"><img src="${escapeHtml(eventItem.bild)}" alt="${escapeHtml(eventItem.titel || "Eventbild")}"></div>`
      : `<div class="pw-kv-img"><div class="pw-kv-img-placeholder">&#128444;</div></div>`;

    const actionsBlock = options.actions ? `
      <div class="inspector-actions-toggle kv-inspector-actions-toggle">
        <button class="inspector-gear-btn" type="button" data-action="toggle-inspector-actions" aria-label="Aktionen ein-/ausblenden">&#9881;</button>
        <div class="inspector-actions-panel">
          ${options.actions}
        </div>
      </div>` : "";

    return `
      <div class="preview-poster preview-poster-kv">
        <div class="pw-kv-row">
          ${imgHtml}
          <div class="pw-kv-text">
            <div class="pw-kv-card">
              ${eventItem.titel ? `<h1>${escapeHtml(eventItem.titel)}</h1>` : ""}
              ${eventItem.untertitel ? `<h2>${escapeHtml(eventItem.untertitel)}</h2>` : ""}
              ${eventItem.beschreibung ? `<p>${escapeHtml(eventItem.beschreibung)}</p>` : ""}
              ${datumStr ? `<div class="pw-kv-info"><p><strong>&#128197; Wann?</strong> ${escapeHtml(datumStr)}</p></div>` : ""}
              ${eventItem.ort ? `<div class="pw-kv-info"><p><strong>&#128205; Wo?</strong> ${escapeHtml(eventItem.ort)}</p></div>` : ""}
              ${eventItem.preis ? `<div class="pw-kv-info"><p><strong>&#127903; Eintritt:</strong> ${escapeHtml(eventItem.preis)}</p></div>` : ""}
              ${eventItem.telefon ? `<div class="pw-kv-info"><p><strong>&#9742; Tickets:</strong> ${escapeHtml(eventItem.telefon)}</p></div>` : ""}
              <a class="pw-kv-ticket-btn" href="${KV_TICKET_FORM_URL}" target="_blank" rel="noopener noreferrer">&#127903; Jetzt Ticket reservieren</a>
            </div>
          </div>
        </div>
        ${operationsMeta}
        ${actionsBlock}
      </div>
    `;
  }

  const imgCol = eventItem.bild
    ? `<div class="pw-mario-img-col"><img src="${escapeHtml(eventItem.bild)}" alt="${escapeHtml(eventItem.titel || "Mario Marschall")}"></div>`
    : `<div class="pw-mario-img-col"><div class="pw-mario-img-placeholder">&#127908;</div></div>`;

  const ortHtml = eventItem.ort
    ? `<div class="pw-mario-ort"><span class="pw-mario-ort-icon">&#128205;</span><span>${escapeHtml(eventItem.ort)}</span></div>`
    : `<div style="flex:1"></div>`;

  const btnHtml = eventItem.link
    ? `<a class="pw-mario-btn" href="${escapeHtml(eventItem.link)}" target="_blank" rel="noopener noreferrer">${escapeHtml(eventItem.buttonLabel || "Mehr erfahren")} <span>&#8594;</span></a>`
    : (eventItem.buttonLabel ? `<span class="pw-mario-btn">${escapeHtml(eventItem.buttonLabel)} <span>&#8594;</span></span>` : "");

  const actionsBlock = options.actions ? `
    <div class="inspector-actions-toggle">
      <button class="inspector-gear-btn" type="button" data-action="toggle-inspector-actions" aria-label="Aktionen ein-/ausblenden">&#9881;</button>
      <div class="inspector-actions-panel">
        ${options.actions}
      </div>
    </div>
  ` : "";

  return `
    <div class="preview-poster preview-poster-mario">
      <div class="pw-mario-card">
        ${imgCol}
        <div class="pw-mario-info">
          <div class="pw-mario-meta">
            ${dateParts.weekday !== "Termin" ? `<span class="pw-mario-weekday">${escapeHtml(dateParts.weekday)}</span>` : ""}
            <span class="pw-mario-datum">${escapeHtml(dateParts.display)}</span>
          </div>
          <div class="pw-mario-body">
            ${eventItem.titel ? `<div class="pw-mario-titel">${escapeHtml(eventItem.titel)}</div>` : ""}
            ${eventItem.beschreibung ? `<div class="pw-mario-beschreibung">${escapeHtml(eventItem.beschreibung)}</div>` : ""}
          </div>
          <div class="pw-mario-footer">
            ${ortHtml}
            ${btnHtml}
          </div>
        </div>
      </div>
      ${operationsMeta}
      ${actionsBlock}
    </div>
  `;
}

function buildEventRow(type, eventItem, selected = false) {
  const status = getStatus(eventItem);
  const title = escapeHtml(eventItem.titel || "(Ohne Titel)");
  const linkedTarget = getCrossPlatformTarget(type, eventItem);
  const image = eventItem.bild
    ? `<img src="${escapeHtml(eventItem.bild)}" alt="${title}">`
    : `<div class="placeholder-thumb${type === "mario" ? " warm" : ""}">${getPlaceholder(type)}</div>`;
  const ticketWarning = type === "kv" && eventItem.aktiv && !eventItem.ticketFormDone
    ? `<span class="ticket-warning" title="Ticketformular noch offen">!</span>`
    : "";
  const expiredWarning = type === "kv" && needsExpiredKvCleanup(eventItem)
    ? `<span class="ticket-warning is-danger" title="Abgelaufen: Ticketformular noch nicht entfernt bestätigt">!</span>`
    : "";
  const location = eventItem.ort
    ? `<span class="event-row-location">${escapeHtml(eventItem.ort)}</span>`
    : "";

  return `
    <article class="event-row${selected ? " is-selected" : ""}">
      <div class="event-row-top">
        <button
          class="event-row-main"
          type="button"
          data-action="select-event"
          data-event-type="${type}"
          data-event-id="${eventItem.id}"
        >
          <div class="event-thumb">${image}</div>
          <div class="event-copy">
            <strong>${title}</strong>
            <span>${escapeHtml(formatDate(eventItem.datum))}</span>
            ${location}
            <div class="event-row-meta">
              <span class="event-row-badge ${status.className}">${escapeHtml(status.label)}</span>
              ${ticketWarning}
              ${expiredWarning}
              ${linkedTarget.id ? `<span class="event-link-badge">${linkedTarget.type === "mario" ? "Mit Mario" : "Mit KV"}</span>` : ""}
            </div>
          </div>
        </button>
        <button class="row-gear-button" type="button" data-action="toggle-row-actions" aria-label="Aktionen anzeigen">&#9881;</button>
      </div>
      <div class="row-actions-panel">
        ${type === "kv" ? `
        <button
          class="row-action-button${eventItem.ticketFormDone ? "" : " is-warning"}"
          type="button"
          data-action="toggle-ticket-form"
          data-event-type="${type}"
          data-event-id="${eventItem.id}"
        >
          ${eventItem.ticketFormDone ? "Ticket offen" : "Ticket erledigt"}
        </button>` : ""}
        <button
          class="row-action-button${eventItem.aktiv ? "" : " is-warning"}"
          type="button"
          data-action="toggle-active"
          data-event-type="${type}"
          data-event-id="${eventItem.id}"
        >
          ${eventItem.aktiv ? "Pausieren" : "Fortsetzen"}
        </button>
        <button
          class="row-edit-button"
          type="button"
          data-action="edit-event"
          data-event-type="${type}"
          data-event-id="${eventItem.id}"
        >
          Bearbeiten
        </button>
        <button
          class="row-action-button is-danger"
          type="button"
          data-action="delete-event"
          data-event-type="${type}"
          data-event-id="${eventItem.id}"
        >
          Löschen
        </button>
      </div>
    </article>
  `;
}

function renderEmptyState(target, text) {
  if (!target) return;
  target.innerHTML = `<div class="preview-empty is-light"><h4>Noch nichts da</h4><p>${escapeHtml(text)}</p></div>`;
}

function renderHomeList(type) {
  const target = listTargets.home[type];
  if (!target) return;

  const activeEvents = getHomeEvents(type);
  if (!activeEvents.length) {
    renderEmptyState(target, "Noch keine aktiven Einträge in diesem Bereich.");
    return;
  }

  target.innerHTML = activeEvents
    .map((eventItem) => buildEventRow(type, eventItem, appState.selectedIds[type] === eventItem.id))
    .join("");
}

function renderTypeList(type) {
  const target = listTargets[type];
  if (!target) return;

  const events = getVisibleEvents(type);
  if (!events.length) {
    renderEmptyState(target, "Hier werden die Firestore-Einträge angezeigt, sobald Daten vorhanden sind.");
    return;
  }

  target.innerHTML = events
    .map((eventItem) => buildEventRow(type, eventItem, appState.selectedIds[type] === eventItem.id))
    .join("");
}

function renderCounts() {
  const kvEvents = getVisibleEvents("kv");
  const marioEvents = getVisibleEvents("mario");
  const pendingKvEvents = getPendingKvEvents();
  const expiredKvEvents = getExpiredKvEventsNeedingCleanup();
  const activeKvCount = kvEvents.filter((eventItem) => eventItem.aktiv && !isEventExpired(eventItem)).length;
  const activeMarioCount = marioEvents.filter((eventItem) => eventItem.aktiv && !isEventExpired(eventItem)).length;

  countTargets.homeKv.textContent = pendingKvEvents.length
    ? `${activeKvCount} aktiv / ${pendingKvEvents.length} offen`
    : `${activeKvCount} aktiv`;
  countTargets.homeMario.textContent = `${activeMarioCount} offen`;
  countTargets.kv.textContent = expiredKvEvents.length
    ? `${kvEvents.length} sichtbar / ${expiredKvEvents.length} Ablauf offen`
    : pendingKvEvents.length
      ? `${kvEvents.length} sichtbar / ${pendingKvEvents.length} Ticket offen`
      : `${kvEvents.length} sichtbar`;
  countTargets.mario.textContent = `${marioEvents.length} gesamt`;
}

function getPreferredInspectorType() {
  return appState.activeTab === "home" ? null : appState.activeTab;
}

function getSelectedEventForType(type) {
  if (!type) return null;
  const events = getVisibleEvents(type);
  const selectedId = appState.selectedIds[type];
  return events.find((eventItem) => eventItem.id === selectedId) || events[0] || null;
}

function updateInspectorVisibility() {
  if (!workspace || !workspaceSide) return false;

  const type = getPreferredInspectorType();
  const eventItem = getSelectedEventForType(type);
  const shouldShowInspector = !!type && !!eventItem;

  workspaceSide.hidden = !shouldShowInspector;
  workspace.classList.toggle("is-single-column", !shouldShowInspector);

  return shouldShowInspector;
}

function buildExpiredKvWorkflow(eventItem) {
  if (needsExpiredKvCleanup(eventItem)) {
    return `
      <div class="preview-workflow preview-workflow-danger">
        <strong>Ablauf-Alarm</strong>
        <p>Diese Vereins-Veranstaltung ist abgelaufen. Bitte zuerst bestätigen, dass das Ticketformular wieder entfernt wurde.</p>
        <div class="preview-workflow-actions">
          <button
            class="primary-button"
            type="button"
            data-action="confirm-ticket-removed"
            data-event-type="kv"
            data-event-id="${eventItem.id}"
          >
            Ticketformular entfernt bestätigen
          </button>
          <button
            class="secondary-button"
            type="button"
            data-action="edit-event"
            data-event-type="kv"
            data-event-id="${eventItem.id}"
          >
            Eintrag prüfen
          </button>
        </div>
      </div>
    `;
  }

  if (canResolveExpiredKvEvent(eventItem)) {
    return `
      <div class="preview-workflow preview-workflow-ready">
        <strong>Abgelaufene Karte abschließen</strong>
        <p>Das Ticketformular ist erledigt. Jetzt kannst du entscheiden, ob die Karte archiviert oder dauerhaft gelöscht werden soll.</p>
        <div class="preview-workflow-actions">
          <button
            class="secondary-button"
            type="button"
            data-action="archive-event"
            data-event-type="kv"
            data-event-id="${eventItem.id}"
          >
            Jetzt archivieren
          </button>
          <button
            class="danger-button"
            type="button"
            data-action="delete-event"
            data-event-type="kv"
            data-event-id="${eventItem.id}"
          >
            Jetzt löschen
          </button>
        </div>
      </div>
    `;
  }

  return "";
}

function renderInspector() {
  if (!inspectorStage) return;

  const type = getPreferredInspectorType();
  const eventItem = getSelectedEventForType(type);
  if (!type || !eventItem) {
    inspectorStage.innerHTML = "";
    return;
  }

  const linkedTarget = getCrossPlatformTarget(type, eventItem);
  const kvWorkflow = type === "kv" ? buildExpiredKvWorkflow(eventItem) : "";
  const isKvWorkflowActive = !!kvWorkflow;

  const actions =     `
    <div class="preview-actions">
      ${kvWorkflow}
      ${!isKvWorkflowActive ? `
      ${linkedTarget.id ? `
      <button
        class="secondary-button"
        type="button"
        data-action="jump-linked-event"
        data-event-type="${type}"
        data-event-id="${eventItem.id}"
      >
        ${getJumpToLinkedLabel(type)}
      </button>
      <button
        class="secondary-button"
        type="button"
        data-action="unlink-linked-event"
        data-event-type="${type}"
        data-event-id="${eventItem.id}"
        ${publishState.loading && publishState.action === "unlink" && publishState.type === type && publishState.eventId === eventItem.id ? "disabled" : ""}
      >
        ${publishState.loading && publishState.action === "unlink" && publishState.type === type && publishState.eventId === eventItem.id
          ? "Löst..."
          : getUnlinkLabel(type)}
      </button>` : ""}
      <button
        class="secondary-button"
        type="button"
        data-action="cross-publish"
        data-event-type="${type}"
        data-event-id="${eventItem.id}"
        ${publishState.loading && publishState.action === "publish" && publishState.type === type && publishState.eventId === eventItem.id ? "disabled" : ""}
      >
        ${publishState.loading && publishState.action === "publish" && publishState.type === type && publishState.eventId === eventItem.id
          ? "Übernimmt..."
          : getCrossPlatformButtonLabel(type, eventItem)}
      </button>
      ${type === "kv" ? `
      <button
        class="${eventItem.ticketFormDone ? "secondary-button" : "primary-button"}"
        type="button"
        data-action="toggle-ticket-form"
        data-event-type="${type}"
        data-event-id="${eventItem.id}"
      >
        ${eventItem.ticketFormDone ? "Ticket wieder offen" : "Ticketformular erledigt"}
      </button>` : ""}
      <button
        class="secondary-button"
        type="button"
        data-action="toggle-active"
        data-event-type="${type}"
        data-event-id="${eventItem.id}"
      >
        ${eventItem.aktiv ? "Pausieren" : "Fortsetzen"}
      </button>
      <button
        class="primary-button"
        type="button"
        data-action="edit-event"
        data-event-type="${type}"
        data-event-id="${eventItem.id}"
      >
        Bearbeiten
      </button>
      <button
        class="danger-button"
        type="button"
        data-action="delete-event"
        data-event-type="${type}"
        data-event-id="${eventItem.id}"
      >
        Löschen
      </button>
      ` : ""}
      <button class="secondary-button" type="button" data-action="create-event" data-event-type="${type}">
        Neu
      </button>
    </div>
  `;

  inspectorStage.innerHTML = buildPreviewPoster(type, eventItem, { actions });
}

function render() {
  tabButtons.forEach((button) => {
    const isActive = button.dataset.tab === appState.activeTab;
    button.classList.toggle("is-active", isActive);
  });

  Object.entries(panels).forEach(([key, panel]) => {
    panel?.classList.toggle("is-active", key === appState.activeTab);
  });

  workspace?.classList.toggle("workspace--mario", appState.activeTab === "mario");

  if (mobileNav && mobileToggle) {
    mobileNav.hidden = !appState.mobileNavOpen;
    mobileToggle.setAttribute("aria-expanded", String(appState.mobileNavOpen));
  }

  renderCounts();
  renderHomeList("kv");
  renderHomeList("mario");
  renderTypeList("kv");
  renderTypeList("mario");
  renderHeaderAlert();
  updateInspectorVisibility();
  renderInspector();
  renderEditor();
  renderConfirmModal();
  document.body.style.overflow = editorState.open || confirmState.open ? "hidden" : "";
}

function applyEditorFieldVisibility() {
  editorElements.typeSpecific.forEach((element) => {
    const visible = element.dataset.editorOnly === editorState.type;
    element.hidden = !visible;
  });
}

function fillEditorForm(draft) {
  editorElements.fields.titel.value = draft.titel;
  editorElements.fields.untertitel.value = draft.untertitel;
  editorElements.fields.beschreibung.value = draft.beschreibung;
  editorElements.fields.datum.value = draft.datum;
  editorElements.fields.ort.value = draft.ort;
  editorElements.fields.einlass.value = draft.einlass;
  editorElements.fields.beginn.value = draft.beginn;
  editorElements.fields.preis.value = draft.preis;
  editorElements.fields.telefon.value = draft.telefon;
  editorElements.fields.buttonLabel.value = draft.buttonLabel;
  editorElements.fields.link.value = draft.link;
  editorElements.fields.bild.value = draft.bild;
  editorElements.fields.aktiv.checked = !!draft.aktiv;
  editorElements.fields.ticketFormDone.checked = !!draft.ticketFormDone;
  if (editorElements.fields.linkPreset) {
    editorElements.fields.linkPreset.value = detectMarioLinkPresetFromValues();
  }
}

function getEditorSystemFlags() {
  if (!editorState.eventId) {
    return {
      ticketFormRemoved: false,
      archived: false
    };
  }

  const sourceEvent = getEventById(editorState.type, editorState.eventId);
  return {
    ticketFormRemoved: !!sourceEvent?.ticketFormRemoved,
    archived: !!sourceEvent?.archived
  };
}

function readEditorDraft() {
  const systemFlags = getEditorSystemFlags();

  return {
    titel: editorElements.fields.titel.value.trim(),
    untertitel: editorElements.fields.untertitel.value.trim(),
    beschreibung: editorElements.fields.beschreibung.value.trim(),
    datum: editorElements.fields.datum.value,
    ort: editorElements.fields.ort.value.trim(),
    einlass: editorElements.fields.einlass.value,
    beginn: editorElements.fields.beginn.value,
    preis: editorElements.fields.preis.value.trim(),
    telefon: editorElements.fields.telefon.value.trim(),
    buttonLabel: editorElements.fields.buttonLabel.value.trim(),
    link: editorElements.fields.link.value.trim(),
    bild: editorElements.fields.bild.value.trim(),
    aktiv: editorElements.fields.aktiv.checked,
    ticketFormDone: editorElements.fields.ticketFormDone.checked,
    ticketFormRemoved: systemFlags.ticketFormRemoved,
    archived: systemFlags.archived,
    crossPublish: editorElements.fields.crossPublish.checked
  };
}

function applyEditorStepVisibility() {
  const stepKey = editorState.type === "kv" ? "kvStep" : "marioStep";
  editorElements.stepPanels.forEach((panel) => {
    const panelStep = panel.dataset[stepKey];
    panel.hidden = panelStep === undefined || Number(panelStep) !== editorState.stepIndex;
  });
}

function updateKvImagePreview(src) {
  const el = editorElements.imgPreview;
  if (!el) return;
  if (src) {
    el.innerHTML = `<img src="${escapeHtml(src)}" alt="Vorschau">`;
  } else {
    el.innerHTML = `<span class="editor-img-icon">&#128247;</span><span class="editor-img-hint">Bild vom Gerät hochladen</span>`;
  }
}

async function resizeImageToDataUrl(file, maxWidth = 800, quality = 0.72) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxWidth / img.width);
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function renderEditorStepNav() {
  const steps = getEditorSteps(editorState.type);
  const totalSteps = steps.length;
  const currentStep = editorState.stepIndex + 1;
  const progressPercent = totalSteps > 1
    ? (editorState.stepIndex / (totalSteps - 1)) * 100
    : 100;

  if (editorElements.stepNav) {
    editorElements.stepNav.innerHTML = `
      <div class="editor-progress">
        <div class="editor-progress-top">
          <span class="editor-progress-kicker">Schritt ${currentStep} von ${totalSteps}</span>
          <strong class="editor-progress-title">${escapeHtml(steps[editorState.stepIndex]?.label || "")}</strong>
        </div>
        <div class="editor-progress-track" aria-hidden="true">
          <span class="editor-progress-fill" style="width: ${progressPercent}%"></span>
        </div>
        <div class="editor-progress-steps">
          ${steps.map((step, index) => `
            <button
              class="editor-step-item${index === editorState.stepIndex ? " is-active" : ""}${index < editorState.stepIndex ? " is-complete" : ""}"
              type="button"
              data-action="editor-go-step"
              data-step-index="${index}"
              aria-label="Gehe zu Schritt ${index + 1}: ${escapeHtml(step.label)}"
              title="${escapeHtml(step.label)}"
            >
              <span class="editor-step-index">${index + 1}</span>
            </button>
          `).join("")}
        </div>
      </div>
    `;
  }

  if (editorElements.stepCopy) {
    editorElements.stepCopy.textContent = steps[editorState.stepIndex]?.copy || "";
  }
}

function renderEditorPreview() {
  const draft = readEditorDraft();
  editorElements.preview.innerHTML = buildPreviewPoster(editorState.type, draft, {
    light: true,
    emptyTitle: "Vorschau",
    emptyText: "Trage links Titel, Datum oder Bild ein, dann siehst du hier sofort die Wirkung."
  });
}

async function clearCrossPlatformLinkPair(sourceType, sourceEventId, targetType, targetEventId) {
  if (!sourceType || !sourceEventId) return;

  await patchEventDocument(sourceType, sourceEventId, { crossPlatform: {} });

  if (!targetType || !targetEventId) return;

  try {
    await patchEventDocument(targetType, targetEventId, { crossPlatform: {} });
  } catch (error) {
    console.warn("Linked counterpart could not be unlinked cleanly.", error);
  }
}

function renderEditor() {
  const isOpen = editorState.open;
  if (!editorElements.modal) return;

  editorElements.modal.hidden = !isOpen;
  if (!isOpen) return;

  applyEditorFieldVisibility();
  applyEditorStepVisibility();
  renderEditorStepNav();
  if (editorElements.crossPublishField && editorElements.crossPublishLabel) {
    const hasLinkedTarget = !!editorPublishState.targetId;
    editorElements.crossPublishField.hidden = false;
    editorElements.crossPublishLabel.textContent = getEditorCrossPublishLabel(editorState.type, hasLinkedTarget);
  }
  if (editorState.type === "mario") {
    syncMarioPresetUi();
  }
  renderEditorPreview();
  if (editorElements.prev) {
    editorElements.prev.hidden = editorState.stepIndex === 0;
    editorElements.prev.disabled = editorState.saving;
  }
  if (editorElements.next) {
    const isLastStep = editorState.stepIndex === getEditorSteps(editorState.type).length - 1;
    editorElements.next.hidden = isLastStep;
    editorElements.next.disabled = editorState.saving;
  }
  editorElements.save.hidden = editorState.stepIndex !== getEditorSteps(editorState.type).length - 1;
  editorElements.save.disabled = editorState.saving;
  editorElements.save.textContent = editorState.saving ? "Speichert..." : "Speichern";
}

function openEditor(type, eventId = null) {
  editorState.open = true;
  editorState.type = type;
  editorState.mode = eventId ? "edit" : "create";
  editorState.eventId = eventId;
  editorState.saving = false;
  editorState.stepIndex = 0;
  const sourceEvent = eventId ? getEventById(type, eventId) : null;
  const linkedTargetId = getCrossPlatformTargetId(type, sourceEvent);
  editorPublishState.targetType = getOtherType(type);
  editorPublishState.targetId = linkedTargetId;

  const draft = eventId
    ? mapEventToDraft(type, sourceEvent || getEmptyDraft(type))
    : getEmptyDraft(type);

  editorElements.eyebrow.textContent = eventId ? `${getTypeLabel(type)} bearbeiten` : `Neuer Eintrag für ${getTypeLabel(type)}`;
  editorElements.heading.textContent = eventId ? "Eintrag aktualisieren" : "Eintrag anlegen";
  fillEditorForm(draft);
  editorElements.fields.crossPublish.checked = !!linkedTargetId;
  if (type === "kv") updateKvImagePreview(draft.bild || "");
  render();
}

function closeEditor(force = false) {
  if (editorState.saving && !force) return;
  editorState.open = false;
  editorState.saving = false;
  editorState.eventId = null;
  editorPublishState.targetType = null;
  editorPublishState.targetId = null;
  render();
}

function openDeleteConfirm(type, eventId) {
  const eventItem = getEventById(type, eventId);
  if (!eventItem) return;
  const linkedType = getOtherType(type);
  const linkedId = getCrossPlatformTargetId(type, eventItem);

  confirmState.open = true;
  confirmState.type = type;
  confirmState.eventId = eventId;
  confirmState.loading = false;
  confirmState.loadingMode = null;
  confirmState.linkedType = linkedId ? linkedType : null;
  confirmState.linkedId = linkedId || null;
  confirmElements.message.textContent = linkedId
    ? getLinkedDeleteMessage(type, eventItem, linkedType)
    : getDeleteMessage(type, eventItem);
  render();
}

function closeDeleteConfirm(force = false) {
  if (confirmState.loading && !force) return;
  confirmState.open = false;
  confirmState.type = null;
  confirmState.eventId = null;
  confirmState.loading = false;
  confirmState.loadingMode = null;
  confirmState.linkedType = null;
  confirmState.linkedId = null;
  render();
}

function renderConfirmModal() {
  if (!confirmElements.modal) return;

  confirmElements.modal.hidden = !confirmState.open;
  if (confirmElements.deleteSingle) {
    confirmElements.deleteSingle.hidden = !confirmState.linkedId;
    confirmElements.deleteSingle.disabled = confirmState.loading;
    confirmElements.deleteSingle.textContent = confirmState.loadingMode === "single" ? "Löscht..." : "Nur diesen löschen";
  }
  confirmElements.confirm.disabled = confirmState.loading;
  confirmElements.confirm.textContent = confirmState.loadingMode === "both"
    ? "Löscht..."
    : (confirmState.linkedId ? "Beide löschen" : "Endgültig löschen");
}

function maybeShowKvReminder() {
  const expiredKvEvents = getExpiredKvEventsNeedingCleanup();
  const expiredSignature = expiredKvEvents.map((eventItem) => eventItem.id).sort().join("|");

  if (expiredSignature) {
    if (reminderState.kvExpiredSignature !== expiredSignature) {
      reminderState.kvExpiredSignature = expiredSignature;
      const nextTitle = expiredKvEvents[0]?.titel || "einem Eintrag";
      const countText = expiredKvEvents.length === 1
        ? `${nextTitle} ist abgelaufen, aber das Ticketformular wurde noch nicht als entfernt bestätigt.`
        : `Es gibt noch ${expiredKvEvents.length} abgelaufene Vereins-Einträge mit offenem Ticketformular-Ablauf.`;

      showToast("Ablauf prüfen", `${countText} Bitte zuerst den Ticketformular-Status abschließen und danach archivieren oder löschen.`);
      return;
    }
  } else {
    reminderState.kvExpiredSignature = "";
  }

  const pendingKvEvents = getPendingKvEvents();
  const signature = pendingKvEvents.map((eventItem) => eventItem.id).sort().join("|");

  if (!signature) {
    reminderState.kvSignature = "";
    return;
  }

  if (reminderState.kvSignature === signature) return;

  reminderState.kvSignature = signature;

  const nextTitle = pendingKvEvents[0]?.titel || "einem Eintrag";
  const countText = pendingKvEvents.length === 1
    ? `Bei ${nextTitle} fehlt noch die Bestätigung für das Jotform-Ticketformular.`
    : `Es sind noch ${pendingKvEvents.length} aktive Vereins-Einträge mit offenem Ticketformular vorhanden.`;

  showToast("Ticketformular noch offen", `${countText} Du kannst den Status jetzt direkt im Dashboard als erledigt markieren.`);
}

function validateDraft(type, draft) {
  if (!draft.titel) return "Bitte einen Titel eintragen.";
  if (!draft.datum) return "Bitte ein Datum auswählen.";
  if (type === "mario" && draft.link && !/^https?:\/\//i.test(draft.link)) {
    return "Mario-Links müssen mit http:// oder https:// beginnen.";
  }
  if (draft.bild && !/^(https?:\/\/|data:image\/)/i.test(draft.bild)) {
    return "Die Bild-URL muss mit http:// oder https:// beginnen.";
  }
  return "";
}

async function saveCurrentEditor() {
  const draft = readEditorDraft();
  const validationError = validateDraft(editorState.type, draft);
  if (validationError) {
    showToast("Speichern noch nicht möglich", validationError, "error");
    return;
  }

  editorState.saving = true;
  render();

  try {
    const sourceType = editorState.type;
    const targetType = editorPublishState.targetType || getOtherType(sourceType);
    const sourcePayload = buildSavePayload(sourceType, draft);
    const previousLinkedTargetId = editorPublishState.targetId;
    const existingLinkedTarget = getEventById(targetType, previousLinkedTargetId);

    const eventId = await saveEventDocument(sourceType, sourcePayload, editorState.eventId);
    let linkedTargetId = previousLinkedTargetId;

    if (draft.crossPublish) {
      linkedTargetId = await saveEventDocument(
        targetType,
        buildCrossPlatformPayload(sourceType, targetType, draft, existingLinkedTarget),
        linkedTargetId
      );

      const crossPlatform = {
        kv: sourceType === "kv" ? eventId : linkedTargetId,
        mario: sourceType === "mario" ? eventId : linkedTargetId
      };

      await Promise.all([
        patchEventDocument("kv", crossPlatform.kv, { crossPlatform }),
        patchEventDocument("mario", crossPlatform.mario, { crossPlatform })
      ]);
    } else if (previousLinkedTargetId) {
      await clearCrossPlatformLinkPair(sourceType, eventId, targetType, previousLinkedTargetId);
    }

    setSelectedId(sourceType, eventId);
    setActiveTab(sourceType);
    setMobileNavOpen(false);
    closeEditor(true);
    const needsKvTicketReminder = sourceType === "kv" && draft.aktiv && !draft.ticketFormDone;
    showToast(
      draft.crossPublish
        ? (editorState.mode === "edit" ? "Eintrag und Verknüpfung aktualisiert" : "Eintrag auf beide Plattformen gespeichert")
        : (editorState.mode === "edit" ? "Eintrag aktualisiert" : "Eintrag gespeichert"),
      needsKvTicketReminder
        ? `${getTypeLabel(sourceType)} wurde gespeichert. Das Ticketformular ist noch offen und sollte jetzt in Jotform erledigt werden.`
        : draft.crossPublish
          ? `Der Eintrag wurde hier und auf ${getTypeLabel(targetType)} gespeichert beziehungsweise aktualisiert.`
          : previousLinkedTargetId
            ? "Die bestehende Verknüpfung zur anderen Plattform wurde beim Speichern entfernt."
          : `${getTypeLabel(sourceType)} wurde erfolgreich in Firestore gespeichert.`
    );
  } catch (error) {
    editorState.saving = false;
    render();
    showToast("Speichern fehlgeschlagen", error?.message || "Bitte Firestore-Regeln und Verbindung prüfen.", "error");
  }
}

async function toggleEventActive(type, eventId) {
  const eventItem = getEventById(type, eventId);
  if (!eventItem) return;

  try {
    await patchEventDocument(type, eventId, { aktiv: !eventItem.aktiv });
    showToast(
      eventItem.aktiv ? "Eintrag deaktiviert" : "Eintrag aktiviert",
      `${eventItem.titel || "Der Eintrag"} ist jetzt ${eventItem.aktiv ? "inaktiv" : "aktiv"}.`
    );
  } catch (error) {
    showToast("Status konnte nicht geändert werden", error?.message || "Bitte Verbindung und Firestore-Regeln prüfen.", "error");
  }
}

async function toggleTicketFormState(type, eventId) {
  if (type !== "kv") return;

  const eventItem = getEventById(type, eventId);
  if (!eventItem) return;

  try {
    await patchEventDocument(type, eventId, {
      ticketFormDone: !eventItem.ticketFormDone,
      ticketFormRemoved: false
    });
    showToast(
      eventItem.ticketFormDone ? "Ticketformular wieder offen" : "Ticketformular erledigt",
      eventItem.ticketFormDone
        ? `${eventItem.titel || "Der Eintrag"} braucht wieder eine Ticketformular-Bestätigung.`
        : `${eventItem.titel || "Der Eintrag"} ist jetzt als Ticketformular-erledigt markiert.`
    );
  } catch (error) {
    showToast("Ticketstatus konnte nicht geändert werden", error?.message || "Bitte Verbindung und Firestore-Regeln prüfen.", "error");
  }
}

async function confirmTicketFormRemoved(type, eventId) {
  if (type !== "kv") return;

  const eventItem = getEventById(type, eventId);
  if (!eventItem) return;

  try {
    await patchEventDocument(type, eventId, { ticketFormRemoved: true });
    showToast(
      "Ticketformular bestätigt",
      `${eventItem.titel || "Der Eintrag"} ist jetzt für Archivierung oder Löschung bereit.`
    );
  } catch (error) {
    showToast("Bestätigung fehlgeschlagen", error?.message || "Bitte Verbindung und Firestore-Regeln prüfen.", "error");
  }
}

async function publishEventToOtherPlatform(sourceType, sourceEventId) {
  const sourceEvent = getEventById(sourceType, sourceEventId);
  if (!sourceEvent) return;

  const targetType = getOtherType(sourceType);
  const targetId = getCrossPlatformTargetId(sourceType, sourceEvent);
  const existingTarget = getEventById(targetType, targetId);
  const sourceDraft = mapEventToDraft(sourceType, sourceEvent);

  publishState.loading = true;
  publishState.type = sourceType;
  publishState.eventId = sourceEventId;
  publishState.action = "publish";
  render();

  try {
    const savedTargetId = await saveEventDocument(
      targetType,
      buildCrossPlatformPayload(sourceType, targetType, sourceDraft, existingTarget),
      targetId
    );

    const kvId = sourceType === "kv" ? sourceEventId : savedTargetId;
    const marioId = sourceType === "mario" ? sourceEventId : savedTargetId;
    const crossPlatform = { kv: kvId, mario: marioId };

    await Promise.all([
      patchEventDocument("kv", kvId, { crossPlatform }),
      patchEventDocument("mario", marioId, { crossPlatform })
    ]);

    showToast(
      targetId ? "Verknüpfter Eintrag aktualisiert" : "Auf zweite Plattform übernommen",
      sourceType === "kv"
        ? "Der Eintrag ist jetzt mit Mario verknüpft."
        : "Der Eintrag ist jetzt mit dem Kulturverein verknüpft."
    );
  } catch (error) {
    showToast("Cross-Publish fehlgeschlagen", error?.message || "Bitte Verbindung und Firestore-Regeln prüfen.", "error");
  } finally {
    publishState.loading = false;
    publishState.type = null;
    publishState.eventId = null;
    publishState.action = null;
    render();
  }
}

function jumpToLinkedEvent(sourceType, sourceEventId) {
  const sourceEvent = getEventById(sourceType, sourceEventId);
  if (!sourceEvent) return;

  const linkedTarget = getCrossPlatformTarget(sourceType, sourceEvent);
  if (!linkedTarget.id) {
    showToast("Keine Verknüpfung vorhanden", "Dieser Eintrag ist noch nicht mit der anderen Plattform verbunden.", "error");
    return;
  }

  if (!linkedTarget.event) {
    showToast("Verknüpfung noch nicht geladen", "Der verknüpfte Eintrag ist noch nicht im aktuellen Datenstand verfügbar.", "error");
    return;
  }

  setSelectedId(linkedTarget.type, linkedTarget.id);
  setActiveTab(linkedTarget.type);
  setMobileNavOpen(false);
  render();
}

async function unlinkCrossPlatformEvent(sourceType, sourceEventId) {
  const sourceEvent = getEventById(sourceType, sourceEventId);
  if (!sourceEvent) return;

  const linkedTarget = getCrossPlatformTarget(sourceType, sourceEvent);
  if (!linkedTarget.id) {
    showToast("Keine Verknüpfung vorhanden", "Dieser Eintrag ist aktuell nicht mit der anderen Plattform verbunden.", "error");
    return;
  }

  publishState.loading = true;
  publishState.type = sourceType;
  publishState.eventId = sourceEventId;
  publishState.action = "unlink";
  render();

  try {
    await Promise.all([
      patchEventDocument(sourceType, sourceEventId, { crossPlatform: {} }),
      patchEventDocument(linkedTarget.type, linkedTarget.id, { crossPlatform: {} })
    ]);

    showToast(
      "Verknüpfung gelöst",
      `${sourceEvent.titel || "Der Eintrag"} und der verknüpfte Eintrag sind jetzt getrennt.`
    );
  } catch (error) {
    showToast("Verknüpfung konnte nicht gelöst werden", error?.message || "Bitte Verbindung und Firestore-Regeln prüfen.", "error");
  } finally {
    publishState.loading = false;
    publishState.type = null;
    publishState.eventId = null;
    publishState.action = null;
    render();
  }
}

async function archiveEvent(type, eventId) {
  const eventItem = getEventById(type, eventId);
  if (!eventItem) return;

  const linkedTarget = getCrossPlatformTarget(type, eventItem);

  try {
    await patchEventDocument(type, eventId, {
      archived: true,
      aktiv: false,
      crossPlatform: {}
    });

    if (linkedTarget.id) {
      await patchEventDocument(linkedTarget.type, linkedTarget.id, { crossPlatform: {} });
    }

    showToast(
      "Eintrag archiviert",
      linkedTarget.id
        ? `${eventItem.titel || "Der Eintrag"} wurde archiviert und von der Verknüpfung gelöst.`
        : `${eventItem.titel || "Der Eintrag"} wurde archiviert.`
    );
  } catch (error) {
    showToast("Archivieren fehlgeschlagen", error?.message || "Bitte Verbindung und Firestore-Regeln prüfen.", "error");
  }
}

async function confirmDeleteEvent(mode = "single") {
  const type = confirmState.type;
  const eventId = confirmState.eventId;
  const eventItem = getEventById(type, eventId);
  const linkedType = confirmState.linkedType;
  const linkedId = confirmState.linkedId;

  if (!type || !eventId || !eventItem) {
    closeDeleteConfirm(true);
    return;
  }

  confirmState.loading = true;
  confirmState.loadingMode = mode;
  renderConfirmModal();

  try {
    if (mode === "both" && linkedType && linkedId) {
      await Promise.all([
        removeEventDocument(type, eventId),
        removeEventDocument(linkedType, linkedId)
      ]);
    } else {
      if (linkedType && linkedId) {
        await patchEventDocument(linkedType, linkedId, { crossPlatform: {} });
      }
      await removeEventDocument(type, eventId);
    }

    closeDeleteConfirm(true);
    showToast(
      mode === "both" && linkedType && linkedId ? "Beide Einträge gelöscht" : "Eintrag gelöscht",
      mode === "both" && linkedType && linkedId
        ? `${eventItem.titel || "Der Eintrag"} und der verknüpfte Eintrag wurden entfernt.`
        : linkedType && linkedId
          ? `${eventItem.titel || "Der Eintrag"} wurde entfernt. Der verknüpfte Eintrag bleibt erhalten und ist jetzt entkoppelt.`
          : `${eventItem.titel || "Der Eintrag"} wurde entfernt.`
    );
  } catch (error) {
    confirmState.loading = false;
    confirmState.loadingMode = null;
    renderConfirmModal();
    showToast("Löschen fehlgeschlagen", error?.message || "Bitte Verbindung und Firestore-Regeln prüfen.", "error");
  }
}

function syncSelection(type) {
  const events = getVisibleEvents(type);
  const selectedId = appState.selectedIds[type];
  if (events.some((eventItem) => eventItem.id === selectedId)) return;

  const firstActive = events.find((eventItem) => eventItem.aktiv) || events[0] || null;
  setSelectedId(type, firstActive ? firstActive.id : null);
}

function handleActionClick(actionTrigger) {
  const action = actionTrigger.dataset.action;

  if (action === "select-event") {
    const type = actionTrigger.getAttribute("data-event-type");
    const eventId = actionTrigger.getAttribute("data-event-id");
    if (!type || !eventId) return;

    setSelectedId(type, eventId);
    if (appState.activeTab === "home") {
      setActiveTab(type);
    }
    setMobileNavOpen(false);
    render();
    return;
  }

  if (action === "edit-event") {
    const type = actionTrigger.getAttribute("data-event-type");
    const eventId = actionTrigger.getAttribute("data-event-id");
    if (!type || !eventId) return;
    openEditor(type, eventId);
    return;
  }

  if (action === "create-event") {
    const type = actionTrigger.getAttribute("data-event-type");
    if (!type) return;
    openEditor(type);
    return;
  }

  if (action === "editor-go-step") {
    const nextStepIndex = Number(actionTrigger.getAttribute("data-step-index"));
    if (Number.isNaN(nextStepIndex)) return;
    setEditorStep(nextStepIndex);
    return;
  }

  if (action === "quick-set-field") {
    const fieldId = actionTrigger.getAttribute("data-field-id");
    const value = actionTrigger.getAttribute("data-value") || "";
    if (!fieldId) return;
    setEditorFieldValue(fieldId, value);
    return;
  }

  if (action === "quick-set-time") {
    const einlass = actionTrigger.getAttribute("data-einlass") || "";
    const beginn = actionTrigger.getAttribute("data-beginn") || "";
    setEditorTimePreset(einlass, beginn);
    return;
  }

  if (action === "select-mario-preset") {
    const preset = actionTrigger.getAttribute("data-preset");
    if (!preset) return;
    selectMarioLinkPreset(preset);
    return;
  }

  if (action === "toggle-active") {
    const type = actionTrigger.getAttribute("data-event-type");
    const eventId = actionTrigger.getAttribute("data-event-id");
    if (!type || !eventId) return;
    void toggleEventActive(type, eventId);
    return;
  }

  if (action === "toggle-ticket-form") {
    const type = actionTrigger.getAttribute("data-event-type");
    const eventId = actionTrigger.getAttribute("data-event-id");
    if (!type || !eventId) return;
    void toggleTicketFormState(type, eventId);
    return;
  }

  if (action === "confirm-ticket-removed") {
    const type = actionTrigger.getAttribute("data-event-type");
    const eventId = actionTrigger.getAttribute("data-event-id");
    if (!type || !eventId) return;
    void confirmTicketFormRemoved(type, eventId);
    return;
  }

  if (action === "archive-event") {
    const type = actionTrigger.getAttribute("data-event-type");
    const eventId = actionTrigger.getAttribute("data-event-id");
    if (!type || !eventId) return;
    void archiveEvent(type, eventId);
    return;
  }

  if (action === "cross-publish") {
    const type = actionTrigger.getAttribute("data-event-type");
    const eventId = actionTrigger.getAttribute("data-event-id");
    if (!type || !eventId) return;
    void publishEventToOtherPlatform(type, eventId);
    return;
  }

  if (action === "jump-linked-event") {
    const type = actionTrigger.getAttribute("data-event-type");
    const eventId = actionTrigger.getAttribute("data-event-id");
    if (!type || !eventId) return;
    jumpToLinkedEvent(type, eventId);
    return;
  }

  if (action === "unlink-linked-event") {
    const type = actionTrigger.getAttribute("data-event-type");
    const eventId = actionTrigger.getAttribute("data-event-id");
    if (!type || !eventId) return;
    void unlinkCrossPlatformEvent(type, eventId);
    return;
  }

  if (action === "delete-event") {
    const type = actionTrigger.getAttribute("data-event-type");
    const eventId = actionTrigger.getAttribute("data-event-id");
    if (!type || !eventId) return;
    openDeleteConfirm(type, eventId);
    return;
  }

  if (action === "toggle-row-actions") {
    const row = actionTrigger.closest(".event-row");
    if (row) row.classList.toggle("is-actions-open");
    return;
  }

  if (action === "toggle-inspector-actions") {
    actionTrigger.closest(".inspector-actions-toggle")?.classList.toggle("is-open");
    return;
  }

  if (action === "close-toast") {
    closeToast();
  }
}

function bindEvents() {
  tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      setActiveTab(button.dataset.tab);
      setMobileNavOpen(false);
      render();
    });
  });

  mobileToggle?.addEventListener("click", () => {
    setMobileNavOpen(!appState.mobileNavOpen);
    render();
  });

  headerAlertButton?.addEventListener("click", () => {
    const target = getFirstKvEventNeedingReview();
    if (!target) return;
    setSelectedId("kv", target.id);
    setActiveTab("kv");
    setMobileNavOpen(false);
    render();
    inspectorStage?.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  createKvButton?.addEventListener("click", () => openEditor("kv"));
  createMarioButton?.addEventListener("click", () => openEditor("mario"));

  editorElements.close?.addEventListener("click", closeEditor);
  editorElements.cancel?.addEventListener("click", closeEditor);
  editorElements.prev?.addEventListener("click", () => {
    setEditorStep(editorState.stepIndex - 1, { skipValidation: true });
  });
  editorElements.next?.addEventListener("click", () => {
    setEditorStep(editorState.stepIndex + 1);
  });

  editorElements.fields.bildFile?.addEventListener("change", async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    updateKvImagePreview(URL.createObjectURL(file));
    try {
      const dataUrl = await resizeImageToDataUrl(file);
      editorElements.fields.bild.value = dataUrl;
      renderEditorPreview();
    } catch {
      showToast("Bild konnte nicht verarbeitet werden", "Bitte eine Bild-URL manuell eingeben.", "error");
    }
  });
  confirmElements.cancel?.addEventListener("click", () => closeDeleteConfirm());
  confirmElements.deleteSingle?.addEventListener("click", () => {
    void confirmDeleteEvent("single");
  });
  confirmElements.confirm?.addEventListener("click", () => {
    void confirmDeleteEvent(confirmState.linkedId ? "both" : "single");
  });

  editorElements.form?.addEventListener("input", () => {
    if (!editorState.open) return;
    if (editorState.type === "mario" && editorElements.fields.linkPreset) {
      const detectedPreset = detectMarioLinkPresetFromValues();
      if (editorElements.fields.linkPreset.value !== detectedPreset) {
        editorElements.fields.linkPreset.value = detectedPreset;
        syncMarioPresetUi();
      }
    }
    renderEditorPreview();
  });

  editorElements.form?.addEventListener("submit", async (event) => {
    event.preventDefault();
    await saveCurrentEditor();
  });

  document.addEventListener("click", (event) => {
    const closeTrigger = event.target.closest("[data-editor-close]");
    if (closeTrigger) {
      closeEditor();
      return;
    }

    const confirmCloseTrigger = event.target.closest("[data-confirm-close]");
    if (confirmCloseTrigger) {
      closeDeleteConfirm();
      return;
    }

    const actionTrigger = event.target.closest("[data-action]");
    if (!actionTrigger) return;
    handleActionClick(actionTrigger);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && confirmState.open) {
      closeDeleteConfirm();
      return;
    }

    if (event.key === "Escape" && editorState.open) {
      closeEditor();
    }
  });
}

function initData() {
  subscribeToEvents(
    "kv",
    (events) => {
      setEvents("kv", events);
      syncSelection("kv");
      render();
      maybeShowKvReminder();
    },
    (error) => {
      showToast("Kulturverein konnte nicht geladen werden", error?.message || "Firestore meldet einen Fehler.", "error");
    }
  );

  subscribeToEvents(
    "mario",
    (events) => {
      setEvents("mario", events);
      syncSelection("mario");
      render();
    },
    (error) => {
      showToast("Mario konnte nicht geladen werden", error?.message || "Firestore meldet einen Fehler.", "error");
    }
  );
}

function init() {
  bindEvents();
  initData();
  render();
}

init();


