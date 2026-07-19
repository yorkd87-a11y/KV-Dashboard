export const appState = {
  activeTab: "home",
  events: {
    kv: [],
    mario: []
  },
  loaded: {
    kv: false,
    mario: false
  },
  selectedIds: {
    kv: null,
    mario: null
  }
};

export function setActiveTab(tab) {
  appState.activeTab = tab;
}

export function setEvents(type, events) {
  appState.events[type] = events;
  appState.loaded[type] = true;
}

export function setSelectedId(type, id) {
  appState.selectedIds[type] = id;
}
