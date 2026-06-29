export const appState = {
  activeTab: "home",
  mobileNavOpen: false,
  events: {
    kv: [],
    mario: []
  },
  selectedIds: {
    kv: null,
    mario: null
  }
};

export function setActiveTab(tab) {
  appState.activeTab = tab;
}

export function setMobileNavOpen(isOpen) {
  appState.mobileNavOpen = isOpen;
}

export function setEvents(type, events) {
  appState.events[type] = events;
}

export function setSelectedId(type, id) {
  appState.selectedIds[type] = id;
}
