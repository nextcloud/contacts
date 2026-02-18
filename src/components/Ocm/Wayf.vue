<template>
  <NcGuestContent appName="contacts" class="wayf">
    <template #default>
      <div class="wayf-body">
        <div v-if="token !== ''">
          <h2>Providers</h2>
          <p>Where are you from?</p>
          <p>Please tell us your Cloud Provider.</p>
          <div v-if="federations">
            <NcTextField
              v-model="query"
              label="Type to search"
              type="search"
              id="wayf-search"
              name="search"
            >
              <template #icon><Magnify :size="20" /></template>
            </NcTextField>
            <div
              v-for="(providers, federation) in federations"
              :key="federation"
            >
              <h3>{{ federation }}</h3>
              <ul id="wayf-list" class="wayf-list">
                <NcListItem
                  v-for="p in filteredBy(providers)"
                  :key="p.fqdn"
                  :href="
                    p.inviteAcceptDialog +
                    '?token=' +
                    token +
                    '&providerDomain=' +
                    providerDomain
                  "
                  :name="p.name"
                  oneLine
                >
                  <template #icon>
                    <NcListItemIcon :name="p.name" :subname="p.fqdn">
                      <WeatherCloudyArrowRight :size="20" />
                    </NcListItemIcon>
                  </template>
                </NcListItem>
              </ul>
            </div>
          </div>
          <NcTextField
            v-model="manualProvider"
            label="No providers? No problem! Enter provider manually."
            type="text"
            id="wayf-manual"
            name="manual"
            @keyup.enter="goToManualProvider"
          >
            <template #icon><WeatherCloudyArrowRight :size="20" /></template>
          </NcTextField>
        </div>
        <div v-else>
          <p>You need a token for this feature to work.</p>
        </div>
      </div>
    </template>
  </NcGuestContent>
</template>

<script>
import axios from "@nextcloud/axios";
import Magnify from "vue-material-design-icons/Magnify.vue";
import WeatherCloudyArrowRight from "vue-material-design-icons/WeatherCloudyArrowRight.vue";
import { generateUrl } from "@nextcloud/router";
import {
  NcGuestContent,
  NcListItem,
  NcListItemIcon,
  NcTextField,
} from "@nextcloud/vue";

export default {
  name: "Wayf",
  components: {
    Magnify,
    NcGuestContent,
    NcListItem,
    NcListItemIcon,
    NcTextField,
    WeatherCloudyArrowRight,
  },
  props: {
    federations: { type: Object, default: () => ({}) },
    providerDomain: { type: String, default: "" },
    token: { type: String, default: "" },
  },
  data: () => ({ query: "" }),
  methods: {
    async discoverProvider(base) {
      const resp = await axios.get(generateUrl("/apps/contacts/discover"), {
        params: { base },
        timeout: 8000,
      });
      if (!resp.data?.inviteAcceptDialogAbsolute)
        throw new Error("Discovery failed");

      // append provider & token safely
      const u = new URL(resp.data.inviteAcceptDialogAbsolute);
      if (this.providerDomain) u.searchParams.set("providerDomain", this.providerDomain);
      if (this.token) u.searchParams.set("token", this.token);
      return u.toString();
    },
    filteredBy(providers) {
      const s = (this.query || "").toLowerCase();
      return providers.filter(
        (p) =>
          p.name.toLowerCase().includes(s) || p.fqdn.toLowerCase().includes(s),
      );
    },
    async goToManualProvider() {
      const input = (this.manualProvider || "").trim();
      if (!input) return;
      try {
        const target = await this.discoverProvider(input);
        window.location.href = target;
      } catch (e) {
        // TODO: handle error and show error dialog to user
        console.error(e);
      }
    },
  },
};
</script>
