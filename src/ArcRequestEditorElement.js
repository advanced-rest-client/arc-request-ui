/* eslint-disable class-methods-use-this */
import { LitElement, html } from 'lit-element';
import { EventsTargetMixin } from '@advanced-rest-client/events-target-mixin';
import { v4 } from '@advanced-rest-client/uuid-generator';
import { ArcResizableMixin } from '@advanced-rest-client/arc-resizable-mixin';
import { HeadersParser } from '@advanced-rest-client/arc-headers';
import '@anypoint-web-components/anypoint-dropdown/anypoint-dropdown.js';
import '@anypoint-web-components/anypoint-listbox/anypoint-listbox.js';
import '@anypoint-web-components/anypoint-item/anypoint-icon-item.js';
import '@advanced-rest-client/arc-url/url-input-editor.js';
import '@advanced-rest-client/arc-icons/arc-icon.js';
import '@anypoint-web-components/anypoint-menu-button/anypoint-menu-button.js';
import '@anypoint-web-components/anypoint-tabs/anypoint-tabs.js';
import '@anypoint-web-components/anypoint-tabs/anypoint-tab.js';
import '@advanced-rest-client/arc-headers/headers-editor.js';
import '@advanced-rest-client/body-editor/body-editor.js';
import '@advanced-rest-client/arc-actions/arc-actions.js';
import '@advanced-rest-client/http-code-snippets/http-code-snippets.js';
import elementStyles from './styles/RequestEditor.js';
import requestMenuTemplate from './templates/RequestMenu.template.js';
import authorizationTemplates from './templates/RequestAuth.template.js';
import '../arc-request-config.js';

/** @typedef {import('@advanced-rest-client/arc-types').Actions.RunnableAction} RunnableAction */
/** @typedef {import('lit-element').TemplateResult} TemplateResult */
/** @typedef {import('@anypoint-web-components/anypoint-listbox').AnypointListbox} AnypointListbox */
/** @typedef {import('@advanced-rest-client/arc-types').ArcRequest.RequestAuthorization} RequestAuthorization */
/** @typedef {import('@advanced-rest-client/arc-types').ArcRequest.RequestUiMeta} RequestUiMeta */
/** @typedef {import('@advanced-rest-client/arc-types').ArcRequest.ArcEditorRequest} ArcEditorRequest */
/** @typedef {import('@advanced-rest-client/arc-types').ArcRequest.ArcBaseRequest} ArcBaseRequest */
/** @typedef {import('@advanced-rest-client/arc-types').ArcRequest.RequestConfig} RequestConfig */
/** @typedef {import('@advanced-rest-client/arc-types').RequestBody.BodyMeta} BodyMeta */
/** @typedef {import('@advanced-rest-client/arc-headers').HeadersEditorElement} HeadersEditorElement */
/** @typedef {import('@advanced-rest-client/body-editor').BodyEditorElement} BodyEditorElement */
/** @typedef {import('@advanced-rest-client/authorization-selector').AuthorizationSelectorElement} AuthorizationSelectorElement */
/** @typedef {import('@advanced-rest-client/authorization-method').AuthorizationMethod} AuthorizationMethod */
/** @typedef {import('@advanced-rest-client/arc-actions').ARCActionsElement} ARCActionsElement */
/** @typedef {import('@advanced-rest-client/arc-url').UrlInputEditorElement} UrlInputEditorElement */
/** @typedef {import('../index').ArcRequestConfigElement} ArcRequestConfigElement */

export const urlMetaTemplate = Symbol('urlMetaTemplate');
export const httpMethodSelectorTemplate = Symbol('httpMethodSelectorTemplate');
export const urlEditorTemplate = Symbol('urlEditorTemplate');
export const methodSelectorOpened = Symbol('methodSelectorOpened');
export const methodClosedHandler = Symbol('methodClosedHandler');
export const methodActivateHandler = Symbol('methodActivateHandler');
export const methodOptionsTemplate = Symbol('methodOptionsTemplate');
export const methodSelectorClickHandler = Symbol('methodSelectorClickHandler');
export const methodSelectorKeydownHandler = Symbol('methodSelectorKeydownHandler');
export const urlHandler = Symbol('urlHandler');
export const requestMenuHandler = Symbol('requestMenuHandler');
export const tabsTemplate = Symbol('tabsTemplate');
export const tabChangeHandler = Symbol('tabChangeHandler');
export const informPanelState = Symbol('informPanelState');
export const currentEditorTemplate = Symbol('currentEditorTemplate');
export const headersTemplate = Symbol('headersTemplate');
export const bodyTemplate = Symbol('bodyTemplate');
export const authorizationTemplate = Symbol('authorizationTemplate');
export const actionsTemplate = Symbol('actionsTemplate');
export const actionsUiHandler = Symbol('actionsUiHandler');
export const actionsHandler = Symbol('actionsHandler');
export const configTemplate = Symbol('configTemplate');
export const snippetsTemplate = Symbol('snippetsTemplate');
export const headersHandler = Symbol('headersHandler');
export const bodyHandler = Symbol('bodyHandler');
export const authorizationHandler = Symbol('authorizationHandler');
export const configHandler = Symbol('configHandler');
export const headersValue = Symbol('headersValue');
export const uiConfigValue = Symbol('uiConfigValue');

export const HttpMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'CONNECT', 'OPTIONS', 'TRACE'];
export const NonPayloadMethods = ['GET', 'HEAD'];

/**
 * An HTTP request message editor.
 * It allows to generate the basic HTTP request fields and configuration used in Advanced REST Client.
 */
export class ArcRequestEditorElement extends ArcResizableMixin(EventsTargetMixin(LitElement)) {
  static get styles() {
    return [elementStyles];
  }

  static get properties() {
    return { 
      /**
       * Request headers.
       */
      headers: { type: String },
      /** 
       * The Current content type value.
       */
      contentType: { type: String },
      /**
       * Body for the request.
       */
      payload: { type: String },
      /**
       * Current request URL
       */
      url: { type: String },
      /**
       * Current HTTP method
       */
      method: { type: String },
      /**
       * List of request actions to be performed when the response is received
       */
      responseActions: { type: Array },
      /**
       * List of request actions to be performed before request is send
       */
      requestActions: { type: Array },
      /**
       * When set it will display the UI to indicate that the request is being
       * send.
       */
      loadingRequest: { type: Boolean, reflect: true, },
      /**
       * Redirect URL for the OAuth2 authorization.
       * If can be also set by dispatching `oauth2-redirect-url-changed`
       * with `value` property on the `detail` object.
       */
      oauth2RedirectUri: { type: String },
      /**
       * Generated request ID when the request is sent. This value is reported
       * in send and abort events.
       * 
       * The `requestId` property is regenerated each time the `reset()` function is called.
       */
      requestId: { type: String },
      /**
       * When set the editor is in read only mode.
       */
      readOnly: { type: Boolean },
      /**
       * Enables compatibility with Anypoint platform
       */
      compatibility: { type: Boolean },
      /**
       * Enables material's outlined theme for inputs.
       */
      outlined: { type: Boolean },
      /**
       * A value to be passed to the OAuth 2 `authorizationUri` property in case
       * if current configuration has no value.
       * This is to be used as a default value.
       */
      oauth2AuthorizationUri: { type: String },
      /**
       * A value to be passed to the OAuth 2 `accessTokenUri` property in case
       * if current configuration has no value.
       * This is to be used as a default value.
       */
      oauth2AccessTokenUri: { type: String },
      /**
       * An index of currently opened tab.
       * @default 0
       */
      selectedTab: { type: Number },
      /** 
       * The authorization configuration for the current request.
       * May be null.
       */
      authorization: { type: Array },
      /** 
       * The editors configuration meta data
       */
      uiConfig: { type: Object },
      /** 
       * The request configuration that overrides application and workspace configuration.
       */
      config: { type: Object },
    };
  }

  /**
   * @returns {boolean} True when the request cannot have the payload on the message.
   */
  get isPayload() {
    return !NonPayloadMethods.includes(this.method);
  }

  /**
   * @returns {number} The number of currently enabled authorization methods.
   */
  get enabledAuthLength() {
    const { authorization=[] } = this;
    let cnt = 0;
    authorization.forEach((method) => {
      if (method.enabled) {
        cnt += 1;
      }
    });
    return cnt;
  }

  /**
   * @returns {number} The number of configured actions.
   */
  get actionsLength() {
    const { requestActions, responseActions } = this;
    let result = 0;
    if (Array.isArray(requestActions)) {
      result += requestActions.length;
    }
    if (Array.isArray(responseActions)) {
      result += responseActions.length;
    }
    return result;
  }

  get headers() {
    return this[headersValue];
  }

  set headers(value) {
    const old = this[headersValue];
    if (old === value) {
      return;
    }
    this[headersValue] = value;
    this.contentType = HeadersParser.contentType(value);
    this.requestUpdate();
  }

  /**
   * @returns {RequestUiMeta}
   */
  get uiConfig() {
    return this[uiConfigValue];
  }

  /**
   * @param {RequestUiMeta} value
   */
  set uiConfig(value) {
    const old = this[uiConfigValue];
    if (old === value) {
      return;
    }
    this[uiConfigValue] = value;
    this.requestUpdate();
    if (value && typeof value.selectedEditor === 'number') {
      this.selectedTab = value.selectedEditor;
    }
  }

  constructor() {
    super();
    this.reset();
    this.selectedTab = 0;
    this[methodSelectorOpened] = false;
  }

  /**
   * Resets the current state actively generating new EditorRequest object
   */
  reset() {
    /**
     * @type {string}
     */
    this.url = '';
    /**
     * @type {string}
     */
    this.method = 'GET';
    /**
     * @type {string | FormData | File | Blob | ArrayBuffer | Buffer}
     */
    this.payload = '';
    /**
     * @type {string}
     */
    this.headers = '';
    /** 
     * @type {RunnableAction[]}
     */
    this.responseActions = undefined;
    /** 
     * @type {RunnableAction[]}
     */
    this.requestActions = undefined;
    this.loadingRequest = false;
    this.readOnly = false;
    this.compatibility = false;
    this.outlined = false;
    /**
     * @type {string}
     */
    this.oauth2RedirectUri = undefined;
    /**
     * @type {string}
     */
    this.requestId = v4();
    /**
     * @type {string}
     */
    this.oauth2AuthorizationUri = undefined;
    /**
     * @type {string}
     */
    this.oauth2AccessTokenUri = undefined;
    /**
     * @type {RequestAuthorization[]}
     */
    this.authorization = undefined;
    /**
     * @type {RequestUiMeta}
     */
    this.uiConfig = undefined;
    /**
     * @type {RequestConfig}
     */
    this.config = undefined;
  }

  /**
   * Serializes the request to the EditorRequest object with the `ArcBaseRequest` request on it.
   * @returns {ArcEditorRequest}
   */
  serialize() {
    const { requestId, url, method, headers, payload, requestActions, responseActions, authorization, uiConfig, config, } = this;
    const request = /** @type ArcBaseRequest */ ({
      url,
      method, 
      headers, 
      payload,
      actions: {
        request: requestActions,
        response: responseActions,
      },
      authorization,
      ui: uiConfig,
      config,
    });
    const result = /** @type ArcEditorRequest */ ({
      id: requestId,
      request,
    });

    return result;
  }

  /**
   * @param {KeyboardEvent} e
   */
  [methodSelectorKeydownHandler](e) {
    if (['Space', 'Enter', 'NumpadEnter', 'ArrowDown'].includes(e.code)) {
      this[methodSelectorClickHandler]();
    }
  }

  async [methodSelectorClickHandler]() {
    this[methodSelectorOpened] = false;
    await this.requestUpdate();
    this[methodSelectorOpened] = true;
    await this.requestUpdate();
  }

  /**
   * The handler for the method drop down list close event.
   */
  [methodClosedHandler]() {
    this[methodSelectorOpened] = false;
  }

  /**
   * The handler for the HTTP method drop down.
   * @param {CustomEvent} e
   */
  [methodActivateHandler](e) {
    this[methodSelectorOpened] = false;
    this.requestUpdate();
    const { selected } = e.detail;
    this.method = selected;
  }

  /**
   * The handler for the URL editor change event
   * @param {Event} e 
   */
  [urlHandler](e) {
    const panel = /** @type UrlInputEditorElement */ (e.target);
    const { value } = panel;
    this.url = value;
    this.notifyRequestChanged();
    this.notifyChanged('url', value);
  }

  [requestMenuHandler](e) {
    const node = /** @type AnypointListbox */ (e.target);
    const { selectedItem } = node;
    if (!selectedItem) {
      return;
    }
    const { action } =  selectedItem.dataset;
    switch (action) {
      case 'clear': this.reset(); break;
      case 'save':
      case 'export':
      case 'details':
      case 'close':
      case 'duplicate':
        this.dispatchEvent(new CustomEvent(action));
        break;
      default: 
        // eslint-disable-next-line no-console
        console.error('Implement me')
    }
  }

  [tabChangeHandler](e) {
    this.selectedTab = e.detail.value;
    this[informPanelState]();
    this.refreshEditors();
    if (!this.uiConfig) {
      this.uiConfig = {};
    }
    this.uiConfig.selectedEditor = this.selectedTab;
    this.notifyRequestChanged();
    this.notifyChanged('uiConfig', this.uiConfig);
  }

  /**
   * Gathers the UI state info and informs about the change.
   */
  [informPanelState]() {
    // const { collapseOpened, selectedTab, urlOpened } = this;
    // const data = {
    //   collapseOpened,
    //   selectedTab,
    //   urlOpened
    // };
    // this.state = data;
    // this.dispatchEvent(new CustomEvent('state', {
    //   detail: {
    //     value: data
    //   }
    // }));
  }

  /**
   * Refreshes payload and headers editors
   * state (code mirror) if currently selected.
   */
  async refreshEditors() {
    await this.updateComplete;
    this.notifyResize();
  }

  /**
   * The handler for the headers change event from the headers editor.
   * @param {Event} e
   */
  [headersHandler](e) {
    const node = /** @type HeadersEditorElement */ (e.target);
    const { value, model, source } = node;
    this[headersValue] = value;
    if (!this.uiConfig) {
      this.uiConfig = {};
    }
    if (!this.uiConfig.headers) {
      this.uiConfig.headers = {};
    }
    this.uiConfig.headers.model = model;
    this.uiConfig.headers.source = source;
    this.contentType = HeadersParser.contentType(value);
    this.notifyRequestChanged();
    this.notifyChanged('headers', value);
  }

  /**
   * The handler for the body editor change event
   * @param {Event} e
   */
  [bodyHandler](e) {
    const node = /** @type BodyEditorElement */ (e.target);
    const { value, model, selected } = node;
    this.payload = value;
    if (!this.uiConfig) {
      this.uiConfig = {};
    }
    if (!this.uiConfig.body) {
      this.uiConfig.body = {};
    }
    this.uiConfig.body.model = model;
    this.uiConfig.body.selected = selected;
    this.notifyRequestChanged();
    this.notifyChanged('payload', value);
  }

  /**
   * The handler for the authorization editor change event
   * @param {Event} e
   */
  [authorizationHandler](e) {
    const selector = /** @type AuthorizationSelectorElement */ (e.target);
    const { selected, type } = selector;
    const methods = /** @type AuthorizationMethod[] */ (selector.items);
    const result = /** @type RequestAuthorization[] */ ([]);
    methods.forEach((authMethod) => {
      const { type: mType } = authMethod;
      const config = (authMethod && authMethod.serialize) ? authMethod.serialize() : undefined;
      const enabled = type.includes(mType);
      result.push({
        config,
        type: mType,
        enabled,
      });
    });
    this.authorization = result;
    if (!this.uiConfig) {
      this.uiConfig = {};
    }
    if (!this.uiConfig.authorization) {
      this.uiConfig.authorization = {};
    }
    this.uiConfig.authorization.selected = /** @type number */ (selected);
    this.notifyRequestChanged();
    this.notifyChanged('authorization', result);
    this.requestUpdate();
  }

  /**
   * The handler for the actions editor change event
   * @param {CustomEvent} e
   */
  [actionsHandler](e) {
    const panel = /** @type ARCActionsElement */ (e.target);
    const { type } = e.detail;
    const list = type === 'request' ? panel.request : panel.response;
    const prop = type === 'request' ? 'requestActions' : 'responseActions';
    this[prop] = /** @type RunnableAction[] */ (list);
    const { selected } = panel;
    if (!this.uiConfig) {
      this.uiConfig = {};
    }
    if (!this.uiConfig.actions) {
      this.uiConfig.actions = {};
    }
    this.uiConfig.actions.selected = selected;
    this.notifyRequestChanged();
    this.notifyChanged(prop, list);
    this.requestUpdate();
  }

  /**
   * The handler for the actions editor UI state change event
   * @param {Event} e
   */
  [actionsUiHandler](e) {
    const panel = /** @type ARCActionsElement */ (e.target);
    const { selected } = panel;
    if (!this.uiConfig) {
      this.uiConfig = {};
    }
    if (!this.uiConfig.actions) {
      this.uiConfig.actions = {};
    }
    this.uiConfig.actions.selected = selected;
    this.notifyRequestChanged();
    this.notifyChanged('uiConfig', this.uiConfig);
  }

  /**
   * The handler for the config editor change event
   * @param {Event} e
   */
  [configHandler](e) {
    const node = /** @type ArcRequestConfigElement */ (e.target);
    this.config = node.config;
    this.notifyRequestChanged();
    this.notifyChanged('config', this.config);
  }

  /**
   * Called when a value on one of the editors change.
   * Dispatches non-bubbling `change` event.
   */
  notifyRequestChanged() {
    this.dispatchEvent(new CustomEvent('change'));
  }

  /**
   * Called to notify listeners about a particular property change
   * 
   * @param {string} type The property that changed. The resulting event type is the combination of this value and the `change` suffix.
   * @param {any} value The value of the changed property
   */
  notifyChanged(type, value) {
    this.dispatchEvent(new CustomEvent(`${type}change`, {
      detail: {
        value
      }
    }));
  }

  render() {
    return html`
    <div class="content">
      ${this[urlMetaTemplate]()}
      ${this[tabsTemplate]()}
      ${this[currentEditorTemplate]()}
    </div>
    `;
  }

  /**
   * @returns {TemplateResult} The template for the top line with method selector, URL, and options.
   */
  [urlMetaTemplate]() {
    return html`
    <div class="url-meta">
      ${this[httpMethodSelectorTemplate]()}
      ${this[urlEditorTemplate]()}
      ${requestMenuTemplate(this[requestMenuHandler], this.compatibility)}
    </div>
    `;
  }

  /**
   * @returns {TemplateResult} The template for the HTTP method selector
   */
  [httpMethodSelectorTemplate]() {
    const { method } = this;
    return html`
    <div 
      class="method-selector"
      tabindex="0"
      @click="${this[methodSelectorClickHandler]}"
      @keydown="${this[methodSelectorKeydownHandler]}"
    >
      <span class="label">${method}</span>
      <arc-icon icon="expandMore"></arc-icon>
    </div>
    <anypoint-dropdown 
      .opened="${this[methodSelectorOpened]}" 
      .positionTarget="${this}" 
      verticalAlign="top"
      @closed="${this[methodClosedHandler]}"
      @activate="${this[methodActivateHandler]}"
    >
      <anypoint-listbox 
        fallbackSelection="GET" 
        attrForSelected="data-method" 
        slot="dropdown-content" 
        selectable="anypoint-icon-item"
        class="method-list"
      >
        ${this[methodOptionsTemplate]()}
      </anypoint-listbox>
    </anypoint-dropdown>
    `;
  }

  /**
   * @returns {TemplateResult[]} The templates for each supported HTTP methods
   */
  [methodOptionsTemplate]() {
    const { compatibility } = this;
    return HttpMethods.map((method) => html`
    <anypoint-icon-item 
      ?compatibility="${compatibility}" 
      data-method="${method}"
    >
      <div slot="item-icon" data-method="${method.toLocaleLowerCase()}" class="http-label"></div>
      ${method}
    </anypoint-icon-item>`);
  }

  /**
   * @returns {TemplateResult} The template for the HTTP URL editor
   */
  [urlEditorTemplate]() {
    const { url='', outlined, compatibility } = this;
    return html`
    <url-input-editor
      ?compatibility="${compatibility}"
      ?outlined="${outlined}"
      .value="${url}"
      @change="${this[urlHandler]}"
    ></url-input-editor>
    `;
  }

  /**
   * @returns {TemplateResult} The template for the request editor tabs
   */
  [tabsTemplate]() {
    const {
      isPayload,
      compatibility,
      selectedTab,
      enabledAuthLength,
      actionsLength,
    } = this;
    return html`
    <anypoint-tabs
      .selected="${selectedTab}"
      ?compatibility="${compatibility}"
      @selected-changed="${this[tabChangeHandler]}"
      class="editor-tabs"
    >
      <anypoint-tab ?compatibility="${compatibility}">Headers</anypoint-tab>
      <anypoint-tab ?compatibility="${compatibility}" ?hidden="${!isPayload}">Body</anypoint-tab>
      <anypoint-tab ?compatibility="${compatibility}">Authorization <span class="tab-counter">${enabledAuthLength}</span></anypoint-tab>
      <anypoint-tab ?compatibility="${compatibility}">Actions <span class="tab-counter">${actionsLength}</span></anypoint-tab>
      <anypoint-tab ?compatibility="${compatibility}">Config</anypoint-tab>
      <anypoint-tab ?compatibility="${compatibility}">Code snippets</anypoint-tab>
    </anypoint-tabs>`;
  }

  /**
   * @returns {TemplateResult} The template for the current editor
   */
  [currentEditorTemplate]() {
    const { selectedTab, isPayload } = this;
    const headersVisible = selectedTab === 0;
    const bodyVisible = isPayload && selectedTab === 1;
    const authVisible = selectedTab === 2;
    const actionsVisible = selectedTab === 3;
    const configVisible = selectedTab === 4;
    const codeVisible = selectedTab === 5;

    return html`
    <div class="panel">
    ${this[headersTemplate](headersVisible)}
    ${this[bodyTemplate](bodyVisible)}
    ${this[authorizationTemplate](authVisible)}
    ${this[actionsTemplate](actionsVisible)}
    ${this[configTemplate](configVisible)}
    ${this[snippetsTemplate](codeVisible)}
    </div>
    `;
  }

  /**
   * @param {boolean} visible Whether the panel should not be hidden
   * @returns {TemplateResult} The template for the headers editor
   */
  [headersTemplate](visible) {
    const {
      compatibility,
      outlined,
      eventsTarget,
      headers,
      readOnly,
    } = this;
    return html`
    <headers-editor
      ?hidden="${!visible}"
      ?compatibility="${compatibility}"
      ?outlined="${outlined}"
      .eventsTarget="${eventsTarget}"
      .value="${headers}"
      @change="${this[headersHandler]}"
      ?readonly="${readOnly}"
    ></headers-editor>`;
  }

  /**
   * @param {boolean} visible Whether the panel should not be hidden
   * @returns {TemplateResult} The template for the body editor
   */
  [bodyTemplate](visible) {
    const {
      compatibility,
      outlined,
      payload,
      readOnly,
      contentType,
    } = this;
    return html`
    <body-editor
      ?hidden="${!visible}"
      ?compatibility="${compatibility}"
      ?outlined="${outlined}"
      ?readOnly="${readOnly}"
      .value="${payload}"
      .contentType="${contentType}"
      @change="${this[bodyHandler]}"
      @selected="${this[bodyHandler]}"
    ></body-editor>
    `;
  }

  /**
   * @param {boolean} visible Whether the panel should not be hidden
   * @returns {TemplateResult} The template for the authorization editor
   */
  [authorizationTemplate](visible) {
    const { oauth2RedirectUri, outlined, compatibility, authorization, uiConfig={} } = this;
    const { authorization: authUi={} } = uiConfig;
    const config = {
      oauth2RedirectUri,
      outlined, 
      compatibility,
      ui: authUi,
      hidden: !visible,
    };
    return authorizationTemplates(this[authorizationHandler], config, authorization);
  }

  /**
   * @param {boolean} visible Whether the panel should be rendered
   * @returns {TemplateResult|string} The template for the ARC request actions editor
   */
  [actionsTemplate](visible) {
    if (!visible) {
      return '';
    }
    const { requestActions, responseActions, outlined, compatibility } = this;
    return html`
    <arc-actions
      .request="${requestActions}"
      .response="${responseActions}"
      ?compatibility="${compatibility}"
      ?outlined="${outlined}"
      slot="content"
      @change="${this[actionsHandler]}"
      @selectedchange="${this[actionsUiHandler]}"
    ></arc-actions>
    `;
  }

  /**
   * @param {boolean} visible Whether the panel should be rendered
   * @returns {TemplateResult|string} The template for the ARC request config editor
   */
  [configTemplate](visible) {
    if (!visible) {
      return '';
    }
    const { config, outlined, compatibility, readOnly } = this;
    return html`
    <arc-request-config 
      .config="${config}"
      ?outlined="${outlined}"
      ?compatibility="${compatibility}"
      ?readOnly="${readOnly}"
      @change="${this[configHandler]}"
    ></arc-request-config>`;
  }

  /**
   * @param {boolean} visible Whether the panel should be rendered
   * @returns {TemplateResult|string} The template for the Code snippets
   */
  [snippetsTemplate](visible) {
    if (!visible) {
      return '';
    }
    const { url, method, headers, payload } = this;
    return html`
    <http-code-snippets
      scrollable
      .url="${url}"
      .method="${method}"
      .headers="${headers}"
      .payload="${payload}"
    ></http-code-snippets>
    `;
  }
}
