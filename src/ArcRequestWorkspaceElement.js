/* eslint-disable no-param-reassign */
/* eslint-disable class-methods-use-this */
import { LitElement, html } from 'lit-element';
import { classMap } from 'lit-html/directives/class-map.js';
import { ArcResizableMixin } from '@advanced-rest-client/arc-resizable-mixin';
import { EventsTargetMixin } from '@advanced-rest-client/events-target-mixin';
import { v4 } from '@advanced-rest-client/uuid-generator';
import { TransportEventTypes, WorkspaceEvents } from '@advanced-rest-client/arc-events';
import { ArcModelEvents } from '@advanced-rest-client/arc-models';
import { BodyProcessor } from '@advanced-rest-client/body-editor';
import '@anypoint-web-components/anypoint-button/anypoint-icon-button.js';
import '@advanced-rest-client/arc-icons/arc-icon.js';
import elementStyles from './styles/Workspace.js';
import '../arc-request-panel.js';
import '../workspace-tab.js'
import '../workspace-tabs.js'

/** @typedef {import('@advanced-rest-client/arc-types').ArcRequest.ArcBaseRequest} ArcBaseRequest */
/** @typedef {import('@advanced-rest-client/arc-types').ArcRequest.ARCSavedRequest} ARCSavedRequest */
/** @typedef {import('@advanced-rest-client/arc-types').ArcRequest.ARCHistoryRequest} ARCHistoryRequest */
/** @typedef {import('@advanced-rest-client/arc-types').ArcRequest.RequestConfig} RequestConfig */
/** @typedef {import('@advanced-rest-client/arc-types').Workspace.DomainWorkspace} DomainWorkspace */
/** @typedef {import('@advanced-rest-client/arc-types').DataExport.ArcExportObject} ArcExportObject */
/** @typedef {import('@advanced-rest-client/arc-events').ApiTransportEvent} ApiTransportEvent */
/** @typedef {import('lit-element').TemplateResult} TemplateResult */
/** @typedef {import('./types').WorkspaceTab} WorkspaceTab */
/** @typedef {import('./types').AddRequestOptions} AddRequestOptions */
/** @typedef {import('./types').WorkspaceRequest} WorkspaceRequest */
/** @typedef {import('./ArcRequestPanelElement').ArcRequestPanelElement} ArcRequestPanelElement */
/** @typedef {import('./WorkspaceTabsElement').WorkspaceTabsElement} WorkspaceTabsElement */
/** @typedef {import('./WorkspaceTabElement').WorkspaceTabElement} WorkspaceTabElement */

export const addTab = Symbol('addTab');
export const createTab = Symbol('createTab');
export const updateTab = Symbol('updateTab');
export const tabsValue = Symbol('tabsValue');
export const requestsValue = Symbol('requestsValue');
export const tabsTemplate = Symbol('tabsTemplate');
export const tabTemplate = Symbol('tabTemplate');
export const panelsTemplate = Symbol('panelsTemplate');
export const panelTemplate = Symbol('panelTemplate');
export const closeRequestHandler = Symbol('closeRequestHandler');
export const tabsSelectionHandler = Symbol('tabsSelectionHandler');
export const requestChangeHandler = Symbol('requestChangeHandler');
export const tabDragStartHandler = Symbol('tabDragStartHandler');
export const tabDragEndHandler = Symbol('tabDragEndHandler');
export const reorderInfo = Symbol('reorderInfo');
export const workspaceValue = Symbol('workspaceValue');
export const restoreRequests = Symbol('restoreRequests');
export const readTabLabel = Symbol('readTabLabel');
export const storeWorkspace = Symbol('storeWorkspace');
export const storeTimeoutValue = Symbol('storeTimeoutValue');
export const syncWorkspaceRequests = Symbol('syncWorkspaceRequests');
export const addNewHandler = Symbol('addNewHandler');
export const panelCloseHandler = Symbol('panelCloseHandler');
export const panelDuplicateHandler = Symbol('panelDuplicateHandler');
export const tabsDragOverHandler = Symbol('tabsDragOverHandler');
export const tabsDragLeaveHandler = Symbol('tabsDragLeaveHandler');
export const tabsDropHandler = Symbol('tabsDropHandler');
export const resetReorderState = Symbol('resetReorderState');
export const rearrangeReorder = Symbol('rearrangeReorder');
export const reorderDragover = Symbol('reorderDragover');
export const getReorderDdx = Symbol('getReorderDdx');
export const getReorderedItem = Symbol('getReorderedItem');
export const updateTabsReorder = Symbol('updateTabsReorder');
export const createDropPointer = Symbol('createDropPointer');
export const removeDropPointer = Symbol('removeDropPointer');
export const dropPointerReference = Symbol('dropPointerReference');
export const dropPointer = Symbol('dropPointer');
export const newTabDragover = Symbol('newTabDragover');
export const resetReorderChildren = Symbol('resetReorderChildren');
export const computeDropOrder = Symbol('computeDropOrder');
export const transportHandler = Symbol('transportHandler');

export class ArcRequestWorkspaceElement extends ArcResizableMixin(EventsTargetMixin(LitElement)) {
  static get styles() {
    return elementStyles;
  }

  static get properties() {
    return { 
      /** 
       * The index of the selected panel. This is the index of the tab to be selected.
       */
      selected: { type: Number, reflect: true },
      /** 
       * Enables the compatibility with Anypoint styling.
      */
      compatibility: { type: Boolean },
      /**
       * Redirect URL for the OAuth2 authorization.
       * If can be also set by dispatching `oauth2-redirect-url-changed`
       * with `value` property on the `detail` object.
       */
      oauth2RedirectUri: { type: String },
      /** 
       *  When set, this identifier will be passed to the read and write workspace events
       */
      backendId: { type: String },

      /** 
       * When set it requests workspace state read when connected to the DOM.
       */
      autoRead: { type: Boolean },
      /** 
       * A timeout after which the actual store workspace event is dispatched.
       * Default to 500 (ms).
       */
      storeTimeout: { type: Number },
      /** 
       * When set it renders the send request button on the request editor
       */
      renderSend: { type: Boolean },
    };
  }

  constructor() {
    super();
    /**  
     * @type {WorkspaceTab[]}
     * Mote, tabs are in sync with workspace requests array
     */
    this[tabsValue] = [];
    /** 
     * @type {WorkspaceRequest[]}
     */
    this[requestsValue] = [];

    this.compatibility = false;
    /** 
     * @type {number}
     */
    this.selected = undefined;
    /** 
     * @type {string}
     */
    this.oauth2RedirectUri = undefined;
    /** 
     * @type {DomainWorkspace}
     */
    this[workspaceValue] = {
      kind: 'ARC#DomainWorkspace',
      id: v4(),
    };
    /** 
     * @type {string}
     */
    this.backendId = undefined;
    this.autoRead = false;
    this.storeTimeout = 500;
    this.renderSend = false;

    this[transportHandler] = this[transportHandler].bind(this);
  }

  connectedCallback() {
    super.connectedCallback();
    if (this.autoRead) {
      this.restore();
    }

    this.addEventListener(TransportEventTypes.request, this[transportHandler]);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener(TransportEventTypes.request, this[transportHandler]);
  }

  /**
   * A handler for the request transport event.
   * It updates request configuration to add configuration from the workspace.
   * @param {ApiTransportEvent} e
   */
  [transportHandler](e) {
    let rConfig = e.detail.request.config;
    if (!rConfig || (rConfig && rConfig.enabled === false)) {
      rConfig = {
        enabled: true,
      };
    }
    const wConfig = this[workspaceValue].config;
    const enabled = rConfig.enabled || !!wConfig;
    const result = /** @type RequestConfig */ ({
      ...(wConfig || {}),
      ...(rConfig || {}),
      enabled,
    });
    if (result.timeout && typeof result.timeout === 'string') {
      result.timeout = Number(result.timeout);
    }
    e.detail.request.config = result;
  }

  /**
   * Dispatches the workspace restore event and sets the workspace data.
   * If the event does not return workspace an empty workspace is created.
   */
  async restore() {
    this.clear();
    const result = await WorkspaceEvents.read(this, this.backendId);
    if (result) {
      if (!result.id) {
        result.id = v4();
      }
      if (Array.isArray(result.requests)) {
        result.requests = result.requests.map((request) => BodyProcessor.restoreRequest(request));
      }
      this[workspaceValue] = result;
    } else {
      this[workspaceValue] = /** @type DomainWorkspace */ ({
        kind: 'ARC#DomainWorkspace',
        id: v4(),
      });
    }
    this.processWorkspace(this[workspaceValue]);
    await this.requestUpdate();
    this.notifyResize();
  }

  /**
   * Dispatches an event to store the current workspace.
   */
  async store() {
    if (this[storeTimeoutValue]) {
      clearTimeout(this[storeTimeoutValue]);
    }
    this[storeTimeoutValue] = setTimeout(() => this[storeWorkspace](), this.storeTimeout);
  }

  async [storeWorkspace]() {
    this[storeTimeoutValue] = undefined;
    this[syncWorkspaceRequests]();
    const workspace = this[workspaceValue];
    const ps = workspace.requests.map((request) => BodyProcessor.stringifyRequest(request));
    const requests = await Promise.all(ps);
    workspace.requests = requests;
    await WorkspaceEvents.write(this, workspace, this.backendId);
  }

  /**
   * A function that updates workspace requests array to reflect the current order and properties of the panels.
   */
  [syncWorkspaceRequests]() {
    const result = [];
    const tabs = this[tabsValue];
    const requests = this[requestsValue];
    tabs.forEach((tab) => {
      const request = requests.find((item) => item.tab === tab.id);
      if (request) {
        result.push(request.request)
      }
    });
    this[workspaceValue].requests = result;
  }

  /**
   * Updates local properties from the workspace state file.
   * @param {DomainWorkspace} workspace
   */
  processWorkspace(workspace) {
    this[restoreRequests](workspace.requests);
    if (typeof workspace.selected === 'number') {
      this.selected = workspace.selected;
    } else {
      this.selected = 0;
    }
  }

  /**
   * @param {(ArcBaseRequest|ARCSavedRequest|ARCHistoryRequest)[]} requests
   */
  [restoreRequests](requests) {
    if (!Array.isArray(requests) || !requests.length) {
      this.addEmpty();
      return;
    }
    requests.forEach((request) => this.add(request, { noAutoSelect: true, skipPositionCheck: true, skipUpdate: true, skipStore: true,}));
  }

  /**
   * Adds new request to the workspace.
   * @param {ArcBaseRequest|ARCSavedRequest|ARCHistoryRequest} request
   * @param {AddRequestOptions} [options={}] Append options
   * @returns {number} The index at which the request was inserted.
   */
  add(request, options={}) {
    let index = options.skipPositionCheck ? -1 : this.findEmptyPosition();
    let tab;
    if (index !== -1) {
      this[requestsValue][index].request = request;
      this[requestsValue][index] = { ...this[requestsValue][index] };
      tab = this[requestsValue][index].tab;
      this[updateTab](tab, request);
    } else {
      tab = this[addTab](request);
      const info = /** @type WorkspaceRequest */ ({
        id: v4(),
        request,
        tab,
      });
      const length = this[requestsValue].push(info);
      index = length - 1;
    }
    
    if (!options.noAutoSelect) {
      this.selectByTabId(tab);
    }
    if (!options.skipUpdate) {
      this.requestUpdate();
    }
    if (!options.skipStore) {
      this.store();
    }
    return index;
  }

  /**
   * Adds an empty request to the workspace.
   * @returns {number} The index at which the request was inserted.
   */
  addEmpty() {
    return this.add({
      method: 'GET',
      url: 'http://'
    });
  }

  /**
   * Adds a request at specific position moving the request at the position to the right.
   * If the position is out of `activeRequests` bounds.
   * 
   * @param {number} index The position of the tab where to put the request
   * @param {ArcBaseRequest|ARCSavedRequest|ARCHistoryRequest} request Request object to put.
   * @param {AddRequestOptions=} options Add request options
   * 
   * @returns {number} The position at which the tab was inserted. It might be different than requested when the index is out of bounds.
   */
  addAt(index, request, options={}) {
    const tabs = this[tabsValue];
    if (index >= tabs.length) {
      return this.add(request, options);
    }
    const tab = this[createTab](request);
    tabs.splice(index, 0, tab);
    const info = /** @type WorkspaceRequest */ ({
      id: v4(),
      request,
      tab: tab.id,
    });
    const length = this[requestsValue].push(info);
    this.requestUpdate();
    if (!options.noAutoSelect) {
      this.selectByTabId(tab.id);
    }
    if (!options.skipStore) {
      this.store();
    }
    return length - 1;
  }

  /**
   * Adds a request at specific position moving the request at the position to the right.
   * If the position is out of `activeRequests` bounds.
   * 
   * @param {number} index The position of the tab where to put the request
   * @param {string} type The request type
   * @param {string} id The request data store id
   * @param {AddRequestOptions=} options Add request options
   * 
   * @returns {Promise<number>} The position at which the tab was inserted. It might be different than requested when the index is out of bounds.
   */
  async addAtByRequestId(index, type, id, options) {
    const request = await ArcModelEvents.Request.read(this, type, id);
    return this.addAt(index, request, options);
  }

  /**
   * Appends request by its datastore id.
   * @param {string} type Request type: `saved` or `history`.
   * @param {string} id The data store id
   * @returns {Promise<number>} The position at which the request has been added.
   */
  async addByRequestId(type, id) {
    const request = await ArcModelEvents.Request.read(this, type, id);
    const index = this.findRequestIndex(request._id);
    if (index === -1) {
      return this.add(request);
    }
    const tab = this[tabsValue][index];
    const existing = this[requestsValue].find((item) => item.tab === tab.id);
    existing.request = request;
    const typed = /** @type ARCSavedRequest */ (request);
    tab.label = this[readTabLabel](typed);
    this.selected = index;
    this[workspaceValue].selected = index;
    this.requestUpdate();
    this.store();
    return index;
  }

  /**
   * Appends requests by their datastore id.
   * @param {string} type Request type: `saved` or `history`.
   * @param {string[]} ids The data store id
   * @returns {Promise<number>} The position at which the last request has been added.
   */
  async addByRequestIds(type, ids) {
    const requests = await ArcModelEvents.Request.readBulk(this, type, ids);
    let result = -1;
    requests.forEach((request) => {
      const index = this.findRequestIndex(request._id);
      if (index === -1) {
        result = this.add(request, { noAutoSelect: true, skipPositionCheck: true, skipStore: true, skipUpdate: true });
      } else {
        const tab = this[tabsValue][index];
        const existing = this[requestsValue].find((item) => item.tab === tab.id);
        existing.request = request;
        const typed = /** @type ARCSavedRequest */ (request);
        tab.label = this[readTabLabel](typed);
        result = index;
      }
    });
    
    this.selected = result;
    this[workspaceValue].selected = this.selected;
    this.requestUpdate();
    this.store();
    return result;
  }

  /**
   * Replaces current workspace with the request passed in the argument.
   * @param {string} type A request type. `history` or `saved`
   * @param {string} id Request id 
   * @return {Promise<number>}
   */
  replaceByRequestId(type, id) {
    this.clear();
    return this.addByRequestId(type, id);
  }

  /**
   * Replaces current workspace with requests passed in the argument.
   * @param {string} type A request type. `history` or `saved`
   * @param {string[]} ids Request ids 
   * @return {Promise<number>}
   */
  replaceByRequestIds(type, ids) {
    this.clear();
    return this.addByRequestIds(type, ids);
  }

  /**
   * @param {string} id The project id to append
   * @param {number=} index The position at which to start appending the projects
   * @returns {Promise<number>} the index of the last inserted item or -1 if none inserted.
   */
  async appendByProjectId(id, index) {
    const project = await ArcModelEvents.Project.read(this, id);
    if (!Array.isArray(project.requests) || !project.requests.length) {
      return -1;
    }
    const requests = await ArcModelEvents.Request.readBulk(this, 'saved', project.requests, {
      preserveOrder: true,
    });
    let lastIndex;
    let hasIndex = typeof index === 'number';
    const tabs = this[tabsValue];
    if (hasIndex && index >= tabs.length) {
      hasIndex = false;
    }
    const opts = {
      skipPositionCheck: true,
      noAutoSelect: true,
      skipStore: true, 
      skipUpdate: true,
    };
    requests.forEach((request, i) => {
      if (!request) {
        // request does not exist in the store anymore
        return;
      }
      if (hasIndex) {
        lastIndex = index + i;
        this.addAt(lastIndex, request, opts);
      } else {
        lastIndex = this.add(request, opts);
      }
    });

    this.selected = lastIndex;
    this[workspaceValue].selected = this.selected;
    this.requestUpdate();
    this.store();
    return lastIndex;
  }

  /**
   * Replaces the current workspace with the project
   * @param {string} id The project id in the data store
   * @returns {Promise<number>} the index of the last inserted item or -1 if none inserted.
   */
  async replaceByProjectId(id) {
    this.clear();
    return this.appendByProjectId(id);
  }
  
  /**
   * Removes a request for given index in the tabs array.
   * @param {number} index THe tab index to remove.
   * @param {boolean=} ignoreSelection When set it does not updates the selection state.
   */
  removeRequest(index, ignoreSelection=false) {
    const tabs = this[tabsValue];
    const tab = tabs[index];
    if (!tab) {
      return;
    }
    tabs.splice(index, 1);
    const requests = this[requestsValue];
    const requestIndex = requests.findIndex((item) => item.tab === tab.id);
    if (requestIndex !== -1) {
      requests.splice(requestIndex, 1);
    }
    this.requestUpdate();
    this.store();
    if (ignoreSelection) {
      return;
    }
    let i = index;
    if (i === this.selected) {
      i -= 1;
      if (i < 0) {
        i = 0;
      }
      if (i === 0) {
        this.selected = undefined;
      }
      this.selected = i;
    } else if (this.selected > i) {
      this.selected -= 1;
    }
    if (!tabs.length) {
      requestAnimationFrame(() => this.addEmpty());
    }
    this[workspaceValue].selected = this.selected;
    this.store();
  }

  /**
   * Finds first position where the request is empty.
   * @return {Number} Index of empty request or `-1`.
   */
  findEmptyPosition() {
    const requests = this[requestsValue];
    let result = -1;
    if (!Array.isArray(requests) || !requests.length) {
      return result;
    }
    result = requests.findIndex((item) => (!item.request.url || item.request.url === 'http://') && !item.request.headers && !item.request.payload);
    return result;
  }

  /**
   * Selects a tab by its id.
   * @param {string} id Tab id.
   */
  selectByTabId(id) {
    const tabIndex = this[tabsValue].findIndex((item) => item.id === id);
    if (this.selected !== tabIndex) {
      this.selected = tabIndex;
      this[workspaceValue].selected = this.selected;
      this.store();
    }
  }

  /**
   * Duplicates the tab at a position
   * @param {number} index Yhe index of the tab to duplicate
   */
  duplicateTab(index) {
    const tabs = this[tabsValue];
    const tab = tabs[index];
    if (!tab) {
      return;
    }
    const requests = this[requestsValue];
    const request = requests.find((item) => item.tab === tab.id);
    const copy = /** @type ARCSavedRequest */ ({ ...request.request });
    delete copy._id;
    delete copy._rev;
    delete copy.name;
    delete copy.driveId;
    delete copy.projects;
    delete copy.type;
    this.add(copy, {
      skipPositionCheck: true,
    });
  }

  /**
   * Finds requests index in the tabs array by its data store id.
   * This does not find not saved requests.
   *
   * @param {string} requestId The data store id of the request
   * @return {number} Request index or -1 if not found.
   */
  findRequestIndex(requestId) {
    if (!requestId) {
      return -1;
    }
    const requests = this[requestsValue];
    const item = requests.find((request) => /** @type ARCSavedRequest */ (request.request)._id === requestId);
    if (!item) {
      return -1;
    }
    return this[tabsValue].findIndex((tab) => tab.id === item.tab);
  }

  /**
   * @returns {ArcRequestPanelElement|undefined}
   */
  getActivePanel() {
    const tab = this[tabsValue][this.selected];
    if (!tab) {
      return undefined;
    }
    const { id } = tab
    return /** @type ArcRequestPanelElement */ (this.shadowRoot.querySelector(`arc-request-panel[data-tab="${id}"]`));
  }

  /**
   * Runs the currently active tab.
   */
  sendCurrent() {
    const panel = this.getActivePanel();
    panel.send();
  }
  
  /**
   * Aborts the currently selected panel
   */
  abortCurrent() {
    const panel = this.getActivePanel();
    panel.abort();
  }

  /**
   * Aborts the currently selected panel
   */
  clearCurrent() {
    const panel = this.getActivePanel();
    panel.clear();
  }

  /**
   * Aborts all running requests
   */
  abortAll() {
    const nodes = this.shadowRoot.querySelectorAll('arc-request-panel');
    Array.from(nodes).forEach((panel) => {
      if (panel.loading) {
        panel.abort();
      }
    });
  }

  /**
   * Appends Project/Saved/History export data directly to workspace.
   * @param {ArcExportObject} detail Arc import object with normalized import structure.
   */
  appendImportRequests(detail) {
    let requests;
    switch (detail.kind) {
      case 'ARC#ProjectExport':
      case 'ARC#SavedExport':
        requests = detail.requests;
        break;
      case 'ARC#HistoryExport':
        requests = detail.history;
        break;
      default: 
    }
    if (!Array.isArray(requests) || !requests.length) {
      return;
    }
    requests.forEach((item) => this.add(item));
  }

  /**
   * Triggers the save current request flow.
   */
  saveOpened() {
    const panel = this.getActivePanel();
    panel.saveAction();
  }

  /**
   * Triggers the "save as..." action on the current request.
   */
  saveAsOpened() {
    const panel = this.getActivePanel();
    panel.saveAsAction();
  }

  /**
   * Closes currently selected tab.
   */
  closeActiveTab() {
    const panel = this.getActivePanel();
    const tabId = panel.dataset.tab;
    const index = this[tabsValue].findIndex((tab) => tab.id === tabId);
    this.removeRequest(index);
  }

  /**
   * Adds a new tab to the tabs list.
   * Note, this function does not call `requestUpdate()`.
   * @param {ArcBaseRequest|ARCSavedRequest|ARCHistoryRequest} request The request that is associated with the tab
   * @returns {string} The id of the created tab
   */
  [addTab](request) {
    const tab = this[createTab](request);
    this[tabsValue].push(tab);
    return tab.id;
  }

  /**
   * Creates a definition of a tab.
   * 
   * @param {ArcBaseRequest|ARCSavedRequest|ARCHistoryRequest} request The request that is associated with the tab
   * @returns {WorkspaceTab} The definition of a tab.
   */
  [createTab](request) {
    const typed = /** @type ARCSavedRequest */ (request);
    const label = this[readTabLabel](typed);
    return {
      id: v4(),
      label,
    };
  }

  /**
   * Updates the tab value from the request.
   * Note, this function does not call `requestUpdate()`.
   * 
   * @param {string} id The id of the tab to update
   * @param {ArcBaseRequest|ARCSavedRequest|ARCHistoryRequest} request The request that is associated with the tab
   */
  [updateTab](id, request) {
    const tab = this[tabsValue].find((item) => item.id === id);
    if (!tab) {
      return;
    }
    const typed = /** @type ARCSavedRequest */ (request);
    tab.label = this[readTabLabel](typed);
  }

  /**
   * @param {ARCSavedRequest} request
   * @returns {string} The label for the tab for a given request.
   */
  [readTabLabel](request) {
    if (request.name) {
      return request.name;
    }
    if (request.url && request.url !== 'http://' && request.url.length > 6) {
      return request.url;
    }
    return 'New request';
  }

  /**
   * Clears the workspace
   */
  clear() {
    this[tabsValue] = [];
    this[requestsValue] = /** @type WorkspaceRequest[] */ ([]);
    this.selected = undefined;
    this[workspaceValue].selected = undefined;
    this.store();
  }

  /**
   * Handler for click event on the request close button.
   * @param {PointerEvent} e
   */
  [closeRequestHandler](e) {
    e.preventDefault();
    e.stopPropagation();
    const node = /** @type HTMLElement */ (e.currentTarget);
    const index = Number(node.dataset.index);
    if (Number.isNaN(index)) {
      return;
    }
    this.removeRequest(index);
  }

  /**
   * The handler for the tabs selection change event
   * @param {Event} e
   */
  async [tabsSelectionHandler](e) {
    const node = /** @type WorkspaceTabsElement */ (e.target);
    this.selected = Number(node.selected);
    this[workspaceValue].selected = this.selected;
    this.store();
    await this.updateComplete;
    this.notifyResize();
  }

  [requestChangeHandler](e) {
    const panel = /** @type ArcRequestPanelElement */ (e.target);
    const request = panel.editorRequest;
    const tabId = panel.dataset.tab;
    const index = Number(panel.dataset.index);
    this[requestsValue][index].id = request.id;
    this[requestsValue][index].request = request.request;
    this[updateTab](tabId, request.request);
    this.requestUpdate();
    this.store();
  }

  /**
   * @param {DragEvent} e
   */
  [tabDragStartHandler](e) {
    const node = /** @type WorkspaceTabElement */ (e.currentTarget);
    const index = Number(node.dataset.index);
    if (Number.isNaN(index)) {
      return;
    }
    const tabs = this[tabsValue];
    const tab = tabs[index];
    if (!tab) {
      return;
    }
    const requests = this[requestsValue];
    const requestIndex = requests.findIndex((item) => item.tab === tab.id);
    if (requestIndex === -1) {
      return;
    }
    const request = requests[requestIndex];
    const typed = /** @type ARCSavedRequest */ (request.request);
    const dt = e.dataTransfer;
    if (typed._id) {
      dt.setData('arc/id', typed._id);
      dt.setData('arc/type', typed.type);
      if (typed.type === 'history') {
        dt.setData('arc/history', '1');
      } else if (typed.type === 'saved') {
        dt.setData('arc/saved', '1');
      }
    }
    dt.setData('arc/request', '1');
    dt.setData('arc/source', this.localName);
    dt.setData('arc-source/request-workspace', '1');
    dt.effectAllowed = 'copyMove';

    this[resetReorderState]()
    this[reorderInfo].type = 'track';
    this[reorderInfo].dragElement = node;
    this[reorderInfo].dragIndex = index;
    setTimeout(() => {
      node.style.visibility = 'hidden';
    });
  }

  /**
   * @param {DragEvent} e
   */
  [tabDragEndHandler](e) {
    if (!this[reorderInfo] || this[reorderInfo].type !== 'track') {
      return;
    }
    const toIdx = this[rearrangeReorder]();
    this[resetReorderChildren]();
    if (typeof toIdx === 'number') {
      this.selected = toIdx;
      this[workspaceValue].selected = this.selected;
      this.store();
      this.notifyResize();
    }
    this[resetReorderState]();
    const tab = /** @type WorkspaceTabElement */ (e.currentTarget);
    tab.style.visibility = 'visible';
  }

  /**
   * Resets state of the reorder info object.
   */
  [resetReorderState]() {
    this[reorderInfo] = {
      type: 'start',
      dragElement: undefined,
      dragIndex: undefined,
      overIndex: undefined,
      moves: [],
    };
  }

  /**
   * Resets styles of anypoint-tabs that has been moved during reorder action.
   */
  [resetReorderChildren]() {
    const children = this.shadowRoot.querySelectorAll('workspace-tab');
    Array.from(children).forEach((tab) => {
      tab.style.transform = '';
      tab.classList.remove('moving');
    });
  }

  /**
   * Moves a tab to corresponding position when drag finishes.
   * @return {number|undefined} Position where the request has been moved to.
   */
  [rearrangeReorder]() {
    const info = this[reorderInfo];
    const fromIdx = info.dragIndex;
    let toIdx;
    const items = this[tabsValue];
    if (fromIdx >= 0 && info.overIndex >= 0) {
      toIdx = info.overIndex;
      const item = items.splice(fromIdx, 1)[0];
      items.splice(toIdx, 0, item);
    }
    this[tabsValue] = items;
    this.requestUpdate();
    return toIdx;
  }

  /**
   * @param {DragEvent} e
   */
  [tabsDragOverHandler](e) {
    const dt = e.dataTransfer;
    const types = [...dt.types];
    if (!types.includes('arc/request') && !types.includes('arc/project')) {
      return;
    }
    e.preventDefault();
    if (types.includes('arc-source/request-workspace')) {
      e.dataTransfer.dropEffect = 'move';
      this[reorderDragover](e);
    } else {
      e.dataTransfer.dropEffect = 'copy';
      this[newTabDragover](e);
    }
  }

  /**
   * The handler for `dragleave` event on this element. If the dragged item is 
   * compatible then it hides the drop message.
   * 
   * @param {DragEvent} e
   */
  [tabsDragLeaveHandler](e) {
    const dt = e.dataTransfer;
    const types = [...dt.types];
    if (!types.includes('arc/request') && !types.includes('arc/project')) {
      return;
    }
    e.preventDefault();
    this[removeDropPointer]();
    this[dropPointerReference] = undefined;
  }

  /**
   * @param {DragEvent} e
   */
  [tabsDropHandler](e) {
    if (this[reorderInfo] && this[reorderInfo].type === 'track') {
      // This is reorder drop
      return;
    }
    const dt = e.dataTransfer;
    const types = [...dt.types];
    const isRequest = types.includes('arc/request');
    const isProject = types.includes('arc/project');
    if (!isRequest && !isProject) {
      return;
    }
    e.preventDefault();
    this[removeDropPointer]();
    if (isRequest) {
      const type = dt.getData('arc/type');
      const id = dt.getData('arc/id');
      if (e.ctrlKey || e.metaKey) {
        this.clear();
        this.addByRequestId(type, id);
      } else {
        const order = this[computeDropOrder]();
        this.addAtByRequestId(order, type, id);
      }
    } else {
      const id = dt.getData('arc/id');
      if (e.ctrlKey || e.metaKey) {
        this.replaceByProjectId(id);
      } else {
        const order = this[computeDropOrder]();
        this.appendByProjectId(id, order);
      }
    }
    this[dropPointerReference] = undefined;
  }

  /**
   * Handles the `dragover` event when in reordering model flow.
   * It updates tabs position and sets variables later used to compute new tab position.
   * 
   * @param {DragEvent} e
   */
  [reorderDragover](e) {
    if (this[reorderInfo].type !== 'track') {
      return;
    }
    this[reorderInfo].moves.push({ x: e.clientX, y: e.clientY });
    const dragElement = this[getReorderedItem](e);
    if (!dragElement) {
      return;
    }
    const index = Number(dragElement.dataset.index);
    const ddx = this[getReorderDdx]();
    this[reorderInfo].dirOffset = ddx < 0 ? -1 : 0;
    const lastOverIndex = this[reorderInfo].overIndex || 0;
    const overIndex = index + this[reorderInfo].dirOffset;
    const start = Math.max(overIndex < lastOverIndex ? overIndex : lastOverIndex, 0);
    const end = index < lastOverIndex ? lastOverIndex : index;
    const draggedIndex = this[reorderInfo].dragIndex;
    this[updateTabsReorder](start, end, draggedIndex, overIndex);
    this[reorderInfo].overIndex = index;
  }

  /**
   * @returns {number} Delta of the last move compared to the previous move.
   */
  [getReorderDdx]() {
    const secondLast = this[reorderInfo].moves[this[reorderInfo].moves.length - 2];
    const lastMove = this[reorderInfo].moves[this[reorderInfo].moves.length - 1];
    let ddx = 0;
    if (secondLast) {
      ddx = lastMove.x - secondLast.x;
    }
    return ddx;
  }

  /**
   * Finds the top level item from the DOM repeater that has been marked as a draggable item.
   * The event can originate from child elements which shouldn't be dragged.
   *
   * @param {DragEvent} e
   * @return {WorkspaceTabElement|undefined} An element that is container for draggable items. Undefined if couldn't find.
   */
  [getReorderedItem](e)  {
    const elmName = 'WORKSPACE-TAB';
    const topTarget = /** @type WorkspaceTabElement */ (e.target);
    if (topTarget.nodeName === elmName) {
      return topTarget;
    }
    const path = e.composedPath();
    if (!path || !path.length) {
      return undefined;
    }
    return /** @type WorkspaceTabElement */ (path.find((node) => 
       /** @type WorkspaceTabElement */ (node).nodeName === elmName
    ));
  }

  /**
   * Updates position of the children in the `workspace-tabs` container while tracking an item.
   * 
   * @param {number} start Change start index.
   * @param {number} end Change end index.
   * @param {number} draggedIndex Index of the tab being dragged.
   * @param {number} overIndex Index of the tab being under the pointer.
   */
  [updateTabsReorder](start, end, draggedIndex, overIndex) {
    const children = this.shadowRoot.querySelectorAll('workspace-tab');
    const dragElement = children[draggedIndex];
    // eslint-disable-next-line no-plusplus
    for (let i = start; i <= end; i++) {
      const el = children[i];
      if (i !== draggedIndex) {
        let dir = 0;
        if (i > draggedIndex && i <= overIndex) {
          dir = -1;
        } else if (i > overIndex && i < draggedIndex) {
          dir = 1;
        }
        el.classList.add('moving');
        const offset = dir * dragElement.offsetWidth;
        el.style.transform = `translate3d(${offset}px, 0px, 0px)`;
      }
    }
  }

  /**
   * Removes drop pointer to shadow root.
   * @param {Element} ref A list item to be used as a reference point.
   */
  [createDropPointer](ref) {
    const rect = ref.getClientRects()[0];
    const div = document.createElement('div');
    div.className = 'drop-pointer';
    const ownRect = this.getClientRects()[0];
    let leftPosition = rect.x - ownRect.x;
    leftPosition -= 10; // some padding
    div.style.left = `${leftPosition}px`;
    this[dropPointer] = div;
    this.shadowRoot.appendChild(div);
  }

  [removeDropPointer]() {
    if (!this[dropPointer]) {
      return;
    }
    this.shadowRoot.removeChild(this[dropPointer]);
    this[dropPointer] = undefined;
    
  }

  /**
   * Computes index of the drop.
   * @return {Number} Index where to drop the object.
   */
  [computeDropOrder]() {
    const dropRef = this[dropPointerReference];
    let order;
    if (dropRef) {
      order = Number(dropRef.dataset.index);
    } else {
      order = this[tabsValue].length;
    }
    return order;
  }

  /**
   * Action to handle dragover event when not in reorder mode.
   * @param {DragEvent} e
   */
  [newTabDragover](e) {
    const path = e.composedPath();
    const item = /** @type HTMLElement */ (path.find((node) => /** @type HTMLElement */ (node).nodeName === 'WORKSPACE-TAB'));
    if (!item) {
      return;
    }
    const rect = item.getClientRects()[0];
    const aboveHalf = (rect.x + rect.width/2) > e.x;
    const ref = aboveHalf ? item : item.nextElementSibling;
    if (!ref || this[dropPointerReference] === ref) {
      return;
    }
    this[removeDropPointer]();
    this[dropPointerReference] = ref;
    this[createDropPointer](ref);
  }

  [addNewHandler](e) {
    this.addEmpty();
    e.currentTarget.blur();
  }

  /**
   * A handler for the `close` event dispatched by the request panel. Closes the panel.
   * @param {Event} e
   */
  [panelCloseHandler](e) {
    const node = /** @type HTMLElement */ (e.target);
    const { tab } = node.dataset;
    const tabs = this[tabsValue];
    const index = tabs.findIndex((item) => item.id === tab);
    this.removeRequest(index);
  }

  /**
   * A handler for the `duplicate` event dispatched by the request panel. 
   * @param {Event} e
   */
  [panelDuplicateHandler](e) {
    const node = /** @type HTMLElement */ (e.target);
    const { tab } = node.dataset;
    const tabs = this[tabsValue];
    const index = tabs.findIndex((item) => item.id === tab);
    this.duplicateTab(index);
  }

  render() {
    return html`
    ${this[tabsTemplate]()}
    ${this[panelsTemplate]()}
    `
  }

  /**
   * @returns {TemplateResult} The template for the tabs list
   */
  [tabsTemplate]() {
    const { selected } = this;
    const items = this[tabsValue];
    return html`
    <workspace-tabs
      class="tabs"
      id="tabs"
      .selected="${selected}"
      @selected="${this[tabsSelectionHandler]}"
      @dragover="${this[tabsDragOverHandler]}"
      @dragleave="${this[tabsDragLeaveHandler]}"
      @drop="${this[tabsDropHandler]}"
    >
      ${items.map((item, index) => this[tabTemplate](item, index))}
      <anypoint-icon-button
        class="add-request-button"
        @click="${this[addNewHandler]}"
        title="Add a new request to the workspace"
        aria-label="Activate to add new request"
        slot="suffix"
      >
        <arc-icon icon="add"></arc-icon>
      </anypoint-icon-button>
    </workspace-tabs>`;
  }

  /**
   * @param {WorkspaceTab} item
   * @param {number} index
   * @returns {TemplateResult} The template for the rendered request panel tab.
   */
  [tabTemplate](item, index) {
    // const { selected } = this;
    // const isSelected = selected === index;
    const classes = {
      // selected: isSelected,
      tab: true
    };
    return html`
    <workspace-tab
      data-index="${index}"
      draggable="true"
      class=${classMap(classes)}
      @dragstart="${this[tabDragStartHandler]}"
      @dragend="${this[tabDragEndHandler]}"
    >
      <span class="tab-name">${item.label}</span>
      <arc-icon class="close-icon" data-index="${index}" icon="close" @click="${this[closeRequestHandler]}"></arc-icon>
    </workspace-tab>
    <div class="tab-divider"></div>
    `;
  }

  /**
   * @returns {TemplateResult} The template for all rendered panels in the workspace.
   */
  [panelsTemplate]() {
    const { selected } = this;
    const tab = this[tabsValue][selected];
    const requests = this[requestsValue];
    const selectedTabId = tab && tab.id;
    return html`
    <section class="workspace-panels">
    ${requests.map((request, index) => this[panelTemplate](request, index, selectedTabId))}
    </section>
    `;
  }

  /**
   * @param {WorkspaceRequest} request The request to render
   * @param {number} index Request index in the requests array
   * @param {string} selectedTabId The id of the selected tab.
   * @returns {TemplateResult} The template for a request panel
   */
  [panelTemplate](request, index, selectedTabId) {
    const visible = request.tab === selectedTabId;
    return html`
    <arc-request-panel
      ?hidden="${!visible}"
      ?compatibility="${this.compatibility}"
      ?renderSend="${this.renderSend}"
      .editorRequest="${request}"
      .oauth2RedirectUri="${this.oauth2RedirectUri}"
      @change="${this[requestChangeHandler]}"
      @close="${this[panelCloseHandler]}"
      @duplicate="${this[panelDuplicateHandler]}"
      class="stacked"
      data-index="${index}"
      data-tab="${request.tab}"
      boundEvents
      tabindex="0"
    ></arc-request-panel>
    `;
  }
}
