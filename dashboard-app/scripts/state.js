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
  statusFilter: {
    kv: null,
    mario: null
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

export function setStatusFilter(type, status) {
  appState.statusFilter[type] = status;
}

export function setSelectedId(type, id) {
  appState.selectedIds[type] = id;
}
