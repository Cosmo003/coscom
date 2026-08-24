(function () {
  "use strict";

  var STORAGE_KEY = "coscom_wartung_v1";

  var QUICK_ADD_DEFAULTS = [
    { name: "Motoröl & Ölfilter", intervalKm: 15000, intervalMonths: 12 },
    { name: "Luftfilter", intervalKm: 30000, intervalMonths: 24 },
    { name: "Innenraumfilter", intervalKm: 15000, intervalMonths: 12 },
    { name: "Zündkerzen", intervalKm: 30000, intervalMonths: 24 },
    { name: "Bremsflüssigkeit", intervalKm: 30000, intervalMonths: 24 },
    { name: "Kühlmittel", intervalKm: 60000, intervalMonths: 48 },
    { name: "Zahnriemen / Steuerkette", intervalKm: 90000, intervalMonths: 72 },
    { name: "Bremsbeläge", intervalKm: 30000, intervalMonths: null },
    { name: "Reifen (Profil prüfen)", intervalKm: 10000, intervalMonths: 6 },
    { name: "Batterie prüfen", intervalKm: 20000, intervalMonths: 24 },
    { name: "TÜV / Hauptuntersuchung", intervalKm: null, intervalMonths: 24 },
  ];

  var DAY_MS = 24 * 60 * 60 * 1000;

  var state = loadState();

  var els = {
    vehicleName: document.getElementById("vehicle-name"),
    kmInput: document.getElementById("km-input"),
    statOverdue: document.getElementById("stat-overdue"),
    statSoon: document.getElementById("stat-soon"),
    statOk: document.getElementById("stat-ok"),
    quickAddChips: document.getElementById("quick-add-chips"),
    addCustomBtn: document.getElementById("add-custom-btn"),
    cardsGrid: document.getElementById("cards-grid"),
    emptyState: document.getElementById("empty-state"),
    itemDialog: document.getElementById("item-dialog"),
    itemForm: document.getElementById("item-form"),
    itemDialogTitle: document.getElementById("item-dialog-title"),
    cancelItemBtn: document.getElementById("cancel-item-btn"),
    deleteItemBtn: document.getElementById("delete-item-btn"),
    settingsBtn: document.getElementById("settings-btn"),
    settingsDialog: document.getElementById("settings-dialog"),
    settingsForm: document.getElementById("settings-form"),
    cancelSettingsBtn: document.getElementById("cancel-settings-btn"),
  };

  var editingId = null;

  function loadState() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (parsed && parsed.vehicle && Array.isArray(parsed.items)) return parsed;
      }
    } catch (e) {
      /* ignore corrupt storage */
    }
    return {
      vehicle: { name: "Hyundai Tucson (2007)", currentKm: null, annualKm: 15000 },
      items: [],
    };
  }

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function uid() {
    return "id-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
  }

  function fmtKm(n) {
    return Math.round(n).toLocaleString("de-DE");
  }

  function fmtDate(d) {
    return d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
  }

  function daysBetween(a, b) {
    return Math.round((b - a) / DAY_MS);
  }

  function addMonths(date, months) {
    var d = new Date(date.getTime());
    d.setMonth(d.getMonth() + months);
    return d;
  }

  // Computes progress/status for one item given the vehicle's current km.
  function evaluateItem(item, currentKm) {
    var hasKm = typeof item.intervalKm === "number" && item.intervalKm > 0;
    var hasTime = typeof item.intervalMonths === "number" && item.intervalMonths > 0;
    var lastKm = typeof item.lastKm === "number" ? item.lastKm : null;
    var lastDate = item.lastDate ? new Date(item.lastDate + "T00:00:00") : null;
    var today = new Date();

    var percentKm = null,
      remainingKm = null;
    if (hasKm && lastKm !== null && typeof currentKm === "number") {
      var dueKm = lastKm + item.intervalKm;
      remainingKm = dueKm - currentKm;
      percentKm = (currentKm - lastKm) / item.intervalKm;
    }

    var percentTime = null,
      remainingDays = null;
    if (hasTime && lastDate) {
      var dueDate = addMonths(lastDate, item.intervalMonths);
      remainingDays = daysBetween(today, dueDate);
      var totalDays = daysBetween(lastDate, dueDate);
      percentTime = totalDays > 0 ? daysBetween(lastDate, today) / totalDays : 1;
    }

    var percent = null;
    if (percentKm !== null && percentTime !== null) percent = Math.max(percentKm, percentTime);
    else if (percentKm !== null) percent = percentKm;
    else if (percentTime !== null) percent = percentTime;

    var status = "unknown";
    if (percent !== null) {
      if (percent >= 1) status = "overdue";
      else if (percent >= 0.85) status = "soon";
      else status = "ok";
    }

    return {
      percent: percent,
      status: status,
      remainingKm: remainingKm,
      remainingDays: remainingDays,
      hasKm: hasKm,
      hasTime: hasTime,
    };
  }

  var STATUS_COLOR = {
    overdue: "var(--color-danger)",
    soon: "var(--color-warn)",
    ok: "var(--color-good)",
    unknown: "var(--color-fg-muted)",
  };
  var STATUS_LABEL = {
    overdue: "Fällig",
    soon: "Bald fällig",
    ok: "In Ordnung",
    unknown: "Unvollständig",
  };

  function renderQuickAdd() {
    els.quickAddChips.innerHTML = "";
    QUICK_ADD_DEFAULTS.forEach(function (def) {
      var already = state.items.some(function (it) {
        return it.name === def.name;
      });
      var chip = document.createElement("button");
      chip.type = "button";
      chip.className = "chip";
      if (already) {
        chip.disabled = true;
        chip.innerHTML = "✓ " + def.name;
      } else {
        chip.innerHTML = '<span class="chip-plus">+</span>' + def.name;
        chip.addEventListener("click", function () {
          openItemDialog(null, def);
        });
      }
      els.quickAddChips.appendChild(chip);
    });
  }

  function renderStats(evaluated) {
    var counts = { overdue: 0, soon: 0, ok: 0 };
    evaluated.forEach(function (e) {
      if (counts[e.evaluation.status] !== undefined) counts[e.evaluation.status]++;
    });
    els.statOverdue.textContent = counts.overdue;
    els.statSoon.textContent = counts.soon;
    els.statOk.textContent = counts.ok;
  }

  function renderCards() {
    var currentKm = state.vehicle.currentKm;
    var evaluated = state.items.map(function (item) {
      return { item: item, evaluation: evaluateItem(item, currentKm) };
    });

    var order = { overdue: 0, soon: 1, unknown: 2, ok: 3 };
    evaluated.sort(function (a, b) {
      var oa = order[a.evaluation.status],
        ob = order[b.evaluation.status];
      if (oa !== ob) return oa - ob;
      var pa = a.evaluation.percent === null ? -1 : a.evaluation.percent;
      var pb = b.evaluation.percent === null ? -1 : b.evaluation.percent;
      return pb - pa;
    });

    els.cardsGrid.innerHTML = "";
    els.emptyState.hidden = state.items.length > 0;

    evaluated.forEach(function (entry) {
      els.cardsGrid.appendChild(buildCard(entry.item, entry.evaluation));
    });

    renderStats(evaluated);
    renderQuickAdd();
  }

  function buildCard(item, ev) {
    var card = document.createElement("article");
    card.className = "item-card";
    card.style.setProperty("--status-color", STATUS_COLOR[ev.status]);
    card.addEventListener("click", function () {
      openItemDialog(item);
    });

    var head = document.createElement("div");
    head.className = "item-card-head";
    var h3 = document.createElement("h3");
    h3.textContent = item.name;
    var pill = document.createElement("span");
    pill.className = "status-pill";
    pill.style.setProperty("--status-color", STATUS_COLOR[ev.status]);
    pill.textContent = STATUS_LABEL[ev.status];
    head.appendChild(h3);
    head.appendChild(pill);
    card.appendChild(head);

    var track = document.createElement("div");
    track.className = "item-progress-track";
    var fill = document.createElement("div");
    fill.className = "item-progress-fill";
    fill.style.setProperty("--status-color", STATUS_COLOR[ev.status]);
    var pct = ev.percent === null ? 0 : Math.min(Math.max(ev.percent, 0), 1) * 100;
    fill.style.width = pct + "%";
    track.appendChild(fill);
    card.appendChild(track);

    var meta = document.createElement("div");
    meta.className = "item-meta";

    var leftSpan = document.createElement("span");
    if (ev.hasKm && ev.remainingKm !== null) {
      leftSpan.innerHTML =
        ev.remainingKm >= 0
          ? "noch <strong>" + fmtKm(ev.remainingKm) + " km</strong>"
          : "<strong>" + fmtKm(Math.abs(ev.remainingKm)) + " km</strong> überfällig";
    } else if (ev.hasKm) {
      leftSpan.textContent = "Kilometerstand fehlt";
    } else {
      leftSpan.textContent = "—";
    }

    var rightSpan = document.createElement("span");
    if (ev.hasTime && ev.remainingDays !== null) {
      rightSpan.innerHTML =
        ev.remainingDays >= 0
          ? "noch <strong>" + fmtDays(ev.remainingDays) + "</strong>"
          : "<strong>" + fmtDays(Math.abs(ev.remainingDays)) + "</strong> überfällig";
    } else if (ev.hasTime) {
      rightSpan.textContent = "Datum fehlt";
    } else {
      rightSpan.textContent = "";
    }

    meta.appendChild(leftSpan);
    meta.appendChild(rightSpan);
    card.appendChild(meta);

    return card;
  }

  function fmtDays(days) {
    if (days < 60) return days + " Tag" + (days === 1 ? "" : "e");
    var months = Math.round(days / 30.44);
    return months + " Monat" + (months === 1 ? "" : "e");
  }

  function openItemDialog(existingItem, prefillDefaults) {
    editingId = existingItem ? existingItem.id : null;
    els.itemDialogTitle.textContent = existingItem ? "Wartungspunkt bearbeiten" : "Neuer Wartungspunkt";
    els.deleteItemBtn.hidden = !existingItem;

    var f = els.itemForm;
    f.reset();
    if (existingItem) {
      f.elements.name.value = existingItem.name;
      f.elements.lastKm.value = existingItem.lastKm != null ? existingItem.lastKm : "";
      f.elements.lastDate.value = existingItem.lastDate || "";
      f.elements.intervalKm.value = existingItem.intervalKm != null ? existingItem.intervalKm : "";
      f.elements.intervalMonths.value = existingItem.intervalMonths != null ? existingItem.intervalMonths : "";
    } else if (prefillDefaults) {
      f.elements.name.value = prefillDefaults.name;
      f.elements.intervalKm.value = prefillDefaults.intervalKm != null ? prefillDefaults.intervalKm : "";
      f.elements.intervalMonths.value = prefillDefaults.intervalMonths != null ? prefillDefaults.intervalMonths : "";
      if (typeof state.vehicle.currentKm === "number") {
        f.elements.lastKm.value = state.vehicle.currentKm;
      }
      f.elements.lastDate.value = new Date().toISOString().slice(0, 10);
    }

    els.itemDialog.showModal();
  }

  els.itemForm.addEventListener("submit", function (e) {
    var f = els.itemForm;
    var name = f.elements.name.value.trim();
    if (!name) {
      e.preventDefault();
      return;
    }
    var intervalKm = f.elements.intervalKm.value ? Number(f.elements.intervalKm.value) : null;
    var intervalMonths = f.elements.intervalMonths.value ? Number(f.elements.intervalMonths.value) : null;
    if (!intervalKm && !intervalMonths) {
      e.preventDefault();
      alert("Bitte mindestens ein Intervall (km oder Monate) angeben.");
      return;
    }

    var data = {
      name: name,
      lastKm: f.elements.lastKm.value ? Number(f.elements.lastKm.value) : null,
      lastDate: f.elements.lastDate.value || null,
      intervalKm: intervalKm,
      intervalMonths: intervalMonths,
    };

    if (editingId) {
      var idx = state.items.findIndex(function (it) {
        return it.id === editingId;
      });
      if (idx !== -1) state.items[idx] = Object.assign({ id: editingId }, data);
    } else {
      data.id = uid();
      state.items.push(data);
    }
    saveState();
    renderCards();
  });

  els.cancelItemBtn.addEventListener("click", function () {
    els.itemDialog.close();
  });

  els.deleteItemBtn.addEventListener("click", function () {
    if (editingId && confirm("Diesen Wartungspunkt wirklich löschen?")) {
      state.items = state.items.filter(function (it) {
        return it.id !== editingId;
      });
      saveState();
      renderCards();
      els.itemDialog.close();
    }
  });

  els.addCustomBtn.addEventListener("click", function () {
    openItemDialog(null, { name: "", intervalKm: null, intervalMonths: null });
    els.itemForm.elements.lastDate.value = new Date().toISOString().slice(0, 10);
  });

  els.kmInput.addEventListener("input", function () {
    var val = els.kmInput.value === "" ? null : Number(els.kmInput.value);
    state.vehicle.currentKm = val;
    saveState();
    renderCards();
  });

  els.settingsBtn.addEventListener("click", function () {
    els.settingsForm.elements.vehicleName.value = state.vehicle.name;
    els.settingsForm.elements.annualKm.value = state.vehicle.annualKm || "";
    els.settingsDialog.showModal();
  });
  els.cancelSettingsBtn.addEventListener("click", function () {
    els.settingsDialog.close();
  });
  els.settingsForm.addEventListener("submit", function () {
    var name = els.settingsForm.elements.vehicleName.value.trim() || "Mein Fahrzeug";
    state.vehicle.name = name;
    state.vehicle.annualKm = Number(els.settingsForm.elements.annualKm.value) || null;
    saveState();
    renderVehicleName();
  });

  function renderVehicleName() {
    els.vehicleName.textContent = state.vehicle.name;
  }

  function init() {
    renderVehicleName();
    if (typeof state.vehicle.currentKm === "number") {
      els.kmInput.value = state.vehicle.currentKm;
    }
    renderCards();
  }

  init();
})();
