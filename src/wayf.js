/**
 * SPDX-FileCopyrightText: 2025 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { createApp } from "vue";
import { loadState } from "@nextcloud/initial-state";
import { translate as t, translatePlural as n } from "@nextcloud/l10n";
import Wayf from "./components/Ocm/Wayf.vue";

if (!document.body.id) {
  document.body.id = 'body-public';
}


document.addEventListener("DOMContentLoaded", () => {
  const props = loadState("contacts", "wayf");
  const app = createApp(Wayf, props);
  app.config.globalProperties.t = t;
  app.config.globalProperties.n = n;
  app.mount("#contacts-wayf");
});
import './css/wayf.scss'
