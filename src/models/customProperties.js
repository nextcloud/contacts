/**
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

/**
 * Merge admin-defined custom property types (app config "customProperties",
 * validated server-side by CustomPropertiesService) into the property registry.
 *
 * @param {object} properties the rfcProps.properties registry to extend
 * @param {string[]} fieldOrder the rfcProps.fieldOrder list to extend
 * @param {object[]} customProperties sanitized entries from the initial state
 */
export function applyCustomProperties(properties, fieldOrder, customProperties) {
	if (!Array.isArray(customProperties)) {
		return
	}

	customProperties.forEach((custom) => {
		const name = typeof custom?.name === 'string' ? custom.name.toLowerCase() : ''
		if (!name.startsWith('x-') || properties[name]) {
			return
		}

		const model = {
			readableName: custom.label,
			icon: custom.icon || 'icon-detailed-name',
			force: custom.force === 'select' ? 'select' : 'text',
			multiple: custom.multiple === true,
			primary: custom.primary === true,
		}

		if (Array.isArray(custom.options) && custom.options.length > 0) {
			model.options = custom.options
			if (model.force === 'text') {
				// options on a text property are TYPE choices: preselect the
				// first one like the builtin tel/email/adr defaults do
				model.defaultValue = { value: '', type: [custom.options[0].id] }
			}
		}

		properties[name] = model
		fieldOrder.push(name)
	})
}
