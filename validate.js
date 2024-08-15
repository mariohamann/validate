class SlValidate extends HTMLElement {
  static get observedAttributes() {
    return ['custom-validity'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = `
      <div part="base">
        <slot></slot>
        <div part="error-message" aria-live="polite" hidden>
          <slot name="error-icon"></slot>
          <span part="error-text"></span>
        </div>
      </div>
    `;

    const inputQuery = this.getAttribute('input-query') || 'input, textarea, select';

    // First, try to find the input using the input-query attribute
    this.inputElement = this.querySelector(inputQuery);

    // If no input element was found using input-query, and there's only one child, use that child
    if (!this.inputElement) {
      const slot = this.shadowRoot.querySelector('slot');
      const assignedElements = slot.assignedElements();
      if (assignedElements.length === 1) {
        this.inputElement = assignedElements[0];
      }
    }

    this.errorMessageElement = this.shadowRoot.querySelector('[part="error-message"]');
    this.errorTextElement = this.shadowRoot.querySelector('[part="error-text"]');

    if (this.inputElement) {
      if (this.hasAttribute('live')) {
        this.inputElement.addEventListener(this.getAttribute('live') || 'input', () => this.validate());
      }

      this.inputElement.addEventListener('invalid', (event) => {
        if (this.hasAttribute('inline')) {
          event.preventDefault();
          this.validate(true);
        }
      });
    }
  }

  attributeChangedCallback(name) {
    if (name === 'custom-validity' && this.inputElement) {
      this.validate();
    }
  }

  validate(fromInvalidEvent = false) {
    const customValidity = this.getAttribute('custom-validity');
    const inline = this.hasAttribute('inline');

    if (customValidity) {
      this.inputElement.setCustomValidity(customValidity);
    } else {
      this.inputElement.setCustomValidity('');
    }

    const isValid = this.inputElement.checkValidity();

    if (isValid) {
      this.setAttribute('data-valid', '');
      this.removeAttribute('data-invalid');
    } else {
      this.setAttribute('data-invalid', '');
      this.removeAttribute('data-valid');
    }

    if (inline && !isValid) {
      const validityMessage = customValidity || this.inputElement.validationMessage;
      this.showInlineError(validityMessage);

      // Don't refocus the input on blur, just show the error
      if (fromInvalidEvent) {
        this.inputElement.focus();
      }
    } else {
      this.errorMessageElement.hidden = true;
    }

    if (!inline) {
      this.inputElement.reportValidity();
    }
  }

  showInlineError(message) {
    if (message) {
      this.errorTextElement.textContent = message;
      this.errorMessageElement.hidden = false;
    } else {
      this.errorMessageElement.hidden = true;
    }
  }
}

customElements.define('sl-validate', SlValidate);
